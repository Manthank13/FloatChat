# FloatChat Application Persistence API & Architecture Reference

This document provides a comprehensive technical guide to the production-quality persistence layer introduced in Stage 7 for FloatChat.

---

## 1. System Architecture & Data Separation Principle

```
Frontend Client (React/Vite)
        │
        ├── Bearer JWT Authorization Header
        ▼
FastAPI Application Layer (`/api/v1`)
 ├── `/api/v1/chat`           ──► ChatService           ──► ChatSessionRepository / ChatMessageRepository
 ├── `/api/v1/saved-queries`  ──► SavedQueryService     ──► SavedQueryRepository
 ├── `/api/v1/preferences`    ──► PreferencesService    ──► UserPreferencesRepository
 └── `/api/v1/auth`           ──► AuthService           ──► UserRepository
        │
        ▼
Persistence Layer (MongoDB Atlas)
 ├── `users`            (User accounts & Argon2 password hashes)
 ├── `chat_sessions`    (Conversations & metadata)
 ├── `messages`         (Chronological messages with roles & tool metadata)
 ├── `saved_queries`    (User-saved oceanographic search parameters)
 └── `user_preferences` (Per-user UI/UX preferences & default map configs)

Separation of Concerns:
 - MongoDB Atlas stores ONLY FloatChat application and user state.
 - Argo GDAC / ERDDAP remains the sole, immutable source of truth for global oceanographic float observations.
```

---

## 2. Authentication & Data Ownership Security

1. **Strict Ownership Enforcement**:
   - Every application resource (`chat_sessions`, `messages`, `saved_queries`, `user_preferences`) is tied to an authenticated `user_id`.
   - The client is **never** trusted to provide `user_id`. Instead, `user_id` is always extracted from the cryptographically verified JWT access token via `current_user = get_current_user()`.
2. **IDOR & Data Leakage Prevention**:
   - Every database query for user-owned resources filters by both `_id` and `user_id`:
     ```python
     collection.find_one({"_id": resource_id, "user_id": current_user.id})
     ```
   - Attempting to access another user's session, message, saved query, or preferences returns `404 Not Found`, deliberately preventing attackers from probing the existence of resources owned by other users.
3. **Cascade Deletion**:
   - When an authenticated user deletes a chat session (`DELETE /api/v1/chat/sessions/{session_id}`), all messages associated with that session are safely deleted to prevent orphaned data.

---

## 3. MongoDB Collections & Indexes

The following indexes are created idempotently on application startup:

| Collection | Index Fields | Purpose |
| :--- | :--- | :--- |
| `users` | `email` (Unique) | Enforce unique normalized user accounts |
| `chat_sessions` | `(user_id, 1), (updated_at, -1)` | Fast retrieval of user sessions ordered by recent activity |
| `chat_sessions` | `(user_id, 1), (is_archived, 1), (updated_at, -1)` | Filtered active vs. archived sessions |
| `messages` | `(session_id, 1), (created_at, 1)` | Chronological retrieval of conversation history |
| `messages` | `(user_id, 1), (created_at, -1)` | User-level message audit and deletion |
| `saved_queries` | `(user_id, 1), (updated_at, -1)` | Paginated saved searches sorted newest first |
| `user_preferences` | `user_id` (Unique) | Enforce single preference record per user |

---

## 4. API Endpoints Reference

### 4.1 Chat Sessions

#### `POST /api/v1/chat/sessions` (Status 201 Created)
Creates a new conversation session for the authenticated user.

- **Request Body** (optional):
  ```json
  {
    "title": "North Atlantic Salinity Anomaly"
  }
  ```
- **Response** (201):
  ```json
  {
    "id": "67c5780a123456789abcdef0",
    "user_id": "67c57650123456789abcdef1",
    "title": "North Atlantic Salinity Anomaly",
    "created_at": "2026-09-02T14:30:00Z",
    "updated_at": "2026-09-02T14:30:00Z",
    "last_message_at": null,
    "is_archived": false
  }
  ```

#### `GET /api/v1/chat/sessions` (Status 200 OK)
Lists sessions owned by the authenticated user.

- **Query Parameters**:
  - `page` (default: `1`, minimum: `1`)
  - `page_size` (default: `20`, range: `1-100`)
  - `is_archived` (optional boolean filter)
- **Response** (200):
  ```json
  {
    "items": [
      {
        "id": "67c5780a123456789abcdef0",
        "user_id": "67c57650123456789abcdef1",
        "title": "North Atlantic Salinity Anomaly",
        "created_at": "2026-09-02T14:30:00Z",
        "updated_at": "2026-09-02T14:30:00Z",
        "last_message_at": "2026-09-02T14:31:00Z",
        "is_archived": false
      }
    ],
    "total": 1,
    "page": 1,
    "page_size": 20,
    "has_more": false
  }
  ```

#### `GET /api/v1/chat/sessions/{session_id}` (Status 200 OK)
Retrieves a specific chat session by ID. Returns `404 Not Found` if the session does not exist or belongs to another user.

#### `PATCH /api/v1/chat/sessions/{session_id}` (Status 200 OK)
Updates session title or archive state.
- **Request Body**:
  ```json
  {
    "title": "Revised Exploration Title",
    "is_archived": true
  }
  ```

#### `DELETE /api/v1/chat/sessions/{session_id}` (Status 200 OK)
Deletes the session and all contained messages.
- **Response** (200):
  ```json
  {
    "status": "deleted",
    "id": "67c5780a123456789abcdef0",
    "deleted_messages_count": 5
  }
  ```

---

### 4.2 Chat Messages

#### `POST /api/v1/chat/sessions/{session_id}/messages` (Status 201 Created)
Adds a message to a session. Validates caller ownership and updates session `last_message_at` and `updated_at`.

- **Request Body**:
  ```json
  {
    "role": "user",
    "content": "Retrieve temperature profiles near 15N, 45W for depth 0 to 200m.",
    "metadata": {
      "source": "web_ui"
    }
  }
  ```
  *(Allowed roles: `"user"`, `"assistant"`, `"system"`)*
- **Response** (201):
  ```json
  {
    "id": "67c5791b123456789abcdef2",
    "session_id": "67c5780a123456789abcdef0",
    "user_id": "67c57650123456789abcdef1",
    "role": "user",
    "content": "Retrieve temperature profiles near 15N, 45W for depth 0 to 200m.",
    "created_at": "2026-09-02T14:31:00Z",
    "metadata": {
      "source": "web_ui"
    }
  }
  ```

#### `GET /api/v1/chat/sessions/{session_id}/messages` (Status 200 OK)
Lists all messages in a session in chronological order (oldest first).

- **Query Parameters**:
  - `page` (default: `1`, minimum: `1`)
  - `page_size` (default: `50`, range: `1-100`)

---

### 4.3 Saved Queries

#### `POST /api/v1/saved-queries` (Status 201 Created)
Saves an oceanographic query definition for future execution.

- **Request Body**:
  ```json
  {
    "name": "Equatorial Pacific Salinity Monitoring",
    "description": "Weekly monitoring query for salinity near the equator",
    "query": {
      "latitude": 0.0,
      "longitude": -140.0,
      "radius_km": 300.0,
      "variable": "PSAL",
      "depth_min_m": 0.0,
      "depth_max_m": 500.0,
      "limit": 100
    }
  }
  ```
- **Response** (201):
  ```json
  {
    "id": "67c57a2c123456789abcdef3",
    "user_id": "67c57650123456789abcdef1",
    "name": "Equatorial Pacific Salinity Monitoring",
    "description": "Weekly monitoring query for salinity near the equator",
    "query": {
      "latitude": 0.0,
      "longitude": -140.0,
      "radius_km": 300.0,
      "variable": ["PSAL"],
      "depth_min_m": 0.0,
      "depth_max_m": 500.0,
      "limit": 100
    },
    "created_at": "2026-09-02T14:32:00Z",
    "updated_at": "2026-09-02T14:32:00Z"
  }
  ```

#### `GET /api/v1/saved-queries` (Status 200 OK)
Returns paginated saved queries for the authenticated user.

#### `GET /api/v1/saved-queries/{query_id}` (Status 200 OK)
Retrieves a saved query. Enforces ownership (`404` if not found/not owned).

#### `PATCH /api/v1/saved-queries/{query_id}` (Status 200 OK)
Updates name, description, or query parameters.

#### `DELETE /api/v1/saved-queries/{query_id}` (Status 200 OK)
Deletes the saved query for caller.

---

### 4.4 User Preferences

#### `GET /api/v1/preferences` (Status 200 OK)
Retrieves the authenticated user's UI/UX preferences. If no record exists, defaults are automatically initialized and persisted:
```json
{
  "user_id": "67c57650123456789abcdef1",
  "theme": "dark",
  "language": "en",
  "default_map_center": [0.0, 0.0],
  "default_map_zoom": 2,
  "preferred_units": {
    "temperature": "degC",
    "salinity": "psu",
    "pressure": "dbar",
    "depth": "m"
  },
  "created_at": "2026-09-02T14:33:00Z",
  "updated_at": "2026-09-02T14:33:00Z"
}
```

#### `PUT /api/v1/preferences` (Status 200 OK)
Updates caller preferences.
- **Request Body**:
  ```json
  {
    "theme": "light",
    "language": "fr",
    "default_map_center": [15.0, 75.0],
    "default_map_zoom": 4
  }
  ```

---

## 5. Error Handling & Status Codes

| Status Code | Meaning | Example Scenario |
| :--- | :--- | :--- |
| `401 Unauthorized` | Missing or invalid Bearer token | Request sent without `Authorization: Bearer <token>` |
| `404 Not Found` | Resource does not exist or belongs to another user | Requesting a session or saved query belonging to a different user |
| `422 Validation Error` | Payload validation failure | Negative page number, invalid map coordinates, unsupported theme |

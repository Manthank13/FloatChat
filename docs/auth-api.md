# FloatChat Native Authentication API & Database Architecture

FloatChat features a native, production-quality authentication system built directly into the FastAPI backend and persisted via **MongoDB Atlas** (`floatchat` database, `users` collection).

---

## 1. System Architecture

```
Frontend (React/Vite)
        │
        ├── 1. POST /api/v1/auth/register or /login
        ▼
FastAPI Auth Endpoints (`app/api/v1/endpoints/auth.py`)
        │
        ├── 2. Verify Credentials against MongoDB Atlas `users` Collection
        ▼
Argon2 Password Hasher & PyJWT Token Generator (`app/core/security.py`)
        │
        ├── 3. Returns Signed JWT Access Token (`access_token`)
        ▼
Frontend Client
        │
        ├── 4. Protected Request: GET /api/v1/auth/me (Header: Authorization: Bearer <token>)
        ▼
FastAPI `get_current_user` Dependency (`app/api/deps.py`)
        │
        └── Returns Authenticated User Profile (`UserResponse`)
```

> **Data Separation Standard**:
> - MongoDB Atlas (`floatchat`) stores application data (`users` collection).
> - Raw Argo profiling float observations are **never** stored in MongoDB; Argo/ERDDAP remains the sole source of truth for oceanographic measurements.

---

## 2. Environment Variables Configuration

The following environment variables configure MongoDB Atlas and JWT security in `app/core/config.py`:

| Variable Name | Description | Example / Default |
| :--- | :--- | :--- |
| `MONGODB_URI` | MongoDB Atlas cluster connection string | `mongodb+srv://floatchat_app:<PASSWORD>@<CLUSTER_HOST>/?appName=FloatChatCluster` |
| `MONGODB_DATABASE` | MongoDB database name | `floatchat` |
| `JWT_SECRET_KEY` | Cryptographic secret for signing JWTs | `<Replace with long random secret string>` |
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifespan in minutes | `30` |

> **Security Rule**: Credentials and connection strings are **never** hardcoded or committed to version control. Set your local connection details in `.env` (which is ignored by `.gitignore`).

---

## 3. API Endpoints Reference

### `POST /api/v1/auth/register` (Status 201 Created)
Registers a new user account, normalizes email, checks uniqueness, hashes password with Argon2, stores record in MongoDB `users` collection, and returns signed JWT access token.

#### **Request Payload**
```json
{
  "email": "scientist@floatchat.org",
  "password": "StrongPassword123!",
  "display_name": "Dr. Sylvia Earle"
}
```

#### **Response (201 Created)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "65e4d2a1b9f8e7c6d5a4b3c2",
    "email": "scientist@floatchat.org",
    "display_name": "Dr. Sylvia Earle",
    "is_active": true,
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### `POST /api/v1/auth/login` (Status 200 OK)
Authenticates user credentials against stored Argon2 hash and returns signed JWT access token.

#### **Request Payload**
```json
{
  "email": "scientist@floatchat.org",
  "password": "StrongPassword123!"
}
```

#### **Response (200 OK)**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "65e4d2a1b9f8e7c6d5a4b3c2",
    "email": "scientist@floatchat.org",
    "display_name": "Dr. Sylvia Earle",
    "is_active": true,
    "created_at": "2024-01-15T12:00:00Z"
  }
}
```

---

### `GET /api/v1/auth/me` (Status 200 OK - Protected)
Retrieves the currently authenticated user's profile. Requires valid Bearer JWT.

#### **Request Header**
```http
Authorization: Bearer <access_token>
```

#### **Response (200 OK)**
```json
{
  "id": "65e4d2a1b9f8e7c6d5a4b3c2",
  "email": "scientist@floatchat.org",
  "display_name": "Dr. Sylvia Earle",
  "is_active": true,
  "created_at": "2024-01-15T12:00:00Z"
}
```

---

### `POST /api/v1/auth/logout` (Status 200 OK)
Stateless JWT logout response. Instructs frontend client to clear token storage.

#### **Response (200 OK)**
```json
{
  "status": "logged_out",
  "message": "Successfully logged out. Client must discard local access token.",
  "note": "FloatChat JWTs are stateless. Discarding the token on the client completes logout."
}
```

---

## 4. Error Responses

| Status Code | Reason | Example Response Message |
| :--- | :--- | :--- |
| `400 Bad Request` | Invalid input format | `"Password must be at least 8 characters long."` |
| `401 Unauthorized` | Invalid/expired credentials or missing Bearer header | `"Invalid email or password."` or `"Token has expired."` |
| `409 Conflict` | Duplicate email registration | `"Email 'scientist@floatchat.org' is already registered."` |
| `422 Validation Error` | Pydantic model validation failure | `"Input validation failed."` |

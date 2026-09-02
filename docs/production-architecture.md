# FloatChat Production Architecture & Security Guide

This document describes the production architecture, security hardening, correlation ID tracking, error handling standards, and Supabase authentication integration strategy for FloatChat.

---

## 1. System Architecture Overview

```
Frontend (React/Vite)
        │  (HTTP / REST + Authorization: Bearer <Supabase_JWT>)
        ▼
Supabase Authentication (OAuth / JWT Verification)
        │
        ▼
FastAPI Application (FloatChat Backend)
 ├── Middleware: RequestIDMiddleware (X-Request-ID Correlation Tracing)
 ├── Middleware: CORSMiddleware (Configured Origins)
 ├── API Layer: /api/v1 (Health, Argo, Query, Analysis)
 ├── Dependency Injection: app/api/deps.py (Supabase Auth Hook)
 ├── Service Layer: Query & Scientific Analysis Engines
 └── Provider Abstraction: GDAC ERDDAP / Mock Fallback Provider
```

---

## 2. Production Security & Hardening Features

### **Request Correlation Tracking (`X-Request-ID`)**
- Handled by `RequestIDMiddleware` in `app/middleware/request_id.py`.
- Every incoming request receives or preserves a unique UUID4 correlation ID (`X-Request-ID`).
- Included in response headers and injected into log entries and JSON error responses for distributed tracing.

### **Production Error Handling & Masking**
- Handled by `app/core/exceptions.py`.
- All `HTTPException`, `RequestValidationError`, and uncaught `Exception` instances return uniform JSON error objects:
  ```json
  {
    "error": {
      "code": 422,
      "message": "Input validation failed.",
      "path": "/api/v1/observations/query",
      "request_id": "8f3b2a1c-...",
      "details": [...]
    }
  }
  ```
- In `production` environment (`ENVIRONMENT=production`), unhandled internal server error messages are masked as `"Internal server error occurred."` to prevent leaking stack trace or infrastructure details to clients.

### **CORS Configuration**
- Configured via `CORS_ORIGINS` in `app/core/config.py`.
- Exposes `X-Request-ID` to cross-origin frontend clients while allowing credentials and standard REST headers.

---

## 3. Future Supabase Authentication Integration Plan

### **Architecture Flow**
1. **User Login**: User authenticates on the frontend using Supabase Auth (Email, OAuth, Magic Link).
2. **JWT Acquisition**: Supabase returns a JWT access token (`access_token`).
3. **API Request**: Frontend attaches token to requests:
   ```http
   GET /api/v1/observations/query HTTP/1.1
   Host: api.floatchat.com
   Authorization: Bearer <SUPABASE_JWT_ACCESS_TOKEN>
   ```
4. **FastAPI Auth Verification Point (`app/api/deps.py`)**:
   - The dependency `get_current_user` will extract and verify the JWT signature using `SUPABASE_JWT_SECRET` or Supabase JWKS endpoint.
   - Extracts user ID (`sub`), user email, and metadata.
   - Attaches user context to request handler.

### **Configuration Placeholders (`.env`)**
```env
# Future Supabase Authentication Settings
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_KEY="your-anon-key"
SUPABASE_JWT_SECRET="your-jwt-secret"
```

---

## 4. Operational Health & Readiness Probes

FloatChat provides dual Kubernetes-friendly health endpoints:

- **Liveness Probe (`GET /api/v1/health`)**: Confirms API process is alive.
- **Readiness Probe (`GET /api/v1/health/readiness`)**: Confirms application configuration, data provider status, and operational health.

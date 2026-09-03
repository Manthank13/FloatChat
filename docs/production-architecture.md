# FloatChat Production Architecture & Security Guide

This document describes the production architecture, security hardening, correlation ID tracking, error handling standards, MongoDB Atlas integration, and Native FastAPI Authentication strategy for FloatChat.

---

## 1. System Architecture Overview

```
Frontend (React/Vite)
        │
        │  (HTTP REST + Authorization: Bearer <JWT>)
        ▼
FastAPI Application (FloatChat Backend)
 ├── Middleware: RequestIDMiddleware (X-Request-ID Correlation Tracing)
 ├── Middleware: CORSMiddleware (Configured Origins)
 ├── API Layer: /api/v1 (Health, Auth, Chat, Saved Queries, Preferences, Argo, Query, Analysis)
 ├── Security & Auth: Argon2 Password Hashing & PyJWT (`app/core/security.py`)
 ├── Persistence Layer: MongoDB Atlas (`floatchat` DB -> `users`, `chat_sessions`, `messages`, `saved_queries`, `user_preferences`)
 ├── Service Layer: Chat, Saved Queries, Preferences, Query & Scientific Analysis Engines
 └── Provider Abstraction: GDAC ERDDAP / Mock Fallback Provider
```

> **Data Responsibility Principle**:
> - **MongoDB Atlas**: Stores application and user data (`users`, `chat_sessions`, `messages`, `saved_queries`, `user_preferences`).
> - **Argo GDAC / ERDDAP**: Source of truth for raw oceanographic observations (`TEMP`, `PSAL`, `PRES`).

---

## 2. Production Security & Hardening Features

### **Native FastAPI Authentication System**
- Uses **Argon2** (`argon2-cffi`) for secure password hashing and verification.
- Issues signed **JWT** access tokens (`pyjwt`) with configurable expiration (`JWT_ACCESS_TOKEN_EXPIRE_MINUTES`).
- Enforces Bearer token authentication via `get_current_user` dependency in `app/api/deps.py`.

### **Request Correlation Tracking (`X-Request-ID`)**
- Handled by `RequestIDMiddleware` in `app/middleware/request_id.py`.
- Every incoming request receives or preserves a unique UUID4 correlation ID (`X-Request-ID`).

### **Production Error Handling & Masking**
- Handled by `app/core/exceptions.py`.
- In `production` environment (`ENVIRONMENT=production`), unhandled 500 error messages are masked to prevent leaking internal tracebacks.

---

## 3. Environment Variables Configuration

Placeholders are documented in `.env.example`:

```env
# MongoDB Atlas Database Configuration
MONGODB_URI=mongodb+srv://floatchat_app:<PASSWORD>@<CLUSTER_HOST>/?appName=FloatChatCluster
MONGODB_DATABASE=floatchat

# Native JWT Authentication Settings
JWT_SECRET_KEY=replace-with-a-long-random-secret
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 4. Operational Health & Readiness Probes

FloatChat provides dual Kubernetes-friendly health endpoints:

- **Liveness Probe (`GET /api/v1/health`)**: Confirms API process is alive.
- **Readiness Probe (`GET /api/v1/health/readiness`)**: Confirms API readiness, active ocean data provider configuration, and MongoDB ping connectivity status.

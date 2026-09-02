# FloatChat Local Development & Setup Guide

This guide provides instructions for setting up, running, and testing FloatChat locally across the **AI / Data Engine**, **FastAPI Backend**, and **React Frontend**.

---

## 1. Prerequisites

- **Python:** 3.11+ (Python 3.12 / 3.13 / 3.14 supported)
- **Node.js:** v18+ & npm (for frontend)
- **Git**
- **MongoDB:** (Optional for full backend user auth, or run via Docker)

---

## 2. Repository Cloning & Environment Setup

```bash
# Clone the repository
git clone https://github.com/your-username/FloatChat.git
cd FloatChat

# Create and activate Python virtual environment
python -m venv .venv

# On Linux / macOS:
source .venv/bin/activate

# On Windows (PowerShell):
.\.venv\Scripts\Activate.ps1

# Create local environment configuration file
cp .env.example .env
```

---

## 3. Installing Dependencies

```bash
# Install core AI and Data Layer dependencies
pip install -r backend/requirements.txt
# (or install root test dependencies: pip install pytest pydantic)
```

For the frontend:
```bash
cd frontend
npm install
cd ..
```

---

## 4. Running the Test Suite

Run the full verified test suite (138 tests, 100% pass rate):

```bash
# Set PYTHONPATH to project root and run pytest
python -m pytest -v
```

To run scoped tests:
```bash
# Run AI parser tests
python -m pytest ai/tests/

# Run Data retrieval tests
python -m pytest tests/data/
```

---

## 5. Running the AI / Data Engine Locally (Python CLI)

You can interact directly with the FloatChat AI Engine in Python:

```python
from ai.engine import FloatChatAIEngine

# Initialize the engine (uses offline sample dataset by default)
engine = FloatChatAIEngine()

# Ask an oceanographic question
response = engine.chat("What is the salinity near Chennai at 100 meters?")

print("ANSWER:")
print(response.answer)

print("\nKEY FINDINGS:")
for finding in response.key_findings:
    print(f"- {finding}")

print("\nCITATIONS:")
for c in response.citations:
    print(f"- Float WMO {c.platform_id} (Cycle {c.cycle_number}) at {c.timestamp}")
```

---

## 6. Running the FastAPI Backend Server

```bash
# Start backend server with uvicorn
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- **Interactive Swagger Documentation:** `http://localhost:8000/docs`
- **ReDoc Documentation:** `http://localhost:8000/redoc`

---

## 7. Running the React Frontend

```bash
cd frontend
npm run dev
```

- **Frontend Application:** `http://localhost:5173`

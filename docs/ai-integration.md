# FloatChat AI & Backend Services Integration Architecture (Stage 9)

## 1. Overview & Architectural Design

FloatChat's Stage 9 completes the integration of natural-language AI understanding and scientific response synthesis with the production backend. The architecture enforces strict separation of concerns:

- **AI Interpretation & Synthesis**: Discovers user intent, extracts geographical/depth/temporal filters, normalizes parameters, and converts raw observation data into natural, grounded scientific narratives.
- **Backend Ground Truth (Single Source of Truth)**: Real ARGO profiling observations, geographic distance filtering (Haversine geodesic), vertical CTD profiles, statistical metrics, mixed-layer depth (MLD) physical derivations, and MongoDB Atlas conversation persistence remain authoritative within backend services.
- **Scientific Grounding & Non-Fabrication**: The AI layer never invents oceanographic measurements, temperatures, salinities, coordinates, or disaster claims. All quantitative metrics in responses strictly originate from retrieved in-situ ARGO telemetry.

```
                         Natural Language Query
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │    FloatChatAIEngine      │
                     └─────────────┬─────────────┘
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    ┌─────────────────────┐                 ┌─────────────────────┐
    │   LLMQueryParser    │  (fallback to)  │ DeterministicParser │
    │ (Few-Shot Prompts)  ├────────────────►│ (Regex & Ocean Lex) │
    └──────────┬──────────┘                 └──────────┬──────────┘
               │                                       │
               └───────────────────┬───────────────────┘
                                   ▼
                            StructuredQuery
                                   │
                                   ▼
                     ┌───────────────────────────┐
                     │   BackendArgoRetriever    │
                     └─────────────┬─────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ ObservationQuery │     │ScientificAnalysis│     │  ArgoDataSource  │
│     Service      │     │     Service      │     │  (GDAC / Mock)   │
└────────┬─────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  ▼
                           RetrievalResult
                                  │
                                  ▼
                     ┌───────────────────────────┐
                     │  AI Response Synthesizer  │
                     │  (LLM or Deterministic)   │
                     └────────────┬──────────────┘
                                  │
                                  ▼
                      ┌───────────────────────┐
                      │ FrontendQueryResponse │
                      │  (Stage 8 Contract)   │
                      └───────────────────────┘
```

---

## 2. Component Reference

### 2.1 AI Query Interpretation Pipeline (`app/ai/parser.py`, `app/ai/mappings/parser.py`)
- **`StructuredQuery`**: Domain model capturing `intent`, `parameters` (`TEMP`, `PSAL`, `PRES`), `location` (name, bounding box, coordinates, radius), `depth` (target depth, depth ranges), `time_range`, `platform_id`, and `comparison` specifications.
- **`LLMQueryParser`**: Few-shot prompt converting natural queries into structured JSON. Validates fields using Pydantic.
- **`DeterministicQueryParser`**: High-performance regular-expression and marine vocabulary parser used when the LLM is disabled (`AI_LLM_PROVIDER="mock"`) or during network failures.

### 2.2 Backend AI Retriever Adapter (`app/ai/adapter.py`)
- **`BackendArgoRetriever`**: Translates `StructuredQuery` into backend `ObservationQuery` and `DepthProfileRequest` models.
- Connects directly to `ObservationQueryService`, `ScientificAnalysisService`, and `ArgoDataSource`.
- Precludes any duplication of geographic calculations or ocean physics. All calculations remain strictly centralized in backend services.

### 2.3 Grounded Response Synthesizer (`app/ai/synthesizer.py`)
- **`LLMResponseSynthesizer`**: Produces conversational, contextual answers from authoritative ARGO data.
- **`DeterministicResponseSynthesizer`**: Generates structured Markdown narratives, citing platform WMO IDs, cycle numbers, in-situ SST, salinity, and depth ranges.
- **Citations & Visual Payloads**: Automatically constructs `FloatCitation`, `ChartDataPayload` (vertical CTD profiles), and `MapMarker` records.

### 2.4 Product & API Alignment (`app/services/frontend_adapter.py`)
- Bridges AI engine responses into the Stage 8 `FrontendQueryResponse` schema.
- Exposes endpoints:
  - `POST /api/query`: Primary natural-language query endpoint.
  - `POST /api/chat`: Compatibility route sharing identical pipeline logic.
- Maintains 100% backward compatibility with `/api/v1` routes and Stage 8 frontend cards (KPIs, profiles, insights, telemetry, citations).

### 2.5 Chat Persistence & Authentication
- **Persistence**: When `conversation_id` is supplied in `FrontendQueryRequest`, user prompts and assistant responses are stored in the MongoDB `messages` collection via `ChatMessageRepository`.
- **Identity**: Reads authenticated user profile via `get_current_user_optional`. If authenticated, attaches `user.id` to messages; if guest, defaults to `"guest"`.

---

## 3. Disaster Safety & Climate Vocabulary Guidelines

To ensure scientific integrity and prevent alarmist or unverified claims, the AI synthesizer strictly enforces these terminology boundaries:

| Permitted Terminology | Prohibited Claims |
| :--- | :--- |
| *"risk-relevant signal"* | *"disaster guaranteed"* |
| *"environmental indicator"* | *"predicts a cyclone"* |
| *"elevated upper-ocean thermal state"* | *"storm landfall imminent"* |
| *"barrier layer stratification"* | Fabricated anomalies (e.g. "+0.8°C anomaly" when baseline is unavailable) |
| *"in-situ CTD observation"* | Fabricated biogeochemical data (e.g., oxygen, density when unmeasured) |

---

## 4. Configuration & Environment Settings

The AI layer is configured via environment variables with safe offline defaults:

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `None` | Google Gemini API key (never hardcoded, never exposed in client bundles). |
| `AI_LLM_PROVIDER` | `"mock"` | Provider selector (`"mock"`, `"gemini"`, `"openai"`, `"ollama"`). |
| `AI_MODEL_NAME` | `"gemini-2.5-flash"` | Active LLM model identifier. |
| `AI_TEMPERATURE` | `0.0` | Sampling temperature (0.0 for deterministic factual parsing). |
| `AI_TIMEOUT_SECONDS` | `15.0` | Max timeout for LLM network requests. |
| `AI_FALLBACK_TO_DETERMINISTIC` | `true` | Automatic fallback to deterministic regex parser on LLM error. |

---

## 5. Automated Test Coverage

FloatChat backend includes 159 automated unit and integration tests covering the complete AI pipeline:

- `tests/test_query_parser.py` (15 tests): Regex patterns, marine entity resolution, bounding boxes, depth ranges.
- `tests/test_llm_parser.py` (12 tests): LLM JSON parsing, mock client integration, error fallback.
- `tests/test_ai_synthesizer.py` (14 tests): Markdown synthesis, citations, CTD chart payload generation, async handling.
- `tests/test_ai_backend_integration.py` (14 tests): End-to-end integration across `POST /api/query`, `POST /api/chat`, conversation persistence, user authentication, guest access, out-of-bounds queries, and offline fallbacks.
- Existing regression suites (104 tests): Unaffected; 100% pass rate maintained across authentication, database repositories, Argo GDAC services, and scientific analysis.

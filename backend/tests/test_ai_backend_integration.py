"""
Stage 9 AI & Backend Services Integration Test Suite.

Verifies end-to-end integration across:
1. Natural language -> StructuredQuery
2. StructuredQuery -> BackendArgoRetriever -> ObservationQueryService / ScientificAnalysisService
3. Grounded RetrievalResult with real/mock observations (no fabricated metrics)
4. RetrievalResult -> AI Response Synthesis
5. AI Response -> FrontendQueryResponse contract
6. POST /api/query
7. POST /api/chat
8. Chat session and message persistence (MongoDB / in-memory)
9. Authenticated queries associating messages with User ID
10. Guest queries allowing public exploration
11. No-data queries returning graceful observational summaries
12. Invalid queries returning clean 422 validation errors
13. Deterministic query parsing and response synthesis fallback
14. Resilient fallback during simulated LLM provider failures
"""

import unittest
from unittest.mock import MagicMock, patch
from fastapi import status
from fastapi.testclient import TestClient

from app.ai.adapter import BackendArgoRetriever
from app.ai.config import AIConfig
from app.ai.engine import FloatChatAIEngine
from app.ai.llm_client import MockLLMClient
from app.ai.models import OceanParameter, QueryIntent, StructuredQuery
from app.ai.response_models import FloatChatResponse
from app.ai.retrieval_models import RetrievalResult
from app.ai.synthesizer import LLMResponseSynthesizer
from app.db.repositories.chat_message import ChatMessageRepository
from app.db.repositories.chat_session import ChatSessionRepository
from app.main import app
from app.models.auth import UserResponse
from app.schemas.frontend_contract import FrontendQueryRequest, FrontendQueryResponse
from app.services.frontend_adapter import FrontendAdapterService
from app.services.mock import MockArgoDataSource
from app.core.security import create_access_token


class TestAIBackendIntegration(unittest.TestCase):
    """Integration test suite connecting the AI layer to backend services."""

    def setUp(self):
        self.data_source = MockArgoDataSource()
        self.retriever = BackendArgoRetriever(data_source=self.data_source)
        self.engine = FloatChatAIEngine(data_source=self.data_source, retriever=self.retriever)
        self.client = TestClient(app)

    # --------------------------------------------------------------------------
    # 1. Natural language -> StructuredQuery
    # --------------------------------------------------------------------------
    def test_01_natural_language_to_structured_query(self):
        """Verify natural-language query is parsed into a domain-validated StructuredQuery."""
        sq = self.engine.parse_query("What is the salinity near Chennai at 100 meters?", use_llm=False)
        self.assertIsInstance(sq, StructuredQuery)
        self.assertEqual(sq.intent, QueryIntent.PROFILE_QUERY)
        self.assertIn(OceanParameter.PSAL, sq.parameters)
        self.assertIsNotNone(sq.location)
        self.assertIn("chennai", sq.location.name.lower())
        self.assertEqual(sq.depth.target_depth, 100.0)

    # --------------------------------------------------------------------------
    # 2. StructuredQuery -> BackendArgoRetriever
    # --------------------------------------------------------------------------
    def test_02_structured_query_to_backend_retrieval(self):
        """Verify StructuredQuery executes against backend services returning RetrievalResult."""
        sq = self.engine.parse_query("Show temperature in the Arabian Sea", use_llm=False)
        res = self.engine.retrieve_data(sq)
        self.assertIsInstance(res, RetrievalResult)
        self.assertFalse(res.is_empty)
        self.assertTrue(res.total_matched_observations > 0)
        self.assertIn("TEMP", res.summary_statistics)

    # --------------------------------------------------------------------------
    # 3. Realistic Mock Argo Retrieval without Fabricated Values
    # --------------------------------------------------------------------------
    def test_03_authoritative_observations_retrieval(self):
        """Verify retrieval returns real observation values without hardcoded or fabricated metrics."""
        sq = self.engine.parse_query("Salinity near Chennai at 100m", use_llm=False)
        res = self.retriever.retrieve(sq)
        self.assertFalse(res.is_empty)
        # Verify valid physical salinity range (PSS-78 scale)
        for obs in res.matched_observations:
            if obs.psal_psu is not None:
                self.assertGreater(obs.psal_psu, 30.0)
                self.assertLess(obs.psal_psu, 40.0)

    # --------------------------------------------------------------------------
    # 4. RetrievalResult -> AI Synthesis
    # --------------------------------------------------------------------------
    def test_04_retrieval_result_to_ai_synthesis(self):
        """Verify AI synthesis transforms RetrievalResult into grounded FloatChatResponse."""
        sq = self.engine.parse_query("What is the salinity near Chennai at 100 meters?", use_llm=False)
        res = self.retriever.retrieve(sq)
        synth_resp = self.engine.synthesize_response(sq, res, use_llm=False)

        self.assertIsInstance(synth_resp, FloatChatResponse)
        self.assertFalse(synth_resp.is_empty)
        self.assertIn("Chennai", synth_resp.answer)
        self.assertTrue(len(synth_resp.citations) > 0)
        self.assertTrue(len(synth_resp.key_findings) > 0)
        self.assertIsNotNone(synth_resp.chart_data)

    # --------------------------------------------------------------------------
    # 5. AI Result -> FrontendQueryResponse Contract
    # --------------------------------------------------------------------------
    def test_05_ai_result_to_frontend_response_contract(self):
        """Verify FrontendAdapterService builds valid FrontendQueryResponse."""
        adapter = FrontendAdapterService(data_source=self.data_source, ai_engine=self.engine)
        import asyncio
        req = FrontendQueryRequest(query="What is the sea temperature near Chennai?")
        res = asyncio.run(adapter.process_query(req))

        self.assertIsInstance(res, FrontendQueryResponse)
        self.assertTrue(len(res.kpis) >= 4)
        self.assertTrue(len(res.profile) > 0)
        self.assertTrue(len(res.insights) > 0)
        self.assertIn("Observation", res.text)
        self.assertIn("Climate Risk & Environmental Relevance", res.text)
        # Safety terminology check
        self.assertNotIn("disaster guaranteed", res.text)
        self.assertNotIn("predicts a cyclone", res.text)

    # --------------------------------------------------------------------------
    # 6. POST /api/query
    # --------------------------------------------------------------------------
    def test_06_post_api_query_endpoint(self):
        """Verify POST /api/query executes end-to-end and returns 200 with schema compliance."""
        payload = {"query": "Analyze water temperature and salinity near Chennai"}
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertIn("kpis", data)
        self.assertIn("profile", data)
        self.assertIn("insights", data)
        self.assertIn("text", data)
        self.assertIn("location", data)
        self.assertIn("float", data)

    # --------------------------------------------------------------------------
    # 7. POST /api/chat Compatibility Route
    # --------------------------------------------------------------------------
    def test_07_post_api_chat_compatibility_endpoint(self):
        """Verify POST /api/chat routes to the same pipeline and returns 200 OK."""
        payload = {"query": "Show temperature in Arabian Sea"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["location"]["regionCategory"], "arabian_sea")
        self.assertTrue(len(data["kpis"]) >= 4)

    # --------------------------------------------------------------------------
    # 8. Conversation & Message Persistence
    # --------------------------------------------------------------------------
    def test_08_conversation_persistence(self):
        """Verify user message and assistant response are persisted when conversation_id is passed."""
        conv_id = "test-session-stage9-persistence-123"
        payload = {
            "query": "What is the surface temperature near Chennai?",
            "conversation_id": conv_id,
        }
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Inspect persisted messages
        repo = ChatMessageRepository()
        import asyncio
        messages, count = asyncio.run(repo.list_messages(session_id=conv_id, user_id="guest"))
        self.assertEqual(count, 2)
        self.assertEqual(messages[0].role, "user")
        self.assertEqual(messages[0].content, payload["query"])
        self.assertEqual(messages[1].role, "assistant")
        self.assertTrue(len(messages[1].content) > 0)

    # --------------------------------------------------------------------------
    # 9. Authenticated Query Associating Messages with User ID
    # --------------------------------------------------------------------------
    def test_09_authenticated_query_user_association(self):
        """Verify authenticated requests associate saved messages with the authenticated user ID."""
        import asyncio
        from app.db.repositories.user import UserRepository

        user_repo = UserRepository(db=None)
        user = asyncio.run(
            user_repo.create_user(
                email="dr.ocean@floatchat.org",
                password_hash="$argon2id$mock_hash_123",
                display_name="Dr. Ocean",
            )
        )

        token = create_access_token(
            subject=user.id, extra_claims={"email": user.email}
        )
        headers = {"Authorization": f"Bearer {token}"}
        conv_id = "session-auth-stage9-456"

        payload = {
            "query": "Salinity observations near Bay of Bengal",
            "conversation_id": conv_id,
        }
        response = self.client.post("/api/query", json=payload, headers=headers)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        repo = ChatMessageRepository()
        messages, count = asyncio.run(repo.list_messages(session_id=conv_id, user_id=user.id))
        self.assertEqual(count, 2)
        self.assertEqual(messages[0].user_id, user.id)
        self.assertEqual(messages[1].user_id, user.id)

    # --------------------------------------------------------------------------
    # 10. Guest Query Handling
    # --------------------------------------------------------------------------
    def test_10_guest_query_handling(self):
        """Verify unauthenticated guests can query without errors and messages default to guest."""
        conv_id = "session-guest-stage9-789"
        payload = {
            "query": "Show float profile in Arabian Sea",
            "conversation_id": conv_id,
        }
        response = self.client.post("/api/query", json=payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        repo = ChatMessageRepository()
        import asyncio
        messages, count = asyncio.run(repo.list_messages(session_id=conv_id, user_id="guest"))
        self.assertEqual(count, 2)
        self.assertEqual(messages[0].user_id, "guest")

    # --------------------------------------------------------------------------
    # 11. No-Data Query Graceful Handling
    # --------------------------------------------------------------------------
    def test_11_no_data_query_handling(self):
        """Verify queries in areas with zero ARGO floats return graceful empty indicators."""
        sq = StructuredQuery(
            raw_query="Show observations in Lake Michigan",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.TEMP],
            location={"name": "Lake Michigan", "latitude": 43.5, "longitude": -87.0, "radius_km": 10.0},
        )
        res = self.retriever.retrieve(sq)
        self.assertTrue(res.is_empty)
        self.assertEqual(res.total_matched_observations, 0)
        resp = self.engine.synthesize_response(sq, res, use_llm=False)
        self.assertTrue(resp.is_empty)
        self.assertIn("No ARGO float profiles were found", resp.answer)

    # --------------------------------------------------------------------------
    # 12. Invalid Query Validation
    # --------------------------------------------------------------------------
    def test_12_invalid_query_validation(self):
        """Verify empty and whitespace-only queries are rejected with 422 Unprocessable Content."""
        response = self.client.post("/api/query", json={"query": "   "})
        self.assertEqual(response.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

        response2 = self.client.post("/api/chat", json={"query": ""})
        self.assertEqual(response2.status_code, status.HTTP_422_UNPROCESSABLE_ENTITY)

    # --------------------------------------------------------------------------
    # 13. Deterministic Fallback Mode
    # --------------------------------------------------------------------------
    def test_13_deterministic_fallback_mode(self):
        """Verify deterministic parser and synthesizer operate reliably when LLM is offline."""
        engine = FloatChatAIEngine(
            config=AIConfig(llm_provider="mock", fallback_to_deterministic=True),
            data_source=self.data_source,
        )
        resp = engine.chat("What is the salinity near Chennai at 100 meters?", use_llm=False)
        self.assertFalse(resp.is_empty)
        self.assertIn("Chennai", resp.answer)
        self.assertTrue(len(resp.citations) > 0)

    # --------------------------------------------------------------------------
    # 14. Resilient Fallback During Simulated LLM Provider Errors
    # --------------------------------------------------------------------------
    def test_14_resilient_fallback_on_llm_failure(self):
        """Verify LLM synthesis failure falls back to deterministic synthesizer seamlessly."""
        failing_client = MagicMock()
        failing_client.generate.side_effect = ConnectionError("Failed to reach Gemini API")
        failing_client.generate_async.side_effect = ConnectionError("Failed to reach Gemini API")

        synth = LLMResponseSynthesizer(llm_client=failing_client)
        engine = FloatChatAIEngine(
            data_source=self.data_source,
            synthesizer=synth,
            retriever=self.retriever,
        )

        sq = self.engine.parse_query("Salinity near Chennai at 100 meters", use_llm=False)
        res = self.retriever.retrieve(sq)

        # Should fall back cleanly without raising ConnectionError to caller
        resp = engine.synthesize_response(sq, res, use_llm=True)
        self.assertFalse(resp.is_empty)
        self.assertIn("Chennai", resp.answer)
        self.assertIn("PSU", resp.answer)


if __name__ == "__main__":
    unittest.main()

"""
Unit and Integration tests for FloatChat Phase 5 AI Response Synthesizer & End-to-End Chat.
"""

import unittest
from unittest.mock import MagicMock

from ai.config import AIConfig
from ai.engine import FloatChatAIEngine
from ai.llm_client import MockLLMClient
from ai.models import (
    ComparisonFilter,
    DepthFilter,
    LocationFilter,
    OceanParameter,
    QueryIntent,
    StructuredQuery,
)
from ai.response_models import FloatChatResponse
from ai.synthesizer import (
    DeterministicResponseSynthesizer,
    LLMResponseSynthesizer,
    create_response_synthesizer,
)
from data.query_engine import MockDataRetriever


class TestAIResponseSynthesizer(unittest.IsolatedAsyncioTestCase):
    """Test suite for Phase 5 AI Response Generation, Citations, and Visual Payloads."""

    def setUp(self):
        self.retriever = MockDataRetriever()
        self.deterministic_synth = DeterministicResponseSynthesizer()

    # ==========================================
    # 1. Deterministic Synthesis Tests
    # ==========================================
    def test_deterministic_synthesis_chennai_salinity_100m(self):
        """Verify deterministic synthesis for profile query near Chennai."""
        sq = StructuredQuery(
            raw_query="What is the salinity near Chennai at 100 meters?",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707, radius_km=50.0),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)

        self.assertIsInstance(resp, FloatChatResponse)
        self.assertFalse(resp.is_empty)
        self.assertIn("Chennai", resp.answer)
        self.assertIn("34.78", resp.answer)
        self.assertIn("2903334", resp.answer)
        self.assertTrue(len(resp.key_findings) > 0)
        self.assertTrue(len(resp.citations) > 0)
        self.assertEqual(resp.citations[0].platform_id, "2903334")
        self.assertIsNotNone(resp.chart_data)
        self.assertEqual(resp.chart_data.parameter, "PSAL")
        self.assertTrue(len(resp.map_markers) > 0)
        self.assertTrue(len(resp.follow_up_suggestions) > 0)

    def test_deterministic_synthesis_kochi_temperature_range(self):
        """Verify deterministic synthesis for depth range query near Kochi."""
        sq = StructuredQuery(
            raw_query="What is the temperature near Kochi between 50 and 200 meters?",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(name="Kochi", latitude=9.9312, longitude=76.2673, radius_km=50.0),
            depth=DepthFilter(depth_min=50.0, depth_max=200.0),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertIn("Kochi", resp.answer)
        self.assertIn("TEMP", resp.key_findings[0])
        self.assertEqual(resp.citations[0].platform_id, "5906432")
        self.assertIsNotNone(resp.chart_data)
        self.assertTrue(len(resp.chart_data.data_points) >= 2)

    def test_deterministic_synthesis_comparison_arabian_sea_vs_bay_of_bengal(self):
        """Verify comparison synthesis between Arabian Sea and Bay of Bengal."""
        sq = StructuredQuery(
            raw_query="Compare salinity in the Arabian Sea and Bay of Bengal",
            intent=QueryIntent.COMPARISON_QUERY,
            parameters=[OceanParameter.PSAL],
            comparison=ComparisonFilter(
                comparison_type="location",
                target_a="Arabian Sea",
                target_b="Bay of Bengal",
            ),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertIn("Arabian Sea", resp.answer)
        self.assertIn("Bay of Bengal", resp.answer)
        self.assertIn("salinity barrier layer", resp.answer)
        self.assertTrue(len(resp.key_findings) > 0)

    def test_deterministic_synthesis_empty_result(self):
        """Verify graceful handling and guidance for empty observation results."""
        sq = StructuredQuery(
            raw_query="Show data near Antarctica",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(name="South Pacific", latitude=-50.0, longitude=-100.0, radius_km=50.0),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)

        self.assertTrue(resp.is_empty)
        self.assertIn("No ARGO float profiles were found", resp.answer)
        self.assertEqual(len(resp.citations), 0)
        self.assertIsNone(resp.chart_data)
        self.assertTrue(len(resp.follow_up_suggestions) > 0)

    # ==========================================
    # 2. LLM Synthesis & Fallback Tests
    # ==========================================
    def test_llm_synthesizer_success_with_mock_client(self):
        """Verify LLMResponseSynthesizer generates structured response."""
        mock_client = MockLLMClient(default_response="The surface waters near Chennai show high salinity.")
        synth = LLMResponseSynthesizer(llm_client=mock_client)

        sq = StructuredQuery(
            raw_query="Salinity near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
        )
        res = self.retriever.retrieve(sq)
        resp = synth.synthesize(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertEqual(resp.answer, "The surface waters near Chennai show high salinity.")
        self.assertTrue(len(resp.citations) > 0)
        self.assertIsNotNone(resp.chart_data)

    def test_llm_synthesizer_fallback_on_exception(self):
        """Verify LLM synthesizer falls back to deterministic synthesizer on error."""
        failing_client = MagicMock()
        failing_client.generate.side_effect = RuntimeError("API connection timeout")
        synth = LLMResponseSynthesizer(llm_client=failing_client)

        sq = StructuredQuery(
            raw_query="What is the salinity near Chennai at 100 meters?",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.retriever.retrieve(sq)
        resp = synth.synthesize(sq, res)

        # Fallback should deliver clean deterministic markdown
        self.assertFalse(resp.is_empty)
        self.assertIn("34.78", resp.answer)
        self.assertIn("2903334", resp.answer)

    # ==========================================
    # 3. FloatChatAIEngine Chat Integration Tests
    # ==========================================
    def test_engine_chat_end_to_end_chennai(self):
        """Verify full end-to-end chat pipeline for Chennai salinity."""
        engine = FloatChatAIEngine()
        resp = engine.chat("What is the salinity near Chennai at 100 meters?", use_llm=False)

        self.assertIsInstance(resp, FloatChatResponse)
        self.assertFalse(resp.is_empty)
        self.assertIn("Chennai", resp.answer)
        self.assertEqual(resp.citations[0].platform_id, "2903334")

        # Verify backend serialization dictionary
        b_dict = resp.to_backend_dict()
        self.assertIn("answer", b_dict)
        self.assertIn("key_findings", b_dict)
        self.assertIn("citations", b_dict)
        self.assertIn("chart_data", b_dict)
        self.assertIn("map_markers", b_dict)
        self.assertIn("follow_up_suggestions", b_dict)

    async def test_engine_chat_async(self):
        """Verify asynchronous chat execution."""
        engine = FloatChatAIEngine()
        resp = await engine.chat_async("Show temperature near Kochi between 50 and 200 meters", use_llm=False)
        self.assertFalse(resp.is_empty)
        self.assertIn("Kochi", resp.answer)

    # ==========================================
    # 4. Extended Synthesis & Visual Payload Tests
    # ==========================================
    def test_create_response_synthesizer_factory(self):
        """Verify factory instantiates LLMResponseSynthesizer with fallback."""
        synth = create_response_synthesizer(AIConfig(llm_provider="mock"))
        self.assertIsInstance(synth, LLMResponseSynthesizer)
        self.assertIsInstance(synth.fallback_synthesizer, DeterministicResponseSynthesizer)

    def test_chart_data_ordering_surface_to_deep(self):
        """Verify chart data points are sorted by increasing depth."""
        sq = StructuredQuery(
            raw_query="Show vertical salinity profile near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)

        self.assertIsNotNone(resp.chart_data)
        depths = [p.depth_m for p in resp.chart_data.data_points]
        self.assertEqual(depths, sorted(depths))

    def test_llm_synthesizer_empty_text_fallback(self):
        """Verify LLM synthesizer falls back when LLM returns empty whitespace string."""
        empty_client = MockLLMClient(default_response="   ")
        synth = LLMResponseSynthesizer(llm_client=empty_client)

        sq = StructuredQuery(
            raw_query="Salinity near Chennai at 100m",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.retriever.retrieve(sq)
        resp = synth.synthesize(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertIn("34.78", resp.answer)

    async def test_llm_synthesizer_async_success(self):
        """Verify asynchronous LLM synthesis with mock client."""
        mock_client = MockLLMClient(default_response="Async LLM scientific narrative.")
        synth = LLMResponseSynthesizer(llm_client=mock_client)

        sq = StructuredQuery(
            raw_query="Temperature near Kochi",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.TEMP],
            location=LocationFilter(name="Kochi", latitude=9.9312, longitude=76.2673),
        )
        res = self.retriever.retrieve(sq)
        resp = await synth.synthesize_async(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertEqual(resp.answer, "Async LLM scientific narrative.")

    async def test_llm_synthesizer_async_fallback_on_error(self):
        """Verify asynchronous LLM synthesis falls back on exception."""
        failing_client = MagicMock()
        failing_client.generate_async.side_effect = RuntimeError("Async LLM error")
        synth = LLMResponseSynthesizer(llm_client=failing_client)

        sq = StructuredQuery(
            raw_query="Salinity near Chennai at 100m",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
            depth=DepthFilter(target_depth=100.0),
        )
        res = self.retriever.retrieve(sq)
        resp = await synth.synthesize_async(sq, res)

        self.assertFalse(resp.is_empty)
        self.assertIn("Chennai", resp.answer)

    def test_response_models_serialization(self):
        """Verify FloatChatResponse and nested models serialize cleanly to backend dictionary."""
        sq = StructuredQuery(
            raw_query="Salinity near Chennai",
            intent=QueryIntent.PROFILE_QUERY,
            parameters=[OceanParameter.PSAL],
            location=LocationFilter(name="Chennai", latitude=13.0827, longitude=80.2707),
        )
        res = self.retriever.retrieve(sq)
        resp = self.deterministic_synth.synthesize(sq, res)
        d = resp.to_backend_dict()

        self.assertEqual(d["query"], sq.raw_query)
        self.assertIsInstance(d["citations"], list)
        self.assertIsInstance(d["map_markers"], list)
        self.assertIsInstance(d["chart_data"], dict)
        self.assertEqual(d["chart_data"]["chart_type"], "profile")


if __name__ == "__main__":
    unittest.main()


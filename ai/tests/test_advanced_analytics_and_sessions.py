"""
Unit and Integration tests for FloatChat Advanced Physical Oceanography Indicators,
Multi-Turn Conversational Memory, and Streaming Response Synthesis.
"""

import unittest
from datetime import datetime, timezone

from ai.engine import FloatChatAIEngine
from ai.models import DepthFilter, LocationFilter, OceanParameter, QueryIntent, StructuredQuery
from ai.session import ConversationSession, SessionManager
from data.filters import (
    approximate_potential_density,
    calculate_barrier_layer_thickness,
    calculate_mixed_layer_depth,
    calculate_thermocline_gradient,
    compute_oceanographic_indicators,
    detect_marine_heatwave_anomalies,
)
from data.models import ArgoObservation
from data.sample_data import get_sample_observations


class TestAdvancedAnalyticsAndSessions(unittest.IsolatedAsyncioTestCase):
    """Test suite for oceanographic indicators, session context, and streaming."""

    def setUp(self):
        self.engine = FloatChatAIEngine()
        self.engine.session_manager.clear_all()
        self.observations = get_sample_observations()

    # ==========================================
    # 1. Physical Oceanography Indicators Tests
    # ==========================================
    def test_approximate_potential_density(self):
        """Verify seawater density anomaly sigma_t computation."""
        # Standard surface seawater: T=25°C, S=35 PSU -> sigma_t ~ 23.3 kg/m^3
        dens = approximate_potential_density(temp_c=25.0, psal_psu=35.0)
        self.assertTrue(22.0 < dens < 25.0)

        # Cold salty water should be denser
        cold_dens = approximate_potential_density(temp_c=5.0, psal_psu=35.0)
        self.assertTrue(cold_dens > dens)

    def test_calculate_mixed_layer_depth(self):
        """Verify Mixed Layer Depth (MLD) calculation using temperature and density criteria."""
        # Synthetic profile with sharp drop below 40m
        obs_profile = [
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=5.0, depth_m=5.0, temp_c=28.5, psal_psu=33.0),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=10.0, depth_m=10.0, temp_c=28.4, psal_psu=33.1),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=25.0, depth_m=25.0, temp_c=28.3, psal_psu=33.2),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=50.0, depth_m=50.0, temp_c=27.9, psal_psu=34.5),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=100.0, depth_m=100.0, temp_c=24.0, psal_psu=35.0),
        ]
        mld = calculate_mixed_layer_depth(obs_profile)
        self.assertIsNotNone(mld["mld_temperature_m"])
        self.assertEqual(mld["mld_temperature_m"], 50.0)
        self.assertIsNotNone(mld["mld_density_m"])

    def test_calculate_thermocline_gradient(self):
        """Verify thermocline maximum temperature lapse rate detection."""
        obs_profile = [
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=10.0, depth_m=10.0, temp_c=28.0, psal_psu=34.0),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=50.0, depth_m=50.0, temp_c=27.5, psal_psu=34.2),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=100.0, depth_m=100.0, temp_c=20.0, psal_psu=34.8),  # 7.5°C drop over 50m = 0.15°C/m
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=200.0, depth_m=200.0, temp_c=15.0, psal_psu=35.0),
        ]
        therm = calculate_thermocline_gradient(obs_profile)
        self.assertIsNotNone(therm["thermocline_depth_m"])
        self.assertEqual(therm["thermocline_depth_m"], 75.0)
        self.assertAlmostEqual(therm["max_gradient_c_per_m"], 0.15, places=3)

    def test_calculate_barrier_layer_thickness(self):
        """Verify salinity barrier layer detection."""
        obs_profile = [
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=10.0, depth_m=10.0, temp_c=28.5, psal_psu=31.5),
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=30.0, depth_m=30.0, temp_c=28.4, psal_psu=34.2),  # Halocline / density jump at 30m
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=60.0, depth_m=60.0, temp_c=28.1, psal_psu=34.8),  # Isothermal down to 60m
            ArgoObservation(platform_id="1234567", latitude=13.0, longitude=80.0, timestamp="2025-01-01T00:00:00Z", pressure_dbar=100.0, depth_m=100.0, temp_c=23.0, psal_psu=35.0),
        ]
        blt = calculate_barrier_layer_thickness(obs_profile)
        self.assertIsNotNone(blt["barrier_layer_thickness_m"])
        self.assertTrue(blt["barrier_layer_thickness_m"] >= 0.0)

    def test_detect_marine_heatwave_anomalies(self):
        """Verify marine heatwave anomaly detection above baseline."""
        anomalous_obs = [
            ArgoObservation(platform_id="2903334", latitude=13.0, longitude=80.0, timestamp="2025-05-01T00:00:00Z", pressure_dbar=5.0, depth_m=5.0, temp_c=31.2, psal_psu=34.0),
            ArgoObservation(platform_id="2903334", latitude=13.0, longitude=80.0, timestamp="2025-05-01T00:00:00Z", pressure_dbar=100.0, depth_m=100.0, temp_c=24.0, psal_psu=34.8),
        ]
        anomalies = detect_marine_heatwave_anomalies(anomalous_obs, baseline_temp_c=28.5, anomaly_threshold_c=1.5)
        self.assertEqual(len(anomalies), 1)
        self.assertEqual(anomalies[0]["anomaly_c"], 2.7)

    # ==========================================
    # 2. Multi-Turn Session Memory Tests
    # ==========================================
    def test_multi_turn_session_context_resolution(self):
        """Verify follow-up queries inherit location, depth, and parameter context."""
        session = self.engine.session_manager.get_or_create_session("test-session-001")

        # Turn 1: Explicit initial query
        t1_resp = self.engine.chat(
            "What is the salinity near Chennai at 100 meters?",
            use_llm=False,
            session_id="test-session-001",
        )
        self.assertIn("Chennai", t1_resp.answer)
        self.assertEqual(len(session.turns), 1)

        # Turn 2: Follow-up changing only depth ("What about at 200 meters?")
        sq2 = self.engine.parse_query("What about at 200 meters?", use_llm=False, session_id="test-session-001")
        self.assertIsNotNone(sq2.location)
        self.assertEqual(sq2.location.name, "Chennai")
        self.assertEqual(sq2.parameters[0], OceanParameter.PSAL)
        self.assertEqual(sq2.depth.target_depth, 200.0)

        t2_resp = self.engine.chat(
            "What about at 200 meters?",
            use_llm=False,
            session_id="test-session-001",
        )
        self.assertIn("Chennai", t2_resp.answer)
        self.assertEqual(len(session.turns), 2)

        # Turn 3: Follow-up changing parameter ("Show temperature instead")
        sq3 = self.engine.parse_query("Show temperature instead", use_llm=False, session_id="test-session-001")
        self.assertIsNotNone(sq3.location)
        self.assertEqual(sq3.location.name, "Chennai")
        self.assertEqual(sq3.parameters[0], OceanParameter.TEMP)
        self.assertEqual(sq3.depth.target_depth, 200.0)

    # ==========================================
    # 3. Streaming Response Generation Tests
    # ==========================================
    async def test_chat_stream_yields_tokens(self):
        """Verify chat_stream yields conversational tokens chunk-by-chunk."""
        chunks = []
        async for chunk in self.engine.chat_stream("What is the salinity near Chennai at 100 meters?", use_llm=False):
            chunks.append(chunk)

        self.assertTrue(len(chunks) > 5)
        full_text = "".join(chunks)
        self.assertIn("Chennai", full_text)
        self.assertIn("34.78", full_text)


if __name__ == "__main__":
    unittest.main()

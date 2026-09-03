from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, field_validator


DEFAULT_THEME = "dark"
ALLOWED_THEMES = {"dark", "light", "system"}
DEFAULT_LANGUAGE = "en"
ALLOWED_LANGUAGES = {"en", "fr", "es", "de", "hi", "zh", "ja"}
DEFAULT_MAP_CENTER = [0.0, 0.0]
DEFAULT_MAP_ZOOM = 2
DEFAULT_PREFERRED_UNITS = {
    "temperature": "degC",
    "salinity": "psu",
    "pressure": "dbar",
    "depth": "m",
}


# ==============================================================================
# Domain Models (Internal representation)
# ==============================================================================

class UserPreferences(BaseModel):
    """Internal domain model representing personalized UI/UX settings for a user."""

    id: str = Field(..., description="Unique preference record ID (derived from MongoDB ObjectId)")
    user_id: str = Field(..., description="Owner User ID")
    theme: str = Field(default=DEFAULT_THEME, description="UI theme ('dark', 'light', 'system')")
    language: str = Field(default=DEFAULT_LANGUAGE, description="Language code (e.g. 'en', 'fr', 'es')")
    default_map_center: List[float] = Field(default_factory=lambda: list(DEFAULT_MAP_CENTER), description="[lat, lon] coordinates")
    default_map_zoom: int = Field(default=DEFAULT_MAP_ZOOM, ge=1, le=18, description="Default map zoom (1 to 18)")
    preferred_units: Dict[str, str] = Field(default_factory=lambda: dict(DEFAULT_PREFERRED_UNITS), description="Preferred measurement units")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Created UTC timestamp")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="Updated UTC timestamp")

    @classmethod
    def from_mongo(cls, doc: Dict[str, Any]) -> Optional["UserPreferences"]:
        """Converts raw MongoDB document dict into UserPreferences domain model."""
        if not doc:
            return None
        doc_copy = dict(doc)
        if "_id" in doc_copy:
            doc_copy["id"] = str(doc_copy.pop("_id"))
        return cls(**doc_copy)


# ==============================================================================
# API Schemas (Request / Response)
# ==============================================================================

class UserPreferencesUpdate(BaseModel):
    """Schema for updating user preferences."""

    theme: Optional[str] = Field(None, description="Preferred theme ('dark', 'light', 'system')")
    language: Optional[str] = Field(None, description="Preferred UI language code ('en', 'fr', 'es', etc.)")
    default_map_center: Optional[List[float]] = Field(
        None,
        min_length=2,
        max_length=2,
        description="Map center as [latitude (-90 to 90), longitude (-180 to 180)]",
    )
    default_map_zoom: Optional[int] = Field(None, ge=1, le=18, description="Map zoom level (1 to 18)")
    preferred_units: Optional[Dict[str, str]] = Field(None, description="Custom unit preferences dictionary")

    @field_validator("theme")
    @classmethod
    def validate_theme(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in ALLOWED_THEMES:
                raise ValueError(f"Theme '{v}' is invalid. Allowed themes: {sorted(ALLOWED_THEMES)}")
            return clean
        return v

    @field_validator("language")
    @classmethod
    def validate_language(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            clean = v.strip().lower()
            if clean not in ALLOWED_LANGUAGES:
                raise ValueError(f"Language '{v}' is not supported. Supported languages: {sorted(ALLOWED_LANGUAGES)}")
            return clean
        return v

    @field_validator("default_map_center")
    @classmethod
    def validate_map_center(cls, v: Optional[List[float]]) -> Optional[List[float]]:
        if v is not None:
            if len(v) != 2:
                raise ValueError("default_map_center must contain exactly [latitude, longitude].")
            lat, lon = v[0], v[1]
            if not (-90.0 <= lat <= 90.0):
                raise ValueError(f"Latitude {lat} out of valid range [-90.0, 90.0]")
            if not (-180.0 <= lon <= 180.0):
                raise ValueError(f"Longitude {lon} out of valid range [-180.0, 180.0]")
        return v


class UserPreferencesResponse(BaseModel):
    """Public API response schema for user preferences."""

    user_id: str = Field(..., description="Owner User ID")
    theme: str = Field(..., description="Active theme ('dark', 'light', 'system')")
    language: str = Field(..., description="Active language code")
    default_map_center: List[float] = Field(..., description="Default center coordinates [lat, lon]")
    default_map_zoom: int = Field(..., description="Default zoom level")
    preferred_units: Dict[str, str] = Field(..., description="Measurement unit mappings")
    created_at: datetime = Field(..., description="Created UTC timestamp")
    updated_at: datetime = Field(..., description="Updated UTC timestamp")

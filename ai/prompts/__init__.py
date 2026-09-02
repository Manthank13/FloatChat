"""Prompts package for FloatChat oceanographic AI personas and query generation."""

from ai.prompts.system_prompts import (
    OCEANOGRAPHER_SYSTEM_PROMPT,
    QUERY_INTERPRETER_SYSTEM_PROMPT,
    QUERY_PARSER_SYSTEM_PROMPT,
)
from ai.prompts.templates import (
    FEW_SHOT_QUERY_PARSER_EXAMPLES,
    QUERY_PARSER_USER_TEMPLATE,
)

__all__ = [
    "OCEANOGRAPHER_SYSTEM_PROMPT",
    "QUERY_INTERPRETER_SYSTEM_PROMPT",
    "QUERY_PARSER_SYSTEM_PROMPT",
    "QUERY_PARSER_USER_TEMPLATE",
    "FEW_SHOT_QUERY_PARSER_EXAMPLES",
]

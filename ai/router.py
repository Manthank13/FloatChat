"""
FastAPI Chat Router for FloatChat.

Exposes conversational endpoints connecting user prompts to FloatChatAIEngine.
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from ai.engine import FloatChatAIEngine
from ai.response_models import FloatChatResponse
from ai.session import ConversationSession, get_session_manager

router = APIRouter(prefix="/chat", tags=["FloatChat AI Conversational Engine"])

# Engine singleton for API routing
_engine = FloatChatAIEngine()


class ChatRequest(BaseModel):
    """Payload for conversational question endpoint."""
    query: str = Field(..., description="Natural language question about oceanographic conditions", min_length=1)
    session_id: Optional[str] = Field(default=None, description="Optional conversation session ID for multi-turn context")
    use_llm: bool = Field(default=True, description="Whether to use LLM parsing and response synthesis")


class ChatSessionResponse(BaseModel):
    """Session history response schema."""
    session_id: str
    turn_count: int
    created_at: str
    updated_at: str
    turns: List[Dict[str, Any]]


@router.post("", response_model=Dict[str, Any], summary="Execute full oceanographic conversational query")
async def chat_endpoint(request: ChatRequest) -> Dict[str, Any]:
    """
    Translates user question into structured query, retrieves ARGO float observations,
    computes authoritative statistics & indicators, and returns grounded insight.
    """
    try:
        response = await _engine.chat_async(
            natural_language_query=request.query,
            use_llm=request.use_llm,
            session_id=request.session_id,
        )
        return response.to_backend_dict()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Conversational query execution failed: {str(exc)}",
        )


@router.post("/stream", summary="Stream conversational response tokens (Server-Sent Events)")
async def chat_stream_endpoint(request: ChatRequest):
    """
    Streams response tokens chunk-by-chunk for real-time frontend chat typing effect.
    """
    async def event_generator():
        try:
            async for chunk in _engine.chat_stream(
                natural_language_query=request.query,
                use_llm=request.use_llm,
                session_id=request.session_id,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as exc:
            yield f"data: [ERROR: {str(exc)}]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/sessions/{session_id}", response_model=ChatSessionResponse, summary="Get conversation history")
async def get_session_history(session_id: str) -> ChatSessionResponse:
    """Retrieve turn history and context for an active session."""
    session = _engine.get_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return ChatSessionResponse(
        session_id=session.session_id,
        turn_count=len(session.turns),
        created_at=session.created_at,
        updated_at=session.updated_at,
        turns=[turn.model_dump() if hasattr(turn, "model_dump") else turn.dict() for turn in session.turns],
    )


@router.delete("/sessions/{session_id}", summary="Clear conversation session")
async def delete_session(session_id: str) -> Dict[str, Any]:
    """Delete a conversation session."""
    cleared = _engine.clear_session(session_id)
    if not cleared:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Session '{session_id}' not found.",
        )
    return {"status": "success", "message": f"Session '{session_id}' cleared."}

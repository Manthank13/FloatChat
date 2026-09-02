from fastapi import APIRouter, HTTPException, status
from app.models.analysis import (
    DepthProfileRequest,
    DepthProfileResult,
    FloatComparisonRequest,
    FloatComparisonResult,
    StatisticsRequest,
    StatisticsResult,
    TrendAnalysisRequest,
    TrendAnalysisResult,
)
from app.services.analysis import ScientificAnalysisService

router = APIRouter()


@router.post(
    "/analysis/statistics",
    response_model=StatisticsResult,
    summary="Calculate Basic Scientific Statistics",
    description="Computes mean, median, minimum, maximum, and observation counts for a target variable.",
)
async def calculate_statistics(request: StatisticsRequest) -> StatisticsResult:
    try:
        service = ScientificAnalysisService()
        return await service.calculate_statistics(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error computing statistics: {str(exc)}",
        )


@router.post(
    "/analysis/profile",
    response_model=DepthProfileResult,
    summary="Generate Vertical Depth Profile Aggregation",
    description="Returns vertical ocean observations aggregated across depth/pressure levels.",
)
async def generate_depth_profile(request: DepthProfileRequest) -> DepthProfileResult:
    try:
        service = ScientificAnalysisService()
        return await service.generate_depth_profile(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating depth profile: {str(exc)}",
        )


@router.post(
    "/analysis/compare",
    response_model=FloatComparisonResult,
    summary="Compare Multi-Float Observations",
    description="Compares observations between two float platforms at depth-matched levels.",
)
async def compare_floats(request: FloatComparisonRequest) -> FloatComparisonResult:
    try:
        service = ScientificAnalysisService()
        return await service.compare_floats(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing floats: {str(exc)}",
        )


@router.post(
    "/analysis/trend",
    response_model=TrendAnalysisResult,
    summary="Analyze Temporal Trends & Changes",
    description="Evaluates chronological changes between earliest and latest observations.",
)
async def analyze_trend(request: TrendAnalysisRequest) -> TrendAnalysisResult:
    try:
        service = ScientificAnalysisService()
        return await service.analyze_trend(request)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing trend: {str(exc)}",
        )

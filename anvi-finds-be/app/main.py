
from contextlib import asynccontextmanager

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html

from app.config.database import create_database_engine, create_session_factory
from app.config.logging import close_logging, configure_logging
from app.config.settings import settings
from app.middleware.errors import register_exception_handlers
from app.modules import collection_router, user_router
from app.security.rate_limit import limiter
from app.utils.base_schema import ErrorResponse
from app.utils.constant import ApiPaths


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and clean up application resources."""

    handler = configure_logging()
    engine = None

    try:
        engine = create_database_engine()

        app.state.db_engine = engine
        app.state.db_session_factory = create_session_factory(engine)

        yield

    finally:
        try:
            if engine is not None:
                await engine.dispose()
        finally:
            close_logging(handler)


app = FastAPI(
    title="Authentication API",
    debug=settings.DEBUG,
    lifespan=lifespan,
    docs_url=None,
    servers=[{"url": "/"}],
)

app.state.limiter = limiter

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=settings.allowed_methods,
    allow_headers=settings.allowed_headers,
)

register_exception_handlers(app)

app.include_router(
    user_router,
    prefix=f"{ApiPaths.API_PREFIX}{ApiPaths.API_VERSION}{ApiPaths.AUTH_PREFIX}",
    tags=["Authentication"],
    responses={
        status.HTTP_401_UNAUTHORIZED: {
            "model": ErrorResponse,
            "description": "Authentication failed",
        },
        status.HTTP_403_FORBIDDEN: {
            "model": ErrorResponse,
            "description": "Request origin is not allowed",
        },
        status.HTTP_409_CONFLICT: {
            "model": ErrorResponse,
            "description": "Account already exists",
        },
        status.HTTP_429_TOO_MANY_REQUESTS: {
            "model": ErrorResponse,
            "description": "Too many login attempts",
        },
        status.HTTP_422_UNPROCESSABLE_CONTENT: {
            "model": ErrorResponse,
            "description": "Invalid input",
        },
        status.HTTP_500_INTERNAL_SERVER_ERROR: {
            "model": ErrorResponse,
            "description": "Unexpected server error",
        },
    },
)

app.include_router(
    collection_router,
    prefix=f"{ApiPaths.API_PREFIX}{ApiPaths.API_VERSION}",
    tags=["Collections"],
)


@app.get("/docs", include_in_schema=False)
async def documentation():
    """Serve Swagger documentation."""

    return get_swagger_ui_html(
        openapi_url="/openapi.json",
        title="Authentication API documentation",
    )

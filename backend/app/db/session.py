from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings
from app.core.logging import logger


class MongoDBManager:
    """Singleton connection manager for Motor AsyncIOMotorClient."""

    _client: Optional[AsyncIOMotorClient] = None
    _db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls) -> None:
        """Initializes single shared Motor MongoDB client connection if MONGODB_URI is configured."""
        if not settings.is_mongodb_configured:
            logger.info("MongoDB URI is not configured or in test mode. Running in memory / mock database mode.")
            return

        if cls._client is None:
            logger.info(f"Connecting to MongoDB database '{settings.MONGODB_DATABASE}'...")
            cls._client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=5000,
                uuidRepresentation="standard",
            )
            cls._db = cls._client[settings.MONGODB_DATABASE]
            logger.info("MongoDB client connected successfully.")

    @classmethod
    async def disconnect(cls) -> None:
        """Closes MongoDB client connection on shutdown."""
        if cls._client is not None:
            logger.info("Closing MongoDB connection client...")
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB client closed.")

    @classmethod
    def get_db(cls) -> Optional[AsyncIOMotorDatabase]:
        """Returns the active Motor database instance or None if unconfigured."""
        return cls._db

    @classmethod
    async def ping(cls) -> bool:
        """Pings MongoDB server to verify readiness connectivity."""
        if cls._client is None or cls._db is None:
            return False
        try:
            # Execute admin ping command
            await cls._db.command("ping")
            return True
        except Exception as exc:
            logger.warning(f"MongoDB readiness ping failed: {exc}")
            return False

    @classmethod
    async def verify_connectivity(cls) -> tuple[bool, str]:
        """Directly tests MongoDB connectivity with current settings without affecting singleton state."""
        if not settings.MONGODB_URI:
            return False, "MONGODB_URI is not set in environment or .env"
        if "<CLUSTER_HOST>" in settings.MONGODB_URI or "<PASSWORD>" in settings.MONGODB_URI:
            return False, "MONGODB_URI contains unconfigured placeholder tokens (<PASSWORD> or <CLUSTER_HOST>)"
        test_client = None
        try:
            test_client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            await test_client[settings.MONGODB_DATABASE].command("ping")
            return True, f"Successfully connected to MongoDB database '{settings.MONGODB_DATABASE}'"
        except Exception as exc:
            return False, f"MongoDB connection error: {str(exc)}"
        finally:
            if test_client is not None:
                test_client.close()


async def get_database() -> Optional[AsyncIOMotorDatabase]:
    """Dependency / Helper returning current MongoDB database."""
    return MongoDBManager.get_db()


async def ping_mongodb() -> bool:
    """Helper verifying MongoDB connectivity status."""
    return await MongoDBManager.ping()

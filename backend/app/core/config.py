from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import URL


class Settings(BaseSettings):
    PROJECT_NAME: str = "DocaOS - Patio & Dock Operating System"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "docaos_yms_secret_key_change_in_production_b2b"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    # Suporte nativo a DATABASE_URL para deploy na nuvem (Fly Postgres, Supabase, Neon, etc.)
    DATABASE_URL: Optional[str] = None

    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "Rikaru@10"
    POSTGRES_DB: str = "rotaflow"

    PORT: int = 8080
    FRONTEND_DIST_DIR: Optional[str] = None
    DRIVER_PORTAL_URL: str = "http://localhost:5173/checkin"

    def get_database_url(self) -> str | URL:
        if self.DATABASE_URL:
            db_url = self.DATABASE_URL.strip()
            # Ajusta o driver para psycopg v3 se necessário
            if db_url.startswith("postgres://"):
                db_url = "postgresql+psycopg://" + db_url[len("postgres://"):]
            elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
                db_url = "postgresql+psycopg://" + db_url[len("postgresql://"):]
            return db_url

        return URL.create(
            drivername="postgresql+psycopg",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_SERVER,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB
        )

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()


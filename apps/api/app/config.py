from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "Manus SwarmDesk API"
    mongodb_uri: str = "mongodb://localhost:27017"
    mongodb_db: str = "swarmdesk"
    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
    use_memory_store: bool = False


settings = Settings()

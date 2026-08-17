from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg2://raznaia:raznaia@localhost:5432/raznaia"
    secret_key: str = "dev-secret"
    jwt_expire_hours: int = 24
    cors_origins: str = "http://localhost:5173"
    app_env: str = "development"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()

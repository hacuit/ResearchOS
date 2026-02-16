from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "Research OS API"
    jwt_secret: str = "change-me-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 24

    database_url: str = "sqlite:///./researchos.db"

    owner_email: str = "dhkwon@dgist.ac.kr"
    owner_password: str = "change-this-password"
    owner_workspace_name: str = "Personal Research Workspace"

    openai_api_key: str = ""
    openai_model: str = "gpt-5-mini"
    ai_monthly_budget_usd: float = 20.0


settings = Settings()

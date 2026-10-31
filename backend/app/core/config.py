from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    app_env: str = "development"
    app_name: str = "NeuroLab Enterprise API"
    api_prefix: str = "/api/v1"
    database_url: str
    supabase_url: str = ""
    supabase_jwt_secret: str = ""
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:4173"
    dev_auth_enabled: bool = True
    dev_user_id: str = "00000000-0000-0000-0000-000000000001"
    dev_user_email: str = "demo@neurolab.local"
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

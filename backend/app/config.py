import os

class Settings:
    PROJECT_NAME: str = "CampusCare Operations Center"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./campuscare.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "campuscare-super-secret-key-operations-2026")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # Priority Engine Weights (Configurable)
    WEIGHT_SEVERITY: float = 0.30
    WEIGHT_PEOPLE_AFFECTED: float = 0.20
    WEIGHT_CATEGORY: float = 0.20
    WEIGHT_LOCATION_RISK: float = 0.10
    WEIGHT_TIME_SENSITIVITY: float = 0.10
    WEIGHT_ESCALATION: float = 0.10

    # SLA Response Target Minutes
    SLA_CRITICAL_MIN: int = 3
    SLA_HIGH_MIN: int = 7
    SLA_MEDIUM_MIN: int = 15
    SLA_LOW_MIN: int = 30

settings = Settings()

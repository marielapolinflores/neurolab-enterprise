from uuid import UUID
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict

class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    description: str | None
    owner_id: UUID
    status: str
    created_at: datetime

class ArchitectureCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    family: Literal["Feedforward", "RNN", "CNN", "GAN"]
    config: dict[str, Any]

class ArchitectureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    name: str
    family: str
    config_json: dict
    version: int

class TrainingCreate(BaseModel):
    architecture_id: UUID
    dataset_id: UUID | None = None
    epochs: int = Field(default=10, ge=1, le=500)
    batch_size: int = Field(default=32, ge=1, le=1024)
    optimizer: str = Field(default="adam", min_length=2, max_length=40)

class TrainingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    architecture_id: UUID
    dataset_id: UUID | None
    status: str
    progress: int
    current_epoch: int
    total_epochs: int
    loss: float | None
    error_message: str | None
    started_at: datetime | None
    ended_at: datetime | None
    created_at: datetime

class DatasetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    metadata: dict[str, Any] = {}

class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    name: str
    version: int
    storage_key: str | None
    metadata_json: dict

class ModelStatusUpdate(BaseModel):
    status: Literal["draft", "reviewed", "approved", "retired", "borrador", "revisado", "aprobado", "retirado"]

class ModelVersionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    job_id: UUID
    version: str
    storage_key: str | None
    status: str
    checksum: str | None
    created_at: datetime
    metadata: dict[str, Any] | None = None
    architecture_name: str | None = None
    family: str | None = None
    accuracy: float | None = None
    loss: float | None = None

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    email: str
    display_name: str | None
    status: str
    created_at: datetime

class MemberOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    project_id: UUID
    user_id: UUID
    role: str
    email: str | None = None
    display_name: str | None = None

class MemberUpdate(BaseModel):
    user_id: UUID
    role: Literal["owner", "admin", "data_scientist", "reviewer", "viewer", "propietario", "administrador", "cientifico_datos", "revisor", "lector"]

class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    actor_id: UUID
    project_id: UUID | None
    action: str
    metadata_json: dict
    created_at: datetime

class ResourceLimitsConfig(BaseModel):
    max_concurrent_jobs: int = Field(default=4, ge=1, le=20)
    max_epochs: int = Field(default=100, ge=5, le=1000)
    storage_limit_gb: int = Field(default=50, ge=5, le=500)
    retention_days: int = Field(default=90, ge=7, le=730)

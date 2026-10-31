from uuid import UUID
from datetime import datetime
from typing import Literal, Any
from pydantic import BaseModel, Field, ConfigDict

class ProjectCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; name: str; description: str | None; owner_id: UUID; status: str; created_at: datetime

class ArchitectureCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    family: Literal["Feedforward", "RNN", "CNN", "GAN"]
    config: dict[str, Any]

class ArchitectureOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; project_id: UUID; name: str; family: str; config_json: dict; version: int

class TrainingCreate(BaseModel):
    architecture_id: UUID
    dataset_id: UUID | None = None
    epochs: int = Field(default=10, ge=1, le=500)
    batch_size: int = Field(default=32, ge=1, le=1024)
    optimizer: str = Field(default="adam", min_length=2, max_length=40)

class TrainingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; project_id: UUID; architecture_id: UUID; dataset_id: UUID | None
    status: str; progress: int; current_epoch: int; total_epochs: int
    loss: float | None; error_message: str | None; started_at: datetime | None; ended_at: datetime | None; created_at: datetime

class DatasetCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    metadata: dict[str, Any] = {}

class DatasetOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID; project_id: UUID; name: str; version: int; storage_key: str | None; metadata_json: dict

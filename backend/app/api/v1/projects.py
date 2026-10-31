
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_, delete
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import (
    Project,
    ProjectMember,
    Architecture,
    Dataset,
    TrainingJob,
    ModelVersion,
    AuditEvent,
)
from app.schemas.schemas import (
    ProjectCreate,
    ProjectOut,
    ArchitectureCreate,
    ArchitectureOut,
    DatasetCreate,
    DatasetOut,
)
from app.core.auth import current_user
from app.services.authorization import get_project_or_404, can_write


router = APIRouter(prefix="/projects", tags=["projects"])


# =========================================================
# LISTAR PROYECTOS
# =========================================================
@router.get("", response_model=list[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    stmt = (
        select(Project)
        .where(
            or_(
                Project.owner_id == user.id,
                Project.id.in_(
                    select(ProjectMember.project_id).where(
                        ProjectMember.user_id == user.id
                    )
                ),
            )
        )
        .order_by(Project.created_at.desc())
    )

    return db.execute(stmt).scalars().all()


# =========================================================
# CREAR PROYECTO
# =========================================================
@router.post("", response_model=ProjectOut, status_code=201)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    project = Project(
        name=body.name,
        description=body.description,
        owner_id=user.id,
    )

    db.add(project)
    db.flush()

    db.add(
        ProjectMember(
            project_id=project.id,
            user_id=user.id,
            role="owner",
        )
    )

    db.commit()
    db.refresh(project)

    return project


# =========================================================
# ELIMINAR PROYECTO
# SOLO PUEDE HACERLO EL PROPIETARIO
# =========================================================
@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    project = get_project_or_404(db, project_id, user.id)

    if project.owner_id != user.id:
        raise HTTPException(
            status_code=403,
            detail="Solo el propietario puede eliminar este proyecto.",
        )

    try:
        # Desvincular los eventos de auditoría.
        db.execute(
            delete(AuditEvent).where(
                AuditEvent.project_id == project_id
            )
        )

        # Eliminar versiones de modelos.
        db.execute(
            delete(ModelVersion).where(
                ModelVersion.project_id == project_id
            )
        )

        # Eliminar trabajos de entrenamiento.
        db.execute(
            delete(TrainingJob).where(
                TrainingJob.project_id == project_id
            )
        )

        # Eliminar arquitecturas.
        db.execute(
            delete(Architecture).where(
                Architecture.project_id == project_id
            )
        )

        # Eliminar datasets.
        db.execute(
            delete(Dataset).where(
                Dataset.project_id == project_id
            )
        )

        # Eliminar miembros del proyecto.
        db.execute(
            delete(ProjectMember).where(
                ProjectMember.project_id == project_id
            )
        )

        # Finalmente, eliminar el proyecto.
        db.delete(project)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo eliminar el proyecto.",
        )

    return None


# =========================================================
# OBTENER UN PROYECTO
# =========================================================
@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    return get_project_or_404(db, project_id, user.id)


# =========================================================
# CREAR ARQUITECTURA
# =========================================================
@router.post(
    "/{project_id}/architectures",
    response_model=ArchitectureOut,
    status_code=201,
)
def create_architecture(
    project_id: UUID,
    body: ArchitectureCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    project = get_project_or_404(db, project_id, user.id)
    can_write(db, project, user.id)

    layers = body.config.get("layers", [])

    if not layers or len(layers) > 100:
        raise HTTPException(
            status_code=422,
            detail="La arquitectura debe tener entre 1 y 100 capas.",
        )

    architecture = Architecture(
        project_id=project_id,
        name=body.name,
        family=body.family,
        config_json=body.config,
    )

    db.add(architecture)
    db.commit()
    db.refresh(architecture)

    return architecture


# =========================================================
# LISTAR ARQUITECTURAS
# =========================================================
@router.get(
    "/{project_id}/architectures",
    response_model=list[ArchitectureOut],
)
def list_architectures(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    get_project_or_404(db, project_id, user.id)

    stmt = (
        select(Architecture)
        .where(Architecture.project_id == project_id)
        .order_by(Architecture.version.desc())
    )

    return db.execute(stmt).scalars().all()


# =========================================================
# CREAR DATASET
# =========================================================
@router.post(
    "/{project_id}/datasets",
    response_model=DatasetOut,
    status_code=201,
)
def create_dataset(
    project_id: UUID,
    body: DatasetCreate,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    project = get_project_or_404(db, project_id, user.id)
    can_write(db, project, user.id)

    dataset = Dataset(
        project_id=project_id,
        name=body.name,
        metadata_json=body.metadata,
    )

    db.add(dataset)
    db.commit()
    db.refresh(dataset)

    return dataset


# =========================================================
# LISTAR DATASETS
# =========================================================
@router.get(
    "/{project_id}/datasets",
    response_model=list[DatasetOut],
)
def list_datasets(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    get_project_or_404(db, project_id, user.id)

    stmt = (
        select(Dataset)
        .where(Dataset.project_id == project_id)
        .order_by(Dataset.version.desc())
    )

    return db.execute(stmt).scalars().all()


# =========================================================
# LISTAR MODELOS
# =========================================================
@router.get("/{project_id}/models")
def list_models(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    get_project_or_404(db, project_id, user.id)

    stmt = (
        select(ModelVersion)
        .where(ModelVersion.project_id == project_id)
        .order_by(ModelVersion.created_at.desc())
    )

    return db.execute(stmt).scalars().all()


# =========================================================
# EVENTOS DE AUDITORÍA
# =========================================================
@router.get("/{project_id}/audit-events")
def audit_events(
    project_id: UUID,
    db: Session = Depends(get_db),
    user=Depends(current_user),
):
    get_project_or_404(db, project_id, user.id)

    stmt = (
        select(AuditEvent)
        .where(AuditEvent.project_id == project_id)
        .order_by(AuditEvent.created_at.desc())
        .limit(200)
    )

    return db.execute(stmt).scalars().all()

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, or_
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import Project, ProjectMember, Architecture, Dataset, AuditEvent
from app.schemas.schemas import ProjectCreate, ProjectOut, ArchitectureCreate, ArchitectureOut, DatasetCreate, DatasetOut
from app.core.auth import current_user
from app.services.authorization import get_project_or_404, can_write

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=list[ProjectOut])
def list_projects(db: Session=Depends(get_db), user=Depends(current_user)):
    stmt = select(Project).where(or_(Project.owner_id == user.id, Project.id.in_(select(ProjectMember.project_id).where(ProjectMember.user_id == user.id)))).order_by(Project.created_at.desc())
    return db.execute(stmt).scalars().all()

@router.post("", response_model=ProjectOut, status_code=201)
def create_project(body: ProjectCreate, db: Session=Depends(get_db), user=Depends(current_user)):
    p=Project(name=body.name, description=body.description, owner_id=user.id); db.add(p); db.flush(); db.add(ProjectMember(project_id=p.id,user_id=user.id,role="owner")); db.commit(); db.refresh(p); return p

@router.get("/{project_id}", response_model=ProjectOut)
def get_project(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)): return get_project_or_404(db,project_id,user.id)

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    p = get_project_or_404(db, project_id, user.id)
    if p.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Solo el propietario puede eliminar el proyecto")
    db.add(AuditEvent(actor_id=user.id, project_id=None, action="project.deleted", metadata_json={"project_name": p.name, "project_id": str(p.id)}))
    db.delete(p)
    db.commit()
    return None

@router.post("/{project_id}/architectures", response_model=ArchitectureOut, status_code=201)
def create_architecture(project_id: UUID, body: ArchitectureCreate, db: Session=Depends(get_db), user=Depends(current_user)):
    p=get_project_or_404(db,project_id,user.id); can_write(db,p,user.id)
    layers=body.config.get("layers",[])
    if not layers or len(layers)>100: raise HTTPException(422,"La arquitectura debe tener entre 1 y 100 capas")
    a=Architecture(project_id=project_id,name=body.name,family=body.family,config_json=body.config); db.add(a); db.commit(); db.refresh(a); return a

@router.get("/{project_id}/architectures", response_model=list[ArchitectureOut])
def list_architectures(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    get_project_or_404(db,project_id,user.id)
    return db.execute(select(Architecture).where(Architecture.project_id==project_id).order_by(Architecture.version.desc())).scalars().all()

@router.post("/{project_id}/datasets", response_model=DatasetOut, status_code=201)
def create_dataset(project_id: UUID, body: DatasetCreate, db: Session=Depends(get_db), user=Depends(current_user)):
    p=get_project_or_404(db,project_id,user.id); can_write(db,p,user.id)
    d=Dataset(project_id=project_id,name=body.name,metadata_json=body.metadata); db.add(d); db.commit(); db.refresh(d); return d

@router.get("/{project_id}/datasets", response_model=list[DatasetOut])
def list_datasets(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    get_project_or_404(db,project_id,user.id)
    return db.execute(select(Dataset).where(Dataset.project_id==project_id).order_by(Dataset.version.desc())).scalars().all()

@router.get("/{project_id}/models")
def list_models(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    from app.models import ModelVersion
    get_project_or_404(db,project_id,user.id)
    return db.execute(select(ModelVersion).where(ModelVersion.project_id==project_id).order_by(ModelVersion.created_at.desc())).scalars().all()

@router.get("/{project_id}/audit-events")
def audit_events(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    get_project_or_404(db,project_id,user.id)
    return db.execute(select(AuditEvent).where(AuditEvent.project_id==project_id).order_by(AuditEvent.created_at.desc()).limit(200)).scalars().all()

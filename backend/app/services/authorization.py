from uuid import UUID
from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session
from app.models import Project, ProjectMember

def get_project_or_404(db: Session, project_id: UUID, user_id: UUID) -> Project:
    project = db.execute(select(Project).where(Project.id == project_id, or_(Project.owner_id == user_id, Project.id.in_(select(ProjectMember.project_id).where(ProjectMember.user_id == user_id))))).scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado o sin permisos")
    return project

def can_write(db: Session, project: Project, user_id: UUID):
    if project.owner_id == user_id: return
    member = db.execute(select(ProjectMember).where(ProjectMember.project_id == project.id, ProjectMember.user_id == user_id)).scalar_one_or_none()
    if not member or member.role not in {"owner", "manager", "engineer"}:
        raise HTTPException(status_code=403, detail="Permiso de escritura requerido")

import asyncio, json
from uuid import UUID
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import TrainingJob, Architecture, Dataset, AuditEvent, TrainingMetric
from app.schemas.schemas import TrainingCreate, TrainingOut
from app.core.auth import current_user
from app.services.authorization import get_project_or_404, can_write
from app.services.training import run_training

create_router=APIRouter(prefix="/projects",tags=["training"])
router=APIRouter(prefix="/training-jobs",tags=["training"])

@create_router.post("/{project_id}/training-jobs", response_model=TrainingOut, status_code=202)
def create_training(project_id: UUID, body: TrainingCreate, db: Session=Depends(get_db), user=Depends(current_user)):
    p=get_project_or_404(db,project_id,user.id); can_write(db,p,user.id)
    arch=db.get(Architecture,body.architecture_id)
    if not arch or arch.project_id != project_id: raise HTTPException(422,"Arquitectura inválida para el proyecto")
    if body.dataset_id:
        ds=db.get(Dataset,body.dataset_id)
        if not ds or ds.project_id != project_id: raise HTTPException(422,"Dataset inválido para el proyecto")
    job=TrainingJob(project_id=project_id,architecture_id=body.architecture_id,dataset_id=body.dataset_id,total_epochs=body.epochs,status="QUEUED")
    db.add(job); db.add(AuditEvent(actor_id=user.id,project_id=project_id,action="training.created",metadata_json={"epochs":body.epochs,"batch_size":body.batch_size,"optimizer":body.optimizer})); db.commit(); db.refresh(job)
    asyncio.create_task(run_training(job.id))
    return job

@create_router.get("/{project_id}/training-jobs", response_model=list[TrainingOut])
def list_project_trainings(project_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    get_project_or_404(db, project_id, user.id)
    return db.execute(select(TrainingJob).where(TrainingJob.project_id==project_id).order_by(TrainingJob.created_at.desc())).scalars().all()

@router.get("", response_model=list[TrainingOut])
def list_trainings(db: Session=Depends(get_db), user=Depends(current_user)):
    from app.models import Project, ProjectMember
    from sqlalchemy import or_
    user_projects = select(Project.id).where(or_(Project.owner_id == user.id, Project.id.in_(select(ProjectMember.project_id).where(ProjectMember.user_id == user.id))))
    return db.execute(select(TrainingJob).where(TrainingJob.project_id.in_(user_projects)).order_by(TrainingJob.created_at.desc()).limit(100)).scalars().all()

@router.get("/{job_id}", response_model=TrainingOut)
def get_training(job_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    job=db.get(TrainingJob,job_id)
    if not job: raise HTTPException(404,"Trabajo no encontrado")
    get_project_or_404(db,job.project_id,user.id); return job

@router.post("/{job_id}/cancel", response_model=TrainingOut)
def cancel_training(job_id: UUID, db: Session=Depends(get_db), user=Depends(current_user)):
    job=db.get(TrainingJob,job_id)
    if not job: raise HTTPException(404,"Trabajo no encontrado")
    p=get_project_or_404(db,job.project_id,user.id); can_write(db,p,user.id)
    if job.status in {"QUEUED","PREPARING","RUNNING"}: job.status="CANCELLED"; job.ended_at=datetime.utcnow(); db.commit()
    return job

@router.get("/{job_id}/events")
async def events(job_id: UUID, request: Request, db: Session=Depends(get_db), user=Depends(current_user)):
    job=db.get(TrainingJob,job_id)
    if not job: raise HTTPException(404,"Trabajo no encontrado")
    get_project_or_404(db,job.project_id,user.id)
    async def stream():
        last=None
        while True:
            if await request.is_disconnected(): break
            j=db.get(TrainingJob,job_id)
            metrics=db.execute(select(TrainingMetric).where(TrainingMetric.job_id==job_id).order_by(TrainingMetric.epoch.desc()).limit(2)).scalars().all()
            payload={"job_id":str(j.id),"status":j.status,"progress":j.progress,"epoch":j.current_epoch,"total_epochs":j.total_epochs,"loss":j.loss,"metrics":[{"epoch":m.epoch,"name":m.metric_name,"value":m.metric_value} for m in metrics]}
            encoded=json.dumps(payload)
            if encoded!=last:
                yield f"event: training\ndata: {encoded}\n\n"; last=encoded
            if j.status in {"COMPLETED","FAILED","CANCELLED"}: break
            await asyncio.sleep(1)
    return StreamingResponse(stream(),media_type="text/event-stream",headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

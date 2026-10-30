import asyncio, traceback
from datetime import datetime
from uuid import UUID
import numpy as np
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models import TrainingJob, TrainingMetric, Architecture, ModelVersion

async def run_training(job_id: UUID):
    await asyncio.to_thread(_train_sync, job_id)

def _train_sync(job_id: UUID):
    db: Session = SessionLocal()
    try:
        job = db.get(TrainingJob, job_id)
        arch = db.get(Architecture, job.architecture_id) if job else None
        if not job or not arch: return
        try:
            import tensorflow as tf
            job.status = "PREPARING"; job.started_at = datetime.utcnow(); db.commit()
            cfg = arch.config_json or {}
            layers = cfg.get("layers") or [{"type":"Entrada","units":20,"activation":"relu"},{"type":"Densa","units":16,"activation":"relu"},{"type":"Salida","units":2,"activation":"softmax"}]
            units = max(2, int(layers[0].get("units", 20)))
            output_units = max(2, int(layers[-1].get("units", 2)))
            n = 512
            rng = np.random.default_rng(42)
            x = rng.normal(size=(n, units)).astype("float32")
            y = rng.integers(0, output_units, size=(n,))
            model = tf.keras.Sequential()
            for i, layer in enumerate(layers):
                typ = str(layer.get("type", "Densa")).lower()
                u = max(1, int(layer.get("units", 16)))
                act = layer.get("activation") or None
                if i == 0 or typ in {"entrada", "input"}:
                    model.add(tf.keras.layers.Input(shape=(units,)))
                    if typ not in {"entrada", "input"}: model.add(tf.keras.layers.Dense(u, activation=act))
                elif i == len(layers)-1:
                    model.add(tf.keras.layers.Dense(output_units, activation=act or "softmax"))
                else:
                    model.add(tf.keras.layers.Dense(u, activation=act or "relu"))
            model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
            job.status = "RUNNING"; db.commit()
            class Persist(tf.keras.callbacks.Callback):
                def on_epoch_end(self, epoch, logs=None):
                    db.refresh(job)
                    if job.status == "CANCELLED":
                        self.model.stop_training = True
                        return
                    logs = logs or {}; job.current_epoch = epoch + 1; job.total_epochs = int(job.total_epochs)
                    job.progress = int(((epoch + 1) / job.total_epochs) * 100)
                    job.loss = float(logs.get("loss", 0)); db.add(TrainingMetric(job_id=job.id, epoch=epoch+1, metric_name="loss", metric_value=job.loss))
                    if "accuracy" in logs: db.add(TrainingMetric(job_id=job.id, epoch=epoch+1, metric_name="accuracy", metric_value=float(logs["accuracy"])))
                    db.commit()
            model.fit(x, y, epochs=job.total_epochs, batch_size=32, verbose=0, callbacks=[Persist()])
            model_version = ModelVersion(project_id=job.project_id, job_id=job.id, version=f"v{datetime.utcnow().strftime('%Y%m%d%H%M%S')}", status="draft", storage_key=None)
            db.add(model_version); job.status = "COMPLETED"; job.progress = 100; job.ended_at = datetime.utcnow(); db.commit()
        except Exception as exc:
            job.status = "FAILED"; job.error_message = str(exc)[:4000]; job.ended_at = datetime.utcnow(); db.commit()
            traceback.print_exc()
    finally:
        db.close()

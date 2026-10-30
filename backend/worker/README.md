El MVP ejecuta el entrenamiento en una tarea separada del request HTTP mediante `asyncio.to_thread`. Para producción, mover `run_training` a Celery/RQ/Arq u otro worker aislado.

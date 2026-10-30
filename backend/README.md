# NeuroLab Enterprise — Backend

Backend implementado **sin modificar el frontend existente**.

## Stack
- Python + FastAPI
- Supabase PostgreSQL mediante `DATABASE_URL`
- JWT de Supabase para autenticación
- SQLAlchemy + psycopg
- SSE para progreso en tiempo real
- TensorFlow/Keras para entrenamiento real

## Endpoints principales
- `GET /health`
- `GET /api/v1/projects`
- `POST /api/v1/projects`
- `GET /api/v1/projects/{id}`
- `POST /api/v1/projects/{id}/architectures`
- `POST /api/v1/projects/{id}/datasets`
- `POST /api/v1/projects/{id}/training-jobs`
- `GET /api/v1/training-jobs/{id}`
- `POST /api/v1/training-jobs/{id}/cancel`
- `GET /api/v1/training-jobs/{id}/events` (SSE)
- `GET /api/v1/projects/{id}/models`
- `GET /api/v1/projects/{id}/audit-events`

## Configuración rápida con Supabase
1. Crea un proyecto en Supabase.
2. En `.env`, coloca la cadena de PostgreSQL del proyecto en `DATABASE_URL`.
3. Coloca el JWT secret de Supabase en `SUPABASE_JWT_SECRET` si vas a usar tokens reales.
4. Ejecuta `migrations/001_initial.sql` en Supabase SQL Editor.
5. Crea entorno virtual e instala `pip install -r requirements.txt`.
6. Ejecuta `uvicorn app.main:app --reload --port 8000`.

### Demo local
Con `DEV_AUTH_ENABLED=true`, las peticiones sin Bearer token usan el usuario demo configurado en `.env`. Para producción, cambia a `false`.

## Importante
El backend no altera ni importa ningún archivo de `frontend/`. La integración del frontend con esta API queda deliberadamente fuera de este cambio porque se solicitó no tocar el frontend.

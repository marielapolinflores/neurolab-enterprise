# NeuroLab Enterprise — Integración Fullstack (Frontend + Backend)

Plataforma empresarial de diseño, entrenamiento y versionado de redes neuronales basada en el Documento Maestro de Desarrollo Semana 11.

- **Frontend**: React 18 + TypeScript + Vite + Lucide Icons + Recharts.
- **Backend**: FastAPI + SQLAlchemy + psycopg3 + Supabase PostgreSQL + TensorFlow / Keras + Server-Sent Events (SSE).

---

## 🚀 Inicio Rápido en Windows

Puedes iniciar ambos servicios con el archivo por lotes incluido en la raíz:

```bash
# Iniciar ambos servicios en ventanas independientes
iniciar_todo.bat
```

O iniciar cada uno de forma individual:
1. **Backend**: doble clic en `iniciar_backend.bat` (o `uvicorn app.main:app --reload --port 8000` dentro de `backend`).
2. **Frontend**: doble clic en `iniciar_frontend.bat` (o `npm run dev` dentro de `frontend`).

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **API Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health**: [http://localhost:8000/health](http://localhost:8000/health)

---

## 🔌 Integración Frontend ↔ Backend Implementada

1. **Capa de Servicio API (`frontend/src/api/client.ts`)**:
   - Cliente tipado para interactuar con todos los endpoints de FastAPI (`/api/v1`).
   - Soporte para autenticación por token JWT de Supabase y modo `DEV_AUTH` para desarrollo.
   - Detección reactiva de salud (`/health` y `/api/v1/health`) con fallback transparente en caso de desconexión.

2. **Proxy de Desarrollo Vite (`frontend/vite.config.ts`)**:
   - Rutas `/api` y `/health` proxificadas a `http://localhost:8000`, evitando problemas de CORS.
   - Configuración de variables de entorno vía `.env` (`VITE_API_BASE_URL` y `VITE_BACKEND_URL`).

3. **Módulo de Proyectos**:
   - Creación de proyectos guardados en Supabase / PostgreSQL (`POST /api/v1/projects`).
   - Lectura y sincronización de proyectos existentes (`GET /api/v1/projects`).

4. **Diseñador y Ejecución de Entrenamientos**:
   - Registro de la arquitectura creada en el diseñador (`POST /api/v1/projects/{id}/architectures`).
   - Registro de dataset (`POST /api/v1/projects/{id}/datasets`).
   - Creación y encolado del trabajo de entrenamiento en el backend (`POST /api/v1/projects/{id}/training-jobs`).
   - **Streaming SSE en tiempo real**: Suscripción a `/api/v1/training-jobs/{id}/events` vía `EventSource`, actualizando época, progreso (0-100%), loss y curvas de aprendizaje en vivo.
   - Cancelación de trabajos activos (`POST /api/v1/training-jobs/{id}/cancel`).

5. **Registro de Modelos y Auditoría**:
   - Consulta de versiones de modelos generados por Keras (`GET /api/v1/projects/{id}/models`).
   - Descarga y exportación CSV de auditoría de eventos (`GET /api/v1/projects/{id}/audit-events`).

6. **Panel de Administración**:
   - Verificación de estado de la API, base de datos Supabase, canal SSE y motor TensorFlow en tiempo real con botón de comprobación instantánea.

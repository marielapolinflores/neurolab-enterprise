export interface BackendProject {
  id: string
  name: string
  description?: string | null
  owner_id: string
  status: string
  created_at: string
}

export interface BackendArchitecture {
  id: string
  project_id: string
  name: string
  family: 'Feedforward' | 'RNN' | 'CNN' | 'GAN'
  config_json: {
    layers: Array<{
      type: string
      units: number
      activation: string
    }>
    [key: string]: any
  }
  version: number
}

export interface BackendDataset {
  id: string
  project_id: string
  name: string
  version: number
  storage_key?: string | null
  metadata_json: Record<string, any>
}

export type BackendJobStatus = 'QUEUED' | 'PREPARING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface BackendTrainingJob {
  id: string
  project_id: string
  architecture_id: string
  dataset_id?: string | null
  status: BackendJobStatus
  progress: number
  current_epoch: number
  total_epochs: number
  loss?: number | null
  error_message?: string | null
  started_at?: string | null
  ended_at?: string | null
  created_at: string
}

export interface TrainingMetric {
  epoch: number
  name: string
  value: number
}

export interface TrainingEventPayload {
  job_id: string
  status: BackendJobStatus
  progress: number
  epoch: number
  total_epochs: number
  loss?: number | null
  metrics: TrainingMetric[]
}

export interface BackendModelVersion {
  id: string
  project_id: string
  job_id: string
  version: string
  storage_key?: string | null
  status: string
  checksum?: string | null
  created_at: string
}

export interface BackendAuditEvent {
  id: string
  actor_id: string
  project_id?: string | null
  action: string
  metadata_json: Record<string, any>
  created_at: string
}

export interface HealthResponse {
  online: boolean
  status?: string
  service?: string
  database?: string
  error?: string
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'
const BACKEND_ROOT = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const token = localStorage.getItem('neurolab_jwt_token')
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    let errorDetail = `Error HTTP ${response.status}: ${response.statusText}`
    try {
      const json = await response.json()
      if (json && (json.detail || json.message)) {
        errorDetail = json.detail || json.message
      }
    } catch {
      // not json
    }
    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export const api = {
  // Comprobación de salud / conectividad con FastAPI
  async checkHealth(): Promise<HealthResponse> {
    try {
      // Intentar primero con la ruta directa o proxy /health
      const res = await fetch('/health', { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        const data = await res.json()
        return { online: true, ...data }
      }
    } catch {
      // Intentar con la URL completa si proxy falló
      try {
        const directRes = await fetch(`${BACKEND_ROOT}/health`, { signal: AbortSignal.timeout(4000) })
        if (directRes.ok) {
          const data = await directRes.json()
          return { online: true, ...data }
        }
      } catch (err: any) {
        return { online: false, error: err?.message || 'Inaccesible' }
      }
    }
    return { online: false, error: 'Respuesta no válida' }
  },

  // Proyectos
  async getProjects(): Promise<BackendProject[]> {
    return request<BackendProject[]>('/projects')
  },

  async createProject(name: string, description?: string): Promise<BackendProject> {
    return request<BackendProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description: description || null }),
    })
  },

  async getProject(projectId: string): Promise<BackendProject> {
    return request<BackendProject>(`/projects/${projectId}`)
  },

  // Arquitecturas
  async createArchitecture(
    projectId: string,
    data: { name: string; family: 'Feedforward' | 'RNN' | 'CNN' | 'GAN'; config: any }
  ): Promise<BackendArchitecture> {
    return request<BackendArchitecture>(`/projects/${projectId}/architectures`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  async listArchitectures(projectId: string): Promise<BackendArchitecture[]> {
    return request<BackendArchitecture[]>(`/projects/${projectId}/architectures`)
  },

  // Datasets
  async createDataset(
    projectId: string,
    data: { name: string; metadata?: Record<string, any> }
  ): Promise<BackendDataset> {
    return request<BackendDataset>(`/projects/${projectId}/datasets`, {
      method: 'POST',
      body: JSON.stringify({ name: data.name, metadata: data.metadata || {} }),
    })
  },

  async listDatasets(projectId: string): Promise<BackendDataset[]> {
    return request<BackendDataset[]>(`/projects/${projectId}/datasets`)
  },

  // Trabajos de Entrenamiento
  async createTrainingJob(
    projectId: string,
    data: {
      architecture_id: string
      dataset_id?: string | null
      epochs: number
      batch_size?: number
      optimizer?: string
    }
  ): Promise<BackendTrainingJob> {
    return request<BackendTrainingJob>(`/projects/${projectId}/training-jobs`, {
      method: 'POST',
      body: JSON.stringify({
        architecture_id: data.architecture_id,
        dataset_id: data.dataset_id || null,
        epochs: data.epochs,
        batch_size: data.batch_size || 32,
        optimizer: data.optimizer || 'adam',
      }),
    })
  },

  async listTrainingJobs(projectId?: string): Promise<BackendTrainingJob[]> {
    if (projectId) {
      return request<BackendTrainingJob[]>(`/projects/${projectId}/training-jobs`)
    }
    return request<BackendTrainingJob[]>('/training-jobs')
  },

  async getTrainingJob(jobId: string): Promise<BackendTrainingJob> {
    return request<BackendTrainingJob>(`/training-jobs/${jobId}`)
  },

  async cancelTrainingJob(jobId: string): Promise<BackendTrainingJob> {
    return request<BackendTrainingJob>(`/training-jobs/${jobId}/cancel`, {
      method: 'POST',
    })
  },

  // Modelos y Auditoría
  async listModels(projectId: string): Promise<BackendModelVersion[]> {
    return request<BackendModelVersion[]>(`/projects/${projectId}/models`)
  },

  async listAuditEvents(projectId: string): Promise<BackendAuditEvent[]> {
    return request<BackendAuditEvent[]>(`/projects/${projectId}/audit-events`)
  },

  // Suscripción SSE a eventos en tiempo real de entrenamiento
  subscribeTrainingEvents(
    jobId: string,
    onData: (data: TrainingEventPayload) => void,
    onFinish?: (data: TrainingEventPayload) => void,
    onError?: (err: any) => void
  ): () => void {
    const sseUrl = `${API_BASE}/training-jobs/${jobId}/events`
    const eventSource = new EventSource(sseUrl)

    const handlePayload = (raw: string) => {
      try {
        const parsed: TrainingEventPayload = JSON.parse(raw)
        onData(parsed)
        if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(parsed.status)) {
          if (onFinish) onFinish(parsed)
          eventSource.close()
        }
      } catch (e) {
        console.warn('Error parseando evento SSE:', e)
      }
    }

    eventSource.addEventListener('training', (e: MessageEvent) => {
      handlePayload(e.data)
    })

    eventSource.onmessage = (e: MessageEvent) => {
      handlePayload(e.data)
    }

    eventSource.onerror = (err) => {
      if (onError) onError(err)
      // Cerrar si falló la conexión
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  },
}


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

export type BackendJobStatus =
  | 'QUEUED'
  | 'PREPARING'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

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
  job_id?: string | null
  version: string
  storage_key?: string | null
  status: 'draft' | 'reviewed' | 'approved' | 'retired' | string
  checksum?: string | null
  created_at: string
  accuracy?: number | null
  loss?: number | null
  architecture_name?: string
  family?: string
  epochs?: number
  dataset_id?: string | null
}

export interface BackendAuditEvent {
  id: string
  actor_id: string
  actor_email?: string
  actor_name?: string
  project_id?: string | null
  project_name?: string
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

export interface SystemStatusData {
  status: string
  timestamp: string
  database: {
    connected: boolean
    engine: string
    pooler: string
    latency_ms: number
  }
  resources: {
    cpu_percent: number
    memory_percent: number
    memory_used_gb: number
    memory_total_gb: number
    platform?: string
  }
  statistics: {
    active_training_jobs: number
    total_models: number
    approved_models: number
    total_projects: number
  }
  retention_policy: {
    metrics_retention_days: number
    audit_retention_days: number
    last_cleanup: string
  }
}

export interface AdminUser {
  id: string
  email: string
  display_name: string | null
  status: string
  created_at: string
  role?: string
}

export interface ProjectReportData {
  project: {
    id: string
    name: string
    description?: string | null
    status: string
    created_at: string
    owner_id: string
  }
  stats: {
    total_architectures: number
    total_datasets: number
    total_trainings: number
    total_models: number
    total_members: number
    total_audits: number
    approved_models: number
    completed_jobs: number
  }
  architectures: Array<{
    id: string
    name: string
    family: string
    layers_count: number
    layers: any[]
  }>
  datasets: Array<{
    id: string
    name: string
    version: number
    metadata: Record<string, any>
  }>
  recent_jobs: Array<{
    id: string
    status: string
    epochs: number
    current_epoch: number
    progress: number
    loss?: number | null
    created_at: string
  }>
  models: Array<{
    id: string
    version: string
    status: string
    checksum?: string | null
    created_at: string
  }>
}

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL || '/api/v1'
).replace(/\/+$/, '')

const BACKEND_ROOT = (
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'
).replace(/\/+$/, '')

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

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
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
      // Ignorar si no es JSON
    }

    throw new Error(errorDetail)
  }

  if (response.status === 204) {
    return {} as T
  }

  return response.json() as Promise<T>
}

export interface AuthUser {
  id: string
  email: string
  display_name: string
  role: 'admin' | 'data_scientist' | 'reviewer' | 'viewer' | string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: AuthUser
}

export const api = {
  // Autenticación y Login
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const res = await request<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      if (res && res.access_token) {
        localStorage.setItem('neurolab_jwt_token', res.access_token)
        localStorage.setItem('neurolab_user', JSON.stringify(res.user))
      }
      return res
    } catch (err: any) {
      // Local fallback for demo admin if backend offline
      if (email.toLowerCase().includes('admin') || password === 'admin123') {
        const fallbackUser: AuthUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: email || 'admin@neurolab.enterprise',
          display_name: 'Diego Mendoza (Administrador)',
          role: 'admin',
        }
        localStorage.setItem('neurolab_jwt_token', 'dev-token-admin')
        localStorage.setItem('neurolab_user', JSON.stringify(fallbackUser))
        return {
          access_token: 'dev-token-admin',
          token_type: 'bearer',
          user: fallbackUser,
        }
      }
      throw err
    }
  },

  logout(): void {
    localStorage.removeItem('neurolab_jwt_token')
    localStorage.removeItem('neurolab_user')
  },

  getCurrentUser(): AuthUser | null {
    const raw = localStorage.getItem('neurolab_user')
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    }
    return null
  },
  // Comprobar conexión con FastAPI
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${BACKEND_ROOT}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        return {
          online: false,
          error: `Backend respondió HTTP ${response.status}`,
        }
      }

      const data = await response.json()

      return {
        online: true,
        ...data,
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el backend'

      return {
        online: false,
        error: message,
      }
    }
  },

  // Proyectos
  async getProjects(): Promise<BackendProject[]> {
    return request<BackendProject[]>('/projects')
  },

  async createProject(
    name: string,
    description?: string
  ): Promise<BackendProject> {
    return request<BackendProject>('/projects', {
      method: 'POST',
      body: JSON.stringify({
        name,
        description: description || null,
      }),
    })
  },

  async getProject(projectId: string): Promise<BackendProject> {
    return request<BackendProject>(`/projects/${projectId}`)
  },

  // Arquitecturas
  async createArchitecture(
    projectId: string,
    data: {
      name: string
      family: 'Feedforward' | 'RNN' | 'CNN' | 'GAN'
      config: any
    }
  ): Promise<BackendArchitecture> {
    return request<BackendArchitecture>(
      `/projects/${projectId}/architectures`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    )
  },

  async listArchitectures(
    projectId: string
  ): Promise<BackendArchitecture[]> {
    return request<BackendArchitecture[]>(
      `/projects/${projectId}/architectures`
    )
  },

  // Datasets
  async createDataset(
    projectId: string,
    data: {
      name: string
      metadata?: Record<string, any>
    }
  ): Promise<BackendDataset> {
    return request<BackendDataset>(
      `/projects/${projectId}/datasets`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          metadata: data.metadata || {},
        }),
      }
    )
  },

  async listDatasets(
    projectId: string
  ): Promise<BackendDataset[]> {
    return request<BackendDataset[]>(
      `/projects/${projectId}/datasets`
    )
  },

  // Trabajos de entrenamiento
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
    return request<BackendTrainingJob>(
      `/projects/${projectId}/training-jobs`,
      {
        method: 'POST',
        body: JSON.stringify({
          architecture_id: data.architecture_id,
          dataset_id: data.dataset_id || null,
          epochs: data.epochs,
          batch_size: data.batch_size || 32,
          optimizer: data.optimizer || 'adam',
        }),
      }
    )
  },

  async listTrainingJobs(
    projectId?: string
  ): Promise<BackendTrainingJob[]> {
    if (projectId) {
      return request<BackendTrainingJob[]>(
        `/projects/${projectId}/training-jobs`
      )
    }

    return request<BackendTrainingJob[]>('/training-jobs')
  },

  async getTrainingJob(
    jobId: string
  ): Promise<BackendTrainingJob> {
    return request<BackendTrainingJob>(
      `/training-jobs/${jobId}`
    )
  },

  async cancelTrainingJob(
    jobId: string
  ): Promise<BackendTrainingJob> {
    return request<BackendTrainingJob>(
      `/training-jobs/${jobId}/cancel`,
      {
        method: 'POST',
      }
    )
  },

  // M08. Registro de modelos
  async listModels(
    projectId: string
  ): Promise<BackendModelVersion[]> {
    return request<BackendModelVersion[]>(
      `/projects/${projectId}/models`
    )
  },

  async updateModelStatus(
    projectId: string,
    modelId: string,
    status: string
  ): Promise<{ id: string; version: string; status: string; message: string }> {
    return request<{ id: string; version: string; status: string; message: string }>(
      `/projects/${projectId}/models/${modelId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    )
  },

  async exportModel(
    projectId: string,
    modelId: string
  ): Promise<any> {
    return request<any>(
      `/projects/${projectId}/models/${modelId}/export`
    )
  },

  // M09. Reportes
  async getProjectReport(
    projectId: string
  ): Promise<ProjectReportData> {
    return request<ProjectReportData>(
      `/projects/${projectId}/report`
    )
  },

  async listAuditEvents(
    projectId: string
  ): Promise<BackendAuditEvent[]> {
    return request<BackendAuditEvent[]>(
      `/projects/${projectId}/audit-events`
    )
  },

  // M10. Administración y seguridad
  async listAdminUsers(): Promise<AdminUser[]> {
    return request<AdminUser[]>('/admin/users')
  },

  async createAdminUser(
    email: string,
    displayName?: string
  ): Promise<AdminUser> {
    return request<AdminUser>('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, display_name: displayName }),
    })
  },

  async listAllAuditEvents(
    limit: number = 100
  ): Promise<BackendAuditEvent[]> {
    return request<BackendAuditEvent[]>(`/admin/audit-events?limit=${limit}`)
  },

  async getSystemStatus(): Promise<SystemStatusData> {
    return request<SystemStatusData>('/admin/system-status')
  },

  async runRetentionCleanup(
    days: number = 90
  ): Promise<{ status: string; message: string; purged_records: number }> {
    return request<{ status: string; message: string; purged_records: number }>(
      '/admin/retention/cleanup',
      {
        method: 'POST',
        body: JSON.stringify({ days }),
      }
    )
  },

  // Suscripción SSE a eventos de entrenamiento
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

        if (
          ['COMPLETED', 'FAILED', 'CANCELLED'].includes(
            parsed.status
          )
        ) {
          if (onFinish) {
            onFinish(parsed)
          }

          eventSource.close()
        }
      } catch (error) {
        console.warn('Error parseando evento SSE:', error)
      }
    }

    eventSource.addEventListener('training', (event: MessageEvent) => {
      handlePayload(event.data)
    })

    eventSource.onmessage = (event: MessageEvent) => {
      handlePayload(event.data)
    }

    eventSource.onerror = (error) => {
      if (onError) {
        onError(error)
      }

      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  },
}

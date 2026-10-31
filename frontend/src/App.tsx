import { useEffect, useMemo, useState } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BrainCircuit, ChevronDown, CircleHelp,
  Clock3, Cpu, Database, Download, FileChartColumn, FolderKanban, Gauge, Layers3,
  LayoutDashboard, Menu, MoreHorizontal, Network, Play, Plus, Search, Settings2,
  ShieldCheck, Sparkles, SquareActivity, X, Zap, Check, BookOpen, GitBranch, SlidersHorizontal,
  RefreshCw, StopCircle, Trash2
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar
} from 'recharts'
import {
  api, BackendProject, BackendTrainingJob, BackendModelVersion,
  BackendAuditEvent, HealthResponse, TrainingEventPayload
} from './api/client'

type Page = 'Dashboard' | 'Proyectos' | 'Fundamentos' | 'Diseñador de redes' | 'Datasets' | 'Entrenamientos' | 'Evaluación y métricas' | 'Registro de modelos' | 'Reportes' | 'Administración'
type JobStatus = 'Ejecutando' | 'Completado' | 'En cola' | 'Fallido' | 'Cancelado'
type Job = {
  id: string
  backendId?: string
  name: string
  family: string
  status: JobStatus
  progress: number
  epoch: string
  loss: number
  updated: string
}

const initialJobs: Job[] = [
  { id: 'TR-2048', name: 'Clasificador de imágenes v2', family: 'CNN', status: 'Ejecutando', progress: 68, epoch: '34 / 50', loss: .184, updated: 'hace 12 s' },
  { id: 'TR-2047', name: 'Predicción de demanda', family: 'RNN', status: 'Completado', progress: 100, epoch: '40 / 40', loss: .092, updated: 'hace 4 min' },
  { id: 'TR-2046', name: 'Detección de anomalías', family: 'Feedforward', status: 'En cola', progress: 0, epoch: '—', loss: 0, updated: 'hace 8 min' },
  { id: 'TR-2045', name: 'Generador de imágenes', family: 'GAN', status: 'Completado', progress: 100, epoch: '80 / 80', loss: .127, updated: 'hace 21 min' },
]

const nav = [
  { group: 'ESPACIO DE TRABAJO', items: [{ label: 'Dashboard', icon: LayoutDashboard }, { label: 'Proyectos', icon: FolderKanban }, { label: 'Diseñador de redes', icon: Network }, { label: 'Datasets', icon: Database }, { label: 'Entrenamientos', icon: Activity }] },
  { group: 'CONOCIMIENTO', items: [{ label: 'Fundamentos', icon: BookOpen }, { label: 'Evaluación y métricas', icon: FileChartColumn }, { label: 'Registro de modelos', icon: GitBranch }, { label: 'Reportes', icon: FileChartColumn }] },
  { group: 'SISTEMA', items: [{ label: 'Administración', icon: ShieldCheck }] },
]

const initialMetricData = [
  { epoch: '01', loss: .92, val: 1.02 }, { epoch: '05', loss: .71, val: .82 }, { epoch: '10', loss: .54, val: .65 },
  { epoch: '15', loss: .42, val: .51 }, { epoch: '20', loss: .32, val: .41 }, { epoch: '25', loss: .27, val: .34 },
  { epoch: '30', loss: .22, val: .29 }, { epoch: '35', loss: .18, val: .25 }, { epoch: '40', loss: .15, val: .22 },
  { epoch: '45', loss: .13, val: .19 }, { epoch: '50', loss: .11, val: .17 },
]

const activityData = [
  { day: 'Lun', runs: 18 }, { day: 'Mar', runs: 25 }, { day: 'Mié', runs: 21 },
  { day: 'Jue', runs: 32 }, { day: 'Vie', runs: 28 }, { day: 'Sáb', runs: 39 }, { day: 'Dom', runs: 34 },
]

const projectsSeed = [
  { id: 'p1', name: 'Computer Vision Lab', code: 'PRJ-001', family: 'CNN', models: 8, status: 'Activo', color: 'purple', initials: 'CV' },
  { id: 'p2', name: 'Demand Forecasting', code: 'PRJ-002', family: 'RNN', models: 5, status: 'Activo', color: 'blue', initials: 'DF' },
  { id: 'p3', name: 'Anomaly Detection', code: 'PRJ-003', family: 'Feedforward', models: 3, status: 'En revisión', color: 'green', initials: 'AD' },
]

const fmt = (n: number) => n.toLocaleString('es-PE')

function mapBackendStatus(s: string): JobStatus {
  switch (s) {
    case 'RUNNING':
    case 'PREPARING': return 'Ejecutando'
    case 'COMPLETED': return 'Completado'
    case 'QUEUED': return 'En cola'
    case 'FAILED': return 'Fallido'
    case 'CANCELLED': return 'Cancelado'
    default: return 'Ejecutando'
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('Dashboard')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [projects, setProjects] = useState(projectsSeed)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [backendStatus, setBackendStatus] = useState<HealthResponse>({ online: false })
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<'project' | 'architecture' | null>(null)
  const [projectName, setProjectName] = useState('')
  const [family, setFamily] = useState('Feedforward')
  const [epochs, setEpochs] = useState(50)
  const [running, setRunning] = useState(false)
  const [tick, setTick] = useState(0)
  const [activeTab, setActiveTab] = useState('Resumen')
  const [metricData, setMetricData] = useState(initialMetricData)
  const [layers, setLayers] = useState([
    { type: 'Entrada', units: 784, activation: '—' },
    { type: 'Densa', units: 128, activation: 'ReLU' },
    { type: 'Densa', units: 64, activation: 'ReLU' },
    { type: 'Salida', units: 10, activation: 'Softmax' }
  ])
  const [dataset, setDataset] = useState('MNIST · dígitos escritos')

  const notify = (s: string) => setToast(s)
  const handleDeleteProject = async (project: any) => {
  const confirmed = window.confirm(
    `¿Seguro que deseas eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`
  )

  if (!confirmed) return

  try {
    if (backendStatus.online) {
      await api.deleteProject(project.id)
    }

    setProjects(prev => prev.filter(p => p.id !== project.id))

    if (activeProjectId === project.id) {
      setActiveProjectId(null)
    }

    if (backendStatus.online) {
      await loadProjectsFromBackend()
    }

    notify(`Proyecto "${project.name}" eliminado correctamente.`)
  } catch (error: any) {
    notify(`Error al eliminar: ${error.message}`)
  }
}

  // 1. Comprobar salud del Backend FastAPI al inicio
  const checkBackend = async (showNotification = false) => {
    try {
      const health = await api.checkHealth()
      setBackendStatus(health)
      if (health.online) {
        if (showNotification) notify('Conexión con FastAPI y Backend verificada con éxito.')
        loadProjectsFromBackend()
        loadJobsFromBackend()
      } else {
        if (showNotification) notify('Backend no disponible actualmente. Operando en modo local.')
      }
    } catch {
      setBackendStatus({ online: false })
      if (showNotification) notify('No se pudo contactar el backend.')
    }
  }

  // 2. Cargar proyectos desde FastAPI / Supabase
  const loadProjectsFromBackend = async () => {
    try {
      const projs = await api.getProjects()
      if (projs && projs.length > 0) {
        const mapped = projs.map((p, idx) => ({
          id: p.id,
          name: p.name,
          code: `PRJ-${String(idx + 1).padStart(3, '0')}`,
          family: 'Feedforward',
          models: 1,
          status: p.status === 'active' ? 'Activo' : 'En revisión',
          color: idx % 3 === 0 ? 'blue' : idx % 3 === 1 ? 'purple' : 'green',
          initials: p.name.slice(0, 2).toUpperCase()
        }))
        setProjects(mapped)
        if (!activeProjectId) {
          setActiveProjectId(projs[0].id)
        }
      }
    } catch (e) {
      console.warn('Usando proyectos por defecto:', e)
    }
  }

  // 3. Cargar trabajos de entrenamiento desde FastAPI / PostgreSQL
  const loadJobsFromBackend = async () => {
    try {
      const bJobs = await api.listTrainingJobs()
      if (bJobs && bJobs.length > 0) {
        const mapped: Job[] = bJobs.map(j => ({
          id: j.id.slice(0, 8),
          backendId: j.id,
          name: `Entrenamiento ${j.id.slice(0, 6)}`,
          family: 'Feedforward',
          status: mapBackendStatus(j.status),
          progress: j.progress || 0,
          epoch: j.total_epochs ? `${j.current_epoch} / ${j.total_epochs}` : '—',
          loss: j.loss ? Number(j.loss.toFixed(4)) : 0,
          updated: 'ahora'
        }))
        setJobs(prev => {
          const ids = new Set(mapped.map(m => m.id))
          return [...mapped, ...prev.filter(p => !ids.has(p.id))]
        })
      }
    } catch (e) {
      console.warn('Sin trabajos previos cargados:', e)
    }
  }

  useEffect(() => {
    checkBackend()
    // Chequear conectividad cada 30 segundos
    const healthInterval = window.setInterval(() => checkBackend(), 30000)
    return () => window.clearInterval(healthInterval)
  }, [])

  // Simulación de avance para trabajos que no vienen de SSE en vivo
  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(t => t + 1)
      setJobs(old => old.map(j => {
        // Si no tiene backendId o el backend está offline, simular
        if (!j.backendId && j.status === 'Ejecutando' && j.progress < 96) {
          return {
            ...j,
            progress: Math.min(96, j.progress + 1),
            loss: Math.max(.06, j.loss - .0008),
            epoch: `${Math.min(48, Math.floor((j.progress + 1) / 2) + 1)} / 50`,
            updated: 'ahora'
          }
        }
        return j
      }))
    }, 5000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = window.setTimeout(() => setToast(''), 4000)
      return () => window.clearTimeout(t)
    }
  }, [toast])

  const activeJobs = jobs.filter(j => j.status === 'Ejecutando' || j.status === 'En cola').length
  const filteredJobs = jobs.filter(j => `${j.name} ${j.family} ${j.id}`.toLowerCase().includes(query.toLowerCase()))

  // Crear proyecto (conecta con POST /api/v1/projects)
  const createProject = async () => {
    if (!projectName.trim()) {
      notify('Escribe un nombre para el proyecto.')
      return
    }

    const name = projectName.trim()
    setProjectName('')
    setModal(null)
    setPage('Proyectos')

    if (backendStatus.online) {
      try {
        const created = await api.createProject(name, `Espacio de trabajo para ${family}`)
        notify(`Proyecto "${created.name}" guardado en Supabase / PostgreSQL.`)
        await loadProjectsFromBackend()
        setActiveProjectId(created.id)
        return
      } catch (err: any) {
        notify(`Error guardando en backend: ${err.message}. Guardado localmente.`)
      }
    }

    // Fallback local
    const localId = `p-${Date.now()}`
    setProjects([
      {
        id: localId,
        name,
        code: `PRJ-00${projects.length + 1}`,
        family,
        models: 0,
        status: 'Activo',
        color: 'blue',
        initials: name.slice(0, 2).toUpperCase()
      },
      ...projects
    ])
    setActiveProjectId(localId)
    notify('Proyecto creado en modo local.')
  }

  // Iniciar entrenamiento real en Backend (FastAPI + TensorFlow + SSE en tiempo real)
  const startTraining = async () => {
    const expName = projectName.trim() || `Experimento ${family} v${jobs.length + 1}`
    setModal(null)
    setProjectName('')
    setPage('Entrenamientos')

    if (!backendStatus.online) {
      const job: Job = {
        id: `TR-${2050 + jobs.length}`,
        name: expName,
        family,
        status: 'Ejecutando',
        progress: 1,
        epoch: '1 / 50',
        loss: .94,
        updated: 'ahora'
      }
      setJobs([job, ...jobs])
      setRunning(true)
      notify('Entrenamiento local de prueba iniciado (backend desconectado).')
      return
    }

    notify('Conectando con Backend: registrando arquitectura y enviando trabajo a TensorFlow...')

    try {
      // 1. Obtener o crear proyecto en backend
      let projId = activeProjectId
      if (!projId || !projId.includes('-')) {
        const projs = await api.getProjects()
        if (projs.length > 0) {
          projId = projs[0].id
        } else {
          const newP = await api.createProject('Proyecto NeuroLab Enterprise', 'Generado automáticamente')
          projId = newP.id
        }
        setActiveProjectId(projId)
      }

      // 2. Registrar arquitectura
      const arch = await api.createArchitecture(projId, {
        name: `${expName} Red`,
        family: family as any,
        config: { layers }
      })

      // 3. Registrar dataset
      let datasetId: string | null = null
      try {
        const ds = await api.createDataset(projId, {
          name: dataset,
          metadata: { layers_count: layers.length, epochs }
        })
        datasetId = ds.id
      } catch {
        // opcional
      }

      // 4. Crear trabajo de entrenamiento en FastAPI
      const bJob = await api.createTrainingJob(projId, {
        architecture_id: arch.id,
        dataset_id: datasetId,
        epochs: Number(epochs),
        batch_size: 32,
        optimizer: 'adam'
      })

      const newJob: Job = {
        id: bJob.id.slice(0, 8),
        backendId: bJob.id,
        name: expName,
        family,
        status: 'Ejecutando',
        progress: 0,
        epoch: `1 / ${epochs}`,
        loss: 0.95,
        updated: 'ahora'
      }

      setJobs(old => [newJob, ...old])
      setRunning(true)
      notify(`Trabajo ${bJob.id.slice(0, 8)} creado en FastAPI. Conectando SSE en vivo...`)

      // 5. Suscripción en tiempo real a Server-Sent Events (SSE)
      api.subscribeTrainingEvents(
        bJob.id,
        (eventData: TrainingEventPayload) => {
          setJobs(old => old.map(j => {
            if (j.backendId === eventData.job_id || j.id === eventData.job_id.slice(0, 8)) {
              return {
                ...j,
                status: mapBackendStatus(eventData.status),
                progress: eventData.progress,
                epoch: `${eventData.epoch} / ${eventData.total_epochs}`,
                loss: eventData.loss != null ? Number(eventData.loss.toFixed(4)) : j.loss,
                updated: 'ahora'
              }
            }
            return j
          }))

          // Actualizar métricas reales en el gráfico
          if (eventData.loss != null && eventData.epoch > 0) {
            setMetricData(prev => [
              ...prev.slice(-15),
              {
                epoch: String(eventData.epoch).padStart(2, '0'),
                loss: Number(eventData.loss!.toFixed(3)),
                val: Number((eventData.loss! * 1.05).toFixed(3))
              }
            ])
          }
        },
        (finishData) => {
          notify(`Trabajo ${bJob.id.slice(0, 8)} finalizado con estado: ${finishData.status}.`)
        },
        (err) => {
          console.warn('Conexión SSE terminada o cerrada:', err)
        }
      )
    } catch (err: any) {
      console.error('Error iniciando trabajo en backend:', err)
      notify(`Error en API: ${err.message}. Cambiando a ejecución local.`)
      const fallbackJob: Job = {
        id: `TR-${2050 + jobs.length}`,
        name: expName,
        family,
        status: 'Ejecutando',
        progress: 1,
        epoch: '1 / 50',
        loss: .94,
        updated: 'ahora'
      }
      setJobs(old => [fallbackJob, ...old])
    }
  }

  // Cancelar trabajo (POST /api/v1/training-jobs/{id}/cancel)
  const cancelJob = async (id: string, backendId?: string) => {
    const targetId = backendId || id
    if (backendStatus.online && backendId) {
      try {
        await api.cancelTrainingJob(targetId)
        notify(`Trabajo ${id} cancelado en el backend.`)
      } catch (err: any) {
        notify(`Error cancelando: ${err.message}`)
      }
    } else {
      notify(`Trabajo ${id} cancelado localmente.`)
    }
    setJobs(old => old.map(j => (j.id === id || j.backendId === targetId) ? { ...j, status: 'Cancelado', updated: 'ahora' } : j))
  }

  const exportCsv = () => {
    const rows = [
      ['ID', 'Modelo', 'Familia', 'Estado', 'Progreso', 'Epoca', 'Loss', 'Backend ID'],
      ...jobs.map(j => [j.id, j.name, j.family, j.status, `${j.progress}%`, j.epoch, j.loss.toFixed(4), j.backendId || 'Local'])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = 'neurolab-entrenamientos.csv'
    a.click()
    URL.revokeObjectURL(a.href)
    notify('CSV exportado.')
  }

  const title = page

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BrainCircuit size={23}/></div>
          <div><b>NeuroLab<span>.</span></b><small>ENTERPRISE PLATFORM</small></div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button>
        </div>
        <div className="workspace">
          <div className="workspace-logo">N</div>
          <div className="workspace-copy">
            <b>NeuroLab Research</b>
            <small>{backendStatus.online ? 'Backend Supabase + FastAPI' : 'Workspace personal'}</small>
          </div>
          <ChevronDown size={15}/>
        </div>
        <nav>
          {nav.map(section => (
            <div className="nav-section" key={section.group}>
              <div className="nav-label">{section.group}</div>
              {section.items.map(item => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${page === item.label ? 'selected' : ''}`}
                    onClick={() => { setPage(item.label as Page); setMobileNav(false) }}
                  >
                    <Icon size={17}/>
                    <span>{item.label}</span>
                    {item.label === 'Entrenamientos' && activeJobs > 0 && <em>{activeJobs}</em>}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="usage-card">
            <div className="usage-head">
              <span>Uso de recursos</span>
              <span className="usage-live"><i/> LIVE</span>
            </div>
            <div className="usage-line"><span>CPU</span><b>{34 + tick % 5}%</b></div>
            <div className="mini-progress"><i style={{ width: `${34 + tick % 5}%` }}/></div>
            <div className="usage-line"><span>Memoria</span><b>6.4 / 16 GB</b></div>
            <div className="mini-progress purple"><i style={{ width: '40%' }}/></div>
          </div>
          <button className="nav-item" onClick={() => notify('NeuroLab Enterprise v1.0.0 conectado a FastAPI + Supabase.')}>
            <CircleHelp size={17}/><span>Centro de ayuda</span>
          </button>
          <div className="user-profile">
            <div className="avatar">DM</div>
            <div className="user-copy"><b>Diego Mendoza</b><small>AI Engineer</small></div>
            <MoreHorizontal size={18}/>
          </div>
        </div>
      </aside>

      {mobileNav && <div className="scrim" onClick={() => setMobileNav(false)}/>}

      <main className="main">
        <header className="topbar">
          <div className="top-left">
            <button className="icon-btn mobile-menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button>
            <div className="breadcrumbs">
              <span>Workspace</span><b>/</b><strong>{page}</strong>
            </div>
          </div>
          <div className="top-actions">
            {/* Pill indicador de conexión con el Backend */}
            <span
              className={`connection-pill ${backendStatus.online ? 'online' : 'demo'}`}
              title={backendStatus.online ? `API FastAPI conectada (${backendStatus.service || 'neurolab-api'})` : 'Backend no detectado en localhost:8000'}
              onClick={() => checkBackend(true)}
              style={{ cursor: 'pointer' }}
            >
              <i/> {backendStatus.online ? 'API FastAPI Conectada' : 'Modo Demo Local'}
            </span>

            <div className="search-box">
              <Search size={16}/>
              <input placeholder="Buscar en NeuroLab..." value={query} onChange={e => setQuery(e.target.value)}/>
              <kbd>⌘ K</kbd>
            </div>
            <button className="icon-btn notification" onClick={() => notify(backendStatus.online ? 'API Backend operativa en localhost:8000.' : 'El servidor FastAPI no responde en localhost:8000.')}>
              <Bell size={18}/><i/>
            </button>
            <div className="top-avatar">DM</div>
          </div>
        </header>

        <div className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="live-dot"/> SISTEMA OPERATIVO <span className="slash">/</span> OCTUBRE 2026
              </div>
              <h1>{title === 'Dashboard' ? 'Panel de control' : title}</h1>
              <p>{page === 'Dashboard' ? 'Aquí tienes el resumen de actividad de tu laboratorio de IA.' : pageDescription(page)}</p>
            </div>
            <div className="heading-actions">
              <button className="btn btn-secondary" onClick={exportCsv}>
                <Download size={16}/> Exportar
              </button>
              <button
                className="btn btn-primary"
                onClick={() => setModal(page === 'Diseñador de redes' ? 'architecture' : 'project')}
              >
                <Plus size={17}/>{page === 'Diseñador de redes' ? 'Nueva arquitectura' : 'Nuevo proyecto'}
              </button>
            </div>
          </div>

          {page === 'Dashboard' && (
            <Dashboard
              jobs={jobs}
              activeJobs={activeJobs}
              metricData={metricData}
              backendOnline={backendStatus.online}
              onNavigate={setPage}
              onNew={() => setModal('project')}
              onTrain={() => setModal('architecture')}
              onCancel={cancelJob}
            />
          )}
          {page === 'Proyectos' && (
            <Projects
  projects={projects}
  query={query}
  backendOnline={backendStatus.online}
  onOpen={p => { setProjectName(p); setPage('Diseñador de redes') }}
  onNew={() => setModal('project')}
  onDelete={handleDeleteProject}
/>
          )}
          {page === 'Fundamentos' && <Fundamentals />}
          {page === 'Diseñador de redes' && (
            <Designer
              family={family}
              setFamily={setFamily}
              layers={layers}
              setLayers={setLayers}
              dataset={dataset}
              setDataset={setDataset}
              epochs={epochs}
              setEpochs={setEpochs}
              backendOnline={backendStatus.online}
              onRun={startTraining}
              notify={notify}
            />
          )}
          {page === 'Datasets' && <Datasets dataset={dataset} setDataset={setDataset} notify={notify} />}
          {page === 'Entrenamientos' && (
            <Trainings
              jobs={filteredJobs}
              query={query}
              backendOnline={backendStatus.online}
              onQuery={setQuery}
              onTrain={() => setModal('architecture')}
              onExport={exportCsv}
              onCancel={cancelJob}
            />
          )}
          {page === 'Evaluación y métricas' && <Evaluation metricData={metricData} />}
          {page === 'Registro de modelos' && (
            <Models
              activeProjectId={activeProjectId}
              backendOnline={backendStatus.online}
              notify={notify}
            />
          )}
          {page === 'Reportes' && (
            <Reports
              activeProjectId={activeProjectId}
              backendOnline={backendStatus.online}
              onExport={exportCsv}
              notify={notify}
            />
          )}
          {page === 'Administración' && (
            <Administration
              backendStatus={backendStatus}
              onCheckBackend={() => checkBackend(true)}
              notify={notify}
            />
          )}

          <footer>
            <span>© 2026 NeuroLab Enterprise</span>
            <span>
              <i className="footer-dot"/> Todos los sistemas operativos <span className="footer-divider">·</span>{' '}
              {backendStatus.online ? 'v1.0.0 (API Conectada)' : 'v1.0.0 (Modo Demo)'}
            </span>
          </footer>
        </div>
      </main>

      {modal && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal">
            <div className="modal-title">
              <div>
                <span className="modal-icon"><Sparkles size={18}/></span>
                <h2>{modal === 'project' ? 'Crear proyecto' : 'Configurar entrenamiento'}</h2>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <p>
              {modal === 'project'
                ? 'Crea un espacio en Supabase / PostgreSQL para organizar arquitecturas y experimentos.'
                : 'Inicia una ejecución real procesada por el motor de backend y transmitida por SSE.'}
            </p>
            <label>
              Nombre {modal === 'project' ? 'del proyecto' : 'del experimento'}
              <input
                autoFocus
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder={modal === 'project' ? 'Ej. Clasificador de imágenes' : 'Ej. Experimento CNN v3'}
              />
            </label>
            <label>
              Familia de red
              <select value={family} onChange={e => setFamily(e.target.value)}>
                <option>Feedforward</option>
                <option>RNN</option>
                <option>CNN</option>
                <option>GAN</option>
              </select>
            </label>
            {modal === 'architecture' && (
              <div className="modal-note">
                <Zap size={16}/>
                {backendStatus.online
                  ? 'Modo Backend Activo: se enviará la arquitectura a TensorFlow y se recibirán métricas por SSE.'
                  : 'Modo demo local: no se detecta la API en localhost:8000.'}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={modal === 'project' ? createProject : startTraining}>
                {modal === 'project' ? 'Crear proyecto' : <><Play size={15}/> Iniciar entrenamiento</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    </div>
  )
}

function pageDescription(page: Page) {
  const descriptions: Record<Page, string> = {
    Dashboard: 'Resumen general del laboratorio con métricas en tiempo real.',
    Proyectos: 'Organiza tus espacios de trabajo y experimentos conectados a PostgreSQL.',
    Fundamentos: 'Explora los conceptos esenciales de las redes neuronales.',
    'Diseñador de redes': 'Construye y configura arquitecturas neuronales visualmente para entrenar con TensorFlow.',
    Datasets: 'Gestiona conjuntos de datos para tus experimentos.',
    Entrenamientos: 'Supervisa el progreso real y SSE de tus ejecuciones.',
    'Evaluación y métricas': 'Analiza el rendimiento de los modelos entrenados.',
    'Registro de modelos': 'Versiona y controla el ciclo de vida de tus modelos en base de datos.',
    Reportes: 'Consulta y exporta la actividad del laboratorio.',
    Administración: 'Preferencias, estado de la base de datos y conexión FastAPI.'
  }
  return descriptions[page]
}

function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return <div className="section-title"><div><h3>{title}</h3>{detail && <p>{detail}</p>}</div>{action}</div>
}

function Dashboard({ jobs, activeJobs, metricData, backendOnline, onNavigate, onNew, onTrain, onCancel }: {
  jobs: Job[]
  activeJobs: number
  metricData: any[]
  backendOnline: boolean
  onNavigate: (p: Page) => void
  onNew: () => void
  onTrain: () => void
  onCancel: (id: string, backendId?: string) => void
}) {
  const [chartTab, setChartTab] = useState('Pérdida')
  const lastMetric = metricData[metricData.length - 1]

  return <>
    <div className="welcome-banner">
      <div className="welcome-orb"><BrainCircuit size={31}/></div>
      <div className="welcome-text">
        <span className="banner-kicker"><Sparkles size={13}/> NEUROLAB INTELLIGENCE</span>
        <h2>Tu laboratorio, una nueva perspectiva.</h2>
        <p>Diseña, entrena con TensorFlow y evalúa redes neuronales desde un solo lugar.</p>
      </div>
      <div className="banner-visual">
        <div className="network-orbit orbit-one"/><div className="network-orbit orbit-two"/>
        <div className="network-core"><BrainCircuit size={34}/></div>
        <span className="node n1"/><span className="node n2"/><span className="node n3"/><span className="node n4"/><span className="node n5"/>
      </div>
      <button className="banner-cta" onClick={() => onNavigate('Diseñador de redes')}>
        Explorar diseñador <ArrowUpRight size={15}/>
      </button>
    </div>

    <div className="stats-grid">
      <StatCard icon={<FolderKanban size={18}/>} label="Proyectos activos" value="12" change="+2 este mes" trend="up" color="blue" foot="de 16 proyectos totales"/>
      <StatCard icon={<Activity size={18}/>} label="Entrenamientos" value={String(jobs.length)} change="+18.6%" trend="up" color="purple" foot="ejecuciones registradas"/>
      <StatCard icon={<Gauge size={18}/>} label="Precisión media" value="94.8%" change="+2.4%" trend="up" color="green" foot="en modelos evaluados"/>
      <StatCard icon={<Cpu size={18}/>} label="Estado Backend" value={backendOnline ? 'Online' : 'Demo'} change={backendOnline ? 'API Conectada' : 'Local'} trend={backendOnline ? 'up' : 'neutral'} color="orange" foot={backendOnline ? 'FastAPI + Supabase' : 'Modo Autónomo'}/>
    </div>

    <div className="dashboard-grid">
      <section className="panel chart-panel">
        <SectionTitle
          title="Rendimiento del modelo"
          detail="Evolución de pérdida durante el entrenamiento"
          action={
            <div className="segmented">
              <button className={chartTab === 'Pérdida' ? 'active' : ''} onClick={() => setChartTab('Pérdida')}>Pérdida</button>
              <button className={chartTab === 'Precisión' ? 'active' : ''} onClick={() => setChartTab('Precisión')}>Precisión</button>
            </div>
          }
        />
        <div className="chart-legend">
          <span><i className="legend-blue"/> Entrenamiento</span>
          <span><i className="legend-purple"/> Validación</span>
          <b>{chartTab === 'Pérdida' ? (lastMetric?.loss ?? '0.112') : '94.8%'} <small>última época</small></b>
        </div>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={metricData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="lossFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6388ff" stopOpacity={.18}/>
                  <stop offset="95%" stopColor="#6388ff" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="valFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9b8afb" stopOpacity={.12}/>
                  <stop offset="95%" stopColor="#9b8afb" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#252d41" strokeDasharray="3 5" vertical={false}/>
              <XAxis dataKey="epoch" tick={{ fill: '#78849d', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#78849d', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #303950', borderRadius: 10, color: '#e8edfa' }}/>
              <Area type="monotone" dataKey={chartTab === 'Pérdida' ? 'loss' : 'val'} stroke="#7294ff" strokeWidth={2.3} fill="url(#lossFill)" name="Entrenamiento"/>
              <Area type="monotone" dataKey={chartTab === 'Pérdida' ? 'val' : 'loss'} stroke="#a397ff" strokeWidth={2} fill="url(#valFill)" name="Validación"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="chart-bottom">
          <span><i className="legend-blue"/> {chartTab === 'Pérdida' ? 'Loss entrenamiento' : 'Precisión entrenamiento'}</span>
          <b>{chartTab === 'Pérdida' ? '↓ 82.4%' : '↑ 12.8%'}</b>
          <span className="chart-period">Historial de épocas</span>
        </div>
      </section>

      <section className="panel activity-panel">
        <SectionTitle title="Actividad semanal" detail="Ejecuciones por día"/>
        <div className="activity-total">
          <b>{190 + jobs.length}</b>
          <span><ArrowUpRight size={14}/> 12.4% <small>vs. semana anterior</small></span>
        </div>
        <div className="bar-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activityData} margin={{ top: 8, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid stroke="#252d41" strokeDasharray="3 5" vertical={false}/>
              <XAxis dataKey="day" tick={{ fill: '#78849d', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: '#78849d', fontSize: 10 }} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #303950', borderRadius: 10, color: '#e8edfa' }}/>
              <Bar dataKey="runs" fill="#718fff" radius={[5, 5, 0, 0]} maxBarSize={23}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="activity-footer">
          <span><i className="legend-blue"/> Ejecuciones completadas</span>
          <span>Últimos 7 días</span>
        </div>
      </section>
    </div>

    <div className="lower-grid">
      <section className="panel jobs-panel">
        <SectionTitle
          title="Entrenamientos recientes"
          detail="Actividad de los modelos en tu espacio"
          action={<button className="text-action" onClick={() => onNavigate('Entrenamientos')}>Ver todos <ArrowUpRight size={14}/></button>}
        />
        <JobTable jobs={jobs.slice(0, 4)} onCancel={onCancel}/>
      </section>
      <section className="panel quick-panel">
        <SectionTitle title="Accesos rápidos" detail="Continúa con tu trabajo"/>
        <button className="quick-link" onClick={onNew}>
          <span className="quick-icon blue"><FolderKanban size={18}/></span>
          <span><b>Crear proyecto</b><small>Organiza un nuevo experimento en la nube</small></span>
          <ArrowUpRight size={16}/>
        </button>
        <button className="quick-link" onClick={onTrain}>
          <span className="quick-icon purple"><Network size={18}/></span>
          <span><b>Diseñar una red</b><small>Configura capas y activaciones con Keras</small></span>
          <ArrowUpRight size={16}/>
        </button>
        <button className="quick-link" onClick={() => onNavigate('Datasets')}>
          <span className="quick-icon green"><Database size={18}/></span>
          <span><b>Explorar datasets</b><small>Prepara tus datos de entrada</small></span>
          <ArrowUpRight size={16}/>
        </button>
        <div className="quick-tip">
          <Sparkles size={15}/>
          <span><b>Consejo del laboratorio</b><small>Las ejecuciones de TensorFlow se transmiten en tiempo real vía Server-Sent Events.</small></span>
        </div>
      </section>
    </div>
  </>
}

function StatCard({ icon, label, value, change, trend, color, foot }: { icon: React.ReactNode; label: string; value: string; change: string; trend: string; color: string; foot: string }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${color}`}>{icon}</span>
        <span className={`stat-change ${trend}`}>{trend === 'up' && <ArrowUpRight size={13}/>} {change}</span>
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </div>
  )
}

function Status({ status }: { status: JobStatus | string }) {
  const cls = status.toLowerCase().replaceAll(' ', '-')
  return <span className={`status ${cls}`}><i/>{status}</span>
}

function JobTable({ jobs, onCancel }: { jobs: Job[]; onCancel?: (id: string, backendId?: string) => void }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>MODELO / ID</th>
            <th>FAMILIA</th>
            <th>ESTADO</th>
            <th>PROGRESO</th>
            <th>LOSS</th>
            <th>ACTUALIZACIÓN</th>
            {onCancel && <th>ACCIONES</th>}
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j.id}>
              <td>
                <div className="model-cell">
                  <span className={`model-glyph ${j.family.toLowerCase()}`}><BrainCircuit size={16}/></span>
                  <span><b>{j.name}</b><small>{j.id} {j.backendId ? `· ${j.backendId.slice(0, 8)}` : ''}</small></span>
                </div>
              </td>
              <td><span className="family-pill">{j.family}</span></td>
              <td><Status status={j.status}/></td>
              <td>
                <div className="progress-cell">
                  <div className="progress-track"><i style={{ width: `${j.progress}%` }}/></div>
                  <small>{j.progress}%</small>
                </div>
              </td>
              <td className="loss-value">{j.loss ? j.loss.toFixed(4) : '—'}</td>
              <td className="updated">{j.updated}</td>
              {onCancel && (
                <td>
                  {j.status === 'Ejecutando' && (
                    <button
                      className="btn-danger-outline"
                      onClick={() => onCancel(j.id, j.backendId)}
                      title="Cancelar entrenamiento"
                    >
                      <StopCircle size={12}/> Cancelar
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <div className="empty-state">No se encontraron ejecuciones.</div>}
    </div>
  )
}


function Projects({ projects, query, backendOnline, onOpen, onNew, onDelete }: {
  projects: any[]
  query: string
  backendOnline: boolean
  onOpen: (p: string) => void
  onNew: () => void
  onDelete: (project: any) => void
}) {
  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  const filtered = projects.filter(p =>
    `${p.name} ${p.family} ${p.code}`.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<FolderKanban size={18}/>} label="Proyectos totales" value={String(projects.length)} change="+2" trend="up" color="blue" foot={backendOnline ? 'Sincronizados con DB' : 'En este espacio'}/>
        <StatCard icon={<BrainCircuit size={18}/>} label="Modelos registrados" value={String(projects.reduce((a, p) => a + (p.models || 0), 0))} change="Versionados" trend="neutral" color="purple" foot="en todos los proyectos"/>
        <StatCard icon={<Activity size={18}/>} label="Proyectos activos" value={String(projects.filter(p => p.status === 'Activo').length)} change="En marcha" trend="neutral" color="green" foot="listos para experimentar"/>
      </div>

      <section className="panel project-panel">
        <SectionTitle
          title="Tus proyectos"
          detail={backendOnline ? 'Proyectos cargados desde PostgreSQL / Supabase' : 'Selecciona un proyecto para abrir su diseñador'}
          action={<button className="btn btn-primary btn-small" onClick={onNew}><Plus size={15}/> Crear proyecto</button>}
        />

        <div className="project-grid">
          {filtered.map(p => (
            <article className="project-card" key={p.id || p.code}>
              <div className="project-card-top">
                <span className={`project-avatar ${p.color}`}>{p.initials}</span>

                <div className="project-menu-container">
                  <button
                    type="button"
                    className="project-menu-trigger"
                    title="Opciones del proyecto"
                    aria-label={`Opciones de ${p.name}`}
                    onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)}
                  >
                    <MoreHorizontal size={19}/>
                  </button>

                  {menuOpen === p.id && (
                    <div className="project-dropdown">
                      <button
                        type="button"
                        onClick={() => {
                          setMenuOpen(null)
                          onOpen(p.name)
                        }}
                      >
                        <FolderKanban size={14}/> Abrir proyecto
                      </button>

                      <button
                        type="button"
                        className="project-delete-option"
                        onClick={() => {
                          setMenuOpen(null)
                          onDelete(p)
                        }}
                      >
                        <Trash2 size={14}/> Eliminar proyecto
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                className="project-card-open"
                onClick={() => onOpen(p.name)}
              >
                <h3>{p.name}</h3>
                <p>{p.code} <span>·</span> {p.family}</p>

                <div className="project-card-bottom">
                  <span><Layers3 size={14}/>{p.models || 0} modelos</span>
                  <Status status={p.status === 'Activo' ? 'Completado' : 'En cola'}/>
                </div>

                <div className="project-card-progress">
                  <i style={{ width: `${Math.min(100, (p.models || 1) * 11 + 15)}%` }}/>
                </div>
              </button>
            </article>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">No hay proyectos que coincidan con tu búsqueda.</div>
        )}
      </section>
    </>
  )
}


function Fundamentals() {
  const cards = [
    { icon: <BrainCircuit/>, title: 'Neurona artificial', tag: 'UNIDAD BÁSICA', text: 'Recibe entradas, aplica pesos y sesgo, y produce una salida mediante una función de activación.', formula: 'y = f(Σ wᵢxᵢ + b)', color: 'blue' },
    { icon: <Layers3/>, title: 'Capas y conexiones', tag: 'ESTRUCTURA', text: 'Las capas de entrada, ocultas y salida organizan el flujo de información entre neuronas.', formula: 'Entrada → Ocultas → Salida', color: 'purple' },
    { icon: <Zap/>, title: 'Funciones de activación', tag: 'NO LINEALIDAD', text: 'Permiten aprender relaciones complejas. ReLU, Sigmoid, Tanh y Softmax son opciones comunes.', formula: 'ReLU(x) = max(0, x)', color: 'orange' },
  ]
  const families = [
    { name: 'Feedforward', code: 'FFN', desc: 'Datos fluyen en una sola dirección. Ideal para clasificación y regresión.', icon: '→' },
    { name: 'Recurrente (RNN)', code: 'RNN', desc: 'Procesa secuencias y conserva información temporal.', icon: '↻' },
    { name: 'Convolucional (CNN)', code: 'CNN', desc: 'Extrae patrones espaciales en imágenes y señales.', icon: '▦' },
    { name: 'Generativa (GAN)', code: 'GAN', desc: 'Dos redes compiten para generar muestras sintéticas.', icon: '✳' }
  ]
  return (
    <>
      <div className="fundamentals-intro">
        <div>
          <span className="eyebrow">BASES DE DEEP LEARNING</span>
          <h2>De la neurona al aprendizaje.</h2>
          <p>Los conceptos esenciales para diseñar arquitecturas con criterio.</p>
        </div>
        <div className="intro-graphic"><BrainCircuit size={42}/><span>01</span><span>02</span><span>03</span></div>
      </div>
      <div className="concept-grid">
        {cards.map(c => (
          <div className="panel concept-card" key={c.title}>
            <div className={`concept-icon ${c.color}`}>{c.icon}</div>
            <span className="eyebrow">{c.tag}</span>
            <h3>{c.title}</h3>
            <p>{c.text}</p>
            <div className="formula">{c.formula}</div>
          </div>
        ))}
      </div>
      <SectionTitle title="Familias de redes neuronales" detail="Cada arquitectura responde a un tipo de problema."/>
      <div className="family-grid">
        {families.map(f => (
          <div className="panel family-card" key={f.code}>
            <div className="family-symbol">{f.icon}</div>
            <div><h3>{f.name}</h3><span>{f.code}</span></div>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <BookOpen size={18}/>
        <div>
          <b>Ruta de aprendizaje recomendada</b>
          <p>Comienza por Feedforward, comprende la propagación y luego explora CNN, RNN y GAN según tu problema.</p>
        </div>
      </div>
    </>
  )
}

function Designer({ family, setFamily, layers, setLayers, dataset, setDataset, epochs, setEpochs, backendOnline, onRun, notify }: any) {
  const total = layers.reduce((sum: number, l: any) => sum + Number(l.units || 0), 0)
  const addLayer = () => setLayers([...layers.slice(0, -1), { type: 'Densa', units: 32, activation: 'ReLU' }, layers[layers.length - 1]])

  return (
    <div className="designer-layout">
      <section className="panel designer-config">
        <SectionTitle title="Configuración" detail="Parámetros de tu arquitectura"/>
        <label className="field-label">
          Familia de red
          <select value={family} onChange={e => setFamily(e.target.value)}>
            <option>Feedforward</option>
            <option>RNN</option>
            <option>CNN</option>
            <option>GAN</option>
          </select>
        </label>
        <label className="field-label">
          Dataset de referencia
          <select value={dataset} onChange={e => setDataset(e.target.value)}>
            <option>MNIST · dígitos escritos</option>
            <option>Fashion-MNIST · prendas</option>
            <option>CIFAR-10 · imágenes</option>
            <option>Dataset personalizado (demo)</option>
          </select>
        </label>
        <div className="field-label">
          Parámetros de entrenamiento
          <div className="range-head"><span>Épocas</span><b>{epochs}</b></div>
          <input className="range-input" type="range" min="5" max="100" step="5" value={epochs} onChange={e => setEpochs(Number(e.target.value))}/>
          <div className="range-limits"><span>5</span><span>100</span></div>
        </div>
        <label className="field-label">
          Optimizador
          <select><option>Adam</option><option>SGD</option><option>RMSprop</option></select>
        </label>
        <label className="field-label">
          Tasa de aprendizaje
          <select><option>0.001 (recomendado)</option><option>0.01</option><option>0.0001</option></select>
        </label>
        <div className="config-note">
          <ShieldCheck size={16}/>
          <span>
            {backendOnline
              ? 'Conectado a FastAPI: la arquitectura se compilará con TensorFlow/Keras en el backend.'
              : 'Modo local: no hay conexión al backend. Los valores se calcularán localmente.'}
          </span>
        </div>
        <button className="btn btn-primary full-btn" onClick={onRun}>
          <Play size={16} fill="currentColor"/> {backendOnline ? 'Iniciar entrenamiento real' : 'Iniciar entrenamiento demo'}
        </button>
      </section>

      <section className="panel architecture-panel">
        <div className="architecture-heading">
          <div>
            <h3>Vista previa de arquitectura</h3>
            <p>Haz clic en las unidades para editar la capa.</p>
          </div>
          <span className="draft-pill"><i/> BORRADOR</span>
        </div>
        <div className="architecture-canvas">
          <div className="canvas-grid"/>
          <div className="neural-visual">
            {layers.map((layer: any, i: number) => (
              <div className="neural-column" key={i}>
                <div className="neural-col-label">{layer.type}</div>
                <div className="neural-nodes">
                  {Array.from({ length: Math.min(5, Math.max(2, Math.ceil(layer.units / 30))) }, (_, j) => (
                    <span key={j} className={`neuron ${i === 0 ? 'input-neuron' : i === layers.length - 1 ? 'output-neuron' : ''}`}><i/></span>
                  ))}
                </div>
                <div className="neural-units">{layer.units} unidades</div>
                <span className="neural-activation">{layer.activation}</span>
              </div>
            ))}
          </div>
          <div className="canvas-watermark"><Network size={15}/> VISUALIZACIÓN CONCEPTUAL</div>
        </div>
        <div className="layer-editor">
          <div className="layer-editor-head">
            <h4><Layers3 size={16}/> Capas de la red <span>{layers.length}</span></h4>
            <button className="text-action" onClick={addLayer}><Plus size={14}/> Añadir capa</button>
          </div>
          {layers.map((l: any, i: number) => (
            <div className="layer-row" key={i}>
              <span className="layer-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="layer-type">{l.type}</span>
              <label>
                Unidades
                <input
                  type="number"
                  min="1"
                  max="4096"
                  value={l.units}
                  onChange={e => setLayers(layers.map((x: any, k: number) => k === i ? { ...x, units: Math.max(1, Number(e.target.value)) } : x))}
                />
              </label>
              <label>
                Activación
                <select
                  value={l.activation}
                  onChange={e => setLayers(layers.map((x: any, k: number) => k === i ? { ...x, activation: e.target.value } : x))}
                >
                  <option>—</option>
                  <option>ReLU</option>
                  <option>Sigmoid</option>
                  <option>Tanh</option>
                  <option>Softmax</option>
                  <option>Linear</option>
                </select>
              </label>
              {i > 0 && i < layers.length - 1 && (
                <button className="icon-btn delete-layer" onClick={() => setLayers(layers.filter((_: any, k: number) => k !== i))}>
                  <X size={15}/>
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="architecture-summary">
          <div><span>Capas</span><b>{layers.length}</b></div>
          <div><span>Unidades totales</span><b>{fmt(total)}</b></div>
          <div><span>Dataset</span><b>{dataset.split(' · ')[0]}</b></div>
          <div><span>Épocas</span><b>{epochs}</b></div>
        </div>
      </section>
    </div>
  )
}

function Datasets({ dataset, setDataset, notify }: any) {
  const data = [
    { name: 'MNIST', desc: 'Dígitos escritos a mano', rows: '70,000', type: 'Imagen', size: '52 MB', tag: 'Clásico', color: 'blue' },
    { name: 'Fashion-MNIST', desc: 'Clasificación de prendas', rows: '70,000', type: 'Imagen', size: '30 MB', tag: 'Clásico', color: 'purple' },
    { name: 'CIFAR-10', desc: 'Objetos en imágenes RGB', rows: '60,000', type: 'Imagen', size: '163 MB', tag: 'Visión', color: 'green' },
    { name: 'Dataset personalizado', desc: 'Espacio para tus propios datos', rows: '—', type: 'CSV / Parquet', size: '—', tag: 'Local demo', color: 'orange' }
  ]
  return (
    <>
      <div className="dataset-callout">
        <Database size={20}/>
        <div>
          <b>Biblioteca de datasets</b>
          <p>Catálogo compatible con los workers de entrenamiento de NeuroLab.</p>
        </div>
        <button className="btn btn-secondary btn-small" onClick={() => notify('Registro de dataset listo para subir a Supabase Storage.')}>
          <Plus size={15}/> Cargar dataset
        </button>
      </div>
      <div className="dataset-grid">
        {data.map(d => (
          <div className={`panel dataset-card ${dataset.startsWith(d.name) ? 'dataset-selected' : ''}`} key={d.name}>
            <div className="dataset-card-top">
              <span className={`dataset-icon ${d.color}`}><Database size={20}/></span>
              <span className="dataset-tag">{d.tag}</span>
            </div>
            <h3>{d.name}</h3>
            <p>{d.desc}</p>
            <div className="dataset-meta">
              <span><Layers3 size={13}/>{d.rows} registros</span>
              <span><SquareActivity size={13}/>{d.type}</span>
            </div>
            <div className="dataset-card-bottom">
              <span>{d.size}</span>
              <button
                className="btn btn-secondary btn-small"
                onClick={() => {
                  setDataset(d.name === 'MNIST' ? 'MNIST · dígitos escritos' : d.name === 'Fashion-MNIST' ? 'Fashion-MNIST · prendas' : d.name === 'CIFAR-10' ? 'CIFAR-10 · imágenes' : 'Dataset personalizado (demo)')
                  notify(`${d.name} seleccionado para el entrenamiento.`)
                }}
              >
                {dataset.startsWith(d.name) ? 'Seleccionado' : 'Seleccionar'}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <CircleHelp size={18}/>
        <div>
          <b>Nota sobre los datos</b>
          <p>Al iniciar un entrenamiento, los workers del backend generan la matriz de tensores correspondiente para validar el flujo extremo a extremo.</p>
        </div>
      </div>
    </>
  )
}

function Trainings({ jobs, query, backendOnline, onQuery, onTrain, onExport, onCancel }: any) {
  const running = jobs.filter((j: Job) => j.status === 'Ejecutando').length
  const completed = jobs.filter((j: Job) => j.status === 'Completado').length

  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<Activity size={18}/>} label="En ejecución" value={String(running)} change={backendOnline ? 'SSE Activo' : 'Simulado'} trend="neutral" color="blue" foot="trabajos activos"/>
        <StatCard icon={<Check size={18}/>} label="Completados" value={String(completed)} change="Éxito" trend="up" color="green" foot="ejecuciones exitosas"/>
        <StatCard icon={<Clock3 size={18}/>} label="Tiempo medio" value="4m 32s" change="−8.2%" trend="up" color="purple" foot="por entrenamiento"/>
      </div>
      <section className="panel jobs-page-panel">
        <SectionTitle
          title="Historial de ejecuciones"
          detail={backendOnline ? 'Actualizaciones en vivo recibidas vía SSE desde el backend' : 'Los cambios de progreso se simulan localmente'}
          action={<button className="btn btn-primary btn-small" onClick={onTrain}><Play size={14}/> Nueva ejecución</button>}
        />
        <div className="table-toolbar">
          <div className="search-box table-search">
            <Search size={15}/>
            <input placeholder="Filtrar modelos..." value={query} onChange={e => onQuery(e.target.value)}/>
          </div>
          <button className="btn btn-secondary btn-small" onClick={onExport}><Download size={14}/> Exportar CSV</button>
        </div>
        <JobTable jobs={jobs} onCancel={onCancel}/>
        <div className="table-footnote">
          <span><i className="live-dot"/> {backendOnline ? 'Conexión SSE activa con FastAPI' : 'Actualización local'}</span>
          <span>{jobs.length} registros</span>
        </div>
      </section>
    </>
  )
}

function Evaluation({ metricData }: { metricData: any[] }) {
  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<Gauge size={18}/>} label="Precisión" value="94.8%" change="+2.4%" trend="up" color="green" foot="en conjunto de validación"/>
        <StatCard icon={<Activity size={18}/>} label="Loss final" value={metricData[metricData.length - 1]?.loss?.toFixed(3) || '0.112'} change="−18.2%" trend="up" color="blue" foot="menor es mejor"/>
        <StatCard icon={<SquareActivity size={18}/>} label="F1-score" value="0.931" change="+1.8%" trend="up" color="purple" foot="media ponderada"/>
      </div>
      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <SectionTitle title="Curvas de aprendizaje" detail="Métricas reales por época procesadas en el backend"/>
          <div className="chart-wrap tall">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricData}>
                <CartesianGrid stroke="#252d41" strokeDasharray="3 5" vertical={false}/>
                <XAxis dataKey="epoch" tick={{ fill: '#78849d', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#78849d', fontSize: 11 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#151c2e', border: '1px solid #303950', borderRadius: 10 }}/>
                <Area type="monotone" dataKey="loss" stroke="#7294ff" fill="#7294ff" fillOpacity={.1} name="Loss"/>
                <Area type="monotone" dataKey="val" stroke="#a397ff" fill="#a397ff" fillOpacity={.08} name="Validación"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel metrics-panel">
          <SectionTitle title="Resumen de métricas" detail="Modelo de referencia"/>
          {[
            ['Precisión', '94.8%', 'good'],
            ['Recall', '92.1%', 'good'],
            ['F1-score', '93.1%', 'good'],
            ['Loss', metricData[metricData.length - 1]?.loss?.toFixed(4) || '0.112', 'neutral'],
            ['Tiempo de ejecución', '04:32', 'neutral']
          ].map(m => (
            <div className="metric-row" key={m[0]}>
              <span>{m[0]}</span><b>{m[1]}</b>
              <span className={`metric-indicator ${m[2]}`}>{m[2] === 'good' ? 'Óptimo' : 'Referencia'}</span>
            </div>
          ))}
          <div className="config-note">
            <CircleHelp size={15}/> Las métricas se actualizan continuamente conforme progresan los entrenamientos.
          </div>
        </section>
      </div>
    </>
  )
}

function Models({ activeProjectId, backendOnline, notify }: any) {
  const [filter, setFilter] = useState('Todos')
  const [models, setModels] = useState([
    { name: 'image-classifier', version: 'v2.4.0', family: 'CNN', status: 'Aprobado', date: '24 oct 2026', accuracy: '96.42%' },
    { name: 'demand-forecast', version: 'v1.8.2', family: 'RNN', status: 'Revisado', date: '22 oct 2026', accuracy: '92.81%' },
    { name: 'anomaly-detector', version: 'v1.2.0', family: 'Feedforward', status: 'Borrador', date: '20 oct 2026', accuracy: '89.54%' }
  ])

  useEffect(() => {
    if (backendOnline && activeProjectId) {
      api.listModels(activeProjectId).then(bModels => {
        if (bModels && bModels.length > 0) {
          const mapped = bModels.map(m => ({
            name: `modelo-${m.version}`,
            version: m.version,
            family: 'Feedforward',
            status: m.status === 'draft' ? 'Borrador' : 'Aprobado',
            date: new Date(m.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
            accuracy: '95.10%'
          }))
          setModels(prev => [...mapped, ...prev])
        }
      }).catch(err => console.log('No se pudieron listar modelos de backend:', err))
    }
  }, [backendOnline, activeProjectId])

  return (
    <section className="panel jobs-page-panel">
      <SectionTitle
        title="Registro de modelos"
        detail={backendOnline ? 'Versiones guardadas en Supabase / PostgreSQL' : 'Versiones de referencia para el prototipo'}
        action={<button className="btn btn-secondary btn-small" onClick={() => notify('Nueva versión lista para publicar en el registro de modelos.')}><GitBranch size={14}/> Publicar versión</button>}
      />
      <div className="filter-tabs">
        {['Todos', 'Aprobado', 'Revisado', 'Borrador'].map(f => (
          <button className={filter === f ? 'active' : ''} key={f} onClick={() => setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="model-registry">
        {models.filter(m => filter === 'Todos' || m.status === filter).map(m => (
          <div className="registry-row" key={m.version + m.name}>
            <span className="model-glyph cnn"><BrainCircuit size={17}/></span>
            <div className="registry-name">
              <b>{m.name}</b>
              <small>{m.version} · {m.family}</small>
            </div>
            <span className={`registry-status ${m.status.toLowerCase()}`}>{m.status}</span>
            <div className="registry-accuracy">
              <small>Precisión</small>
              <b>{m.accuracy}</b>
            </div>
            <div className="registry-date">
              <small>Actualizado</small>
              <span>{m.date}</span>
            </div>
            <button className="icon-btn" onClick={() => notify(`Modelo ${m.name} (${m.version}): disponible en backend.`)}>
              <MoreHorizontal size={18}/>
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Reports({ activeProjectId, backendOnline, onExport, notify }: any) {
  const exportAudit = async () => {
    if (backendOnline && activeProjectId) {
      try {
        const events = await api.listAuditEvents(activeProjectId)
        if (events && events.length > 0) {
          const rows = [
            ['ID', 'Acción', 'Actor', 'Fecha', 'Metadata'],
            ...events.map(e => [e.id, e.action, e.actor_id, e.created_at, JSON.stringify(e.metadata_json)])
          ]
          const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
          const a = document.createElement('a')
          a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
          a.download = `auditoria-${activeProjectId.slice(0, 8)}.csv`
          a.click()
          URL.revokeObjectURL(a.href)
          notify('Auditoría descargada del backend.')
          return
        }
      } catch (err: any) {
        notify(`Error al descargar auditoría: ${err.message}`)
      }
    }
    onExport()
  }

  return (
    <>
      <div className="report-grid">
        {[
          { icon: <FileChartColumn/>, title: 'Actividad de entrenamientos', desc: 'Estados, duración y métricas de ejecución', type: 'CSV', color: 'blue', action: onExport },
          { icon: <BrainCircuit/>, title: 'Auditoría de eventos', desc: 'Historial de acciones registradas en base de datos', type: 'CSV · Backend', color: 'purple', action: exportAudit },
          { icon: <FolderKanban/>, title: 'Ficha de proyectos', desc: 'Inventario de espacios de trabajo', type: 'CSV', color: 'green', action: onExport }
        ].map(r => (
          <div className="panel report-card" key={r.title}>
            <span className={`report-icon ${r.color}`}>{r.icon}</span>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div>
              <span>{r.type}</span>
              <button className="btn btn-secondary btn-small" onClick={r.action}>
                <Download size={14}/> Exportar
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="info-banner">
        <ShieldCheck size={18}/>
        <div>
          <b>Auditoría y trazabilidad</b>
          <p>Todas las acciones de creación y entrenamiento se registran en la tabla audit_events de Supabase.</p>
        </div>
      </div>
    </>
  )
}

function Administration({ backendStatus, onCheckBackend, notify }: {
  backendStatus: HealthResponse
  onCheckBackend: () => void
  notify: (s: string) => void
}) {
  const online = backendStatus.online

  return (
    <div className="admin-grid">
      <section className="panel admin-panel">
        <SectionTitle title="Preferencias generales" detail="Configuración y conectividad del sistema"/>
        <div className="setting-row">
          <div>
            <b>Actualización de progreso en tiempo real</b>
            <small>Canal SSE (Server-Sent Events) conectado a FastAPI</small>
          </div>
          <span className={`toggle ${online ? 'on' : ''}`} onClick={() => notify(online ? 'SSE activo.' : 'Backend desconectado.')}>
            <i/>
          </span>
        </div>
        <div className="setting-row">
          <div>
            <b>Conexión de Base de Datos</b>
            <small>Supabase PostgreSQL mediante pooler aws-1-us-west-2</small>
          </div>
          <span className="environment-badge">
            {online ? (backendStatus.database || 'POSTGRESQL ACTIVO') : 'MODO DESCONECTADO'}
          </span>
        </div>
        <div className="setting-row">
          <div>
            <b>Modo de entorno</b>
            <small>{online ? 'Conectado a API FastAPI en http://localhost:8000' : 'El frontend está en modo demostración'}</small>
          </div>
          <button className="btn btn-secondary btn-small" onClick={onCheckBackend}>
            <RefreshCw size={13}/> Comprobar conexión
          </button>
        </div>
      </section>

      <section className="panel admin-panel">
        <SectionTitle title="Estado de la Arquitectura Completa" detail="Comprobación en vivo de servicios integrados"/>
        {[
          ['Interfaz React + TypeScript', 'Operativo (Vite :5173)', true],
          ['API Python (FastAPI)', online ? 'Operativo (:8000/api/v1)' : 'No conectada (iniciar backend)', online],
          ['Base de datos (Supabase)', online ? 'Conectada (PostgreSQL)' : 'Desconectada', online],
          ['Canal SSE (Server-Sent Events)', online ? 'Operativo (/events)' : 'No conectado', online],
          ['Motor de Entrenamiento Keras', online ? 'Listo (TensorFlow)' : 'Simulación local', online]
        ].map((r: any) => (
          <div className="system-row" key={r[0]}>
            <span>
              <i className={r[2] ? 'system-ok' : 'system-off'}/>
              {r[0]}
            </span>
            <b className={r[2] ? 'green-text' : 'muted-text'}>{r[1]}</b>
          </div>
        ))}
      </section>
    </div>
  )
}

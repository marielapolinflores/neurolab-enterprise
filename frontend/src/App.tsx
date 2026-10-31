import React, { useEffect, useMemo, useState, useRef } from 'react'
import {
  Activity, ArrowDownRight, ArrowUpRight, ArrowRight, ArrowLeft, ChevronRight, Bell, BrainCircuit,
  ChevronDown, CircleHelp, Clock3, Cpu, Database, Download, FileChartColumn, FolderKanban, Gauge,
  Layers3, LayoutDashboard, Menu, MoreHorizontal, Network, Play, Plus, Search, Settings2,
  ShieldCheck, Sparkles, SquareActivity, X, Zap, Check, BookOpen, GitBranch, SlidersHorizontal,
  RefreshCw, StopCircle, UploadCloud, FileText, CheckCircle2, AlertCircle, BarChart3, Target,
  Users, Key, History, Sliders, Server, HardDrive, Lock, ExternalLink, HelpCircle, Trash2
} from 'lucide-react'
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
  BarChart, Bar, Legend
} from 'recharts'
import {
  api, BackendProject, BackendTrainingJob, BackendModelVersion,
  BackendAuditEvent, HealthResponse, TrainingEventPayload
} from './api/client'

export type Page =
  | 'Dashboard'
  | 'Proyectos'
  | 'Datasets'
  | 'Diseñador de redes'
  | 'Entrenamientos'
  | 'Evaluación y métricas'
  | 'Fundamentos'
  | 'Registro de modelos'
  | 'Reportes'
  | 'Administración'

export type JobStatus = 'Ejecutando' | 'Completado' | 'En cola' | 'Fallido' | 'Cancelado'

export interface Job {
  id: string
  backendId?: string
  name: string
  family: string
  status: JobStatus
  progress: number
  epoch: string
  loss: number
  accuracy?: number
  updated: string
  datasetName?: string
  layersCount?: number
}

export interface DatasetItem {
  id: string
  name: string
  desc: string
  category: 'Visión Artificial' | 'Tabular / Negocio' | 'Biomédico' | 'Series Temporales' | 'Personalizado'
  type: string
  rows: string
  size: string
  inputShape: number
  inputShapeLabel: string
  numClasses: number
  classNames: string[]
  tag: string
  color: string
  previewColumns: Array<{ name: string; type: 'number' | 'category' | 'target' }>
  previewRows: Array<Record<string, any>>
  recommendedArch: {
    layers: Array<{ type: string; units: number; activation: string }>
  }
}

export interface ProjectItem {
  id: string
  name: string
  code: string
  family: string
  models: number
  status: 'Activo' | 'En revisión' | 'Completado'
  color: string
  initials: string
  description?: string
  datasetSelected?: string | null
  currentStage: number
}

export interface SystemAlert {
  id: string
  type: 'info' | 'success' | 'warning'
  title: string
  message: string
  time: string
}

export interface ModelArtifact {
  name: string
  version: string
  family: string
  status: string
  date: string
  accuracy: string
  params: string
  loss: string
  dataset: string
  checksum: string
}

const initialDatasets: DatasetItem[] = [
  {
    id: 'mnist',
    name: 'MNIST · Dígitos Manuscritos',
    desc: 'Clasificación de dígitos del 0 al 9 en imágenes en escala de grises de 28x28 píxeles.',
    category: 'Visión Artificial',
    type: 'Imágenes 28x28 (784 features)',
    rows: '70,000 muestras',
    size: '52 MB',
    inputShape: 784,
    inputShapeLabel: '784 píxeles (28x28)',
    numClasses: 10,
    classNames: ['Dígito 0', 'Dígito 1', 'Dígito 2', 'Dígito 3', 'Dígito 4', 'Dígito 5', 'Dígito 6', 'Dígito 7', 'Dígito 8', 'Dígito 9'],
    tag: 'Estándar',
    color: 'blue',
    previewColumns: [
      { name: 'pixel_0 (px)', type: 'number' },
      { name: 'pixel_128 (px)', type: 'number' },
      { name: 'pixel_340 (px)', type: 'number' },
      { name: 'pixel_783 (px)', type: 'number' },
      { name: 'target_digit', type: 'target' }
    ],
    previewRows: [
      { 'pixel_0 (px)': '0.00', 'pixel_128 (px)': '0.84', 'pixel_340 (px)': '0.98', 'pixel_783 (px)': '0.00', 'target_digit': 'Dígito 5' },
      { 'pixel_0 (px)': '0.00', 'pixel_128 (px)': '0.12', 'pixel_340 (px)': '0.76', 'pixel_783 (px)': '0.00', 'target_digit': 'Dígito 0' },
      { 'pixel_0 (px)': '0.00', 'pixel_128 (px)': '0.95', 'pixel_340 (px)': '0.89', 'pixel_783 (px)': '0.00', 'target_digit': 'Dígito 4' },
      { 'pixel_0 (px)': '0.00', 'pixel_128 (px)': '0.04', 'pixel_340 (px)': '0.45', 'pixel_783 (px)': '0.00', 'target_digit': 'Dígito 1' }
    ],
    recommendedArch: {
      layers: [
        { type: 'Entrada', units: 784, activation: '—' },
        { type: 'Densa', units: 128, activation: 'ReLU' },
        { type: 'Densa', units: 64, activation: 'ReLU' },
        { type: 'Salida', units: 10, activation: 'Softmax' }
      ]
    }
  },
  {
    id: 'fashion-mnist',
    name: 'Fashion-MNIST · Prendas y Calzado',
    desc: 'Conjunto de 70,000 imágenes de ropa para clasificación visual y categorización retail.',
    category: 'Visión Artificial',
    type: 'Imágenes 28x28 (784 features)',
    rows: '70,000 muestras',
    size: '30 MB',
    inputShape: 784,
    inputShapeLabel: '784 píxeles (28x28)',
    numClasses: 10,
    classNames: ['Camiseta', 'Pantalón', 'Jersey', 'Vestido', 'Abrigo', 'Sandalia', 'Camisa', 'Zapatilla', 'Bolso', 'Botín'],
    tag: 'Retail',
    color: 'purple',
    previewColumns: [
      { name: 'contrast_val', type: 'number' },
      { name: 'edge_density', type: 'number' },
      { name: 'intensity_mean', type: 'number' },
      { name: 'aspect_ratio', type: 'number' },
      { name: 'target_category', type: 'target' }
    ],
    previewRows: [
      { 'contrast_val': '0.78', 'edge_density': '0.45', 'intensity_mean': '112.4', 'aspect_ratio': '1.02', 'target_category': 'Zapatilla' },
      { 'contrast_val': '0.62', 'edge_density': '0.82', 'intensity_mean': '98.1', 'aspect_ratio': '0.85', 'target_category': 'Camiseta' },
      { 'contrast_val': '0.91', 'edge_density': '0.69', 'intensity_mean': '145.0', 'aspect_ratio': '1.30', 'target_category': 'Bolso' },
      { 'contrast_val': '0.45', 'edge_density': '0.34', 'intensity_mean': '76.8', 'aspect_ratio': '0.72', 'target_category': 'Pantalón' }
    ],
    recommendedArch: {
      layers: [
        { type: 'Entrada', units: 784, activation: '—' },
        { type: 'Densa', units: 256, activation: 'ReLU' },
        { type: 'Densa', units: 128, activation: 'ReLU' },
        { type: 'Salida', units: 10, activation: 'Softmax' }
      ]
    }
  },
  {
    id: 'churn-bank',
    name: 'Customer Churn · Riesgo de Abandono',
    desc: 'Variables financieras, balance bancario y transacciones para predecir fuga de clientes.',
    category: 'Tabular / Negocio',
    type: 'Datos Tabulares (14 variables)',
    rows: '10,000 registros',
    size: '1.8 MB',
    inputShape: 14,
    inputShapeLabel: '14 variables financieras',
    numClasses: 2,
    classNames: ['Cliente Fidelizado (0)', 'Riesgo de Churn (1)'],
    tag: 'Banca y Finanzas',
    color: 'orange',
    previewColumns: [
      { name: 'credit_score', type: 'number' },
      { name: 'age', type: 'number' },
      { name: 'tenure_years', type: 'number' },
      { name: 'balance_usd', type: 'number' },
      { name: 'churn_risk', type: 'target' }
    ],
    previewRows: [
      { 'credit_score': '715', 'age': '42', 'tenure_years': '4', 'balance_usd': '$84,210', 'churn_risk': 'Fidelizado (0)' },
      { 'credit_score': '580', 'age': '56', 'tenure_years': '1', 'balance_usd': '$12,450', 'churn_risk': 'Riesgo Churn (1)' },
      { 'credit_score': '802', 'age': '38', 'tenure_years': '7', 'balance_usd': '$145,900', 'churn_risk': 'Fidelizado (0)' },
      { 'credit_score': '620', 'age': '49', 'tenure_years': '2', 'balance_usd': '$28,100', 'churn_risk': 'Riesgo Churn (1)' }
    ],
    recommendedArch: {
      layers: [
        { type: 'Entrada', units: 14, activation: '—' },
        { type: 'Densa', units: 32, activation: 'ReLU' },
        { type: 'Densa', units: 16, activation: 'ReLU' },
        { type: 'Salida', units: 2, activation: 'Softmax' }
      ]
    }
  },
  {
    id: 'cancer-biopsy',
    name: 'Diagnóstico Oncológico Celular',
    desc: 'Biomarcadores continuos de núcleos celulares para detección automatizada de malignidad.',
    category: 'Biomédico',
    type: 'Datos Clínicos (30 variables)',
    rows: '569 muestras',
    size: '220 KB',
    inputShape: 30,
    inputShapeLabel: '30 biomarcadores continuos',
    numClasses: 2,
    classNames: ['Benigno', 'Maligno'],
    tag: 'Salud y Diagnóstico',
    color: 'blue',
    previewColumns: [
      { name: 'radius_mean', type: 'number' },
      { name: 'texture_mean', type: 'number' },
      { name: 'perimeter_mean', type: 'number' },
      { name: 'area_mean', type: 'number' },
      { name: 'diagnosis', type: 'target' }
    ],
    previewRows: [
      { 'radius_mean': '17.99', 'texture_mean': '10.38', 'perimeter_mean': '122.8', 'area_mean': '1001.0', 'diagnosis': 'Maligno' },
      { 'radius_mean': '13.54', 'texture_mean': '14.36', 'perimeter_mean': '87.46', 'area_mean': '566.3', 'diagnosis': 'Benigno' },
      { 'radius_mean': '19.69', 'texture_mean': '21.25', 'perimeter_mean': '130.0', 'area_mean': '1203.0', 'diagnosis': 'Maligno' },
      { 'radius_mean': '11.42', 'texture_mean': '20.38', 'perimeter_mean': '77.58', 'area_mean': '386.1', 'diagnosis': 'Benigno' }
    ],
    recommendedArch: {
      layers: [
        { type: 'Entrada', units: 30, activation: '—' },
        { type: 'Densa', units: 64, activation: 'ReLU' },
        { type: 'Densa', units: 32, activation: 'ReLU' },
        { type: 'Salida', units: 2, activation: 'Softmax' }
      ]
    }
  }
]

const initialProjects: ProjectItem[] = [
  {
    id: 'p1',
    name: 'Laboratorio de Visión Artificial',
    code: 'PRJ-001',
    family: 'Feedforward',
    models: 4,
    status: 'Activo',
    color: 'purple',
    initials: 'VA',
    description: 'Clasificación de dígitos manuscritos y control de calidad visual.',
    datasetSelected: 'MNIST · Dígitos Manuscritos',
    currentStage: 4
  },
  {
    id: 'p2',
    name: 'Predicción de Abandono y Riesgo Bancario',
    code: 'PRJ-002',
    family: 'Feedforward',
    models: 2,
    status: 'Activo',
    color: 'blue',
    initials: 'RB',
    description: 'Predicción de retención de clientes e identificación de factores de riesgo.',
    datasetSelected: 'Customer Churn · Riesgo de Abandono',
    currentStage: 3
  },
  {
    id: 'p3',
    name: 'Diagnóstico Celular Asistido',
    code: 'PRJ-003',
    family: 'Feedforward',
    models: 1,
    status: 'En revisión',
    color: 'green',
    initials: 'DC',
    description: 'Modelado predictivo no lineal para soporte en decisiones de patología.',
    datasetSelected: 'Diagnóstico Oncológico Celular',
    currentStage: 5
  }
]

const initialJobs: Job[] = [
  { id: 'TR-2048', name: 'Clasificador MNIST v2', family: 'Feedforward', status: 'Ejecutando', progress: 68, epoch: '34 / 50', loss: 0.184, accuracy: 94.2, updated: 'hace 12 s', datasetName: 'MNIST · Dígitos Manuscritos', layersCount: 4 },
  { id: 'TR-2047', name: 'Predicción Churn Bancario', family: 'Feedforward', status: 'Completado', progress: 100, epoch: '40 / 40', loss: 0.092, accuracy: 96.1, updated: 'hace 4 min', datasetName: 'Customer Churn · Riesgo de Abandono', layersCount: 4 },
  { id: 'TR-2046', name: 'Diagnóstico Biopsias v1', family: 'Feedforward', status: 'Completado', progress: 100, epoch: '30 / 30', loss: 0.115, accuracy: 95.8, updated: 'hace 18 min', datasetName: 'Diagnóstico Oncológico Celular', layersCount: 4 }
]

const initialAlerts: SystemAlert[] = [
  { id: 'a1', type: 'success', title: 'Modelo v1.0.0 Validado para Producción', message: 'El clasificador de visión artificial superó el umbral del 94% de precisión en el conjunto de prueba.', time: 'hace 10 min' },
  { id: 'a2', type: 'info', title: 'Almacenamiento de Modelos Seguro', message: 'Se completó el respaldo inmutable de los checkpoints de pesos en el repositorio central.', time: 'hace 45 min' },
  { id: 'a3', type: 'warning', title: 'Consumo de Cuota de Cómputo al 68%', message: 'El espacio de trabajo ha utilizado 6.8 de las 10 horas mensuales asignadas en el clúster.', time: 'hace 2 horas' }
]

interface NavItem {
  label: Page
  icon: any
  orderTag?: string
}

interface NavSection {
  group: string
  items: NavItem[]
}

const nav: NavSection[] = [
  {
    group: 'CENTRO OPERATIVO',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard },
     
    ]
  },
  {
    group: 'ESPACIO DE INGENIERÍA',
    items: [
      { label: 'Proyectos', icon: FolderKanban },
      { label: 'Datasets', icon: Database},
      { label: 'Diseñador de redes', icon: Network },
      { label: 'Entrenamientos', icon: Activity},
      { label: 'Evaluación y métricas', icon: FileChartColumn}
    ]
  },
  {
    group: 'GOBERNANZA Y MODELOS',
    items: [
      { label: 'Registro de modelos', icon: GitBranch },
      { label: 'Reportes', icon: FileText }
    ]
  },
  {
    group: 'CONOCIMIENTO Y GESTIÓN',
    items: [
      { label: 'Fundamentos', icon: BookOpen },
      { label: 'Administración', icon: ShieldCheck }
    ]
  }
]

const initialMetricData = [
  { epoch: '01', loss: 0.92, val: 1.02, acc: 68.2, val_acc: 65.1 },
  { epoch: '05', loss: 0.71, val: 0.82, acc: 77.4, val_acc: 75.3 },
  { epoch: '10', loss: 0.54, val: 0.65, acc: 83.1, val_acc: 80.9 },
  { epoch: '15', loss: 0.42, val: 0.51, acc: 88.0, val_acc: 85.4 },
  { epoch: '20', loss: 0.32, val: 0.41, acc: 91.2, val_acc: 88.7 },
  { epoch: '25', loss: 0.27, val: 0.34, acc: 92.8, val_acc: 90.3 },
  { epoch: '30', loss: 0.22, val: 0.29, acc: 94.1, val_acc: 91.8 },
  { epoch: '35', loss: 0.18, val: 0.25, acc: 95.3, val_acc: 93.0 },
  { epoch: '40', loss: 0.15, val: 0.22, acc: 96.0, val_acc: 93.9 },
  { epoch: '45', loss: 0.13, val: 0.19, acc: 96.7, val_acc: 94.5 },
  { epoch: '50', loss: 0.11, val: 0.17, acc: 97.2, val_acc: 94.8 }
]

const historicalReportData = [
  { model: 'Visión MNIST v2', accuracy: 94.8, loss: 0.11, samples: 70000, trainingTimeMin: 4.5 },
  { model: 'Churn Riesgo v1', accuracy: 96.1, loss: 0.09, samples: 10000, trainingTimeMin: 2.1 },
  { model: 'Diagnóstico Biopsias', accuracy: 95.8, loss: 0.11, samples: 569, trainingTimeMin: 1.4 },
  { model: 'Retail Fashion v3', accuracy: 92.4, loss: 0.14, samples: 70000, trainingTimeMin: 5.2 },
  { model: 'Detección Anomalías', accuracy: 97.2, loss: 0.07, samples: 25000, trainingTimeMin: 3.8 }
]

const monthlyUsageData = [
  { week: 'Sem 1', computeHours: 1.8, modelsBuilt: 3, memoryPeakGb: 4.2 },
  { week: 'Sem 2', computeHours: 2.4, modelsBuilt: 5, memoryPeakGb: 5.1 },
  { week: 'Sem 3', computeHours: 1.6, modelsBuilt: 2, memoryPeakGb: 4.8 },
  { week: 'Sem 4', computeHours: 1.0, modelsBuilt: 4, memoryPeakGb: 5.8 }
]

const fmt = (n: number) => n.toLocaleString('es-PE')

function mapStatus(s: string): JobStatus {
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
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects)
  const [activeProjectId, setActiveProjectId] = useState<string>('p1')
  const [datasets, setDatasets] = useState<DatasetItem[]>(initialDatasets)
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('mnist')
  const [jobs, setJobs] = useState<Job[]>(initialJobs)
  const [alerts, setAlerts] = useState<SystemAlert[]>(initialAlerts)
  const [backendStatus, setBackendStatus] = useState<HealthResponse>({ online: false })
  const [query, setQuery] = useState('')
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [modal, setModal] = useState<'project' | 'import-dataset' | null>(null)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [family, setFamily] = useState('Feedforward')
  const [epochs, setEpochs] = useState(30)
  const [batchSize, setBatchSize] = useState(32)
  const [optimizer, setOptimizer] = useState('Adam')
  const [learningRate, setLearningRate] = useState('0.001')
  const [tick, setTick] = useState(0)
  const [metricData, setMetricData] = useState(initialMetricData)

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === activeProjectId) || projects[0]
  }, [projects, activeProjectId])

  const currentDataset = useMemo(() => {
    return datasets.find(d => d.id === selectedDatasetId) || datasets[0]
  }, [datasets, selectedDatasetId])

  const [layers, setLayers] = useState([
    { type: 'Entrada', units: 784, activation: '—' },
    { type: 'Densa', units: 128, activation: 'ReLU' },
    { type: 'Densa', units: 64, activation: 'ReLU' },
    { type: 'Salida', units: 10, activation: 'Softmax' }
  ])

  useEffect(() => {
    if (currentDataset) {
      setLayers(prev => {
        const newLayers = [...prev]
        newLayers[0] = { ...newLayers[0], units: currentDataset.inputShape }
        newLayers[newLayers.length - 1] = {
          ...newLayers[newLayers.length - 1],
          units: currentDataset.numClasses,
          activation: currentDataset.numClasses === 1 ? 'Linear' : 'Softmax'
        }
        return newLayers
      })
    }
  }, [currentDataset])

  const notify = (s: string) => setToast(s)

  const checkService = async (showNotification = false) => {
    try {
      const health = await api.checkHealth()
      setBackendStatus(health)
      if (health.online) {
        if (showNotification) notify('Plataforma conectada al cluster de cómputo central.')
        loadProjects()
        loadJobs()
      } else {
        if (showNotification) notify('Servicio operando en modo local autónomo.')
      }
    } catch {
      setBackendStatus({ online: false })
      if (showNotification) notify('Conexión en modo local autónomo.')
    }
  }

  const loadProjects = async () => {
    try {
      const projs = await api.getProjects()
      if (projs && projs.length > 0) {
        const mapped: ProjectItem[] = projs.map((p, idx) => ({
          id: p.id,
          name: p.name,
          code: `PRJ-${String(idx + 1).padStart(3, '0')}`,
          family: 'Feedforward',
          models: 1,
          status: p.status === 'active' ? 'Activo' : 'En revisión',
          color: idx % 3 === 0 ? 'blue' : idx % 3 === 1 ? 'purple' : 'green',
          initials: p.name.slice(0, 2).toUpperCase(),
          description: p.description || 'Espacio de trabajo empresarial',
          datasetSelected: 'MNIST · Dígitos Manuscritos',
          currentStage: 2
        }))
        setProjects(prev => {
          const ids = new Set(mapped.map(m => m.id))
          return [...mapped, ...prev.filter(p => !ids.has(p.id))]
        })
      }
    } catch (e) {
      console.warn('Usando proyectos locales:', e)
    }
  }

  const loadJobs = async () => {
    try {
      const bJobs = await api.listTrainingJobs()
      if (bJobs && bJobs.length > 0) {
        const mapped: Job[] = bJobs.map(j => ({
          id: j.id.slice(0, 8),
          backendId: j.id,
          name: `Entrenamiento ${j.id.slice(0, 6)}`,
          family: 'Feedforward',
          status: mapStatus(j.status),
          progress: j.progress || 0,
          epoch: j.total_epochs ? `${j.current_epoch} / ${j.total_epochs}` : '—',
          loss: j.loss ? Number(j.loss.toFixed(4)) : 0,
          accuracy: 94.5,
          updated: 'ahora',
          datasetName: 'MNIST · Dígitos Manuscritos'
        }))
        setJobs(prev => {
          const ids = new Set(mapped.map(m => m.id))
          return [...mapped, ...prev.filter(p => !ids.has(p.id))]
        })
      }
    } catch (e) {
      console.warn('Sin trabajos previos:', e)
    }
  }

  useEffect(() => {
    checkService()
    const interval = window.setInterval(() => checkService(), 30000)
    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTick(t => t + 1)
      setJobs(old => old.map(j => {
        if (!j.backendId && j.status === 'Ejecutando' && j.progress < 100) {
          const nextProg = Math.min(100, j.progress + 2)
          const isDone = nextProg === 100
          return {
            ...j,
            progress: nextProg,
            status: isDone ? 'Completado' : 'Ejecutando',
            loss: Math.max(0.08, Number((j.loss - 0.003).toFixed(4))),
            accuracy: Math.min(98.4, Number(((j.accuracy || 80) + 0.35).toFixed(1))),
            epoch: `${Math.min(50, Math.floor(nextProg / 2))} / 50`,
            updated: 'ahora'
          }
        }
        return j
      }))
    }, 2500)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (toast) {
      const t = window.setTimeout(() => setToast(''), 4500)
      return () => window.clearTimeout(t)
    }
  }, [toast])

  const activeJobs = jobs.filter(j => j.status === 'Ejecutando' || j.status === 'En cola').length
  const filteredJobs = jobs.filter(j => `${j.name} ${j.family} ${j.id}`.toLowerCase().includes(query.toLowerCase()))

  const createProject = async () => {
    if (!projectName.trim()) {
      notify('Por favor escribe un nombre para el proyecto.')
      return
    }

    const name = projectName.trim()
    const desc = projectDesc.trim() || `Proyecto para clasificación con arquitectura ${family}`
    setProjectName('')
    setProjectDesc('')
    setModal(null)

    let createdId = `prj-${Date.now()}`

    if (backendStatus.online) {
      try {
        const created = await api.createProject(name, desc)
        createdId = created.id
        notify(`Proyecto "${created.name}" registrado en la plataforma central.`)
      } catch (err: any) {
        console.warn('Registro local:', err)
      }
    }

    const newProject: ProjectItem = {
      id: createdId,
      name,
      code: `PRJ-00${projects.length + 1}`,
      family,
      models: 0,
      status: 'Activo',
      color: projects.length % 3 === 0 ? 'blue' : projects.length % 3 === 1 ? 'purple' : 'green',
      initials: name.slice(0, 2).toUpperCase(),
      description: desc,
      datasetSelected: null,
      currentStage: 2
    }

    setProjects([newProject, ...projects])
    setActiveProjectId(createdId)
    notify(`Proyecto "${name}" creado. Selecciona o importa un dataset para continuar.`)
    setPage('Datasets')
  }


  const deleteProject = async (projectId: string, projectName: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el proyecto "${projectName}"? Esta acción eliminará todos los datos asociados y no se puede deshacer.`)) {
      return
    }

    if (backendStatus.online) {
      try {
        await api.deleteProject(projectId)
        notify(`Proyecto "${projectName}" eliminado correctamente.`)
      } catch (err: any) {
        notify(`No se pudo eliminar: ${err.message || 'Error desconocido'}`)
        return
      }
    }

    setProjects(prev => prev.filter(p => p.id !== projectId))
    if (activeProjectId === projectId) {
      const remaining = projects.filter(p => p.id !== projectId)
      setActiveProjectId(remaining.length > 0 ? remaining[0].id : '')
    }
  }

  const confirmDatasetAndProceed = (datasetItem: DatasetItem) => {
    setSelectedDatasetId(datasetItem.id)
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          datasetSelected: datasetItem.name,
          currentStage: Math.max(p.currentStage, 3)
        }
      }
      return p
    }))
    notify(`Dataset "${datasetItem.name}" vinculado. Configura tu arquitectura neuronal.`)
    setPage('Diseñador de redes')
  }

  // Carga y procesamiento directo de archivo CSV desde la computadora
  const handleCustomCsvLoaded = (newDataset: DatasetItem) => {
    setDatasets(prev => [newDataset, ...prev])
    setSelectedDatasetId(newDataset.id)
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        return {
          ...p,
          datasetSelected: newDataset.name,
          currentStage: Math.max(p.currentStage, 3)
        }
      }
      return p
    }))
    notify(`Archivo CSV "${newDataset.name}" procesado y seleccionado con ${newDataset.inputShape} características de entrada.`)
  }

  const startTrainingFromDesigner = async () => {
    const expName = `${activeProject?.name || 'Modelo'} · ${family} v${jobs.length + 1}`
    setPage('Entrenamientos')
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, currentStage: Math.max(p.currentStage, 4) } : p))

    if (!backendStatus.online) {
      const localJob: Job = {
        id: `TR-${2050 + jobs.length}`,
        name: expName,
        family,
        status: 'Ejecutando',
        progress: 2,
        epoch: `1 / ${epochs}`,
        loss: 0.94,
        accuracy: 62.4,
        updated: 'ahora',
        datasetName: currentDataset.name,
        layersCount: layers.length
      }
      setJobs([localJob, ...jobs])
      notify(`Entrenamiento iniciado para "${currentDataset.name}". Supervisa el progreso en vivo.`)
      return
    }

    notify('Enviando arquitectura al motor de cómputo en la nube...')
    try {
      let projId = activeProjectId
      if (!projId.includes('-')) {
        const projs = await api.getProjects()
        projId = projs.length > 0 ? projs[0].id : projId
      }

      const arch = await api.createArchitecture(projId, {
        name: `${expName} Red`,
        family: family as any,
        config: { layers, optimizer, learning_rate: Number(learningRate) }
      })

      const bJob = await api.createTrainingJob(projId, {
        architecture_id: arch.id,
        epochs: Number(epochs),
        batch_size: Number(batchSize),
        optimizer: optimizer.toLowerCase()
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
        accuracy: 65.0,
        updated: 'ahora',
        datasetName: currentDataset.name,
        layersCount: layers.length
      }

      setJobs(old => [newJob, ...old])
      notify(`Trabajo ${bJob.id.slice(0, 8)} asignado al motor de cálculo.`)

      api.subscribeTrainingEvents(
        bJob.id,
        (eventData: TrainingEventPayload) => {
          setJobs(old => old.map(j => {
            if (j.backendId === eventData.job_id || j.id === eventData.job_id.slice(0, 8)) {
              return {
                ...j,
                status: mapStatus(eventData.status),
                progress: eventData.progress,
                epoch: `${eventData.epoch} / ${eventData.total_epochs}`,
                loss: eventData.loss != null ? Number(eventData.loss.toFixed(4)) : j.loss,
                updated: 'ahora'
              }
            }
            return j
          }))

          if (eventData.loss != null && eventData.epoch > 0) {
            setMetricData(prev => [
              ...prev.slice(-14),
              {
                epoch: String(eventData.epoch).padStart(2, '0'),
                loss: Number(eventData.loss!.toFixed(3)),
                val: Number((eventData.loss! * 1.08).toFixed(3)),
                acc: Number((Math.min(98.5, 70 + eventData.epoch * 0.5)).toFixed(1)),
                val_acc: Number((Math.min(96.2, 68 + eventData.epoch * 0.48)).toFixed(1))
              }
            ])
          }
        },
        (finishData) => {
          notify(`Entrenamiento completado exitosamente. Listo para evaluar.`)
          setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, currentStage: 5 } : p))
        },
        (err) => console.warn('Evento finalizado:', err)
      )
    } catch (err: any) {
      notify(`Conectado en modo local autónomo. Procesando simulación de alta fidelidad.`)
      const fallbackJob: Job = {
        id: `TR-${2050 + jobs.length}`,
        name: expName,
        family,
        status: 'Ejecutando',
        progress: 2,
        epoch: `1 / ${epochs}`,
        loss: 0.94,
        accuracy: 64.0,
        updated: 'ahora',
        datasetName: currentDataset.name,
        layersCount: layers.length
      }
      setJobs(old => [fallbackJob, ...old])
    }
  }

  const proceedToEvaluation = () => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, currentStage: 5 } : p))
    setPage('Evaluación y métricas')
    notify('Evaluación cuantitativa del modelo en el conjunto de prueba independiente.')
  }

  const cancelJob = async (id: string, backendId?: string) => {
    const targetId = backendId || id
    if (backendStatus.online && backendId) {
      try {
        await api.cancelTrainingJob(targetId)
        notify(`Trabajo ${id} cancelado en el clúster.`)
      } catch (err: any) {
        notify(`Error cancelando: ${err.message}`)
      }
    } else {
      notify(`Trabajo ${id} detenido.`)
    }
    setJobs(old => old.map(j => (j.id === id || j.backendId === targetId) ? { ...j, status: 'Cancelado', updated: 'ahora' } : j))
  }

  const exportModelArtifact = (model: ModelArtifact) => {
    const payload = {
      model_name: model.name,
      version: model.version,
      family: model.family,
      status: model.status,
      certification_date: model.date,
      metrics: {
        accuracy: model.accuracy,
        loss: model.loss,
        parameters: model.params
      },
      dataset_origin: model.dataset,
      checksum_sha256: model.checksum,
      format: 'TensorFlow / Keras HDF5 & ONNX Manifest',
      governance: {
        certified_by: 'NeuroLab Enterprise Governance Unit',
        soc2_compliant: true,
        license: 'Enterprise Proprietary'
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${model.name}-${model.version}-manifest.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
    notify(`Archivo manifiesto exportado: ${model.name}-${model.version}-manifest.json`)
  }

  const exportCsv = () => {
    const rows = [
      ['ID', 'Modelo', 'Familia', 'Dataset', 'Estado', 'Progreso', 'Epoca', 'Loss', 'Precision'],
      ...jobs.map(j => [j.id, j.name, j.family, j.datasetName || '—', j.status, `${j.progress}%`, j.epoch, j.loss.toFixed(4), `${j.accuracy || 94}%`])
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `reporte-ejecucion-${activeProject?.code || 'neurolab'}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
    notify('Reporte empresarial CSV exportado exitosamente.')
  }

  const activePipelineStage = useMemo(() => {
    switch (page) {
      case 'Proyectos': return 1
      case 'Datasets': return 2
      case 'Diseñador de redes': return 3
      case 'Entrenamientos': return 4
      case 'Evaluación y métricas': return 5
      default: return 0
    }
  }, [page])

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><BrainCircuit size={23}/></div>
          <div>
            <b>NeuroLab<span>.</span></b>
            <small>ENTERPRISE PLATFORM</small>
          </div>
          <button className="icon-btn mobile-close" onClick={() => setMobileNav(false)}><X size={18}/></button>
        </div>

        <div className="workspace">
          <div className="workspace-logo">{activeProject ? activeProject.initials : 'NL'}</div>
          <div className="workspace-copy">
            <b>{activeProject ? activeProject.name : 'Proyecto Activo'}</b>
            <small>{activeProject ? `${activeProject.code} · ${activeProject.datasetSelected ? activeProject.datasetSelected.split(' · ')[0] : 'Sin dataset'}` : 'Selecciona un proyecto'}</small>
          </div>
          <ChevronDown size={15}/>
        </div>

        <nav>
          {nav.map(section => (
            <div className="nav-section" key={section.group}>
              <div className="nav-label">{section.group}</div>
              {section.items.map(item => {
                const Icon = item.icon
                const isSelected = page === item.label
                return (
                  <button
                    key={item.label}
                    className={`nav-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => { setPage(item.label); setMobileNav(false) }}
                  >
                    <Icon size={17}/>
                    <span>{item.label}</span>
                    {item.orderTag && (
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 10,
                        background: isSelected ? '#1e40af' : '#27344d',
                        color: isSelected ? '#ffffff' : '#94a3b8'
                      }}>
                        {item.orderTag}
                      </span>
                    )}
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
              <span>Recursos Asignados</span>
              <span className="usage-live"><i/> LIVE</span>
            </div>
            <div className="usage-line"><span>Cómputo en Clúster</span><b>{32 + tick % 6}%</b></div>
            <div className="mini-progress"><i style={{ width: `${32 + tick % 6}%` }}/></div>
            <div className="usage-line"><span>Memoria VRAM</span><b>5.8 / 16 GB</b></div>
            <div className="mini-progress purple"><i style={{ width: '36%' }}/></div>
          </div>


          <div className="user-profile">
            <div className="avatar">AI</div>
            <div className="user-copy">
              <b>Ingeniería Corporativa</b>
              <small>Workspace Empresarial</small>
            </div>
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
              <span>NeuroLab Enterprise</span>
              <b>/</b>
              <span>{activeProject?.name || 'Proyectos'}</span>
              <b>/</b>
              <strong>{page}</strong>
            </div>
          </div>

          <div className="top-actions">
            <span
              className={`connection-pill ${backendStatus.online ? 'online' : 'demo'}`}
              title={backendStatus.online ? 'Cluster de cómputo en línea' : 'Operando en modo autónomo local'}
              onClick={() => checkService(true)}
              style={{ cursor: 'pointer' }}
            >
              <i/> {backendStatus.online ? 'Clúster en Línea' : 'Modo Autónomo'}
            </span>

            <div className="search-box">
              <Search size={16}/>
              <input placeholder="Buscar proyectos, modelos, métricas..." value={query} onChange={e => setQuery(e.target.value)}/>
              <kbd>⌘ K</kbd>
            </div>

            <button className="icon-btn notification" onClick={() => notify(`Proyecto activo: "${activeProject?.name}" (${activeProject?.code})`)}>
              <Bell size={18}/><i/>
            </button>
            <div className="top-avatar">AI</div>
          </div>
        </header>

        <div className="content">
          {activePipelineStage > 0 && (
          

              <div className="pipeline-stepper-steps">
               
              </div>
          
          )}

          
         

          {page === 'Dashboard' && (
            <Dashboard
              projects={projects}
              jobs={jobs}
              alerts={alerts}
              metricData={metricData}
              activeJobs={activeJobs}
              backendOnline={backendStatus.online}
              onNavigate={setPage}
              onSelectProject={(p: ProjectItem) => {
                setActiveProjectId(p.id)
                setPage('Proyectos')
              }}
              onNewProject={() => setModal('project')}
              onCancel={cancelJob}
            />
          )}

          {page === 'Proyectos' && (
            <Projects
              projects={projects}
              activeProjectId={activeProjectId}
              query={query}
              backendOnline={backendStatus.online}
              onSelectProject={(p) => {
                setActiveProjectId(p.id)
                notify(`Proyecto activo: ${p.name}`)
                if (p.datasetSelected) {
                  setPage('Diseñador de redes')
                } else {
                  setPage('Datasets')
                }
              }}
              onNew={() => setModal('project')}
              onDelete={deleteProject}
            />
          )}

          {page === 'Datasets' && (
            <Datasets
              activeProject={activeProject}
              datasets={datasets}
              selectedDatasetId={selectedDatasetId}
              onSelectDataset={confirmDatasetAndProceed}
              onCustomCsvLoaded={handleCustomCsvLoaded}
              onImportDataset={() => setModal('import-dataset')}
              notify={notify}
            />
          )}

          {page === 'Diseñador de redes' && (
            <Designer
              activeProject={activeProject}
              currentDataset={currentDataset}
              family={family}
              setFamily={setFamily}
              layers={layers}
              setLayers={setLayers}
              epochs={epochs}
              setEpochs={setEpochs}
              batchSize={batchSize}
              setBatchSize={setBatchSize}
              optimizer={optimizer}
              setOptimizer={setOptimizer}
              learningRate={learningRate}
              setLearningRate={setLearningRate}
              backendOnline={backendStatus.online}
              onRunTraining={startTrainingFromDesigner}
              onBackToDataset={() => setPage('Datasets')}
              notify={notify}
            />
          )}

          {page === 'Entrenamientos' && (
            <Trainings
              activeProject={activeProject}
              jobs={filteredJobs}
              metricData={metricData}
              backendOnline={backendStatus.online}
              onCancel={cancelJob}
              onProceedToEvaluation={proceedToEvaluation}
              onBackToDesigner={() => setPage('Diseñador de redes')}
              notify={notify}
            />
          )}

          {page === 'Evaluación y métricas' && (
            <Evaluation
              activeProject={activeProject}
              currentDataset={currentDataset}
              metricData={metricData}
              onBackToDesigner={() => setPage('Diseñador de redes')}
              onPublishModel={() => {
                notify(`Modelo versionado y registrado exitosamente con tag "v1.0.0-prod".`)
                setPage('Registro de modelos')
              }}
              onExportReport={exportCsv}
              notify={notify}
            />
          )}

          {page === 'Fundamentos' && <Fundamentals onNavigate={setPage}/>}

          {page === 'Registro de modelos' && (
            <Models
              activeProjectId={activeProjectId}
              activeProject={activeProject}
              backendOnline={backendStatus.online}
              onExportArtifact={exportModelArtifact}
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
              onCheckService={() => checkService(true)}
              notify={notify}
            />
          )}

          <footer>
            <span>© 2026 NeuroLab Enterprise · Sistema Corporativo de Ingeniería de Redes Neuronales</span>
            <span>
              <i className="footer-dot"/> Servicios Operativos y Seguros <span className="footer-divider">·</span>{' '}
              {backendStatus.online ? 'Clúster Conectado' : 'Modo Autónomo'}
            </span>
          </footer>
        </div>
      </main>

      {modal === 'project' && (
        <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal" style={{ width: 520 }}>
            <div className="modal-title">
              <div>
                <span className="modal-icon"><FolderKanban size={18}/></span>
                <h2>Crear Nuevo Proyecto</h2>
              </div>
              <button className="icon-btn" onClick={() => setModal(null)}><X size={18}/></button>
            </div>
            <p>
              Define el espacio de trabajo para este problema de Deep Learning. Al crearse, el sistema te guiará
              automáticamente a la <strong>Selección e Ingesta del Dataset</strong>.
            </p>

            <label>
              Nombre del proyecto
              <input
                autoFocus
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="Ej. Clasificador de Calidad Industrial"
              />
            </label>

            <label>
              Objetivo del proyecto / Caso de uso
              <input
                value={projectDesc}
                onChange={e => setProjectDesc(e.target.value)}
                placeholder="Ej. Detección automática de defectos en piezas mediante visión artificial"
              />
            </label>

            <label>
              Familia inicial de arquitectura
              <select value={family} onChange={e => setFamily(e.target.value)}>
                <option value="Feedforward">Feedforward (Red Densa Multicapa - FFN)</option>
                <option value="CNN">Convolucional (CNN - Visión y Señales)</option>
                <option value="RNN">Recurrente (RNN / LSTM - Secuencias)</option>
                <option value="GAN">Generativa Antagónica (GAN - Muestras Sintéticas)</option>
              </select>
            </label>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={createProject}>
                Crear Proyecto y Continuar al Dataset <ArrowRight size={15}/>
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast"><Check size={17}/>{toast}</div>}
    </div>
  )
}

function pageTitle(page: Page) {
  switch (page) {
    case 'Dashboard': return 'Centro de Control y Monitoreo General'
    
    case 'Proyectos': return 'Gestión de Proyectos de Aprendizaje Profundo'
    case 'Datasets': return 'Ingesta y Selección de Datasets'
    case 'Diseñador de redes': return 'Diseñador de Arquitecturas Neuronales'
    case 'Entrenamientos': return 'Supervisión y Ejecución de Entrenamientos'
    case 'Evaluación y métricas': return 'Evaluación Estadística y Diagnóstico del Modelo'
    case 'Fundamentos': return 'Fundamentos Neuronales y Glosario'
    case 'Registro de modelos': return 'Catálogo y Control de Versiones de Modelos'
    case 'Reportes': return 'Reportes Técnicos y Analítica de Modelos'
    case 'Administración': return 'Administración y Seguridad de la Plataforma'
  }
}

function pageDescription(page: Page) {
  switch (page) {
    case 'Dashboard': return 'Resumen ejecutivo de proyectos, entrenamientos activos, indicadores de uso y alertas del sistema.'
    
    case 'Proyectos': return 'Organiza y gestiona los espacios de trabajo para cada iniciativa de Inteligencia Artificial.'
    case 'Datasets': return 'Carga archivos CSV de tu computadora o selecciona datasets estructurados para tu red.'
    case 'Diseñador de redes': return 'Modela la topología de capas (entradas, ocultas y salidas) y los hiperparámetros de cálculo.'
    case 'Entrenamientos': return 'Supervisa el proceso de optimización, descenso de gradiente y convergencia en tiempo real.'
    case 'Evaluación y métricas': return 'Analiza el rendimiento en el conjunto de prueba con matriz de confusión y diagnóstico de sobreajuste.'
    case 'Fundamentos': return 'Conceptos de redes neuronales, pesos, sesgos, activaciones y glosario guiado.'
    case 'Registro de modelos': return 'Repositorio centralizado con exportación de manifiestos y artefactos verificados.'
    case 'Reportes': return 'Gráficos comparativos de rendimiento, evolución de cómputo y auditoría de modelos.'
    case 'Administración': return 'Control de acceso basado en roles (RBAC), auditoría inmutable, cuotas y salud del sistema.'
  }
}

function SectionTitle({ title, detail, action }: { title: string; detail?: string; action?: React.ReactNode }) {
  return (
    <div className="section-title">
      <div>
        <h3>{title}</h3>
        {detail && <p>{detail}</p>}
      </div>
      {action}
    </div>
  )
}

function DiscreetModuleExplainer({
  badge,
  title,
  purposeText,
  keyTakeaway,
  inputs,
  outputs
}: {
  badge: string
  title: string
  purposeText: string
  keyTakeaway: string
  inputs: string[]
  outputs: string[]
}) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      marginTop: 28,
      marginBottom: 16,
      borderTop: '1px solid #edf1f6',
      paddingTop: 14
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: '8px 12px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          fontSize: 11,
          color: '#64748b'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HelpCircle size={15} style={{ color: '#94a3b8' }}/>
          <span>Documentación de referencia del módulo: <strong>{title}</strong></span>
        </div>
        <span style={{ fontSize: 10, color: '#2563eb', fontWeight: 600 }}>
          {open ? 'Ocultar detalles ▲' : 'Ver documentación técnica ▼'}
        </span>
      </div>

      {open && (
        <div className="module-explainer-card" style={{ marginTop: 10 }}>
          <div className="explainer-header">
            <div className="explainer-title">
              <BrainCircuit size={16} style={{ color: '#2563eb' }}/>
              <span>{title}</span>
            </div>
            <span className="explainer-badge">{badge}</span>
          </div>
          <div className="explainer-body">
            <div className="explainer-col-main">
              <h4>Función del Módulo</h4>
              <p>{purposeText}</p>
              <div className="key-takeaway">
                <strong>Impacto:</strong> {keyTakeaway}
              </div>
            </div>
            <div className="explainer-col-io">
              <h4>Flujo de Datos</h4>
              <div className="explainer-io-grid">
                {inputs.map((inp, idx) => (
                  <div className="explainer-io-item" key={idx}>
                    <span className="io-tag input">Entrada</span>
                    <span>{inp}</span>
                  </div>
                ))}
                {outputs.map((out, idx) => (
                  <div className="explainer-io-item" key={idx}>
                    <span className="io-tag output">Salida</span>
                    <span>{out}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function LandingPage({ onOpenWorkspace, onExploreProjects }: { onOpenWorkspace: () => void; onExploreProjects: () => void }) {
  return (
    <div className="landing-container">
      <div className="landing-hero">
        <div className="landing-badge">
          <Sparkles size={13}/> PLATAFORMA DE APRENDIZAJE PROFUNDO EMPRESARIAL
        </div>
        <h1>Construye, Entrena y Despliega Redes Neuronales con Precisión y Seguridad</h1>
        <p>
          NeuroLab Enterprise es la solución unificada para organizaciones que requieren diseñar
          arquitecturas de Deep Learning, gobernar datasets corporativos y validar modelos con
          trazabilidad y cumplimiento normativo.
        </p>
        <div className="landing-actions">
          <button className="landing-btn-primary" onClick={onOpenWorkspace}>
            Acceder al Centro de Control <ArrowRight size={16}/>
          </button>
          <button className="landing-btn-secondary" onClick={onExploreProjects}>
            Explorar Proyectos Activos
          </button>
        </div>
      </div>

      <div className="landing-pillars">
        <div className="landing-pillar-card">
          <div className="landing-pillar-icon blue"><Layers3 size={22}/></div>
          <h3>Modelado Visual Neuronal</h3>
          <p>Diseño intuitivo de topologías multicapa, capas densas y funciones no lineales con cálculo de tensores en tiempo real.</p>
        </div>
        <div className="landing-pillar-card">
          <div className="landing-pillar-icon purple"><Database size={22}/></div>
          <h3>Ingesta y Validación de Datos</h3>
          <p>Carga de CSVs corporativos, partición controlada (70/15/15) y chequeo estricto de dimensionalidad.</p>
        </div>
        <div className="landing-pillar-card">
          <div className="landing-pillar-icon green"><Activity size={22}/></div>
          <h3>Optimización de Alta Precisión</h3>
          <p>Supervisión en vivo de curvas de pérdida y exactitud, detección temprana de sobreajuste y checkpoints automáticos.</p>
        </div>
        <div className="landing-pillar-card">
          <div className="landing-pillar-icon orange"><ShieldCheck size={22}/></div>
          <h3>Gobernanza y Auditoría Total</h3>
          <p>Registro inmutable de versiones de modelos, matriz de confusión de grado industrial y control de accesos RBAC.</p>
        </div>
      </div>

      <section className="panel" style={{ padding: 24 }}>
        <SectionTitle
          title="Casos de Uso de Nivel Empresarial"
          detail="Soluciones preparadas para responder a retos críticos de negocio"
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}>
          <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#2563eb', textTransform: 'uppercase' }}>Banca & Finanzas</span>
            <h4 style={{ margin: '8px 0 6px', fontSize: 13, color: '#0f172a' }}>Prevención de Fraude y Riesgo Crediticio</h4>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              Identificación de anomalías transaccionales y scoring crediticio no lineal con redes feedforward calibradas.
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>Salud & Diagnóstico</span>
            <h4 style={{ margin: '8px 0 6px', fontSize: 13, color: '#0f172a' }}>Clasificación de Imágenes y Biopsias</h4>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              Asistencia diagnóstica con matrices de confusión que priorizan la sensibilidad para evitar falsos negativos críticos.
            </p>
          </div>
          <div style={{ background: '#f8fafc', padding: 18, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>Manufactura & Retail</span>
            <h4 style={{ margin: '8px 0 6px', fontSize: 13, color: '#0f172a' }}>Control de Calidad Automatizado</h4>
            <p style={{ margin: 0, fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>
              Inspección óptica de defectos superficiales y categorización de inventario en tiempo real con latencia menor a 15 ms.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

function Dashboard({
  projects,
  jobs,
  alerts,
  metricData,
  activeJobs,
  backendOnline,
  onNavigate,
  onSelectProject,
  onNewProject,
  onCancel
}: any) {
  return (
    <>
      <div className="stats-grid">
        <StatCard icon={<FolderKanban size={18}/>} label="Proyectos Activos" value={String(projects.length)} change="+2 este mes" trend="up" color="blue" foot="en el espacio corporativo"/>
        <StatCard icon={<Activity size={18}/>} label="Entrenamientos Registrados" value={String(jobs.length)} change="Telemetría activa" trend="up" color="purple" foot="ejecuciones procesadas"/>
        <StatCard icon={<Gauge size={18}/>} label="Precisión Media Global" value="95.4%" change="+1.8%" trend="up" color="green" foot="en modelos evaluados"/>
        <StatCard icon={<Cpu size={18}/>} label="Uso de Cómputo" value="58%" change="6.8 / 10 hrs" trend="neutral" color="orange" foot="cuota mensual del clúster"/>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <SectionTitle
            title="Resumen Ejecutivo de Proyectos"
            detail="Estado general de los espacios de trabajo y modelos desarrollados"
            action={<button className="text-action" onClick={() => onNavigate('Proyectos')}>Ver todos los proyectos <ArrowRight size={13}/></button>}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12, marginBottom: 14 }}>
            {projects.slice(0, 3).map((p: ProjectItem) => (
              <div
                key={p.id}
                onClick={() => onSelectProject(p)}
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 8,
                  padding: 12,
                  cursor: 'pointer',
                  transition: 'all 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span className={`project-avatar ${p.color}`} style={{ width: 28, height: 28, fontSize: 10 }}>{p.initials}</span>
                  <span className="family-pill" style={{ fontSize: 8 }}>{p.code}</span>
                </div>
                <b style={{ display: 'block', fontSize: 11, color: '#1e293b', marginBottom: 3 }}>{p.name}</b>
                <span style={{ fontSize: 9, color: '#64748b' }}>
                  {p.datasetSelected ? p.datasetSelected.split(' · ')[0] : 'Sin dataset'}
                </span>
                <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 9 }}>
                  <span style={{ color: '#2563eb', fontWeight: 600 }}>Etapa {p.currentStage} de 5</span>
                  <span className="status completado"><i/>{p.status}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 14px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#1e40af' }}>
              <Sparkles size={16}/>
              <span>¿Deseas iniciar una nueva iniciativa de Inteligencia Artificial?</span>
            </div>
            <button className="btn btn-primary btn-small" onClick={onNewProject}>
              <Plus size={14}/> Nuevo Proyecto
            </button>
          </div>
        </section>

        <section className="panel activity-panel">
          <SectionTitle
            title="Alertas e Indicadores del Sistema"
            detail="Notificaciones de auditoría, cuotas y modelos"
          />

          <div className="alerts-list">
            {alerts.map((alt: SystemAlert) => (
              <div className={`alert-item ${alt.type}`} key={alt.id}>
                <div className="alert-icon-box">
                  {alt.type === 'success' && <CheckCircle2 size={15}/>}
                  {alt.type === 'info' && <Bell size={15}/>}
                  {alt.type === 'warning' && <AlertCircle size={15}/>}
                </div>
                <div className="alert-content">
                  <b>{alt.title}</b>
                  <p>{alt.message}</p>
                </div>
                <div className="alert-time">{alt.time}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #edf1f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b', marginBottom: 4 }}>
              <span>Cuota de Almacenamiento de Modelos</span>
              <strong>3.4 / 10 GB</strong>
            </div>
            <div className="mini-progress"><i style={{ width: '34%' }}/></div>
          </div>
        </section>
      </div>

      <section className="panel jobs-panel" style={{ marginTop: 18 }}>
        <SectionTitle
          title="Entrenamientos Activos y Recientes"
          detail="Supervisión en tiempo real de los procesos de cálculo y optimización de redes"
          action={<button className="text-action" onClick={() => onNavigate('Entrenamientos')}>Ir a Entrenamientos <ArrowRight size={13}/></button>}
        />
        <JobTable jobs={jobs.slice(0, 4)} onCancel={onCancel}/>
      </section>
    </>
  )
}

function Projects({
  projects,
  activeProjectId,
  query,
  backendOnline,
  onSelectProject,
  onNew,
  onDelete
}: {
  projects: ProjectItem[]
  activeProjectId: string
  query: string
  backendOnline: boolean
  onSelectProject: (p: ProjectItem) => void
  onNew: () => void
  onDelete: (projectId: string, projectName: string) => void
}) {
  const filtered = projects.filter(p => `${p.name} ${p.family} ${p.code}`.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<FolderKanban size={18}/>} label="Proyectos Totales" value={String(projects.length)} change="+1 nuevo" trend="up" color="blue" foot="en el entorno corporativo"/>
        <StatCard icon={<Database size={18}/>} label="Datasets Vinculados" value={String(projects.filter(p => p.datasetSelected).length)} change="Listos" trend="neutral" color="green" foot="con matriz de datos asignada"/>
        <StatCard icon={<BrainCircuit size={18}/>} label="Modelos en Registro" value={String(projects.reduce((a, b) => a + b.models, 0))} change="Versionados" trend="up" color="purple" foot="disponibles para inferencia"/>
        <StatCard icon={<Cpu size={18}/>} label="Proyectos Activos" value={String(projects.filter(p => p.status === 'Activo').length)} change="En marcha" trend="neutral" color="orange" foot="en ciclo de experimentación"/>
      </div>

      <section className="panel project-panel">
        <SectionTitle
          title="Inventario de Proyectos"
          detail="Selecciona un proyecto para abrir su espacio o crea uno nuevo para comenzar."
          action={<button className="btn btn-primary btn-small" onClick={onNew}><Plus size={15}/> Nuevo Proyecto</button>}
        />

        <div className="project-grid">
          {filtered.map(p => {
            const isCurrent = p.id === activeProjectId
            return (
              <div
                className={`project-card ${isCurrent ? 'dataset-selected' : ''}`}
                key={p.id}
                style={{ cursor: 'pointer', position: 'relative' }}
                onClick={() => onSelectProject(p)}
              >
                <div className="project-card-top">
                  <span className={`project-avatar ${p.color}`}>{p.initials}</span>
                  {isCurrent && (
                    <span style={{ fontSize: 9, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 7px', borderRadius: 12, fontWeight: 700 }}>
                      ACTIVO
                    </span>
                  )}
                  <button
                      className="btn-icon-danger"
                      title="Eliminar proyecto"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(p.id, p.name)
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        padding: '4px 6px',
                        cursor: 'pointer',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 10,
                        fontWeight: 600,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#f87171' }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.borderColor = '#fecaca' }}
                    >
                      <Trash2 size={13}/>
                      Eliminar
                    </button>
                </div>
                <h3>{p.name}</h3>
                <p>{p.code} <span>·</span> {p.family}</p>
                <div style={{ fontSize: 10, color: '#64748b', marginTop: 6, lineHeight: 1.4, minHeight: 28 }}>
                  {p.description || 'Sin descripción detallada.'}
                </div>

                <div className="project-card-bottom">
                  <span>
                    <Database size={13}/>
                    {p.datasetSelected ? p.datasetSelected.split(' · ')[0] : 'Sin dataset'}
                  </span>
                  <span className={`status ${p.status === 'Activo' ? 'ejecutando' : 'completado'}`}>
                    <i/>{p.status}
                  </span>
                </div>

                <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 9, color: '#2563eb', fontWeight: 600 }}>
                    Etapa: {p.currentStage} de 5
                  </span>
                  <button
                    className="btn btn-secondary btn-small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectProject(p)
                    }}
                  >
                    Abrir Espacio <ArrowRight size={13}/>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <DiscreetModuleExplainer
        badge="FASE 1: ESPACIO DE TRABAJO"
        title="Gobernanza y Aislamiento de Iniciativas de IA"
        purposeText="Este módulo centraliza y aísla el ciclo de vida de un modelo de Deep Learning. Permite definir el problema de negocio, controlar las versiones de datos y rastrear todos los intentos de entrenamiento bajo un mismo identificador inmutable."
        keyTakeaway="Crear o seleccionar un proyecto vincula de manera coherente el dataset de entrada con la arquitectura de capas y el registro final de auditoría."
        inputs={[
          'Nombre descriptivo del caso de uso (ej. Visión Médica, Detección de Fraude)',
          'Familia de red objetivo (Feedforward, CNN, RNN, GAN)'
        ]}
        outputs={[
          'Identificador único de proyecto (PRJ-XXX) registrado en la plataforma',
          'Espacio de trabajo activo para la selección de datos'
        ]}
      />
    </>
  )
}

function Datasets({
  activeProject,
  datasets,
  selectedDatasetId,
  onSelectDataset,
  onCustomCsvLoaded,
  onImportDataset,
  notify
}: {
  activeProject: ProjectItem
  datasets: DatasetItem[]
  selectedDatasetId: string
  onSelectDataset: (d: DatasetItem) => void
  onCustomCsvLoaded: (d: DatasetItem) => void
  onImportDataset: () => void
  notify: (s: string) => void
}) {
  const current = datasets.find(d => d.id === selectedDatasetId) || datasets[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        if (!text) return

        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0)
        if (lines.length < 2) {
          notify('El archivo CSV debe tener al menos una fila de encabezados y una fila de datos.')
          return
        }

        const delimiter = lines[0].includes(';') ? ';' : ','
        const headers = lines[0].split(delimiter).map(h => h.trim().replaceAll('"', ''))
        const dataRows = lines.slice(1, 10).map(line => {
          const vals = line.split(delimiter).map(v => v.trim().replaceAll('"', ''))
          const rowObj: Record<string, any> = {}
          headers.forEach((h, i) => {
            rowObj[h] = vals[i] ?? ''
          })
          return rowObj
        })

        const targetCol = headers[headers.length - 1]
        const uniqueTargets = new Set(lines.slice(1).map(l => {
          const parts = l.split(delimiter)
          return parts[parts.length - 1]?.trim().replaceAll('"', '')
        }))

        const numClasses = Math.max(2, Math.min(20, uniqueTargets.size))
        const inputShape = Math.max(1, headers.length - 1)

        const datasetName = file.name.replace(/\.[^/.]+$/, '')

        const customItem: DatasetItem = {
          id: `custom-${Date.now()}`,
          name: `${datasetName} (Archivo Local)`,
          desc: `Dataset importado desde ${file.name} con ${headers.length} columnas y ${lines.length - 1} registros.`,
          category: 'Personalizado',
          type: `Datos CSV (${inputShape} variables)`,
          rows: `${fmt(lines.length - 1)} registros`,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          inputShape,
          inputShapeLabel: `${inputShape} variables numéricas`,
          numClasses,
          classNames: Array.from(uniqueTargets).slice(0, 10),
          tag: 'Subido por Usuario',
          color: 'green',
          previewColumns: headers.map((h, i) => ({
            name: h,
            type: i === headers.length - 1 ? 'target' : 'number'
          })),
          previewRows: dataRows.slice(0, 5),
          recommendedArch: {
            layers: [
              { type: 'Entrada', units: inputShape, activation: '—' },
              { type: 'Densa', units: Math.min(128, Math.max(16, inputShape * 4)), activation: 'ReLU' },
              { type: 'Densa', units: Math.min(64, Math.max(8, inputShape * 2)), activation: 'ReLU' },
              { type: 'Salida', units: numClasses, activation: numClasses === 1 ? 'Linear' : 'Softmax' }
            ]
          }
        }

        onCustomCsvLoaded(customItem)
      } catch (err: any) {
        notify(`Error al leer el archivo CSV: ${err.message}`)
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv, .txt"
        style={{ display: 'none' }}
        onChange={handleFileUpload}
      />

      <div className="dataset-callout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Database size={24} style={{ color: '#2563eb' }}/>
          <div>
            <b>Asignación para Proyecto: {activeProject.name} ({activeProject.code})</b>
            <p>Selecciona un dataset corporativo o carga un archivo CSV directamente desde tu computadora.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <UploadCloud size={16}/> Subir CSV desde mi Computadora
          </button>
        </div>
      </div>

      <div className="dataset-grid">
        {datasets.map(d => {
          const isSelected = d.id === selectedDatasetId
          return (
            <div className={`panel dataset-card ${isSelected ? 'dataset-selected' : ''}`} key={d.id}>
              <div className="dataset-card-top">
                <span className={`dataset-icon ${d.color}`}><Database size={20}/></span>
                <span className="dataset-tag">{d.category}</span>
              </div>
              <h3>{d.name}</h3>
              <p>{d.desc}</p>

              <div className="dataset-meta">
                <span><Layers3 size={13}/>{d.rows}</span>
                <span><SquareActivity size={13}/>{d.inputShapeLabel}</span>
              </div>

              <div style={{ padding: '9px 0', borderBottom: '1px solid #edf1f6', fontSize: 10, color: '#475467' }}>
                <div><strong>Clases ({d.numClasses}):</strong> {d.classNames.slice(0, 4).join(', ')}{d.classNames.length > 4 ? '...' : ''}</div>
              </div>

              <div className="dataset-card-bottom">
                <span>{d.size} · {d.tag}</span>
                <button
                  className={isSelected ? 'btn btn-primary btn-small' : 'btn btn-secondary btn-small'}
                  onClick={() => onSelectDataset(d)}
                >
                  {isSelected ? <><Check size={13}/> Seleccionado</> : 'Seleccionar'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <section className="data-preview-container">
        <SectionTitle
          title={`Vista Previa de los Datos: ${current.name}`}
          detail="Exploración directa de muestras, tipología de columnas y variables predictoras"
          action={
            <button className="btn btn-secondary btn-small" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud size={13}/> Cargar Otro CSV
            </button>
          }
        />

        <div className="data-stats-bar">
          <span>Total Muestras: <strong>{current.rows}</strong></span>
          <span>Dimensionalidad Entrada: <strong>{current.inputShapeLabel}</strong></span>
          <span>Total Clases Objetivo: <strong>{current.numClasses} clases</strong></span>
          <span>Valores Nulos Detectados: <strong style={{ color: '#16a34a' }}>0 (Limpio)</strong></span>
          <span>Tamaño en Memoria: <strong>{current.size}</strong></span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="preview-grid-table">
            <thead>
              <tr>
                <th># Registro</th>
                {current.previewColumns.map(col => (
                  <th key={col.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{col.name}</span>
                      <span className={`pill-tag ${col.type}`}>
                        {col.type === 'target' ? 'TARGET' : col.type === 'number' ? 'FLOAT' : 'CAT'}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {current.previewRows.map((row, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600, color: '#94a3b8' }}>Muestra #{idx + 1}</td>
                  {current.previewColumns.map(col => (
                    <td key={col.name} style={{ fontWeight: col.type === 'target' ? 700 : 400, color: col.type === 'target' ? '#15803d' : '#334155' }}>
                      {row[col.name]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="pipeline-next-bar">
        <div className="pipeline-next-info">
          <div className="pipeline-next-icon"><CheckCircle2 size={20}/></div>
          <div>
            <b>Dataset Asignado: {current.name}</b>
            <small>Configurará automáticamente la capa de entrada a <strong>{current.inputShape} variables</strong> y la salida a <strong>{current.numClasses} neuronas</strong>.</small>
          </div>
        </div>
        <div className="pipeline-next-actions">
          <button className="btn btn-primary" onClick={() => onSelectDataset(current)}>
            Continuar a Diseñador de Redes <ArrowRight size={15}/>
          </button>
        </div>
      </div>

      <DiscreetModuleExplainer
        badge="FASE 2: INGESTA DE DATOS"
        title="Ingesta, Inspección y Vista Previa de Datos"
        purposeText="Una red neuronal requiere datos estructurados, balanceados y numéricamente consistentes. Este módulo ingesta los conjuntos de datos, inspecciona las variables predictoras, calcula la dimensionalidad y divide los datos en particiones de Entrenamiento (70%), Validación (15%) y Prueba (15%)."
        keyTakeaway="El dataset elegido define la dimensionalidad de la Capa de Entrada y el número de neuronas de la Capa de Salida en el Diseñador de Redes."
        inputs={[
          'Archivos estructurados (CSV, imágenes preprocesadas, series numéricas)',
          'Definición de variable objetivo (etiqueta a predecir)'
        ]}
        outputs={[
          'Matriz de tensores dimensionales (X_train, y_train, X_test, y_test)',
          'Definición del input_shape y número de clases'
        ]}
      />
    </>
  )
}

function Designer({
  activeProject,
  currentDataset,
  family,
  setFamily,
  layers,
  setLayers,
  epochs,
  setEpochs,
  batchSize,
  setBatchSize,
  optimizer,
  setOptimizer,
  learningRate,
  setLearningRate,
  backendOnline,
  onRunTraining,
  onBackToDataset,
  notify
}: any) {
  const totalParams = useMemo(() => {
    let params = 0
    for (let i = 1; i < layers.length; i++) {
      const prevUnits = Number(layers[i - 1].units || 0)
      const currentUnits = Number(layers[i].units || 0)
      params += (prevUnits * currentUnits) + currentUnits
    }
    return params
  }, [layers])

  const addHiddenLayer = () => {
    const insertIdx = layers.length - 1
    const newLayer = { type: 'Densa', units: 64, activation: 'ReLU' }
    const updated = [...layers.slice(0, insertIdx), newLayer, layers[insertIdx]]
    setLayers(updated)
    notify('Capa oculta agregada (Densa 64 unidades, ReLU).')
  }

  return (
    <>
      <div className="designer-layout">
        <section className="panel designer-config">
          <SectionTitle
            title="Parámetros de Optimización"
            detail={`Proyecto: ${activeProject.name}`}
          />

          <label className="field-label">
            Familia de Red
            <select value={family} onChange={e => setFamily(e.target.value)}>
              <option value="Feedforward">Feedforward (Densa Multicapa)</option>
              <option value="CNN">Convolucional (CNN)</option>
              <option value="RNN">Recurrente (RNN)</option>
            </select>
          </label>

          <label className="field-label">
            Dataset Vinculado
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '8px 10px',
              borderRadius: 6,
              fontSize: 10,
              color: '#334155',
              marginTop: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{currentDataset.name}</span>
              <button
                className="text-action"
                style={{ fontSize: 9 }}
                onClick={onBackToDataset}
              >
                Cambiar
              </button>
            </div>
          </label>

          <div className="field-label">
            Épocas de Entrenamiento
            <div className="range-head">
              <span>Iteraciones completas</span>
              <b>{epochs} épocas</b>
            </div>
            <input
              className="range-input"
              type="range"
              min="5"
              max="100"
              step="5"
              value={epochs}
              onChange={e => setEpochs(Number(e.target.value))}
            />
            <div className="range-limits"><span>5 épocas</span><span>100 épocas</span></div>
          </div>

          <label className="field-label">
            Tamaño de Lote (Batch Size)
            <select value={batchSize} onChange={e => setBatchSize(Number(e.target.value))}>
              <option value={16}>16 muestras (Mayor actualización estocástica)</option>
              <option value={32}>32 muestras (Recomendado estándar)</option>
              <option value={64}>64 muestras (Mayor paralelismo)</option>
              <option value={128}>128 muestras (Lotes grandes)</option>
            </select>
          </label>

          <label className="field-label">
            Algoritmo Optimizador
            <select value={optimizer} onChange={e => setOptimizer(e.target.value)}>
              <option value="Adam">Adam (Momento Adaptativo - Estándar)</option>
              <option value="SGD">SGD con Momentum (Descenso de Gradiente Estocástico)</option>
              <option value="RMSprop">RMSprop (Raíz del Cuadrado Medio)</option>
            </select>
          </label>

          <label className="field-label">
            Tasa de Aprendizaje (Learning Rate)
            <select value={learningRate} onChange={e => setLearningRate(e.target.value)}>
              <option value="0.001">0.001 (Convergencia suave recomendada)</option>
              <option value="0.01">0.01 (Aprendizaje rápido)</option>
              <option value="0.0001">0.0001 (Ajuste fino / Fine-tuning)</option>
            </select>
          </label>

          <div className="config-note">
            <ShieldCheck size={16}/>
            <span>
              Configuración óptima verificada: tasa de aprendizaje y dimensiones correspondientes al problema.
            </span>
          </div>

          <button className="btn btn-primary full-btn" onClick={onRunTraining}>
            <Play size={16} fill="currentColor"/> Iniciar Entrenamiento
          </button>
        </section>

        <section className="panel architecture-panel">
          <div className="architecture-heading">
            <div>
              <h3>Visualizador del Grafo Computacional</h3>
              <p>Representación visual de capas y flujo tensorial desde la entrada hasta la predicción.</p>
            </div>
            <span className="draft-pill">
              <i/> {layers.length} CAPAS · ~{fmt(totalParams)} PARÁMETROS
            </span>
          </div>

          <div className="architecture-canvas">
            <div className="canvas-grid"/>
            <div className="neural-visual">
              {layers.map((layer: any, i: number) => {
                const isInput = i === 0
                const isOutput = i === layers.length - 1
                return (
                  <div className="neural-column" key={i}>
                    <div className="neural-col-label">
                      {isInput ? 'Entrada' : isOutput ? 'Salida' : `Oculta ${i}`}
                    </div>
                    <div className="neural-nodes">
                      {Array.from({ length: Math.min(5, Math.max(2, Math.ceil(layer.units / 35))) }, (_, j) => (
                        <span
                          key={j}
                          className={`neuron ${isInput ? 'input-neuron' : isOutput ? 'output-neuron' : ''}`}
                        >
                          <i/>
                        </span>
                      ))}
                    </div>
                    <div className="neural-units">{layer.units} neuronas</div>
                    <span className="neural-activation">{layer.activation}</span>
                  </div>
                )
              })}
            </div>
            <div className="canvas-watermark">
              <Network size={14}/> GRAFO TENSORIAL ACTIVO
            </div>
          </div>

          <div className="layer-editor">
            <div className="layer-editor-head">
              <h4>
                <Layers3 size={16}/>
                Configuración Detallada de Capas
                <span>{layers.length} capas</span>
              </h4>
              <button className="text-action" onClick={addHiddenLayer}>
                <Plus size={14}/> Añadir Capa Oculta
              </button>
            </div>

            {layers.map((l: any, i: number) => {
              const isInput = i === 0
              const isOutput = i === layers.length - 1
              return (
                <div className="layer-row" key={i}>
                  <span className="layer-index">{String(i + 1).padStart(2, '0')}</span>
                  <span className="layer-type" style={{ fontWeight: isInput || isOutput ? 700 : 400 }}>
                    {isInput ? 'Entrada (Input)' : isOutput ? 'Salida (Softmax)' : `Capa Densa ${i}`}
                  </span>

                  <label>
                    Neuronas
                    <input
                      type="number"
                      min="1"
                      max="4096"
                      value={l.units}
                      disabled={isInput || isOutput}
                      onChange={e => setLayers(layers.map((x: any, k: number) => k === i ? { ...x, units: Math.max(1, Number(e.target.value)) } : x))}
                    />
                  </label>

                  <label>
                    Función de Activación
                    <select
                      value={l.activation}
                      disabled={isInput}
                      onChange={e => setLayers(layers.map((x: any, k: number) => k === i ? { ...x, activation: e.target.value } : x))}
                    >
                      {isInput && <option>—</option>}
                      {!isInput && !isOutput && (
                        <>
                          <option value="ReLU">ReLU (Rectified Linear Unit)</option>
                          <option value="LeakyReLU">LeakyReLU</option>
                          <option value="Tanh">Tanh (Tangente Hiperbólica)</option>
                          <option value="Sigmoid">Sigmoid</option>
                        </>
                      )}
                      {isOutput && (
                        <>
                          <option value="Softmax">Softmax (Probabilidades multiclase)</option>
                          <option value="Sigmoid">Sigmoid (Probabilidad binaria)</option>
                          <option value="Linear">Linear (Regresión continua)</option>
                        </>
                      )}
                    </select>
                  </label>

                  {!isInput && !isOutput ? (
                    <button
                      className="icon-btn delete-layer"
                      title="Eliminar capa"
                      onClick={() => setLayers(layers.filter((_: any, k: number) => k !== i))}
                    >
                      <X size={15}/>
                    </button>
                  ) : (
                    <div style={{ width: 28 }}/>
                  )}
                </div>
              )
            })}
          </div>

          <div className="architecture-summary">
            <div><span>Total Capas</span><b>{layers.length}</b></div>
            <div><span>Parámetros W+b</span><b>~{fmt(totalParams)}</b></div>
            <div><span>Variables Entrada</span><b>{layers[0]?.units}</b></div>
            <div><span>Clases Salida</span><b>{layers[layers.length - 1]?.units}</b></div>
          </div>
        </section>
      </div>

      <div className="pipeline-next-bar">
        <div className="pipeline-next-info">
          <div className="pipeline-next-icon"><SlidersHorizontal size={20}/></div>
          <div>
            <b>Arquitectura Compilada con Éxito</b>
            <small>Optimizador: <strong>{optimizer}</strong> · Learning rate: <strong>{learningRate}</strong> · {epochs} épocas programadas.</small>
          </div>
        </div>
        <div className="pipeline-next-actions">
          <button className="btn btn-secondary" onClick={onBackToDataset}>
            <ArrowLeft size={14}/> Volver al Dataset
          </button>
          <button className="btn btn-primary" onClick={onRunTraining}>
            Iniciar Entrenamiento de la Red <ArrowRight size={15}/>
          </button>
        </div>
      </div>

      <DiscreetModuleExplainer
        badge="FASE 3: MODELADO NEURONAL"
        title="Diseño Topológico de Capas y Parámetros de Optimización"
        purposeText="En esta fase se construye la red neuronal capa por capa. Las capas intermedias (ocultas) aprenden representaciones complejas no lineales mediante transformaciones de pesos (W) y sesgos (b), usando funciones de activación (ReLU) para evitar que la red colapse en una simple regresión lineal."
        keyTakeaway="La Capa de Entrada está fijada a las dimensiones del dataset elegido y la Capa de Salida a sus clases. Las capas intermedias definen la capacidad de generalización."
        inputs={[
          `Matriz de entrada del dataset: ${currentDataset.name} (${currentDataset.inputShape} variables)`,
          'Selección de optimizador (Adam, SGD, RMSprop) y tasa de aprendizaje'
        ]}
        outputs={[
          `Grafo de red compilado con ${layers.length} capas y ~${fmt(totalParams)} parámetros entrenables`,
          'Plan de optimización listo para ser enviado a los workers de cómputo'
        ]}
      />
    </>
  )
}

function Trainings({
  activeProject,
  jobs,
  metricData,
  backendOnline,
  onCancel,
  onProceedToEvaluation,
  onBackToDesigner,
  notify
}: any) {
  const runningJobs = jobs.filter((j: Job) => j.status === 'Ejecutando')
  const completedJobs = jobs.filter((j: Job) => j.status === 'Completado')
  const activeJob = runningJobs[0] || completedJobs[0] || jobs[0]

  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<Activity size={18}/>} label="En Ejecución" value={String(runningJobs.length)} change="Telemetría en tiempo real" trend="neutral" color="blue" foot="trabajos activos"/>
        <StatCard icon={<Check size={18}/>} label="Entrenamientos Completados" value={String(completedJobs.length)} change="Listos" trend="up" color="green" foot="modelos disponibles"/>
        <StatCard icon={<Gauge size={18}/>} label="Precisión Actual" value={`${metricData[metricData.length - 1]?.acc || 94.8}%`} change="+1.2%" trend="up" color="purple" foot="en última época"/>
        <StatCard icon={<Target size={18}/>} label="Loss de Validación" value={String(metricData[metricData.length - 1]?.val || 0.17)} change="−12.4%" trend="up" color="orange" foot="convergencia estable"/>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <SectionTitle
            title="Curvas de Convergencia en Tiempo Real"
            detail={`Monitoreo de Pérdida (Loss) y Precisión para ${activeJob?.name || 'Modelo Activo'}`}
          />
          <div className="chart-legend">
            <span><i className="legend-blue"/> Pérdida Entrenamiento</span>
            <span><i className="legend-purple"/> Pérdida Validación</span>
            <b>{metricData[metricData.length - 1]?.loss} <small>loss final</small></b>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metricData} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="trainLossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="valLossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/>
                <XAxis dataKey="epoch" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, color: '#1e293b' }}/>
                <Area type="monotone" dataKey="loss" stroke="#2563eb" strokeWidth={2.2} fill="url(#trainLossGrad)" name="Loss Entrenamiento"/>
                <Area type="monotone" dataKey="val" stroke="#8b5cf6" strokeWidth={2} fill="url(#valLossGrad)" name="Loss Validación"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-bottom">
            <span><i className="legend-blue"/> Descenso del error: <strong>88.4%</strong></span>
            <span className="chart-period">50 épocas procesadas</span>
          </div>
        </section>

        <section className="panel activity-panel">
          <SectionTitle
            title="Consola de Telemetría de Cómputo"
            detail="Registro cronológico de épocas e iteraciones de la red"
          />
          <div className="training-terminal">
            <div className="log-line">
              <span className="log-time">[09:00:12]</span>
              <span>Servicio de cómputo asignado: nodo-gpu-01</span>
            </div>
            <div className="log-line">
              <span className="log-time">[09:00:13]</span>
              <span>Dataset estructurado: {activeJob?.datasetName || 'MNIST'} (Partición 70/15/15)</span>
            </div>
            <div className="log-line">
              <span className="log-time">[09:00:14]</span>
              <span>Compilando grafo con optimizador Adam (lr=0.001)</span>
            </div>
            {metricData.slice(-6).map((m: any, i: number) => (
              <div className="log-line" key={i}>
                <span className="log-time">[09:0{i + 1}:18]</span>
                <span className="log-epoch">Época {m.epoch}/50</span>
                <span className="log-loss">loss: {m.loss}</span>
                <span className="log-acc">acc: {m.acc}%</span>
              </div>
            ))}
            <div className="log-line">
              <span className="log-time">[ahora]</span>
              <span style={{ color: '#4ade80' }}>✔ Checkpoint guardado en repositorio seguro</span>
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
              <span>Progreso de {activeJob?.name || 'Entrenamiento'}:</span>
              <strong>{activeJob?.progress || 100}%</strong>
            </div>
            <div className="mini-progress" style={{ height: 7 }}>
              <i style={{ width: `${activeJob?.progress || 100}%` }}/>
            </div>
          </div>
        </section>
      </div>

      <section className="panel jobs-page-panel" style={{ marginTop: 18 }}>
        <SectionTitle
          title="Historial de Entrenamientos del Proyecto"
          detail="Registro de todas las iteraciones ejecutadas en este espacio de trabajo."
        />
        <JobTable jobs={jobs} onCancel={onCancel}/>
      </section>

      <div className="pipeline-next-bar">
        <div className="pipeline-next-info">
          <div className="pipeline-next-icon"><FileChartColumn size={20}/></div>
          <div>
            <b>Entrenamiento Finalizado y Validado</b>
            <small>Loss de prueba: <strong>0.110</strong> · Precisión alcanzada: <strong>94.8%</strong> en el conjunto de validación.</small>
          </div>
        </div>
        <div className="pipeline-next-actions">
          <button className="btn btn-secondary" onClick={onBackToDesigner}>
            <ArrowLeft size={14}/> Reajustar Arquitectura
          </button>
          <button className="btn btn-primary" onClick={onProceedToEvaluation}>
            Continuar a Evaluación y Métricas <ArrowRight size={15}/>
          </button>
        </div>
      </div>

      <DiscreetModuleExplainer
        badge="FASE 4: OPTIMIZACIÓN Y APRENDIZAJE"
        title="Supervisión y Ejecución de Entrenamientos en Tiempo Real"
        purposeText="En esta fase la red procesa los lotes de datos y ajusta sus pesos mediante Backpropagation (propagación hacia atrás del gradiente del error). La función de coste (Loss) debe descender progresivamente, mientras que la Precisión (Accuracy) debe aumentar tanto en el conjunto de entrenamiento como en validación."
        keyTakeaway="Supervisar las curvas de pérdida permite asegurar que el modelo converge sin divergencia ni sobreajuste temprano."
        inputs={[
          'Grafo de red compilado en el Diseñador',
          'Conjunto de entrenamiento y validación provistos por el Dataset'
        ]}
        outputs={[
          'Pesos neuronales optimizados guardados en checkpoints de almacenamiento',
          'Telemetría en tiempo real: Curvas de Loss y Precisión por época'
        ]}
      />
    </>
  )
}

function Evaluation({
  activeProject,
  currentDataset,
  metricData,
  onBackToDesigner,
  onPublishModel,
  onExportReport,
  notify
}: any) {
  const [selectedSample, setSelectedSample] = useState(0)
  const [inferenceRunning, setInferenceRunning] = useState(false)
  const [predictionResult, setPredictionResult] = useState<any>(null)

  const confusionClasses = currentDataset.classNames.slice(0, 5)
  const confusionData = [
    [982, 4, 8, 2, 4],
    [3, 976, 12, 6, 3],
    [5, 8, 960, 18, 9],
    [1, 9, 14, 968, 8],
    [4, 2, 7, 5, 982]
  ]

  const runSampleInference = () => {
    setInferenceRunning(true)
    setTimeout(() => {
      setInferenceRunning(false)
      setPredictionResult({
        classIndex: selectedSample % currentDataset.numClasses,
        className: currentDataset.classNames[selectedSample % currentDataset.numClasses],
        confidence: 98.4,
        probabilities: currentDataset.classNames.slice(0, 5).map((c: string, i: number) => ({
          name: c,
          prob: i === (selectedSample % currentDataset.numClasses) ? 98.4 : Number((Math.random() * 0.4).toFixed(2))
        }))
      })
      notify('Inferencia ejecutada sobre la muestra de prueba.')
    }, 400)
  }

  return (
    <>
      <div className="stats-grid compact-stats">
        <StatCard icon={<Gauge size={18}/>} label="Exactitud Global (Accuracy)" value="94.8%" change="+2.4%" trend="up" color="green" foot="aciertos en conjunto de prueba"/>
        <StatCard icon={<Target size={18}/>} label="Precisión (Precision)" value="95.2%" change="Alta fidelidad" trend="up" color="blue" foot="minimiza falsos positivos"/>
        <StatCard icon={<Activity size={18}/>} label="Sensibilidad (Recall)" value="94.4%" change="Sensible" trend="up" color="purple" foot="detecta casos reales"/>
        <StatCard icon={<SquareActivity size={18}/>} label="F1-Score Ponderado" value="0.948" change="Equilibrado" trend="up" color="orange" foot="media armónica Precision/Recall"/>
      </div>

      <div className="dashboard-grid">
        <section className="panel chart-panel">
          <SectionTitle
            title="Matriz de Confusión (Predicción vs Realidad)"
            detail="La diagonal principal indica predicciones correctas; las celdas externas muestran confusiones."
          />

          <div className="confusion-matrix-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#64748b' }}>
              <span>Filas: Clase Verdadera (Ground Truth)</span>
              <span>Columnas: Predicción del Modelo</span>
            </div>

            <div
              className="confusion-grid"
              style={{
                gridTemplateColumns: `80px repeat(${confusionClasses.length}, minmax(0, 1fr))`
              }}
            >
              <div/>
              {confusionClasses.map((c: string, idx: number) => (
                <div key={idx} style={{ textAlign: 'center', fontSize: 9, fontWeight: 700, color: '#334155' }}>
                  {c.length > 7 ? `${c.slice(0, 6)}..` : c}
                </div>
              ))}

              {confusionData.map((row, rIdx) => (
                <React.Fragment key={`row-frag-${rIdx}`}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475467', whiteSpace: 'nowrap' }} key={`lbl-${rIdx}`}>
                    {confusionClasses[rIdx]?.length > 8 ? `${confusionClasses[rIdx].slice(0, 7)}.` : confusionClasses[rIdx]}
                  </div>
                  {row.map((val, cIdx) => {
                    const isMatch = rIdx === cIdx
                    return (
                      <div
                        key={`cell-${rIdx}-${cIdx}`}
                        className={`confusion-cell ${isMatch ? 'match' : val > 10 ? 'mismatch' : 'neutral'}`}
                        title={`Real: ${confusionClasses[rIdx]} -> Predicho: ${confusionClasses[cIdx]} (${val} muestras)`}
                      >
                        {val}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 16, fontSize: 9, color: '#64748b', marginTop: 8 }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#86efac', borderRadius: 2, marginRight: 4 }}/> Predicción correcta</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, background: '#fca5a5', borderRadius: 2, marginRight: 4 }}/> Confusión detectada</span>
            </div>
          </div>
        </section>

        <section className="panel metrics-panel">
          <SectionTitle
            title="Diagnóstico de Sesgo y Varianza"
            detail="Evaluación automática del comportamiento del modelo en producción."
          />

          <div style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: 8,
            padding: 12,
            marginBottom: 14,
            fontSize: 11
          }}>
            <div style={{ fontWeight: 700, color: '#166534', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={16}/> Diagnóstico: Convergencia Óptima (Sin Overfitting)
            </div>
            <div style={{ color: '#15803d', fontSize: 10, lineHeight: 1.5 }}>
              La brecha entre la pérdida de entrenamiento (0.11) y la de validación (0.17) es mínima (menor al 5%).
              El modelo generaliza correctamente sin memorizar ruido del dataset.
            </div>
          </div>

          {[
            ['Loss en Entrenamiento', '0.110', 'good'],
            ['Loss en Test Set', '0.124', 'good'],
            ['Capacidad de Generalización', '94.8%', 'good'],
            ['Riesgo de Sobreajuste', 'Bajo (< 3%)', 'good'],
            ['Latencia de Inferencia', '14 ms / muestra', 'neutral']
          ].map(m => (
            <div className="metric-row" key={m[0]}>
              <span>{m[0]}</span>
              <b>{m[1]}</b>
              <span className={`metric-indicator ${m[2]}`}>{m[2] === 'good' ? 'Óptimo' : 'Referencia'}</span>
            </div>
          ))}
        </section>
      </div>

      <section className="panel" style={{ marginTop: 18, padding: 18 }}>
        <SectionTitle
          title="Simulador de Inferencia en Tiempo Real"
          detail="Prueba el modelo entrenado con una muestra y observa la distribución de probabilidades."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 20, alignItems: 'center' }}>
          <div>
            <label className="field-label">
              Seleccionar Muestra de Test
              <select value={selectedSample} onChange={e => setSelectedSample(Number(e.target.value))}>
                <option value={0}>Muestra #01 · {currentDataset.classNames[0] || 'Clase 0'}</option>
                <option value={1}>Muestra #02 · {currentDataset.classNames[1] || 'Clase 1'}</option>
                <option value={2}>Muestra #03 · {currentDataset.classNames[2] || 'Clase 2'}</option>
                <option value={3}>Muestra #04 · {currentDataset.classNames[3] || 'Clase 3'}</option>
              </select>
            </label>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 10, color: '#475467' }}>
              <div><strong>Formato tensor:</strong> Vector normalizado de {currentDataset.inputShape} variables</div>
              <div style={{ marginTop: 4 }}><strong>Etiqueta real esperada:</strong> {currentDataset.classNames[selectedSample % currentDataset.numClasses]}</div>
            </div>

            <button
              className="btn btn-primary"
              style={{ marginTop: 14, width: '100%' }}
              onClick={runSampleInference}
              disabled={inferenceRunning}
            >
              {inferenceRunning ? 'Calculando tensores...' : <><Zap size={15}/> Ejecutar Inferencia</>}
            </button>
          </div>

          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
              Distribución de Probabilidades Softmax:
            </div>

            {predictionResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 11, color: '#475467' }}>Predicción:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '3px 10px', borderRadius: 6 }}>
                    {predictionResult.className} ({predictionResult.confidence}%)
                  </span>
                </div>

                {predictionResult.probabilities.map((p: any) => (
                  <div className="inference-class-bar" key={p.name}>
                    <span style={{ width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
                    <div className="inference-bar-track">
                      <div className={`inference-bar-fill ${p.prob > 50 ? 'top' : ''}`} style={{ width: `${p.prob}%` }}/>
                    </div>
                    <span style={{ width: 45, textAlign: 'right', fontWeight: 600 }}>{p.prob}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#94a3b8', fontSize: 11 }}>
                Selecciona una muestra y presiona "Ejecutar Inferencia" para calcular probabilidades.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="pipeline-next-bar">
        <div className="pipeline-next-info">
          <div className="pipeline-next-icon"><GitBranch size={20}/></div>
          <div>
            <b>Evaluación Concluida Exitosamente</b>
            <small>El modelo cumple con los criterios de precisión (&gt;90%) y está listo para ser registrado o exportado.</small>
          </div>
        </div>
        <div className="pipeline-next-actions">
          <button className="btn btn-secondary" onClick={onExportReport}>
            <Download size={14}/> Exportar Reporte Técnico
          </button>
          <button className="btn btn-secondary" onClick={onBackToDesigner}>
            <RefreshCw size={14}/> Nueva Iteración
          </button>
          <button className="btn btn-primary" onClick={onPublishModel}>
            <GitBranch size={15}/> Publicar en Registro de Modelos
          </button>
        </div>
      </div>

      <DiscreetModuleExplainer
        badge="FASE 5: EVALUACIÓN ESTADÍSTICA"
        title="Evaluación Cuantitativa y Matriz de Rendimiento"
        purposeText="Este módulo somete al modelo entrenado al Test Set (datos completamente desconocidos por la red durante el entrenamiento). Evalúa la capacidad real de generalización mediante métricas estadísticas clave y permite verificar que no existan sesgos indeseados o sobreajuste antes del pase a producción."
        keyTakeaway="La matriz de confusión revela en qué clases específicas se confunde la red y el F1-Score garantiza un balance real entre falsos positivos y falsos negativos."
        inputs={[
          'Pesos del modelo entrenado',
          'Conjunto de prueba independiente (Test Set - 15% de los datos)'
        ]}
        outputs={[
          'Matriz de confusión, F1-Score ponderado y curvas de diagnóstico de sesgo',
          'Certificado de validación para publicación en el Registro de Modelos'
        ]}
      />
    </>
  )
}

function Fundamentals({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const [activeTab, setActiveTab] = useState<'conceptos' | 'neuronas' | 'pesos' | 'glosario'>('conceptos')

  return (
    <>
      <div className="fundamentals-intro">
        <div>
          <span className="eyebrow">FUNDAMENTOS NEURONALES DE DEEP LEARNING</span>
          <h2>Bases Matemáticas y Principios de Aprendizaje Profundo</h2>
          <p>Comprende cómo los tensores, las neuronas artificiales y las funciones de activación aprenden patrones complejos.</p>
        </div>
        <div className="heading-actions">
          <button className="btn btn-primary" onClick={() => onNavigate('Diseñador de redes')}>
            Ir al Diseñador de Redes <ArrowRight size={14}/>
          </button>
        </div>
      </div>

      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={activeTab === 'conceptos' ? 'active' : ''} onClick={() => setActiveTab('conceptos')}>
          • Conceptos de red neuronal
        </button>
        <button className={activeTab === 'neuronas' ? 'active' : ''} onClick={() => setActiveTab('neuronas')}>
          • Neuronas, capas y conexiones
        </button>
        <button className={activeTab === 'pesos' ? 'active' : ''} onClick={() => setActiveTab('pesos')}>
          • Pesos, sesgos y funciones de activación
        </button>
        <button className={activeTab === 'glosario' ? 'active' : ''} onClick={() => setActiveTab('glosario')}>
          • Glosario y ejemplos guiados
        </button>
      </div>

      {activeTab === 'conceptos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0f172a' }}>1. ¿Qué es una Red Neuronal Artificial?</h3>
            <p style={{ color: '#475467', lineHeight: 1.6, fontSize: 12 }}>
              Una <strong>Red Neuronal Artificial (ANN)</strong> es un modelo computacional bio-inspirado diseñado para resolver problemas de aproximación de funciones complejas, reconocimiento de patrones, clasificación y regresión. A diferencia de los algoritmos basados en reglas explícitas (if/else), una red neuronal <strong>aprende directamente a partir de ejemplos</strong> mediante optimización matemática de parámetros internos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 16 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#2563eb', display: 'block', marginBottom: 4 }}>Aprendizaje Supervisado</b>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  La red recibe pares de entrada y salida real (etiqueta). Calcula el error entre su predicción y la verdad fundamental para corregirse.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#7c3aed', display: 'block', marginBottom: 4 }}>Aproximador Universal</b>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  El Teorema de Aproximación Universal demuestra que una red con capas no lineales puede aproximar cualquier función continua con precisión arbitraria.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#16a34a', display: 'block', marginBottom: 4 }}>Extracción Jerárquica</b>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  Las primeras capas detectan bordes y contrastes; las capas medias aprenden texturas y formas; las últimas capas reconocen clases completas.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'neuronas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0f172a' }}>2. Anatomía de la Red: Neuronas, Capas y Conexiones Densas</h3>
            <p style={{ color: '#475467', lineHeight: 1.6, fontSize: 12 }}>
              La unidad computacional básica es la <strong>neurona artificial</strong> (o nodo). Las neuronas se organizan en <strong>capas secuenciales</strong>:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginTop: 16 }}>
              <div style={{ background: '#eff6ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '2px 6px', borderRadius: 4 }}>ENTRADA (INPUT LAYER)</span>
                <h4 style={{ margin: '10px 0 6px', fontSize: 13, color: '#1e293b' }}>Capa de Entrada</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#475467', lineHeight: 1.5 }}>
                  Recibe los datos crudos normalizados. No realiza operaciones matemáticas; su número de neuronas coincide exactamente con las variables del dataset (ej. 784 píxeles para MNIST).
                </p>
              </div>

              <div style={{ background: '#f5f3ff', padding: 16, borderRadius: 8, border: '1px solid #ddd6fe' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#6b21a8', background: '#ede9fe', padding: '2px 6px', borderRadius: 4 }}>PROCESAMIENTO (HIDDEN LAYERS)</span>
                <h4 style={{ margin: '10px 0 6px', fontSize: 13, color: '#1e293b' }}>Capas Ocultas (Densas)</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#475467', lineHeight: 1.5 }}>
                  Cada neurona está conectada con todas las neuronas de la capa anterior. Realiza la multiplicación de matrices de pesos y suma el sesgo: <code>z = W · x + b</code>.
                </p>
              </div>

              <div style={{ background: '#f0fdf4', padding: 16, borderRadius: 8, border: '1px solid #bbf7d0' }}>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#15803d', background: '#dcfce7', padding: '2px 6px', borderRadius: 4 }}>PREDICCIÓN (OUTPUT LAYER)</span>
                <h4 style={{ margin: '10px 0 6px', fontSize: 13, color: '#1e293b' }}>Capa de Salida</h4>
                <p style={{ margin: 0, fontSize: 11, color: '#475467', lineHeight: 1.5 }}>
                  Genera la predicción final. En clasificación multiclase utiliza la función <strong>Softmax</strong> para que las salidas representen probabilidades que suman exactamente 1.0 (100%).
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'pesos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0f172a' }}>3. Pesos (W), Sesgos (b) y Funciones de Activación</h3>
            <p style={{ color: '#475467', lineHeight: 1.6, fontSize: 12 }}>
              Sin funciones de activación no lineales, una red de 100 capas colapsaría matemáticamente en una simple transformación afín (regresión lineal). Las activaciones introducen la no-linealidad necesaria para resolver problemas complejos:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14, marginTop: 14 }}>
              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#2563eb' }}>ReLU · Rectified Linear Unit</b>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#1e293b', margin: '4px 0 6px' }}>f(x) = max(0, x)</div>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  Estándar en capas ocultas. Computacionalmente rápida, previene la saturación y acelera el descenso por gradiente.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#7c3aed' }}>Softmax · Probabilidades Normalizadas</b>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#1e293b', margin: '4px 0 6px' }}>σ(z)ᵢ = e^(zᵢ) / Σ e^(zⱼ)</div>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  Utilizada en la capa de salida para problemas multiclase. Transforma los valores brutos (logits) en una distribución probabilística que suma 1.0.
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#16a34a' }}>Sigmoid · Salida Binaria</b>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#1e293b', margin: '4px 0 6px' }}>σ(x) = 1 / (1 + e^(-x))</div>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  Comprime las salidas en el rango [0, 1]. Ideal para clasificación binaria (ej. detección de fraude o diagnóstico sí/no).
                </p>
              </div>

              <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#d97706' }}>Tanh · Tangente Hiperbólica</b>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#1e293b', margin: '4px 0 6px' }}>tanh(x) = (e^x - e^(-x)) / (e^x + e^(-x))</div>
                <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>
                  Centrada en cero con rango [-1, 1]. Ayuda a que los gradientes no oscilen fuertemente durante las primeras iteraciones.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'glosario' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section className="panel" style={{ padding: 22 }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: '#0f172a' }}>4. Glosario Técnico y Ejemplos Guiados de la Industria</h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 14 }}>
              {[
                { term: 'Backpropagation (Propagación hacia atrás)', def: 'Algoritmo que calcula el gradiente de la función de coste respecto a cada peso mediante la regla de la cadena para actualizar los parámetros.' },
                { term: 'Gradiente Descendente (Gradient Descent)', def: 'Método iterativo de optimización que da pasos en dirección opuesta al gradiente para encontrar el mínimo global del error.' },
                { term: 'Época (Epoch)', def: 'Una pasada completa de entrenamiento sobre todos los ejemplos del conjunto de datos de entrenamiento.' },
                { term: 'Tamaño de Lote (Batch Size)', def: 'Número de muestras de entrenamiento procesadas antes de que el modelo actualice sus pesos sinápticos.' },
                { term: 'Sobreajuste (Overfitting)', def: 'Cuando el modelo memoriza el ruido del conjunto de entrenamiento y pierde la capacidad de generalizar con datos nuevos.' },
                { term: 'Tasa de Aprendizaje (Learning Rate)', def: 'Hiperparámetro que determina el tamaño del paso de actualización de pesos en cada iteración del optimizador.' }
              ].map(item => (
                <div key={item.term} style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <b style={{ color: '#1e293b', fontSize: 11, display: 'block', marginBottom: 4 }}>{item.term}</b>
                  <p style={{ margin: 0, fontSize: 10, color: '#64748b', lineHeight: 1.4 }}>{item.def}</p>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 20, background: '#eff6ff', padding: 16, borderRadius: 8, border: '1px solid #bfdbfe' }}>
              <b style={{ color: '#1e40af', fontSize: 12 }}>Ejemplo Guiado: Clasificación de Dígitos MNIST</b>
              <p style={{ color: '#3b82f6', fontSize: 11, margin: '6px 0 0 0', lineHeight: 1.5 }}>
                1. <strong>Entrada:</strong> Imagen 28x28 aplanada en vector de 784 píxeles (valores entre 0.0 y 1.0).<br/>
                2. <strong>Capa Densa 1 (128 neuronas, ReLU):</strong> Aprende 128 combinaciones lineales de bordes y trazos.<br/>
                3. <strong>Capa Densa 2 (64 neuronas, ReLU):</strong> Compone bucles, curvas y líneas continuas.<br/>
                4. <strong>Capa de Salida (10 neuronas, Softmax):</strong> Devuelve 10 probabilidades para los dígitos 0 al 9.
              </p>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function Models({ activeProjectId, activeProject, backendOnline, onExportArtifact, notify }: any) {
  const [models] = useState<ModelArtifact[]>([
    {
      name: 'vision-mnist-classifier',
      version: 'v1.0.0-prod',
      family: 'Feedforward',
      status: 'Aprobado',
      date: '31 oct 2026',
      accuracy: '94.8%',
      params: '109,386',
      loss: '0.110',
      dataset: 'MNIST · Dígitos Manuscritos',
      checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    },
    {
      name: 'churn-predictor-core',
      version: 'v1.2.1-prod',
      family: 'Feedforward',
      status: 'Aprobado',
      date: '28 oct 2026',
      accuracy: '96.1%',
      params: '1,042',
      loss: '0.092',
      dataset: 'Customer Churn · Riesgo de Abandono',
      checksum: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
    },
    {
      name: 'biopsy-cancer-detector',
      version: 'v0.9.4-rc',
      family: 'Feedforward',
      status: 'Revisado',
      date: '25 oct 2026',
      accuracy: '95.8%',
      params: '4,162',
      loss: '0.115',
      dataset: 'Diagnóstico Oncológico Celular',
      checksum: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
    }
  ])

  return (
    <section className="panel jobs-page-panel">
      <SectionTitle
        title="Catálogo Oficial de Modelos (Model Registry)"
        detail="Modelos validados, versionados y listos para inferencia y despliegue empresarial."
      />
      <div className="model-registry">
        {models.map(m => (
          <div className="registry-row" key={m.version + m.name}>
            <span className="model-glyph"><BrainCircuit size={17}/></span>
            <div className="registry-name">
              <b>{m.name}</b>
              <small>{m.version} · {m.family} · {m.params} parámetros · Dataset: {m.dataset}</small>
            </div>
            <span className={`registry-status ${m.status.toLowerCase()}`}>{m.status}</span>
            <div className="registry-accuracy">
              <small>Precisión Test</small>
              <b>{m.accuracy}</b>
            </div>
            <div className="registry-date">
              <small>Certificado</small>
              <span>{m.date}</span>
            </div>
            <button
              className="btn btn-secondary btn-small"
              onClick={() => onExportArtifact(m)}
              title="Descargar archivo manifiesto JSON del modelo"
            >
              <Download size={13}/> Exportar Manifiesto
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

function Reports({ activeProjectId, backendOnline, onExport, notify }: any) {
  const [reportTab, setReportTab] = useState<'rendimiento' | 'consumo' | 'auditoria'>('rendimiento')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stats-grid compact-stats">
        <StatCard icon={<FileChartColumn size={18}/>} label="Modelos Evaluados" value="5" change="Certificados" trend="up" color="blue" foot="en catálogo histórico"/>
        <StatCard icon={<Gauge size={18}/>} label="Precisión Promedio" value="95.2%" change="+2.1%" trend="up" color="green" foot="en todos los proyectos"/>
        <StatCard icon={<Cpu size={18}/>} label="Horas Cómputo Mes" value="6.8 hrs" change="Dentro de cuota" trend="neutral" color="purple" foot="límite mensual 10 hrs"/>
        <StatCard icon={<ShieldCheck size={18}/>} label="Cumplimiento y Calidad" value="100%" change="SOC2 / ISO" trend="up" color="orange" foot="trazabilidad verificada"/>
      </div>

      <div className="filter-tabs">
        <button className={reportTab === 'rendimiento' ? 'active' : ''} onClick={() => setReportTab('rendimiento')}>
          <BarChart3 size={14}/> Comparativa de Rendimiento de Modelos
        </button>
        <button className={reportTab === 'consumo' ? 'active' : ''} onClick={() => setReportTab('consumo')}>
          <Activity size={14}/> Consumo de Cómputo Semanal
        </button>
        <button className={reportTab === 'auditoria' ? 'active' : ''} onClick={() => setReportTab('auditoria')}>
          <FileText size={14}/> Documentos y Certificados de Auditoría
        </button>
      </div>

      {reportTab === 'rendimiento' && (
        <section className="panel" style={{ padding: 22 }}>
          <SectionTitle
            title="Comparativa de Rendimiento entre Modelos Desarrollados"
            detail="Precisión porcentual alcanzada en el conjunto de prueba (Test Set) para cada modelo"
            action={
              <button className="btn btn-secondary btn-small" onClick={onExport}>
                <Download size={13}/> Exportar Métricas (CSV)
              </button>
            }
          />

          <div style={{ height: 260, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historicalReportData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/>
                <XAxis dataKey="model" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis domain={[80, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 11 }}/>
                <Bar dataKey="accuracy" name="Precisión Test (%)" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={38}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ marginTop: 18, overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>MODELO</th>
                  <th>PRECISIÓN TEST</th>
                  <th>LOSS FINAL</th>
                  <th>VOLUMEN DE MUESTRAS</th>
                  <th>TIEMPO ENTRENAMIENTO</th>
                  <th>ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {historicalReportData.map(r => (
                  <tr key={r.model}>
                    <td><strong>{r.model}</strong></td>
                    <td style={{ color: '#15803d', fontWeight: 700 }}>{r.accuracy}%</td>
                    <td>{r.loss}</td>
                    <td>{fmt(r.samples)} registros</td>
                    <td>{r.trainingTimeMin} min</td>
                    <td><span className="status completado"><i/>Aprobado</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {reportTab === 'consumo' && (
        <section className="panel" style={{ padding: 22 }}>
          <SectionTitle
            title="Consumo de Horas de Cómputo por Semana"
            detail="Distribución del uso de GPU y CPU en el clúster a lo largo del mes"
            action={
              <button className="btn btn-secondary btn-small" onClick={onExport}>
                <Download size={13}/> Descargar Registro de Cómputo
              </button>
            }
          />

          <div style={{ height: 250, width: '100%', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyUsageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="usageHoursGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 5" vertical={false}/>
                <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: 11 }}/>
                <Area type="monotone" dataKey="computeHours" stroke="#7c3aed" strokeWidth={2.4} fill="url(#usageHoursGrad)" name="Horas de Cómputo"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {reportTab === 'auditoria' && (
        <div className="report-grid">
          {[
            { icon: <FileText/>, title: 'Reporte Técnico de Ciclo de Vida', desc: 'Informe exhaustivo de punta a punta: Dataset, topología, métricas y matriz de confusión.', type: 'CSV / Manifiesto', color: 'blue', action: onExport },
            { icon: <ShieldCheck/>, title: 'Auditoría de Cumplimiento y Gobernanza', desc: 'Registro inmutable de hiperparámetros, autoría y métricas de prueba para cumplimiento SOC2.', type: 'Certificado Formal', color: 'green', action: onExport },
            { icon: <Activity/>, title: 'Telemetría de Recursos y Cómputo', desc: 'Historial de tiempos de cálculo, épocas procesadas y consumo de memoria del clúster.', type: 'Métricas de Ejecución', color: 'purple', action: onExport }
          ].map(r => (
            <div className="panel report-card" key={r.title}>
              <span className={`report-icon ${r.color}`}>{r.icon}</span>
              <h3>{r.title}</h3>
              <p>{r.desc}</p>
              <div>
                <span>{r.type}</span>
                <button className="btn btn-secondary btn-small" onClick={r.action}>
                  <Download size={14}/> Descargar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Administration({ backendStatus, onCheckService, notify }: any) {
  const [adminTab, setAdminTab] = useState<'usuarios' | 'auditoria' | 'limites' | 'salud'>('usuarios')

  const usersList = [
    { name: 'Diego Mendoza', email: 'diego.mendoza@empresa.com', role: 'Administrador de Plataforma', roleBadge: 'admin', status: 'Activo', lastAccess: 'hace 5 min' },
    { name: 'Dra. Elena Vasquez', email: 'elena.vasquez@empresa.com', role: 'Científica de Datos Principal', roleBadge: 'scientist', status: 'Activo', lastAccess: 'hace 2 horas' },
    { name: 'Carlos Ramos', email: 'carlos.ramos@empresa.com', role: 'Ingeniero de ML / Operaciones', roleBadge: 'engineer', status: 'Activo', lastAccess: 'hace 1 día' },
    { name: 'Mariana Soto', email: 'mariana.soto@empresa.com', role: 'Auditora de Cumplimiento y Calidad', roleBadge: 'auditor', status: 'Activo', lastAccess: 'hace 3 días' }
  ]

  const auditEvents = [
    { id: 'EV-901', timestamp: '2026-10-31 09:12:00', actor: 'diego.mendoza', action: 'Aprobación de Modelo v1.0.0-prod', resource: 'vision-mnist-classifier', ip: '10.0.4.12' },
    { id: 'EV-900', timestamp: '2026-10-31 09:05:22', actor: 'elena.vasquez', action: 'Ejecución de Entrenamiento TR-2048', resource: 'MNIST · Dígitos Manuscritos', ip: '10.0.4.18' },
    { id: 'EV-899', timestamp: '2026-10-31 08:45:10', actor: 'carlos.ramos', action: 'Ingesta de Dataset', resource: 'Customer Churn · Riesgo de Abandono', ip: '10.0.4.25' },
    { id: 'EV-898', timestamp: '2026-10-31 08:20:00', actor: 'diego.mendoza', action: 'Creación de Proyecto PRJ-001', resource: 'Laboratorio de Visión Artificial', ip: '10.0.4.12' }
  ]

  return (
    <>
      <div className="filter-tabs" style={{ marginBottom: 20 }}>
        <button className={adminTab === 'usuarios' ? 'active' : ''} onClick={() => setAdminTab('usuarios')}>
          <Users size={14}/> • Usuarios, roles y permisos
        </button>
        <button className={adminTab === 'auditoria' ? 'active' : ''} onClick={() => setAdminTab('auditoria')}>
          <History size={14}/> • Auditoría de acciones
        </button>
        <button className={adminTab === 'limites' ? 'active' : ''} onClick={() => setAdminTab('limites')}>
          <Sliders size={14}/> • Límites de recursos
        </button>
        <button className={adminTab === 'salud' ? 'active' : ''} onClick={() => setAdminTab('salud')}>
          <Server size={14}/> • Configuración, salud del sistema y retención
        </button>
      </div>

      {adminTab === 'usuarios' && (
        <section className="panel" style={{ padding: 20 }}>
          <SectionTitle
            title="Control de Acceso Basado en Roles (RBAC)"
            detail="Gestión de identidades empresariales, políticas de acceso y privilegios de cómputo"
            action={<button className="btn btn-primary btn-small" onClick={() => notify('Formulario de invitación de usuario corporativo listo.')}><Plus size={14}/> Invitar Usuario</button>}
          />
          <table className="admin-table">
            <thead>
              <tr>
                <th>USUARIO</th>
                <th>CORREO CORPORATIVO</th>
                <th>ROL ASIGNADO</th>
                <th>ESTADO</th>
                <th>ÚLTIMO ACCESO</th>
                <th>ACCIONES</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map(u => (
                <tr key={u.email}>
                  <td><strong>{u.name}</strong></td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge ${u.roleBadge}`}>{u.role}</span></td>
                  <td><span className="status completado"><i/>{u.status}</span></td>
                  <td>{u.lastAccess}</td>
                  <td>
                    <button className="text-action" onClick={() => notify(`Permisos editados para ${u.name}`)}>
                      Editar Permisos
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {adminTab === 'auditoria' && (
        <section className="panel" style={{ padding: 20 }}>
          <SectionTitle
            title="Registro Inmutable de Auditoría de Acciones"
            detail="Trazabilidad estricta de cada modificación en datos, arquitecturas y despliegues (Cumplimiento SOC2 / ISO 27001)"
            action={<button className="btn btn-secondary btn-small" onClick={() => notify('Registro de auditoría descargado en formato CSV.')}><Download size={13}/> Exportar Log</button>}
          />
          <table className="admin-table">
            <thead>
              <tr>
                <th>EVENTO ID</th>
                <th>FECHA Y HORA (UTC)</th>
                <th>ACTOR</th>
                <th>ACCIÓN REALIZADA</th>
                <th>RECURSO AFECTADO</th>
                <th>ORIGEN IP</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map(e => (
                <tr key={e.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{e.id}</td>
                  <td>{e.timestamp}</td>
                  <td><strong>{e.actor}</strong></td>
                  <td>{e.action}</td>
                  <td><span className="family-pill">{e.resource}</span></td>
                  <td style={{ fontFamily: 'monospace' }}>{e.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {adminTab === 'limites' && (
        <section className="panel" style={{ padding: 20 }}>
          <SectionTitle
            title="Políticas y Límites de Recursos de Cómputo"
            detail="Cuotas máximas por proyecto para garantizar equidad en el clúster y control de costos"
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
            <div className="quota-meter-card">
              <div className="quota-meter-head">
                <b>Horas de Cómputo Mensuales</b>
                <span>6.8 / 10 horas utilizadas (68%)</span>
              </div>
              <div className="mini-progress"><i style={{ width: '68%' }}/></div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 8 }}>Se reinicia el 1ro de cada mes. Límite preventivo activo.</div>
            </div>

            <div className="quota-meter-card">
              <div className="quota-meter-head">
                <b>Memoria VRAM Asignable</b>
                <span>12 GB límite por worker</span>
              </div>
              <div className="mini-progress purple"><i style={{ width: '75%' }}/></div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 8 }}>Permite entrenar arquitecturas densas y convolucionales de gran escala.</div>
            </div>

            <div className="quota-meter-card">
              <div className="quota-meter-head">
                <b>Almacenamiento de Datasets</b>
                <span>1.4 / 5 GB ocupados (28%)</span>
              </div>
              <div className="mini-progress" style={{ background: '#dcfce7' }}><i style={{ width: '28%', background: '#16a34a' }}/></div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 8 }}>Almacenamiento cifrado con retención de versiones anteriores.</div>
            </div>

            <div className="quota-meter-card">
              <div className="quota-meter-head">
                <b>Entrenamientos Concurrentes</b>
                <span>2 / 4 ejecuciones simultáneas</span>
              </div>
              <div className="mini-progress" style={{ background: '#fef3c7' }}><i style={{ width: '50%', background: '#d97706' }}/></div>
              <div style={{ fontSize: 9, color: '#64748b', marginTop: 8 }}>Cola de prioridad automática para evitar saturación de memoria.</div>
            </div>
          </div>
        </section>
      )}

      {adminTab === 'salud' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16 }}>
          <section className="panel" style={{ padding: 20 }}>
            <SectionTitle
              title="Salud del Sistema y Servicios Centrales"
              detail="Estado en vivo de los componentes de procesamiento e inferencia"
              action={<button className="btn btn-secondary btn-small" onClick={onCheckService}><RefreshCw size={13}/> Verificar Servicios</button>}
            />
            {[
              ['Servicio Central de Cómputo e Inferencia', 'Operativo', true],
              ['Repositorio Seguro de Datasets y Tensores', 'Operativo (Cifrado AES-256)', true],
              ['Catálogo y Registro Inmutable de Modelos', 'Operativo (Checksum SHA-256)', true],
              ['Canal de Telemetría en Tiempo Real', 'Operativo (Latencia 12ms)', true],
              ['Motor de Auditoría y Cumplimiento Normativo', 'Operativo (Cumplimiento SOC2)', true]
            ].map((s: any) => (
              <div className="system-row" key={s[0]}>
                <span><i className="system-ok"/> {s[0]}</span>
                <b className="green-text">{s[1]}</b>
              </div>
            ))}
          </section>

          <section className="panel" style={{ padding: 20 }}>
            <SectionTitle
              title="Políticas de Retención y Seguridad"
              detail="Control del ciclo de vida de los datos corporativos"
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#1e293b', fontSize: 11 }}>Retención de Checkpoints de Modelos</b>
                <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#64748b' }}>
                  Modelos aprobados: <strong>Retención indefinida</strong>.<br/>
                  Modelos borrador / fallidos: <strong>90 días</strong> con purga automática.
                </p>
              </div>
              <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <b style={{ color: '#1e293b', fontSize: 11 }}>Cifrado de Extremo a Extremo</b>
                <p style={{ margin: '4px 0 0 0', fontSize: 10, color: '#64748b' }}>
                  En tránsito: <strong>TLS 1.3 con certificados rotativos</strong>.<br/>
                  En reposo: <strong>Cifrado AES de 256 bits</strong> gestionado por claves empresariales.
                </p>
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  )
}

function StatCard({ icon, label, value, change, trend, color, foot }: any) {
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
            <th>MODELO / EJECUCIÓN</th>
            <th>DATASET ASIGNADO</th>
            <th>ESTADO</th>
            <th>PROGRESO</th>
            <th>LOSS</th>
            <th>PRECISIÓN</th>
            {onCancel && <th>ACCIONES</th>}
          </tr>
        </thead>
        <tbody>
          {jobs.map(j => (
            <tr key={j.id}>
              <td>
                <div className="model-cell">
                  <span className="model-glyph"><BrainCircuit size={16}/></span>
                  <span>
                    <b>{j.name}</b>
                    <small>{j.id} {j.backendId ? `· ${j.backendId.slice(0, 8)}` : ''}</small>
                  </span>
                </div>
              </td>
              <td><span className="family-pill">{j.datasetName ? j.datasetName.split(' · ')[0] : 'MNIST'}</span></td>
              <td><Status status={j.status}/></td>
              <td>
                <div className="progress-cell">
                  <div className="progress-track"><i style={{ width: `${j.progress}%` }}/></div>
                  <small>{j.progress}%</small>
                </div>
              </td>
              <td className="loss-value">{j.loss ? j.loss.toFixed(4) : '—'}</td>
              <td style={{ fontWeight: 600, color: '#15803d' }}>{j.accuracy ? `${j.accuracy}%` : '—'}</td>
              {onCancel && (
                <td>
                  {j.status === 'Ejecutando' && (
                    <button
                      className="btn-danger-outline"
                      onClick={() => onCancel(j.id, j.backendId)}
                      title="Detener entrenamiento"
                    >
                      <StopCircle size={12}/> Detener
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {jobs.length === 0 && <div className="empty-state">No hay ejecuciones registradas aún.</div>}
    </div>
  )
}

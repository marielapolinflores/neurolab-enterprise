import { useState } from 'react'
import {
  BrainCircuit,
  Network,
  Database,
  Cpu,
  ShieldCheck,
  Activity,
  ArrowRight,
  Sparkles,
  ScanEye,
  Layers3,
  Zap,
  Github,
  Sliders,
  CheckCircle2,
  LockKeyhole,
  FileChartColumn,
  FolderKanban,
  LayoutDashboard,
  BookOpen
} from 'lucide-react'
import './ladingpage.css'

export interface LandingPageProps {
  onGoToLogin: () => void
  onGoToPlatform?: () => void
  isLoggedIn?: boolean
  currentUser?: { display_name?: string; email?: string; role?: string } | null
}

const features = [
  {
    icon: BrainCircuit,
    title: 'Inteligencia Artificial',
    description: 'Desarrollo y gestión de modelos inteligentes para resolver problemas mediante algoritmos avanzados y deep learning.'
  },
  {
    icon: Network,
    title: 'Diseño de Redes Neuronales',
    description: 'Construcción visual, configuración hiperparamétrica y topologías multicapa con soporte Keras/TensorFlow.'
  },
  {
    icon: Database,
    title: 'Gestión de Datasets',
    description: 'Organización, validación de schemas y preparación de conjuntos de datos empresariales y benchmarks estándar.'
  },
  {
    icon: Activity,
    title: 'Evaluación y Métricas',
    description: 'Análisis minucioso de curvas de pérdida (loss), precisión (accuracy), matrices de confusión y métricas ROC/AUC.'
  },
  {
    icon: ScanEye,
    title: 'Visión Computacional',
    description: 'Procesamiento, convolución y análisis inteligente de imágenes mediante modelos neuronales convolucionales (CNN).'
  },
  {
    icon: ShieldCheck,
    title: 'Administración y Auditoría Segura',
    description: 'Control de roles (RBAC), registro de eventos de auditoría del sistema y gestión centralizada de usuarios.'
  }
]

const modulesList = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Proyectos', icon: FolderKanban },
  { name: 'Fundamentos', icon: BookOpen },
  { name: 'Network Designer', icon: Network },
  { name: 'Datasets', icon: Database },
  { name: 'Entrenamientos', icon: Cpu },
  { name: 'Evaluación', icon: Activity },
  { name: 'Modelos', icon: Zap },
  { name: 'Reportes', icon: FileChartColumn }
]

export default function LandingPage({
  onGoToLogin,
  onGoToPlatform,
  isLoggedIn = false,
  currentUser = null
}: LandingPageProps) {
  // Mini playground interactivo para la landing
  const [x1, setX1] = useState(0.8)
  const [x2, setX2] = useState(-0.4)
  const [w1, setW1] = useState(1.5)
  const [w2, setW2] = useState(0.9)
  const [bias, setBias] = useState(0.2)
  const [actType, setActType] = useState<'relu' | 'sigmoid' | 'tanh'>('sigmoid')

  // Cálculo z = x1*w1 + x2*w2 + bias
  const z = Number((x1 * w1 + x2 * w2 + bias).toFixed(3))
  let activation = 0
  if (actType === 'relu') {
    activation = Math.max(0, z)
  } else if (actType === 'sigmoid') {
    activation = 1 / (1 + Math.exp(-z))
  } else if (actType === 'tanh') {
    activation = Math.tanh(z)
  }
  const formattedActivation = Number(activation.toFixed(3))

  const handlePrimaryAction = () => {
    if (isLoggedIn && onGoToPlatform) {
      onGoToPlatform()
    } else {
      onGoToLogin()
    }
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="nl-landing" id="inicio">
      {/* BACKGROUND FLARES */}
      <div className="nl-bg-flare-1" />
      <div className="nl-bg-flare-2" />
      <div className="nl-bg-flare-3" />

      {/* NAVBAR */}
      <header className="nl-navbar">
        <div className="nl-nav-container">
          <button
            type="button"
            onClick={() => scrollToSection('inicio')}
            className="nl-brand-link"
          >
            <div className="nl-brand-icon-box">
              <BrainCircuit size={26} />
            </div>
            <div>
              <div className="nl-brand-title">NEUROLAB</div>
              <span className="nl-brand-subtitle">ENTERPRISE</span>
            </div>
          </button>

          <nav className="nl-nav-links">
            <button
              type="button"
              onClick={() => scrollToSection('inicio')}
              className="nl-nav-link"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('nosotros')}
              className="nl-nav-link"
            >
              Nosotros
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('funcionalidades')}
              className="nl-nav-link"
            >
              Funcionalidades
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('simulador')}
              className="nl-nav-link"
            >
              Simulador
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('modulos')}
              className="nl-nav-link"
            >
              Módulos
            </button>
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isLoggedIn && currentUser && (
              <span style={{ fontSize: '11px', color: '#94a3b8' }} className="hidden md:inline">
                Hola, <b style={{ color: '#22d3ee' }}>{currentUser.display_name}</b>
              </span>
            )}

            <button
              type="button"
              onClick={handlePrimaryAction}
              className="nl-btn-nav-login"
            >
              {isLoggedIn ? 'Ir a la plataforma' : 'Acceder'}
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="nl-hero-section">
        <div className="nl-container">
          <div className="nl-hero-grid">
            {/* HERO LEFT */}
            <div>
              <div className="nl-kicker-badge">
                <Sparkles size={14} />
                <span>PLATAFORMA EMPRESARIAL v2.4</span>
              </div>

              <h1 className="nl-hero-title">
                El futuro de la
                <span className="nl-gradient-text">Inteligencia Artificial</span>
                aplicada a tu empresa.
              </h1>

              <p className="nl-hero-description">
                Un entorno integral de alto rendimiento para diseñar, entrenar,
                gestionar y desplegar redes neuronales y algoritmos de Machine Learning
                con telemetría y monitoreo en tiempo real.
              </p>

              <div className="nl-hero-buttons">
                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  className="nl-btn-primary"
                >
                  {isLoggedIn ? 'Abrir Plataforma' : 'Explorar plataforma'}
                  <ArrowRight size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => scrollToSection('funcionalidades')}
                  className="nl-btn-secondary"
                >
                  Conocer más
                </button>
              </div>

              <div className="nl-hero-stats">
                <div className="nl-stat-item">
                  <b>AI</b>
                  <span>Inteligencia Artificial</span>
                </div>
                <div className="nl-stat-item">
                  <b>ML</b>
                  <span>Machine Learning</span>
                </div>
                <div className="nl-stat-item">
                  <b>CV</b>
                  <span>Computer Vision</span>
                </div>
                <div className="nl-stat-item">
                  <b>TF</b>
                  <span>TensorFlow / Keras</span>
                </div>
              </div>
            </div>

            {/* HERO RIGHT (VISUAL TECNOLÓGICO) */}
            <div className="nl-visual-wrapper">
              <div className="nl-visual-glow" />

              <div className="nl-visual-card">
                <div className="nl-visual-card-header">
                  <div className="nl-visual-title-group">
                    <p>NEUROLAB CORE</p>
                    <h3>AI Intelligence Engine</h3>
                  </div>

                  <span className="nl-system-status-pill">
                    <span className="nl-pulse-dot" />
                    SYSTEM ONLINE
                  </span>
                </div>

                {/* ANIMATED ORBIT STAGE */}
                <div className="nl-orbit-stage">
                  <div className="nl-orbit-ring-outer" />
                  <div className="nl-orbit-ring-inner" />

                  <div className="nl-core-orb">
                    <BrainCircuit size={60} />
                  </div>

                  <div className="nl-satellite-icon nl-sat-1" title="Topología de Red">
                    <Network size={20} />
                  </div>
                  <div className="nl-satellite-icon nl-sat-2" title="Unidad de Procesamiento">
                    <Cpu size={20} />
                  </div>
                  <div className="nl-satellite-icon nl-sat-3" title="Dataset Repository">
                    <Database size={20} />
                  </div>
                </div>

                {/* TELEMETRY DATA */}
                <div className="nl-visual-telemetry">
                  <div className="nl-telemetry-box">
                    <p className="nl-telemetry-label">NETWORK</p>
                    <p className="nl-telemetry-val">ACTIVE</p>
                  </div>
                  <div className="nl-telemetry-box">
                    <p className="nl-telemetry-label">AI ENGINE</p>
                    <p className="nl-telemetry-val">READY</p>
                  </div>
                  <div className="nl-telemetry-box">
                    <p className="nl-telemetry-label">LATENCY</p>
                    <p className="nl-telemetry-val">12 ms</p>
                  </div>
                </div>
              </div>

              {/* FLOATING STATUS BADGE */}
              <div className="nl-floating-tag">
                <Zap size={22} style={{ color: '#06b6d4' }} />
                <div className="nl-floating-tag-text">
                  <b>NEURAL COMPUTING</b>
                  <span>Innovación Inteligente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN SOBRE NOSOTROS */}
      <section id="nosotros" className="nl-section-about">
        <div className="nl-container">
          <div className="nl-about-inner">
            <span className="nl-section-kicker">SOBRE NEUROLAB</span>
            <h2 className="nl-section-title">
              Tecnología inteligente para transformar ideas en soluciones.
            </h2>
            <p className="nl-about-text">
              NeuroLab Enterprise unifica herramientas avanzadas de inteligencia artificial,
              aprendizaje automático y análisis computacional en una plataforma centralizada,
              facilitando la experimentación, preparación de datos, entrenamiento distribuido
              y validación rigurosa de modelos para la industria moderna.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN FUNCIONALIDADES */}
      <section id="funcionalidades" className="nl-section-features">
        <div className="nl-container">
          <div className="nl-section-header">
            <span className="nl-section-kicker">CAPACIDADES EMPRESARIALES</span>
            <h2>Funcionalidades principales</h2>
            <p>
              Herramientas de nivel profesional diseñadas para abarcar todo el ciclo
              de vida de desarrollo de inteligencia artificial.
            </p>
          </div>

          <div className="nl-features-grid">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="nl-feature-card">
                  <div className="nl-feature-icon-box">
                    <Icon size={26} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* SECCIÓN SIMULADOR INTERACTIVO / PLAYGROUND */}
      <section id="simulador" className="nl-section-sim">
        <div className="nl-container">
          <div className="nl-sim-box">
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span className="nl-section-kicker">DEMOSTRACIÓN INTERACTIVA</span>
              <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '28px', margin: '0 0 10px', color: '#fff' }}>
                Simulador de Perceptrón en Tiempo Real
              </h2>
              <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '640px', margin: '0 auto' }}>
                Prueba en vivo cómo una neurona artificial calcula la suma ponderada de entradas
                y aplica una función de activación para generar su salida.
              </p>
            </div>

            <div className="nl-sim-grid">
              {/* CONTROLES */}
              <div className="nl-sim-controls">
                <div className="nl-sim-control-group">
                  <label>
                    <span>Entrada $x_1$</span>
                    <b>{x1}</b>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={x1}
                    onChange={(e) => setX1(parseFloat(e.target.value))}
                  />
                </div>

                <div className="nl-sim-control-group">
                  <label>
                    <span>Peso $w_1$</span>
                    <b>{w1}</b>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={w1}
                    onChange={(e) => setW1(parseFloat(e.target.value))}
                  />
                </div>

                <div className="nl-sim-control-group">
                  <label>
                    <span>Entrada $x_2$</span>
                    <b>{x2}</b>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={x2}
                    onChange={(e) => setX2(parseFloat(e.target.value))}
                  />
                </div>

                <div className="nl-sim-control-group">
                  <label>
                    <span>Peso $w_2$</span>
                    <b>{w2}</b>
                  </label>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={w2}
                    onChange={(e) => setW2(parseFloat(e.target.value))}
                  />
                </div>

                <div className="nl-sim-control-group" style={{ gridColumn: 'span 2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ margin: 0 }}>
                      <span>Sesgo (Bias $b$):</span> <b>{bias}</b>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['sigmoid', 'relu', 'tanh'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setActType(type)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            border: '1px solid',
                            borderColor: actType === type ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                            background: actType === type ? 'rgba(6,182,212,0.2)' : 'transparent',
                            color: actType === type ? '#22d3ee' : '#94a3b8',
                            cursor: 'pointer'
                          }}
                        >
                          {type.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="range"
                    min="-2"
                    max="2"
                    step="0.1"
                    value={bias}
                    onChange={(e) => setBias(parseFloat(e.target.value))}
                  />
                </div>
              </div>

              {/* RESULTADOS */}
              <div className="nl-sim-result-card">
                <span style={{ fontSize: '11px', letterSpacing: '1px', color: '#64748b', fontWeight: 700 }}>
                  SALIDA ACTIVADA $f(z)$
                </span>

                <div className="nl-sim-orb-val">
                  {formattedActivation}
                </div>

                <div style={{ fontSize: '12px', color: '#94a3b8', background: '#0a1727', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)', width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span>Suma neta $z$:</span>
                    <b style={{ color: '#22d3ee' }}>{z}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Activación:</span>
                    <b style={{ color: '#ffffff' }}>{actType.toUpperCase()}</b>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN MÓDULOS */}
      <section id="modulos" className="nl-section-modules">
        <div className="nl-container">
          <div className="nl-modules-grid">
            <div className="nl-modules-left">
              <span className="nl-section-kicker">ECOSISTEMA DIGITAL</span>
              <h2>
                Todo lo que necesitas,
                <span style={{ color: '#22d3ee', display: 'block' }}>en un solo lugar.</span>
              </h2>
              <p>
                Accede a un entorno organizado modularmente que permite
                gestionar proyectos, preparar datos, entrenar redes neuronales
                y consultar resultados de forma centralizada con trazabilidad completa.
              </p>

              <button
                type="button"
                onClick={handlePrimaryAction}
                className="nl-btn-primary"
              >
                {isLoggedIn ? 'Acceder a Módulos' : 'Ingresar al sistema'}
                <ArrowRight size={18} />
              </button>
            </div>

            <div className="nl-modules-cards">
              {modulesList.map((m, index) => {
                const Icon = m.icon
                return (
                  <div key={m.name} className="nl-module-card">
                    <Icon className="nl-module-card-icon" size={24} />
                    <p>{m.name}</p>
                    <span>MÓDULO {String(index + 1).padStart(2, '0')}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="nl-section-cta">
        <div className="nl-container">
          <div className="nl-cta-card">
            <div className="nl-cta-glow" />

            <div className="nl-cta-inner">
              <Sparkles className="nl-cta-icon" size={36} />
              <h2>
                Explora el potencial de la
                <span style={{ color: '#22d3ee', display: 'block' }}>Inteligencia Artificial</span>
              </h2>
              <p>
                Ingresa a NeuroLab Enterprise y descubre un laboratorio digital diseñado
                para la innovación, el análisis predictivo y el desarrollo tecnológico seguro.
              </p>

              <button
                type="button"
                onClick={handlePrimaryAction}
                className="nl-btn-primary"
                style={{ padding: '16px 36px', fontSize: '15px' }}
              >
                {isLoggedIn ? 'Ir a la plataforma' : 'Acceder a la plataforma'}
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="nl-footer">
        <div className="nl-footer-container">
          <div className="nl-footer-brand">
            <BrainCircuit size={28} style={{ color: '#06b6d4' }} />
            <div>
              <b>NEUROLAB ENTERPRISE</b>
              <small>ARTIFICIAL INTELLIGENCE PLATFORM</small>
            </div>
          </div>

          <p className="nl-footer-copy">
            © {new Date().getFullYear()} NeuroLab Enterprise. Todos los derechos reservados.
          </p>

          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="nl-footer-link"
            aria-label="GitHub Repository"
          >
            <Github size={22} />
          </a>
        </div>
      </footer>
    </div>
  )
}

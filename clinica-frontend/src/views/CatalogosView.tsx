import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { catalogoService } from '../services/catalogoService';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { FeedbackAlert } from '../components/FeedbackAlert';
import type { CategoriaExamen, SignoClinico } from '../types/catalogo';
import {
  Layers,
  Activity,
  PlusCircle,
  Search,
  X,
  Save,
  Tag,
  Bookmark,
  LayoutGrid,
  List,
  ArrowRight,
  CheckCircle2,
  Stethoscope,
  Filter,
} from 'lucide-react';

// Esquema Zod para Categoría
const categoriaSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  descripcion: z
    .string()
    .max(255, 'La descripción no puede superar los 255 caracteres')
    .optional(),
});

type CategoriaFormData = z.infer<typeof categoriaSchema>;

// Esquema Zod para Signo Clínico
const signoSchema = z.object({
  nombre: z
    .string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(150, 'El nombre no puede superar los 150 caracteres'),
  descripcion: z.string().optional(),
  idCategoria: z.coerce.number().min(1, 'Debe seleccionar una categoría'),
});

type SignoFormData = z.infer<typeof signoSchema>;

export const CatalogosView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'categorias' | 'signos'>('categorias');
  const [categorias, setCategorias] = useState<CategoriaExamen[]>([]);
  const [signos, setSignos] = useState<SignoClinico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modo de visualización: Tarjetas (Cards) o Tabla
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Filtros
  const [searchCategoria, setSearchCategoria] = useState('');
  const [searchSigno, setSearchSigno] = useState('');
  const [filtroCategoriaId, setFiltroCategoriaId] = useState<number | 'todas'>('todas');

  // Modales
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isSignoModalOpen, setIsSignoModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formularios
  const catForm = useForm<CategoriaFormData>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nombre: '', descripcion: '' },
  });

  const signoForm = useForm<SignoFormData>({
    resolver: zodResolver(signoSchema),
    defaultValues: { nombre: '', descripcion: '', idCategoria: 0 },
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [cats, sgns] = await Promise.all([
        catalogoService.getCategorias(),
        catalogoService.getSignos(),
      ]);
      setCategorias(cats);
      setSignos(sgns);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al cargar los catálogos.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Categoría
  const onCategoriaSubmit = async (data: CategoriaFormData) => {
    try {
      setIsSubmitting(true);
      const nueva = await catalogoService.createCategoria({
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
      });
      setCategorias((prev) => [...prev, nueva]);
      setFeedback({
        type: 'success',
        message: `Categoría "${nueva.nombre}" registrada exitosamente.`,
      });
      catForm.reset();
      setIsCatModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar la categoría.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Signo Clínico
  const onSignoSubmit = async (data: SignoFormData) => {
    try {
      setIsSubmitting(true);
      const nuevo = await catalogoService.createSigno({
        nombre: data.nombre.trim(),
        descripcion: data.descripcion?.trim() || null,
        idCategoria: data.idCategoria,
      });
      setSignos((prev) => [...prev, nuevo]);
      setFeedback({
        type: 'success',
        message: `Signo Clínico "${nuevo.nombre}" registrado exitosamente.`,
      });
      signoForm.reset();
      setIsSignoModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar el signo clínico.';
      setFeedback({ type: 'error', message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Métricas calculadas para la barra superior de estadísticas
  const stats = useMemo(() => {
    const catsConSignos = new Set(signos.map((s) => s.idCategoria)).size;
    return {
      totalCategorias: categorias.length,
      totalSignos: signos.length,
      categoriasActivas: catsConSignos,
    };
  }, [categorias, signos]);

  const filteredCategorias = useMemo(() => {
    return categorias.filter(
      (c) =>
        c.nombre.toLowerCase().includes(searchCategoria.toLowerCase()) ||
        (c.descripcion && c.descripcion.toLowerCase().includes(searchCategoria.toLowerCase()))
    );
  }, [categorias, searchCategoria]);

  const filteredSignos = useMemo(() => {
    return signos.filter((s) => {
      const matchSearch =
        s.nombre.toLowerCase().includes(searchSigno.toLowerCase()) ||
        (s.descripcion && s.descripcion.toLowerCase().includes(searchSigno.toLowerCase())) ||
        (s.categoria && s.categoria.toLowerCase().includes(searchSigno.toLowerCase()));
      const matchCat =
        filtroCategoriaId === 'todas' || s.idCategoria === filtroCategoriaId;
      return matchSearch && matchCat;
    });
  }, [signos, searchSigno, filtroCategoriaId]);

  const getSignosPorCategoria = (idCategoria: number) => {
    return signos.filter((s) => s.idCategoria === idCategoria).length;
  };

  const categoriaFiltradaNombre = useMemo(() => {
    if (filtroCategoriaId === 'todas') return null;
    return categorias.find((c) => c.idCategoria === filtroCategoriaId)?.nombre || null;
  }, [categorias, filtroCategoriaId]);

  return (
    <main className="container page-content" id="main-content">
      {/* Encabezado */}
      <section className="page-header" aria-labelledby="catalogos-title">
        <div>
          <h1 id="catalogos-title" className="page-heading">
            Catálogos Clínicos
          </h1>
          <p className="page-subtext">
            Directorio maestro de disciplinas diagnósticas y signos clínicos para la evaluación física y neurológica de pacientes.
          </p>
        </div>
        <div className="header-actions">
          {activeTab === 'categorias' ? (
            <button
              type="button"
              className="btn btn-primary min-touch"
              onClick={() => {
                setFeedback(null);
                catForm.reset();
                setIsCatModalOpen(true);
              }}
            >
              <PlusCircle size={18} aria-hidden="true" />
              <span>Nueva Categoría</span>
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary min-touch"
              onClick={() => {
                setFeedback(null);
                signoForm.reset();
                setIsSignoModalOpen(true);
              }}
            >
              <PlusCircle size={18} aria-hidden="true" />
              <span>Nuevo Signo Clínico</span>
            </button>
          )}
        </div>
      </section>

      {/* Alertas */}
      {feedback && (
        <FeedbackAlert
          type={feedback.type}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
      {error && <FeedbackAlert type="error" message={error} onClose={() => setError(null)} />}

      {/* Barra de Estadísticas Rápidas (KPIs) */}
      {!isLoading && (
        <section className="catalog-stats-bar" aria-label="Resumen numérico de catálogos">
          <div className="catalog-stat-chip">
            <div className="catalog-stat-icon-wrapper catalog-stat-icon-blue" aria-hidden="true">
              <Layers size={24} />
            </div>
            <div className="catalog-stat-content">
              <span className="catalog-stat-number">{stats.totalCategorias}</span>
              <span className="catalog-stat-label">Categorías de Examen</span>
            </div>
          </div>

          <div className="catalog-stat-chip">
            <div className="catalog-stat-icon-wrapper catalog-stat-icon-teal" aria-hidden="true">
              <Activity size={24} />
            </div>
            <div className="catalog-stat-content">
              <span className="catalog-stat-number">{stats.totalSignos}</span>
              <span className="catalog-stat-label">Pruebas y Signos Clínicos</span>
            </div>
          </div>

          <div className="catalog-stat-chip">
            <div className="catalog-stat-icon-wrapper catalog-stat-icon-emerald" aria-hidden="true">
              <CheckCircle2 size={24} />
            </div>
            <div className="catalog-stat-content">
              <span className="catalog-stat-number">{stats.categoriasActivas}</span>
              <span className="catalog-stat-label">Categorías con Pruebas Activas</span>
            </div>
          </div>
        </section>
      )}

      {/* Pestañas de Navegación Segmentadas */}
      <div className="catalog-tabs" role="tablist" aria-label="Secciones de catálogos">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'categorias'}
          aria-controls="tab-categorias"
          id="tab-btn-categorias"
          className={`tab-btn min-touch ${activeTab === 'categorias' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('categorias')}
        >
          <Layers size={18} aria-hidden="true" />
          <span>Categorías de Examen ({categorias.length})</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'signos'}
          aria-controls="tab-signos"
          id="tab-btn-signos"
          className={`tab-btn min-touch ${activeTab === 'signos' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('signos')}
        >
          <Activity size={18} aria-hidden="true" />
          <span>Signos Clínicos ({signos.length})</span>
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton rows={4} message="Cargando información del catálogo clínico..." />
      ) : (
        <>
          {/* TAB 1: CATEGORÍAS */}
          {activeTab === 'categorias' && (
            <section
              id="tab-categorias"
              role="tabpanel"
              aria-labelledby="tab-btn-categorias"
              className="catalog-section"
            >
              {/* Barra de herramientas y filtros */}
              <div className="catalog-toolbar">
                <div className="catalog-toolbar-left">
                  <div className="search-bar catalog-search-wrapper">
                    <Search size={18} className="search-icon" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Buscar categorías por nombre o descripción..."
                      value={searchCategoria}
                      onChange={(e) => setSearchCategoria(e.target.value)}
                      className="search-input"
                      aria-label="Buscar categorías de examen"
                    />
                    {searchCategoria && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setSearchCategoria('')}
                        aria-label="Limpiar búsqueda"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="catalog-toolbar-right">
                  {/* Selector de modo de vista: Tarjetas o Tabla */}
                  <div className="view-mode-toggle" role="group" aria-label="Modo de visualización">
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'cards' ? 'view-mode-btn-active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      aria-pressed={viewMode === 'cards'}
                      title="Vista en cuadrícula de tarjetas"
                    >
                      <LayoutGrid size={16} aria-hidden="true" />
                      <span>Tarjetas</span>
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'table' ? 'view-mode-btn-active' : ''}`}
                      onClick={() => setViewMode('table')}
                      aria-pressed={viewMode === 'table'}
                      title="Vista en tabla detallada"
                    >
                      <List size={16} aria-hidden="true" />
                      <span>Tabla</span>
                    </button>
                  </div>
                </div>
              </div>

              {filteredCategorias.length === 0 ? (
                <div className="empty-state">
                  <Bookmark size={48} className="empty-icon" aria-hidden="true" />
                  <h2>No se encontraron categorías</h2>
                  <p>No existen disciplinas diagnósticas que coincidan con la búsqueda.</p>
                </div>
              ) : viewMode === 'cards' ? (
                /* VISTA TARJETAS: CATEGORÍAS */
                <div className="catalog-cards-grid" aria-label="Cuadrícula de categorías">
                  {filteredCategorias.map((cat) => {
                    const countSignos = getSignosPorCategoria(cat.idCategoria);
                    return (
                      <article key={cat.idCategoria} className="catalog-card">
                        <header className="catalog-card-header">
                          <div className="catalog-card-title-group">
                            <div className="catalog-card-icon-badge" aria-hidden="true">
                              <Layers size={20} />
                            </div>
                            <h2 className="catalog-card-title">{cat.nombre}</h2>
                          </div>
                          <span className="catalog-card-id-badge">#{cat.idCategoria}</span>
                        </header>

                        <div className="catalog-card-body">
                          <p className="catalog-card-desc">
                            {cat.descripcion || <em className="text-muted">Sin descripción registrada para esta categoría.</em>}
                          </p>
                        </div>

                        <footer className="catalog-card-footer">
                          <span className="catalog-card-badge-count">
                            <Stethoscope size={14} aria-hidden="true" />
                            <span>
                              {countSignos} {countSignos === 1 ? 'signo clínico' : 'signos clínicos'}
                            </span>
                          </span>

                          <button
                            type="button"
                            className="catalog-card-action-link min-touch"
                            onClick={() => {
                              setActiveTab('signos');
                              setFiltroCategoriaId(cat.idCategoria);
                            }}
                            title={`Ver signos de ${cat.nombre}`}
                          >
                            <span>Ver signos</span>
                            <ArrowRight size={14} aria-hidden="true" />
                          </button>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* VISTA TABLA: CATEGORÍAS */
                <div className="table-container">
                  <table className="data-table" aria-label="Listado de categorías de examen">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '80px' }}>ID</th>
                        <th scope="col">Nombre de la Categoría</th>
                        <th scope="col">Descripción Clínica</th>
                        <th scope="col">Signos Asociados</th>
                        <th scope="col" style={{ textAlign: 'right' }}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategorias.map((cat) => {
                        const countSignos = getSignosPorCategoria(cat.idCategoria);
                        return (
                          <tr key={cat.idCategoria}>
                            <td>
                              <span className="badge badge-outline">#{cat.idCategoria}</span>
                            </td>
                            <td>
                              <strong>{cat.nombre}</strong>
                            </td>
                            <td>{cat.descripcion || <em className="text-muted">Sin descripción</em>}</td>
                            <td>
                              <span className="badge badge-blue">
                                {countSignos} {countSignos === 1 ? 'signo clínico' : 'signos clínicos'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                type="button"
                                className="catalog-card-action-link min-touch"
                                onClick={() => {
                                  setActiveTab('signos');
                                  setFiltroCategoriaId(cat.idCategoria);
                                }}
                              >
                                <span>Ver pruebas</span>
                                <ArrowRight size={14} aria-hidden="true" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* TAB 2: SIGNOS CLÍNICOS */}
          {activeTab === 'signos' && (
            <section
              id="tab-signos"
              role="tabpanel"
              aria-labelledby="tab-btn-signos"
              className="catalog-section"
            >
              {/* Barra de herramientas y filtros */}
              <div className="catalog-toolbar">
                <div className="catalog-toolbar-left">
                  <div className="search-bar catalog-search-wrapper">
                    <Search size={18} className="search-icon" aria-hidden="true" />
                    <input
                      type="search"
                      placeholder="Buscar signos clínicos por nombre o descripción..."
                      value={searchSigno}
                      onChange={(e) => setSearchSigno(e.target.value)}
                      className="search-input"
                      aria-label="Buscar signos clínicos"
                    />
                    {searchSigno && (
                      <button
                        type="button"
                        className="search-clear-btn"
                        onClick={() => setSearchSigno('')}
                        aria-label="Limpiar búsqueda"
                      >
                        <X size={16} aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  <div className="form-group catalog-filter-select" style={{ margin: 0 }}>
                    <label htmlFor="filtro-categoria" className="sr-only">
                      Filtrar por categoría
                    </label>
                    <select
                      id="filtro-categoria"
                      className="form-input"
                      value={filtroCategoriaId}
                      onChange={(e) =>
                        setFiltroCategoriaId(e.target.value === 'todas' ? 'todas' : Number(e.target.value))
                      }
                    >
                      <option value="todas">Todas las categorías ({signos.length} signos)</option>
                      {categorias.map((c) => (
                        <option key={c.idCategoria} value={c.idCategoria}>
                          {c.nombre} ({getSignosPorCategoria(c.idCategoria)})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="catalog-toolbar-right">
                  <div className="view-mode-toggle" role="group" aria-label="Modo de visualización">
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'cards' ? 'view-mode-btn-active' : ''}`}
                      onClick={() => setViewMode('cards')}
                      aria-pressed={viewMode === 'cards'}
                      title="Vista en cuadrícula de tarjetas"
                    >
                      <LayoutGrid size={16} aria-hidden="true" />
                      <span>Tarjetas</span>
                    </button>
                    <button
                      type="button"
                      className={`view-mode-btn ${viewMode === 'table' ? 'view-mode-btn-active' : ''}`}
                      onClick={() => setViewMode('table')}
                      aria-pressed={viewMode === 'table'}
                      title="Vista en tabla detallada"
                    >
                      <List size={16} aria-hidden="true" />
                      <span>Tabla</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Indicador de filtro activo si está filtrando por una categoría */}
              {categoriaFiltradaNombre && (
                <div className="catalog-active-filter-banner" role="status">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Filter size={16} aria-hidden="true" />
                    <span>Filtrando por categoría: <strong>{categoriaFiltradaNombre}</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setFiltroCategoriaId('todas')}
                    aria-label="Restablecer filtro de categoría"
                  >
                    <span>Mostrar todas</span>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              )}

              {filteredSignos.length === 0 ? (
                <div className="empty-state">
                  <Activity size={48} className="empty-icon" aria-hidden="true" />
                  <h2>No se encontraron signos clínicos</h2>
                  <p>No existen pruebas diagnósticas que coincidan con los filtros aplicados.</p>
                </div>
              ) : viewMode === 'cards' ? (
                /* VISTA TARJETAS: SIGNOS CLÍNICOS */
                <div className="catalog-cards-grid" aria-label="Cuadrícula de signos clínicos">
                  {filteredSignos.map((s) => {
                    const nombreCat =
                      s.categoria ||
                      categorias.find((c) => c.idCategoria === s.idCategoria)?.nombre ||
                      'General';

                    return (
                      <article key={s.idSigno} className="catalog-card">
                        <header className="catalog-card-header">
                          <div className="catalog-card-title-group">
                            <div className="catalog-card-icon-badge catalog-card-icon-signo" aria-hidden="true">
                              <Activity size={20} />
                            </div>
                            <h2 className="catalog-card-title">{s.nombre}</h2>
                          </div>
                          <span className="catalog-card-id-badge">#{s.idSigno}</span>
                        </header>

                        <div className="catalog-card-body">
                          <div style={{ marginBottom: '0.625rem' }}>
                            <span className="catalog-card-pill-tag">
                              <Tag size={12} aria-hidden="true" />
                              <span>{nombreCat}</span>
                            </span>
                          </div>
                          <p className="catalog-card-desc">
                            {s.descripcion || <em className="text-muted">Sin descripción detallada registrada para esta prueba.</em>}
                          </p>
                        </div>

                        <footer className="catalog-card-footer">
                          <span className="catalog-status-badge">
                            <span className="catalog-status-dot" aria-hidden="true"></span>
                            <span>Activo en Evaluaciones</span>
                          </span>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* VISTA TABLA: SIGNOS CLÍNICOS */
                <div className="table-container">
                  <table className="data-table" aria-label="Listado de signos clínicos">
                    <thead>
                      <tr>
                        <th scope="col" style={{ width: '80px' }}>ID</th>
                        <th scope="col">Signo Clínico / Maniobra</th>
                        <th scope="col">Categoría Disciplinar</th>
                        <th scope="col">Descripción Clínica</th>
                        <th scope="col">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSignos.map((s) => {
                        const nombreCat =
                          s.categoria ||
                          categorias.find((c) => c.idCategoria === s.idCategoria)?.nombre ||
                          'General';

                        return (
                          <tr key={s.idSigno}>
                            <td>
                              <span className="badge badge-outline">#{s.idSigno}</span>
                            </td>
                            <td>
                              <strong>{s.nombre}</strong>
                            </td>
                            <td>
                              <span className="badge badge-blue">{nombreCat}</span>
                            </td>
                            <td>{s.descripcion || <em className="text-muted">Sin descripción detallada</em>}</td>
                            <td>
                              <span className="catalog-status-badge">
                                <span className="catalog-status-dot" aria-hidden="true"></span>
                                <span>Activo</span>
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </>
      )}

      {/* MODAL: NUEVA CATEGORÍA */}
      {isCatModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-cat-title"
        >
          <div className="modal-content">
            <header className="modal-header">
              <h2 id="modal-cat-title" className="modal-title">
                Nueva Categoría de Examen
              </h2>
              <button
                type="button"
                className="modal-close-btn min-touch"
                onClick={() => setIsCatModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={catForm.handleSubmit(onCategoriaSubmit)} className="modal-body" noValidate>
              <div className="form-group">
                <label htmlFor="cat-nombre" className="form-label">
                  Nombre de la Categoría <span className="required-mark">*</span>
                </label>
                <div className="input-wrapper">
                  <Tag className="input-icon" aria-hidden="true" size={18} />
                  <input
                    id="cat-nombre"
                    type="text"
                    className={`form-input has-icon ${catForm.formState.errors.nombre ? 'input-error' : ''}`}
                    placeholder="Ej: Neurofisiología Clínica o Traumatología"
                    aria-required="true"
                    aria-invalid={!!catForm.formState.errors.nombre}
                    {...catForm.register('nombre')}
                  />
                </div>
                {catForm.formState.errors.nombre && (
                  <span className="field-error" role="alert">
                    {catForm.formState.errors.nombre.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cat-descripcion" className="form-label">
                  Descripción (Opcional)
                </label>
                <textarea
                  id="cat-descripcion"
                  rows={3}
                  className={`form-input ${catForm.formState.errors.descripcion ? 'input-error' : ''}`}
                  placeholder="Detalle o alcance de esta categoría de pruebas clínicas..."
                  {...catForm.register('descripcion')}
                />
                {catForm.formState.errors.descripcion && (
                  <span className="field-error" role="alert">
                    {catForm.formState.errors.descripcion.message}
                  </span>
                )}
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary min-touch"
                  onClick={() => setIsCatModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-touch"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  <Save size={18} aria-hidden="true" />
                  <span>{isSubmitting ? 'Guardando...' : 'Crear Categoría'}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO SIGNO CLÍNICO */}
      {isSignoModalOpen && (
        <div
          className="modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-signo-title"
        >
          <div className="modal-content">
            <header className="modal-header">
              <h2 id="modal-signo-title" className="modal-title">
                Nuevo Signo Clínico
              </h2>
              <button
                type="button"
                className="modal-close-btn min-touch"
                onClick={() => setIsSignoModalOpen(false)}
                aria-label="Cerrar modal"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </header>

            <form onSubmit={signoForm.handleSubmit(onSignoSubmit)} className="modal-body" noValidate>
              <div className="form-group">
                <label htmlFor="signo-categoria" className="form-label">
                  Categoría de Examen <span className="required-mark">*</span>
                </label>
                <select
                  id="signo-categoria"
                  className={`form-input ${signoForm.formState.errors.idCategoria ? 'input-error' : ''}`}
                  aria-required="true"
                  aria-invalid={!!signoForm.formState.errors.idCategoria}
                  {...signoForm.register('idCategoria')}
                >
                  <option value={0}>-- Seleccione una categoría --</option>
                  {categorias.map((c) => (
                    <option key={c.idCategoria} value={c.idCategoria}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
                {signoForm.formState.errors.idCategoria && (
                  <span className="field-error" role="alert">
                    {signoForm.formState.errors.idCategoria.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="signo-nombre" className="form-label">
                  Nombre del Signo Clínico <span className="required-mark">*</span>
                </label>
                <div className="input-wrapper">
                  <Activity className="input-icon" aria-hidden="true" size={18} />
                  <input
                    id="signo-nombre"
                    type="text"
                    className={`form-input has-icon ${signoForm.formState.errors.nombre ? 'input-error' : ''}`}
                    placeholder="Ej: Signo de Babinski o Prueba de Romberg"
                    aria-required="true"
                    aria-invalid={!!signoForm.formState.errors.nombre}
                    {...signoForm.register('nombre')}
                  />
                </div>
                {signoForm.formState.errors.nombre && (
                  <span className="field-error" role="alert">
                    {signoForm.formState.errors.nombre.message}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="signo-descripcion" className="form-label">
                  Descripción Clínica (Opcional)
                </label>
                <textarea
                  id="signo-descripcion"
                  rows={3}
                  className={`form-input ${signoForm.formState.errors.descripcion ? 'input-error' : ''}`}
                  placeholder="Protocolo de ejecución, maniobras o criterios de evaluación diagnóstica..."
                  {...signoForm.register('descripcion')}
                />
              </div>

              <footer className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary min-touch"
                  onClick={() => setIsSignoModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-touch"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  <Save size={18} aria-hidden="true" />
                  <span>{isSubmitting ? 'Guardando...' : 'Crear Signo Clínico'}</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

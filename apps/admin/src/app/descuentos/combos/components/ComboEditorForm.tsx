'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Layers,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Save,
  Loader2,
  Package,
  Eye,
  Tag,
  Image as ImageIcon,
  Palette,
  LayoutGrid,
  ShoppingBag,
  Monitor,
  Upload,
  Check,
  CalendarClock,
} from 'lucide-react';
import { api } from '@/lib/axios';
import { CatalogBrowseModal, CatalogProduct } from './CatalogBrowseModal';
import { ComboProductOmnibox } from './ComboProductOmnibox';
import {
  computeSellable,
  parseUtcOrLocal,
  utcToLocalDate,
  OFFSET_MINUTES,
} from '@/lib/combo-rules';
import type { ModoVenta } from '@/lib/combo-rules';
import styles from './ComboEditorForm.module.css';

interface ComponenteItem {
  componente_prod_id: string;
  cantidad: number;
  nombre?: string;
  sku?: string;
  precio_unitario?: number;
  stock_disponible?: number;
  imagen_url?: string | null;
}

interface ComboEditorFormProps {
  initialId?: string;
  isEditing?: boolean;
}

type BadgeStyle = 'red' | 'emerald' | 'blue' | 'indigo' | 'amber' | 'slate' | 'none';

const BADGE_STYLES: { key: BadgeStyle; label: string; bg: string; text: string; border: string }[] = [
  { key: 'red', label: 'Rojo Oferta', bg: '#fef2f2', text: '#991b1b', border: '#fecaca' },
  { key: 'emerald', label: 'Verde Ahorro', bg: '#ecfdf5', text: '#065f46', border: '#a7f3d0' },
  { key: 'blue', label: 'Azul Corporativo', bg: '#eff6ff', text: '#1e40af', border: '#bfdbfe' },
  { key: 'indigo', label: 'Índigo Especial', bg: '#eef2ff', text: '#3730a3', border: '#c7d2fe' },
  { key: 'amber', label: 'Ámbar Destacado', bg: '#fffbeb', text: '#92400e', border: '#fde68a' },
  { key: 'slate', label: 'Slate Sobrio', bg: '#f8fafc', text: '#334155', border: '#cbd5e1' },
  { key: 'none', label: 'Sin Badge', bg: '#f1f5f9', text: '#64748b', border: '#cbd5e1' },
];

const MODOS_VENTA: { key: ModoVenta; titulo: string; descripcion: string }[] = [
  { key: 'PERMANENTE', titulo: 'Permanente', descripcion: 'Sin restricciones: se vende siempre que haya stock.' },
  { key: 'RANGO_FECHAS', titulo: 'Rango de Fechas', descripcion: 'Válido únicamente entre una fecha de inicio y una de fin.' },
  { key: 'FECHA_HORA', titulo: 'Fecha y Hora', descripcion: 'Válido desde una fecha y hora exacta en adelante.' },
  { key: 'CUPO_FIJO', titulo: 'Cupo Fijo', descripcion: 'Limitado a un cupo máximo de ventas totales.' },
  { key: 'MIXTO', titulo: 'Mixto', descripcion: 'Combina rango de fechas, hora exacta y cupo máximo.' },
];

function utcToLocalDateTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const local = new Date(d.getTime() + OFFSET_MINUTES * 60_000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  const hh = String(local.getUTCHours()).padStart(2, '0');
  const mm = String(local.getUTCMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function formatFechaDDMM(date: Date): string {
  const [y, m, d] = utcToLocalDate(date).split('-');
  return `${d}/${m}/${y}`;
}

export function ComboEditorForm({ initialId, isEditing = false }: ComboEditorFormProps) {
  const router = useRouter();
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Core Form State
  const [nombre, setNombre] = useState('');
  const [sku, setSku] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [precioBase, setPrecioBase] = useState('');
  const [componentes, setComponentes] = useState<ComponenteItem[]>([]);

  // Presentation & Card Visuals State
  const [badgeTexto, setBadgeTexto] = useState('');
  const [badgeEstilo, setBadgeEstilo] = useState<BadgeStyle>('emerald');
  const [modoImagen, setModoImagen] = useState<'GRID_AUTO' | 'PROPIA'>('GRID_AUTO');
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [destacadoPortada, setDestacadoPortada] = useState(false);

  // Availability State (independent toggles)
  const [vigenciaEnabled, setVigenciaEnabled] = useState(false);
  const [diasEnabled, setDiasEnabled] = useState(false);
  const [cupoEnabled, setCupoEnabled] = useState(false);
  const [vigenciaInicio, setVigenciaInicio] = useState('');
  const [vigenciaInicioHora, setVigenciaInicioHora] = useState('');
  const [vigenciaFin, setVigenciaFin] = useState('');
  const [vigenciaFinHora, setVigenciaFinHora] = useState('');
  const [diasSemana, setDiasSemana] = useState<number[]>([]);
  const [cupoMaximo, setCupoMaximo] = useState('');
  const [cupoUsado, setCupoUsado] = useState(0);
  const [canalVenta, setCanalVenta] = useState<'AMBOS' | 'ECOMMERCE' | 'POS'>('AMBOS');
  const [activoCombo, setActivoCombo] = useState(true);

  // Live Preview Mode
  const [previewTab, setPreviewTab] = useState<'ecommerce' | 'pos'>('ecommerce');

  // Catalogs
  const [categorias, setCategorias] = useState<any[]>([]);
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);

  // Browse Catalog Modal
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);

  useEffect(() => {
    async function loadAll() {
      setLoadingData(true);
      try {
        const [resCat, resProd] = await Promise.all([
          api.get('/categorias'),
          api.get('/productos?limit=100'),
        ]);

        const cats = Array.isArray(resCat.data) ? resCat.data : resCat.data.data || [];
        setCategorias(cats);

        const prods = (resProd.data.data || []).filter(
          (p: any) => p.tipo_producto !== 'COMBO' && (!initialId || p.id?.toString() !== initialId)
        );
        setCatalogoProductos(prods);

        if (isEditing && initialId) {
          const resDetail = await api.get(`/productos/${initialId}`);
          const data = resDetail.data.data || resDetail.data;

          setNombre(data.nombre || '');
          setSku(data.sku || '');
          setDescripcion(data.descripcion || '');
          setCategoriaId(data.categoria_id?.toString() || (cats[0]?.id?.toString() ?? ''));
          setPrecioBase(data.precio_base ? Number(data.precio_base).toString() : '');

          // Load visual metadata
          if (data.atributos?.presentacion_visual) {
            const pv = data.atributos.presentacion_visual;
            setBadgeTexto(pv.badge_texto || '');
            setBadgeEstilo(pv.badge_estilo || 'emerald');
            setModoImagen(pv.modo_imagen || 'GRID_AUTO');
            setDestacadoPortada(pv.destacado_portada ?? false);
          }

          if (data.imagenes && data.imagenes.length > 0) {
            setExistingImageUrl(data.imagenes[0].url);
          }

          if (data.componentes_combo && data.componentes_combo.length > 0) {
            const mappedComps: ComponenteItem[] = data.componentes_combo.map((c: any) => {
              const compProd = c.componente_producto || {};
              const stock = Array.isArray(compProd.Inventario)
                ? compProd.Inventario.reduce((acc: number, inv: any) => acc + Math.max(0, (inv.cantidad_disponible ?? 0) - (inv.reservado ?? 0)), 0)
                : (typeof c.stock_disponible === 'number' ? c.stock_disponible : 0);
              return {
                componente_prod_id: c.componente_prod_id?.toString(),
                cantidad: c.cantidad || 1,
                nombre: compProd.nombre || 'Producto',
                sku: compProd.sku || '',
                precio_unitario: Number(compProd.precio_base) || 0,
                stock_disponible: stock,
                imagen_url: compProd.imagenes?.[0]?.url || null,
              };
            });
            setComponentes(mappedComps);
          }

          // Load availability state
          setCupoUsado(Number(data.cupo_usado) || 0);
          setActivoCombo(data.activo !== false);
          const hasCupo = data.cupo_maximo != null;
          const hasVigencia = !!data.vigencia_inicio || !!data.vigencia_fin;
          const hasDias = (data.dias_semana?.length ?? 0) > 0;
          setCupoEnabled(hasCupo);
          setVigenciaEnabled(hasVigencia);
          setDiasEnabled(hasDias);
          if (hasCupo) setCupoMaximo(String(data.cupo_maximo));
          if (data.vigencia_inicio) {
            const dt = utcToLocalDateTime(data.vigencia_inicio);
            setVigenciaInicio(dt.slice(0, 10));
            setVigenciaInicioHora(dt.length > 10 ? dt.slice(11, 16) : '');
          }
          if (data.vigencia_fin) {
            const dt = utcToLocalDateTime(data.vigencia_fin);
            setVigenciaFin(dt.slice(0, 10));
            setVigenciaFinHora(dt.length > 10 ? dt.slice(11, 16) : '');
          }
          if (hasDias) setDiasSemana(data.dias_semana);
          if (data.canal_venta) setCanalVenta(data.canal_venta);
        } else {
          if (cats.length > 0) setCategoriaId(cats[0].id.toString());
        }
      } catch (err: any) {
        console.error('Error cargando combo:', err);
        setErrorMsg('Error al cargar la información del combo.');
      } finally {
        setLoadingData(false);
      }
    }
    loadAll();
  }, [initialId, isEditing]);

  const handleAddProduct = (prod: CatalogProduct, qty: number = 1) => {
    const idStr = prod.id.toString();
    const existingIdx = componentes.findIndex((c) => c.componente_prod_id === idStr);
    const stock = Array.isArray(prod.Inventario)
      ? prod.Inventario.reduce((acc: number, inv: any) => acc + Math.max(0, (inv.cantidad_disponible ?? 0) - (inv.reservado ?? 0)), 0)
      : 0;
    const imgUrl = prod.imagenes?.[0]?.url || null;

    if (existingIdx >= 0) {
      const updated = [...componentes];
      updated[existingIdx].cantidad += qty;
      setComponentes(updated);
    } else {
      setComponentes([
        ...componentes,
        {
          componente_prod_id: idStr,
          cantidad: qty,
          nombre: prod.nombre,
          sku: prod.sku,
          precio_unitario: Number(prod.precio_base) || 0,
          stock_disponible: stock,
          imagen_url: imgUrl,
        },
      ]);
    }
  };

  const handleAddSelectedFromModal = (items: Array<{ producto: CatalogProduct; cantidad: number }>) => {
    setComponentes((prev) => {
      const updated = [...prev];
      items.forEach(({ producto, cantidad }) => {
        const idStr = producto.id.toString();
        const existingIdx = updated.findIndex((c) => c.componente_prod_id === idStr);
        const stock = Array.isArray(producto.Inventario)
          ? producto.Inventario.reduce((acc: number, inv: any) => acc + Math.max(0, (inv.cantidad_disponible ?? 0) - (inv.reservado ?? 0)), 0)
          : 0;
        const imgUrl = producto.imagenes?.[0]?.url || null;

        if (existingIdx >= 0) {
          updated[existingIdx].cantidad += cantidad;
        } else {
          updated.push({
            componente_prod_id: idStr,
            cantidad: cantidad,
            nombre: producto.nombre,
            sku: producto.sku,
            precio_unitario: Number(producto.precio_base) || 0,
            stock_disponible: stock,
            imagen_url: imgUrl,
          });
        }
      });
      return updated;
    });
  };

  const handleRemoveComponent = (idx: number) => {
    setComponentes(componentes.filter((_, i) => i !== idx));
  };

  const handleUpdateCantidad = (idx: number, qty: number) => {
    const updated = [...componentes];
    updated[idx].cantidad = Math.max(1, qty);
    setComponentes(updated);
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImageFile(file);
      setImagePreviewUrl(URL.createObjectURL(file));
      setModoImagen('PROPIA');
    }
  };

  // Metrics
  const { subtotalComponentes, virtualStock, bottleneckId, ahorroMonto, ahorroPorcentaje } = useMemo(() => {
    const subtotal = componentes.reduce(
      (acc, c) => acc + (c.precio_unitario || 0) * (c.cantidad || 1),
      0
    );

    let stockKits = 0;
    let bottleneck: string | null = null;
    if (componentes.length > 0) {
      let minKits = Infinity;
      componentes.forEach((c) => {
        const prod = catalogoProductos.find((p) => p.id?.toString() === c.componente_prod_id);
        const stockFisico = Array.isArray(prod?.Inventario) && prod.Inventario.length > 0
          ? prod.Inventario.reduce((acc: number, inv: any) => acc + Math.max(0, (inv.cantidad_disponible ?? 0) - (inv.reservado ?? 0)), 0)
          : (typeof c.stock_disponible === 'number' ? c.stock_disponible : 0);
        const kitsForThis = Math.floor(stockFisico / (c.cantidad || 1));
        if (kitsForThis < minKits) {
          minKits = kitsForThis;
          bottleneck = c.componente_prod_id;
        }
      });
      stockKits = minKits === Infinity ? 0 : Math.max(0, minKits);
    }

    const precioComboNum = Number(precioBase) || 0;
    const ahorro = Math.max(0, subtotal - precioComboNum);
    const porcentaje = subtotal > 0 && ahorro > 0 ? Math.round((ahorro / subtotal) * 100) : 0;

    return {
      subtotalComponentes: subtotal,
      virtualStock: stockKits,
      bottleneckId: bottleneck,
      ahorroMonto: ahorro,
      ahorroPorcentaje: porcentaje,
    };
  }, [componentes, precioBase, catalogoProductos]);

  const showBadge = badgeEstilo !== 'none';

  const resolvedBadgeText = useMemo(() => {
    if (badgeTexto.trim()) return badgeTexto.trim();
    if (ahorroPorcentaje > 0) return `Ahorrá ${ahorroPorcentaje}%`;
    return 'KIT / COMBO';
  }, [badgeTexto, ahorroPorcentaje]);

  const selectedBadgeStyleObj = useMemo(() => {
    return BADGE_STYLES.find((s) => s.key === badgeEstilo) || BADGE_STYLES[0];
  }, [badgeEstilo]);

  const componentImages = useMemo(() => {
    const list: string[] = [];
    componentes.forEach((c) => {
      const prod = catalogoProductos.find((p) => p.id?.toString() === c.componente_prod_id);
      const url = prod?.imagenes?.[0]?.url || c.imagen_url;
      if (url) {
        list.push(url.startsWith('http') ? url : `http://localhost:3001${url}`);
      }
    });
    return list;
  }, [componentes, catalogoProductos]);

  // Derived modoVenta from toggles
  const modoVenta = useMemo((): ModoVenta => {
    if (!vigenciaEnabled && !cupoEnabled) return 'PERMANENTE';
    if (vigenciaEnabled && !cupoEnabled) return 'RANGO_FECHAS';
    if (!vigenciaEnabled && cupoEnabled) return 'CUPO_FIJO';
    return 'MIXTO';
  }, [vigenciaEnabled, cupoEnabled]);

  // Sale rules derived state
  const cupoNum = cupoEnabled && cupoMaximo.trim() !== '' ? Number(cupoMaximo) : null;
  const cupoValido = cupoNum === null || (!isNaN(cupoNum) && cupoNum >= 1);
  const cupoExcedeStock = cupoNum !== null && !isNaN(cupoNum) && cupoNum > virtualStock;
  const cupoInvalido = cupoEnabled && (!cupoValido || cupoExcedeStock);

  const vigenciaInicioDate = useMemo(() => {
    if (!vigenciaEnabled || !vigenciaInicio) return null;
    try { return parseUtcOrLocal(vigenciaInicio); } catch { return null; }
  }, [vigenciaInicio, vigenciaEnabled]);

  const vigenciaFinDate = useMemo(() => {
    if (!vigenciaEnabled || !vigenciaFin) return null;
    try { return parseUtcOrLocal(vigenciaFin); } catch { return null; }
  }, [vigenciaFin, vigenciaEnabled]);

  const sellableInfo = useMemo(() => {
    return computeSellable({
      tipoProducto: 'COMBO',
      stockBom: virtualStock,
      activo: activoCombo,
      modoVenta,
      vigenciaInicio: vigenciaInicioDate,
      vigenciaFin: vigenciaFinDate,
      cupoMaximo: cupoNum ?? null,
      cupoUsado,
    });
  }, [virtualStock, activoCombo, modoVenta, vigenciaInicioDate, vigenciaFinDate, cupoNum, cupoUsado]);

  let estadoLabel: string | null = null;
  if (sellableInfo.estado === 'VENCIDO') estadoLabel = 'Vencido';
  else if (sellableInfo.estado === 'AGOTADO') estadoLabel = 'Agotado';
  else if (sellableInfo.estado === 'INACTIVO') estadoLabel = 'Inactivo';
  else if (sellableInfo.estado === 'ACTIVO') {
    if (vigenciaFinDate) estadoLabel = `Vigente hasta ${formatFechaDDMM(vigenciaFinDate)}`;
    else if (cupoNum === null && modoVenta === 'PERMANENTE') estadoLabel = 'Sin restricciones';
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nombre.trim()) {
      setErrorMsg('Debes ingresar el nombre del Combo Promocional.');
      return;
    }
    if (!categoriaId) {
      setErrorMsg('Debes seleccionar una categoría para el Combo.');
      return;
    }
    if (componentes.length < 2) {
      setErrorMsg('Un Combo debe tener al menos 2 productos componentes.');
      return;
    }
    if (!precioBase || Number(precioBase) <= 0) {
      setErrorMsg('Debes ingresar un precio de venta para el Combo.');
      return;
    }
    if (vigenciaEnabled) {
      if (!vigenciaInicio || !vigenciaFin) {
        setErrorMsg('Completá la fecha/hora de inicio y fin de la vigencia.');
        return;
      }
      if (vigenciaFin < vigenciaInicio) {
        setErrorMsg('La fecha de fin no puede ser anterior a la de inicio.');
        return;
      }
    }
    if (cupoEnabled) {
      if (!cupoMaximo.trim() || Number(cupoMaximo) < 1) {
        setErrorMsg('Ingresá un cupo máximo mayor a 0.');
        return;
      }
      if (cupoExcedeStock) {
        setErrorMsg(`El cupo supera el stock del combo (${virtualStock} kit(s) disponibles).`);
        return;
      }
    }
    if (diasEnabled && diasSemana.length === 0) {
      setErrorMsg('Seleccioná al menos un día o desactivá la restricción de días.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nombre: nombre.trim(),
        sku: sku.trim() || undefined,
        descripcion: descripcion.trim() || undefined,
        categoria_id: Number(categoriaId),
        tipo_producto: 'COMBO',
        precio_base: Number(precioBase),
        modo_venta: modoVenta,
        vigencia_inicio: vigenciaEnabled && vigenciaInicio
          ? (vigenciaInicioHora ? `${vigenciaInicio}T${vigenciaInicioHora}:00` : vigenciaInicio)
          : null,
        vigencia_fin: vigenciaEnabled && vigenciaFin
          ? (vigenciaFinHora ? `${vigenciaFin}T${vigenciaFinHora}:00` : vigenciaFin)
          : null,
        cupo_maximo: cupoEnabled ? cupoNum : null,
        dias_semana: diasEnabled ? diasSemana : [],
        canal_venta: canalVenta,
        atributos: {
          presentacion_visual: {
            badge_texto: badgeTexto.trim() || undefined,
            badge_estilo: badgeEstilo,
            mostrar_badge: showBadge,
            modo_imagen: modoImagen,
            destacado_portada: destacadoPortada,
          },
        },
        componentes_combo: componentes.map((c) => ({
          componente_prod_id: c.componente_prod_id,
          cantidad: Number(c.cantidad) || 1,
        })),
      };

      let prodId = initialId;
      if (isEditing && initialId) {
        await api.patch(`/productos/${initialId}`, payload);
      } else {
        const res = await api.post('/productos', payload);
        const created = res.data.data || res.data;
        prodId = created.id?.toString();
      }

      // If there's an image file to upload
      if (selectedImageFile && prodId) {
        const formData = new FormData();
        formData.append('image', selectedImageFile);
        await api.post(`/producto-imagenes/upload/${prodId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      router.push('/descuentos');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      setErrorMsg(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al procesar el combo');
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className={styles.loadingWrap}>
        <Loader2 size={32} className={`spin ${styles.loadingSpin}`} />
        <p className={styles.loadingText}>Cargando estructura del combo...</p>
      </div>
    );
  }

  return (
    <main className={styles.main}>
      {/* Top Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => router.push('/descuentos')} className={styles.backBtn}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className={styles.title}>
              <Package size={22} color="#0f172a" />
              {isEditing ? `Editar Combo: ${nombre}` : 'Nuevo Combo / Paquete Promocional'}
            </h1>
            <p className={styles.subtitle}>
              Configura los componentes del paquete, precio promocional y apariencia de las cards en POS y E-commerce.
            </p>
          </div>
        </div>
      </header>

      {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

      <form onSubmit={handleSubmit} className={styles.formGrid}>
        {/* Left Column: Form Sections */}
        <div className={styles.leftColumn}>
          {/* Card 1: Informacion Comercial */}
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>1. Información del Combo</h3>

            <div className={styles.grid2Mb}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre del Combo / Paquete *</label>
                <input
                  type="text"
                  placeholder="Ej: Pack Escolar Completo 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Categoría en Catálogo *</label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  className={styles.select}
                  required
                >
                  <option value="">Selecciona categoría</option>
                  {categorias.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.grid2}>
              <div className={styles.field}>
                <label className={styles.label}>Código SKU (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: COMBO-ESC-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descripción Comercial (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Incluye 2 cuadernos + 1 estuche de bolígrafos"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Receta BOM */}
          <div className={styles.card}>
            <div className={styles.cardHeaderRow}>
              <h3 className={styles.cardTitleIcon}>
                <Layers size={18} color="#0f172a" /> 2. Componentes del Paquete (Receta BOM)
              </h3>
              {componentes.length > 0 && (
                <div className={styles.stockVirtualRow}>
                  <span className={styles.stockVirtualLabel}>Stock Virtual del Combo:</span>
                  <span className={virtualStock > 0 ? styles.stockBadgePositive : styles.stockBadgeNegative}>
                    {virtualStock > 0 ? `${virtualStock} unidades armables` : '0 combos (Sin stock)'}
                  </span>
                </div>
              )}
            </div>
            <p className={styles.cardDescription}>
              Selecciona qué productos del catálogo componen este combo y cuántas unidades incluye cada uno.
            </p>

            {/* Omnibox & Batch catalog search */}
            <div className={styles.omniboxWrap}>
              <ComboProductOmnibox
                onAddProduct={handleAddProduct}
                onOpenBrowseModal={() => setIsBrowseModalOpen(true)}
                existingComponentIds={componentes.map((c) => c.componente_prod_id)}
                excludeProductId={initialId}
              />
            </div>

            {/* Modal de Exploración Masiva de Catálogo */}
            <CatalogBrowseModal
              isOpen={isBrowseModalOpen}
              onClose={() => setIsBrowseModalOpen(false)}
              onAddSelected={handleAddSelectedFromModal}
              existingComponentIds={componentes.map((c) => c.componente_prod_id)}
              excludeProductId={initialId}
            />

            {/* Component list */}
            {componentes.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={36} className={styles.emptyStateIcon} />
                <p className={styles.emptyStateTitle}>No has agregado componentes a este combo todavía</p>
                <p className={styles.emptyStateText}>
                  Usa el buscador rápido de arriba (con soporte para lector de código de barras) o el botón "Explorar Catálogo".
                </p>
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead className={styles.theadRow}>
                    <tr>
                      <th className={styles.th}>Producto Componente</th>
                      <th className={styles.thCenter}>Cantidad</th>
                      <th className={styles.thRight}>P. Unitario</th>
                      <th className={styles.thRight}>Subtotal</th>
                      <th className={styles.thStock}>Stock Físico</th>
                      <th className={styles.thAction}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentes.map((c, i) => {
                      const isBottleneck = c.componente_prod_id === bottleneckId && componentes.length > 1;
                      const stockAvailable = c.stock_disponible !== undefined ? c.stock_disponible : 0;
                      const maxCombosFromThis = Math.floor(stockAvailable / (c.cantidad || 1));
                      const isLast = i === componentes.length - 1;

                      let rowClass = styles.tr;
                      if (isBottleneck) rowClass = isLast ? styles.trBottleneckLast : styles.trBottleneck;
                      else if (isLast) rowClass = styles.trLast;

                      return (
                        <tr key={c.componente_prod_id} className={rowClass}>
                          <td className={styles.td}>
                            <div className={styles.productNameRow}>
                              <div className={styles.productName}>{c.nombre}</div>
                              {isBottleneck && (
                                <span
                                  title="Este producto tiene el stock más bajo y determina cuántos combos se pueden vender"
                                  className={styles.bottleneckBadge}
                                >
                                  <AlertTriangle size={12} /> Limita el stock del combo
                                </span>
                              )}
                            </div>
                            <div className={styles.skuText}>
                              SKU: <span className={styles.mono}>{c.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td className={styles.tdCenter}>
                            <div className={styles.qtyControl}>
                              <button
                                type="button"
                                onClick={() => handleUpdateCantidad(i, c.cantidad - 1)}
                                className={styles.qtyBtn}
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={c.cantidad}
                                onChange={(e) => handleUpdateCantidad(i, parseInt(e.target.value) || 1)}
                                className={styles.qtyInput}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCantidad(i, c.cantidad + 1)}
                                className={styles.qtyBtn}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                          <td className={styles.tdRight}>
                            Bs. {(c.precio_unitario || 0).toFixed(2)}
                          </td>
                          <td className={styles.tdRightStrong}>
                            Bs. {((c.precio_unitario || 0) * c.cantidad).toFixed(2)}
                          </td>
                          <td className={styles.tdCenter}>
                            <span className={stockAvailable >= c.cantidad ? styles.stockCellPositive : styles.stockCellNegative}>
                              {stockAvailable} un. ({maxCombosFromThis} combos)
                            </span>
                          </td>
                          <td className={styles.tdCenter}>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(i)}
                              title="Quitar de la receta"
                              className={styles.removeBtn}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Card 3: Presentación Visual & Configuración de Cards */}
          <div className={styles.card}>
            <h3 className={styles.cardTitleIconMb}>
              <Palette size={18} color="#0f172a" /> 3. Presentación Comercial & Cards (POS & E-commerce)
            </h3>
            <p className={styles.cardDescription}>
              Controla cómo se presenta el combo visualmente ante los clientes en la tienda y en la pantalla de caja.
            </p>

            {/* Badge Config */}
            <div className={styles.grid2Mb}>
              <div className={styles.field}>
                <label className={styles.label}>Badge / Tagline Promocional</label>
                <input
                  type="text"
                  placeholder={`Ej: ${ahorroPorcentaje > 0 ? `Ahorrá ${ahorroPorcentaje}%` : 'Pack Escolar 2026'}`}
                  value={badgeTexto}
                  onChange={(e) => setBadgeTexto(e.target.value)}
                  disabled={badgeEstilo === 'none'}
                  className={badgeEstilo === 'none' ? styles.badgeInputDisabled : styles.badgeInput}
                />
                <span className={styles.badgeHelpText}>
                  {badgeEstilo === 'none'
                    ? 'El badge está desactivado para este combo.'
                    : 'Si se deja vacío, muestra automáticamente el % de ahorro o "KIT / COMBO".'}
                </span>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Estilo Visual del Badge</label>
                <div className={styles.badgeStyleRow}>
                  {BADGE_STYLES.map((style) => (
                    <button
                      key={style.key}
                      type="button"
                      onClick={() => setBadgeEstilo(style.key)}
                      className={styles.badgeStyleBtn}
                      style={{
                        backgroundColor: style.bg,
                        color: style.text,
                        border: badgeEstilo === style.key ? `2px solid ${style.text}` : `1px solid ${style.border}`,
                      }}
                    >
                      {badgeEstilo === style.key && <Check size={13} />}
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Image Mode */}
            <div className={styles.imageModeBox}>
              <label className={styles.imageModeLabel}>Modo de Imagen de la Card</label>

              <div className={styles.imageModeGrid}>
                <button
                  type="button"
                  onClick={() => setModoImagen('GRID_AUTO')}
                  className={modoImagen === 'GRID_AUTO' ? styles.imageModeOptionActive : styles.imageModeOption}
                >
                  <div className={styles.imageModeOptionTitle}>
                    <LayoutGrid size={16} /> Cuadrícula Automática (BOM)
                  </div>
                  <div className={styles.imageModeOptionDesc}>
                    Compone automáticamente las fotos de los componentes ocupando el 100% del área disponible.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModoImagen('PROPIA')}
                  className={modoImagen === 'PROPIA' ? styles.imageModeOptionActive : styles.imageModeOption}
                >
                  <div className={styles.imageModeOptionTitle}>
                    <ImageIcon size={16} /> Imagen Propia del Pack
                  </div>
                  <div className={styles.imageModeOptionDesc}>
                    Sube una foto exclusiva del kit armado o diseño promocional.
                  </div>
                </button>
              </div>

              {/* Upload input when PROPIA is selected */}
              {modoImagen === 'PROPIA' && (
                <div className={styles.uploadBox}>
                  <label className={styles.uploadLabel}>Subir Foto del Pack / Combo:</label>
                  <div className={styles.uploadRow}>
                    <label className={styles.uploadFileLabel}>
                      <Upload size={14} /> Seleccionar archivo
                      <input type="file" accept="image/*" onChange={handleImageFileChange} className={styles.hiddenFileInput} />
                    </label>
                    <span className={styles.uploadFileName}>
                      {selectedImageFile ? selectedImageFile.name : existingImageUrl ? 'Imagen actual cargada' : 'Sin imagen seleccionada'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Destacado en portada */}
            <div className={styles.checkboxColumn}>
              <label className={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={destacadoPortada}
                  onChange={(e) => setDestacadoPortada(e.target.checked)}
                  className={styles.checkboxInput}
                />
                <div>
                  <div className={styles.checkboxTitle}>
                    Destacar en la sección de Combos & Ofertas del E-commerce
                  </div>
                  <div className={styles.checkboxDesc}>
                    Le da prioridad al pack en la página principal y la sección de promociones.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Card 4: Disponibilidad */}
          <div className={styles.card}>
            {/* Header */}
            <div className={styles.availabilityHeaderRow}>
              <h3 className={styles.cardTitleIcon}>
                <CalendarClock size={18} color="#0f172a" /> 4. Disponibilidad
              </h3>
              {[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length > 0 && (
                <span className={styles.availabilityCount}>
                  {[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length} activa{[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Mode badge */}
            <div className={styles.availabilityModeRow}>
              <p className={styles.availabilityModeText}>
                Cada restricción es independiente y se combina automáticamente.
              </p>
              <span className={modoVenta === 'PERMANENTE' ? styles.availabilityModeBadgeNeutral : styles.availabilityModeBadgeActive}>
                {modoVenta === 'PERMANENTE' && 'Permanente'}
                {modoVenta === 'RANGO_FECHAS' && 'Temporal'}
                {modoVenta === 'CUPO_FIJO' && 'Con cupo'}
                {modoVenta === 'MIXTO' && 'Temporal + cupo'}
              </span>
            </div>

            {/* Toggle 1 — Período de vigencia */}
            <div className={vigenciaEnabled ? styles.toggleSectionActive : styles.toggleSection}>
              <button
                type="button"
                onClick={() => setVigenciaEnabled(!vigenciaEnabled)}
                className={vigenciaEnabled ? styles.toggleBtnActive : styles.toggleBtn}
              >
                <div className={styles.toggleBtnLeft}>
                  <div className={vigenciaEnabled ? styles.toggleDotActive : styles.toggleDot}>
                    {vigenciaEnabled && <div className={styles.toggleDotInner} />}
                  </div>
                  <span className={vigenciaEnabled ? styles.toggleLabelActive : styles.toggleLabel}>Período de vigencia</span>
                </div>
                <span className={vigenciaEnabled ? styles.toggleStatusActive : styles.toggleStatus}>
                  {vigenciaEnabled ? 'Activo' : 'Siempre disponible'}
                </span>
              </button>
              {vigenciaEnabled && (
                <div className={styles.toggleBodyGrid}>
                  {/* Desde */}
                  <div>
                    <label className={styles.dateTimeLabel}>Disponible desde</label>
                    <div className={styles.dateTimeRow}>
                      <input
                        type="date"
                        value={vigenciaInicio}
                        onChange={(e) => setVigenciaInicio(e.target.value)}
                        className={styles.dateInput}
                      />
                      <input
                        type="time"
                        value={vigenciaInicioHora}
                        onChange={(e) => setVigenciaInicioHora(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>
                  </div>
                  {/* Hasta */}
                  <div>
                    <label className={styles.dateTimeLabel}>Disponible hasta</label>
                    <div className={styles.dateTimeRow}>
                      <input
                        type="date"
                        value={vigenciaFin}
                        onChange={(e) => setVigenciaFin(e.target.value)}
                        className={styles.dateInput}
                      />
                      <input
                        type="time"
                        value={vigenciaFinHora}
                        onChange={(e) => setVigenciaFinHora(e.target.value)}
                        className={styles.timeInput}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2 — Días específicos */}
            <div className={diasEnabled ? styles.toggleSectionActive : styles.toggleSection}>
              <button
                type="button"
                onClick={() => setDiasEnabled(!diasEnabled)}
                className={diasEnabled ? styles.toggleBtnActive : styles.toggleBtn}
              >
                <div className={styles.toggleBtnLeft}>
                  <div className={diasEnabled ? styles.toggleDotActive : styles.toggleDot}>
                    {diasEnabled && <div className={styles.toggleDotInner} />}
                  </div>
                  <span className={diasEnabled ? styles.toggleLabelActive : styles.toggleLabel}>Solo en días específicos</span>
                </div>
                <span className={diasEnabled ? styles.toggleStatusActive : styles.toggleStatus}>
                  {diasEnabled
                    ? diasSemana.length > 0
                      ? (['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'] as string[]).filter((_, i) => diasSemana.includes(i)).join(', ')
                      : 'Seleccioná días'
                    : 'Todos los días'}
                </span>
              </button>
              {diasEnabled && (
                <div className={styles.toggleBody}>
                  <div className={styles.dayChipsRow}>
                    {([1,2,3,4,5,6,0] as number[]).map((day) => {
                      const labels: Record<number,string> = { 0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb' };
                      const isOn = diasSemana.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDiasSemana(isOn ? diasSemana.filter(d => d !== day) : [...diasSemana, day])}
                          className={isOn ? styles.dayChipActive : styles.dayChip}
                        >
                          {labels[day]}
                        </button>
                      );
                    })}
                  </div>
                  {diasSemana.length === 0 && (
                    <p className={styles.warnText}>Seleccioná al menos un día o desactivá esta restricción.</p>
                  )}
                </div>
              )}
            </div>

            {/* Toggle 3 — Cupo máximo */}
            <div className={cupoEnabled ? styles.toggleSectionActiveLast : styles.toggleSectionLast}>
              <button
                type="button"
                onClick={() => setCupoEnabled(!cupoEnabled)}
                className={cupoEnabled ? styles.toggleBtnActive : styles.toggleBtn}
              >
                <div className={styles.toggleBtnLeft}>
                  <div className={cupoEnabled ? styles.toggleDotActive : styles.toggleDot}>
                    {cupoEnabled && <div className={styles.toggleDotInner} />}
                  </div>
                  <span className={cupoEnabled ? styles.toggleLabelActive : styles.toggleLabel}>Limitar cupo de ventas</span>
                </div>
                <span className={cupoEnabled ? styles.toggleStatusActive : styles.toggleStatus}>
                  {cupoEnabled ? (cupoMaximo ? `${cupoMaximo} kits máx.` : 'Sin definir') : 'Sin límite'}
                </span>
              </button>
              {cupoEnabled && (
                <div className={styles.toggleBody}>
                  <label className={styles.dateTimeLabel}>Cupo máximo</label>
                  <div className={styles.cupoRow}>
                    <div className={styles.cupoInputWrap}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={cupoMaximo}
                        onChange={(e) => setCupoMaximo(e.target.value)}
                        placeholder="0"
                        className={cupoInvalido ? styles.cupoInputInvalid : styles.cupoInput}
                      />
                      <span className={styles.cupoSuffix}>kits</span>
                    </div>
                    {cupoUsado > 0 && <span className={styles.cupoUsedText}>{cupoUsado} vendido{cupoUsado !== 1 ? 's' : ''}</span>}
                  </div>
                  {cupoExcedeStock && (
                    <div className={styles.cupoWarnBox}>
                      <div className={styles.cupoWarnLeft}>
                        <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span className={styles.cupoWarnText}>El cupo supera el stock virtual (<strong>{virtualStock}</strong> kits armables)</span>
                      </div>
                      <button type="button" onClick={() => setCupoMaximo(String(virtualStock))} className={styles.cupoAdjustBtn}>Ajustar a {virtualStock}</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Canal de Publicación */}
            <div className={styles.channelBox}>
              <label className={styles.channelLabel}>Canal de Publicación</label>
              <div className={styles.grid3}>
                {[
                  { value: 'AMBOS', label: 'Todos los Canales', desc: 'Web + Caja POS' },
                  { value: 'ECOMMERCE', label: 'Solo E-commerce', desc: 'Tienda Online' },
                  { value: 'POS', label: 'Solo POS', desc: 'Caja / Local' },
                ].map((c) => {
                  const isSel = canalVenta === c.value;
                  return (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCanalVenta(c.value as any)}
                      className={isSel ? styles.channelBtnActive : styles.channelBtn}
                    >
                      <div className={styles.channelBtnTitle}>{c.label}</div>
                      <div className={isSel ? styles.channelBtnDescInverted : styles.channelBtnDescMuted}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!vigenciaEnabled && !diasEnabled && !cupoEnabled && (
              <div className={styles.noRestrictionsBox}>
                <CheckCircle size={14} color="#94a3b8" className={styles.noRestrictionsIcon} />
                <span className={styles.noRestrictionsText}>
                  Sin restricciones de fecha/cupo — se vende siempre que haya stock disponible.
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Right Column: Pricing, Availability & Live Card Preview */}
        <div className={styles.rightColumn}>
          {/* Card Pricing */}
          <div className={styles.cardElevated}>
            <h3 className={styles.cardTitle}>Precio & Ahorro</h3>

            <div className={styles.subtotalRow}>
              <label className={styles.subtotalLabel}>Suma Individual de Componentes:</label>
              <div className={styles.subtotalValue}>Bs. {subtotalComponentes.toFixed(2)}</div>
            </div>

            <div className={styles.priceFieldRow}>
              <label className={styles.priceFieldLabel}>Precio Promocional del Combo *</label>
              <div className={styles.priceInputRow}>
                <span className={styles.priceCurrency}>Bs.</span>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  placeholder="0.00"
                  value={precioBase}
                  onChange={(e) => setPrecioBase(e.target.value)}
                  className={styles.priceInput}
                  required
                />
              </div>
            </div>

            {/* Savings Box */}
            <div className={ahorroMonto > 0 ? styles.savingsBoxActive : styles.savingsBox}>
              <div className={ahorroMonto > 0 ? styles.savingsLabelActive : styles.savingsLabel}>
                Ahorro para el Cliente:
              </div>
              <div className={ahorroMonto > 0 ? styles.savingsValueActive : styles.savingsValue}>
                {ahorroMonto > 0 ? `Bs. ${ahorroMonto.toFixed(2)} (${ahorroPorcentaje}%)` : 'Sin Ahorro'}
              </div>
            </div>

            {/* Virtual Availability Box */}
            <div className={sellableInfo.sellable > 0 ? styles.availabilityBoxPositive : styles.availabilityBoxNegative}>
              <div className={sellableInfo.sellable > 0 ? styles.availabilityBoxLabelPositive : styles.availabilityBoxLabelNegative}>
                Disponibilidad Inmediata:
              </div>
              <div className={sellableInfo.sellable > 0 ? styles.availabilityBoxValuePositive : styles.availabilityBoxValueNegative}>
                {sellableInfo.sellable > 0 ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                {sellableInfo.sellable} kit{sellableInfo.sellable !== 1 ? 's' : ''} disponibles
              </div>
              {estadoLabel && (
                <span className={sellableInfo.estado === 'ACTIVO' ? styles.estadoBadgeActive : styles.estadoBadgeInactive}>
                  {estadoLabel}
                </span>
              )}
              <p className={styles.availabilityHint}>
                Stock dinámico según el producto con menor disponibilidad, vigencia y cupo configurados.
              </p>
            </div>

            <button type="submit" disabled={saving || cupoInvalido} className={styles.submitBtn}>
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              {isEditing ? 'Guardar Cambios del Combo' : 'Publicar Combo Promocional'}
            </button>
          </div>

          {/* Interactive Live Card Preview */}
          <div className={styles.cardElevated}>
            <div className={styles.previewHeaderRow}>
              <div className={styles.previewTitle}>
                <Eye size={16} /> Vista Previa en Vivo
              </div>
              <div className={styles.previewTabs}>
                <button
                  type="button"
                  onClick={() => setPreviewTab('ecommerce')}
                  className={previewTab === 'ecommerce' ? styles.previewTabActive : styles.previewTab}
                >
                  <ShoppingBag size={13} /> E-com
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('pos')}
                  className={previewTab === 'pos' ? styles.previewTabActive : styles.previewTab}
                >
                  <Monitor size={13} /> POS
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className={styles.previewContainer}>
              {previewTab === 'ecommerce' ? (
                /* E-COMMERCE CARD MOCKUP */
                <div className={styles.ecomCard}>
                  {/* Image container */}
                  <div className={styles.ecomImageWrap}>
                    {/* Badge */}
                    {showBadge && (
                      <span
                        className={styles.ecomBadge}
                        style={{
                          backgroundColor: selectedBadgeStyleObj.bg,
                          color: selectedBadgeStyleObj.text,
                          border: `1px solid ${selectedBadgeStyleObj.border}`,
                        }}
                      >
                        {resolvedBadgeText}
                      </span>
                    )}

                    {/* Image rendering */}
                    {modoImagen === 'PROPIA' && (imagePreviewUrl || existingImageUrl) ? (
                      <img
                        src={imagePreviewUrl || (existingImageUrl?.startsWith('http') ? existingImageUrl : `http://localhost:3001${existingImageUrl}`)}
                        alt="Pack"
                        className={styles.ecomFullImage}
                      />
                    ) : componentImages.length > 0 ? (
                      <div
                        className={styles.ecomImageGrid}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: componentImages.length <= 2 ? '1fr' : '1fr 1fr',
                          gridTemplateRows: componentImages.length === 1 ? '1fr' : '1fr 1fr',
                        }}
                      >
                        {componentImages.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className={styles.ecomImageCell}
                            style={{
                              gridRow: componentImages.length === 3 && idx === 0 ? 'span 2' : undefined,
                            }}
                          >
                            <img src={img} alt="comp" className={styles.ecomImageCellImg} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Package size={36} color="#cbd5e1" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div className={styles.ecomContent}>
                    <div className={styles.ecomCategory}>
                      {categorias.find((c) => c.id?.toString() === categoriaId)?.nombre || 'COMBO / PACK'}
                    </div>
                    <div className={styles.ecomName}>{nombre || 'Nombre del Combo'}</div>

                    {/* Price and Action */}
                    <div className={styles.ecomPriceRow}>
                      <div>
                        {ahorroMonto > 0 && (
                          <div className={styles.ecomOldPrice}>Bs. {subtotalComponentes.toFixed(2)}</div>
                        )}
                        <div className={styles.ecomPrice}>Bs. {Number(precioBase || 0).toFixed(2)}</div>
                      </div>

                      <button type="button" className={styles.ecomAddBtn}>
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* POS CARD MOCKUP */
                <div className={styles.posCard}>
                  <div className={styles.posTopRow}>
                    {showBadge ? (
                      <span
                        className={styles.posBadge}
                        style={{
                          backgroundColor: selectedBadgeStyleObj.bg,
                          color: selectedBadgeStyleObj.text,
                          border: `1px solid ${selectedBadgeStyleObj.border}`,
                        }}
                      >
                        {resolvedBadgeText}
                      </span>
                    ) : <span />}

                    <span className={virtualStock > 0 ? styles.posStockPositive : styles.posStockNegative}>
                      Stock: {virtualStock}
                    </span>
                  </div>

                  <div className={styles.posImageWrap}>
                    {modoImagen === 'PROPIA' && (imagePreviewUrl || existingImageUrl) ? (
                      <img
                        src={imagePreviewUrl || (existingImageUrl?.startsWith('http') ? existingImageUrl : `http://localhost:3001${existingImageUrl}`)}
                        alt="Pack"
                        className={styles.posFullImage}
                      />
                    ) : componentImages.length > 0 ? (
                      <div
                        className={styles.posImageGrid}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: componentImages.length === 1 ? '1fr' : '1fr 1fr',
                          gridTemplateRows: componentImages.length <= 2 ? '1fr' : '1fr 1fr',
                        }}
                      >
                        {componentImages.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            className={styles.ecomImageCell}
                            style={{
                              gridRow: componentImages.length === 3 && idx === 0 ? 'span 2' : undefined,
                            }}
                          >
                            <img src={img} alt="comp" className={styles.ecomImageCellImg} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Package size={28} color="#cbd5e1" />
                    )}
                  </div>

                  <div className={styles.posName}>{nombre || 'Nombre del Combo'}</div>
                  <div className={styles.posSku}>SKU: {sku || 'COMBO-AUTO'}</div>

                  <div className={styles.posBottomRow}>
                    <div className={styles.posPrice}>Bs. {Number(precioBase || 0).toFixed(2)}</div>
                    {ahorroMonto > 0 && (
                      <span className={styles.posDiscountPill}>-{ahorroPorcentaje}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}

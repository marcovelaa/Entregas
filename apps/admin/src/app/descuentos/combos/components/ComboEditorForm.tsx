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
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b' }}>
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 1rem', color: '#2563eb' }} />
        <p style={{ fontWeight: 600 }}>Cargando estructura del combo...</p>
      </div>
    );
  }

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Top Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => router.push('/descuentos')}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: '#475569',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{
                fontSize: '1.35rem',
                fontWeight: 800,
                margin: 0,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Package size={22} color="#0f172a" />
              {isEditing ? `Editar Combo: ${nombre}` : 'Nuevo Combo / Paquete Promocional'}
            </h1>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
              Configura los componentes del paquete, precio promocional y apariencia de las cards en POS y E-commerce.
            </p>
          </div>
        </div>
      </header>

      {errorMsg && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}
      >
        {/* Left Column: Form Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Card 1: Informacion Comercial */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              1. Información del Combo
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Nombre del Combo / Paquete *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pack Escolar Completo 2026"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Categoría en Catálogo *
                </label>
                <select
                  value={categoriaId}
                  onChange={(e) => setCategoriaId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Código SKU (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: COMBO-ESC-01"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Descripción Comercial (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Incluye 2 cuadernos + 1 estuche de bolígrafos"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Receta BOM */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={18} color="#0f172a" /> 2. Componentes del Paquete (Receta BOM)
              </h3>
              {componentes.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.8rem' }}>
                  <span style={{ color: '#64748b' }}>Stock Virtual del Combo:</span>
                  <span
                    style={{
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      backgroundColor: virtualStock > 0 ? '#ecfdf5' : '#fef2f2',
                      color: virtualStock > 0 ? '#065f46' : '#991b1b',
                      border: `1px solid ${virtualStock > 0 ? '#a7f3d0' : '#fecaca'}`,
                    }}
                  >
                    {virtualStock > 0 ? `${virtualStock} unidades armables` : '0 combos (Sin stock)'}
                  </span>
                </div>
              )}
            </div>
            <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '0.8rem' }}>
              Selecciona qué productos del catálogo componen este combo y cuántas unidades incluye cada uno.
            </p>

            {/* Omnibox & Batch catalog search */}
            <div style={{ marginBottom: '1rem' }}>
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
              <div
                style={{
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  border: '1.5px dashed #cbd5e1',
                  borderRadius: '10px',
                  backgroundColor: '#f8fafc',
                  color: '#64748b',
                }}
              >
                <Package size={36} style={{ margin: '0 auto 0.5rem', color: '#94a3b8' }} />
                <p style={{ margin: '0 0 0.35rem 0', fontSize: '0.9rem', fontWeight: 600, color: '#334155' }}>
                  No has agregado componentes a este combo todavía
                </p>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
                  Usa el buscador rápido de arriba (con soporte para lector de código de barras) o el botón "Explorar Catálogo".
                </p>
              </div>
            ) : (
              <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                    <tr>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'left', fontWeight: 600, color: '#475569' }}>
                        Producto Componente
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 600, color: '#475569', width: '130px' }}>
                        Cantidad
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#475569', width: '110px' }}>
                        P. Unitario
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#475569', width: '110px' }}>
                        Subtotal
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center', fontWeight: 600, color: '#475569', width: '160px' }}>
                        Stock Físico
                      </th>
                      <th style={{ padding: '0.65rem 0.85rem', width: '40px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {componentes.map((c, i) => {
                      const isBottleneck = c.componente_prod_id === bottleneckId && componentes.length > 1;
                      const stockAvailable = c.stock_disponible !== undefined ? c.stock_disponible : 0;
                      const maxCombosFromThis = Math.floor(stockAvailable / (c.cantidad || 1));

                      return (
                        <tr
                          key={c.componente_prod_id}
                          style={{
                            borderBottom: i < componentes.length - 1 ? '1px solid #f1f5f9' : 'none',
                            backgroundColor: isBottleneck ? '#fffbeb' : '#ffffff',
                          }}
                        >
                          <td style={{ padding: '0.65rem 0.85rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.nombre}</div>
                              {isBottleneck && (
                                <span
                                  title="Este producto tiene el stock más bajo y determina cuántos combos se pueden vender"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    fontSize: '0.7rem',
                                    padding: '0.15rem 0.45rem',
                                    borderRadius: '4px',
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    fontWeight: 600,
                                    border: '1px solid #fde68a',
                                  }}
                                >
                                  <AlertTriangle size={12} /> Limita el stock del combo
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>
                              SKU: <span style={{ fontFamily: 'monospace' }}>{c.sku || 'N/A'}</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                border: '1px solid #cbd5e1',
                                borderRadius: '6px',
                                overflow: 'hidden',
                                backgroundColor: '#ffffff',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => handleUpdateCantidad(i, c.cantidad - 1)}
                                style={{
                                  border: 'none',
                                  background: '#f8fafc',
                                  padding: '0.35rem 0.5rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#475569',
                                }}
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={c.cantidad}
                                onChange={(e) => handleUpdateCantidad(i, parseInt(e.target.value) || 1)}
                                style={{
                                  width: '42px',
                                  border: 'none',
                                  textAlign: 'center',
                                  fontSize: '0.85rem',
                                  fontWeight: 600,
                                  padding: '0.25rem 0',
                                  outline: 'none',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleUpdateCantidad(i, c.cantidad + 1)}
                                style={{
                                  border: 'none',
                                  background: '#f8fafc',
                                  padding: '0.35rem 0.5rem',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#475569',
                                }}
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', color: '#64748b' }}>
                            Bs. {(c.precio_unitario || 0).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                            Bs. {((c.precio_unitario || 0) * c.cantidad).toFixed(2)}
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem',
                                borderRadius: '999px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                backgroundColor: stockAvailable >= c.cantidad ? '#ecfdf5' : '#fef2f2',
                                color: stockAvailable >= c.cantidad ? '#065f46' : '#991b1b',
                                border: `1px solid ${stockAvailable >= c.cantidad ? '#a7f3d0' : '#fecaca'}`,
                              }}
                            >
                              {stockAvailable} un. ({maxCombosFromThis} combos)
                            </span>
                          </td>
                          <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handleRemoveComponent(i)}
                              title="Quitar de la receta"
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#94a3b8',
                                cursor: 'pointer',
                                padding: '0.3rem',
                                borderRadius: '4px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                transition: 'color 0.15s, background-color 0.15s',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.color = '#ef4444';
                                e.currentTarget.style.backgroundColor = '#fee2e2';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.color = '#94a3b8';
                                e.currentTarget.style.backgroundColor = 'transparent';
                              }}
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
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.3rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Palette size={18} color="#0f172a" /> 3. Presentación Comercial & Cards (POS & E-commerce)
            </h3>
            <p style={{ margin: '0 0 1.25rem 0', color: '#64748b', fontSize: '0.8rem' }}>
              Controla cómo se presenta el combo visualmente ante los clientes en la tienda y en la pantalla de caja.
            </p>

            {/* Badge Config */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Badge / Tagline Promocional
                </label>
                <input
                  type="text"
                  placeholder={`Ej: ${ahorroPorcentaje > 0 ? `Ahorrá ${ahorroPorcentaje}%` : 'Pack Escolar 2026'}`}
                  value={badgeTexto}
                  onChange={(e) => setBadgeTexto(e.target.value)}
                  disabled={badgeEstilo === 'none'}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.9rem',
                    opacity: badgeEstilo === 'none' ? 0.5 : 1,
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', display: 'block' }}>
                  {badgeEstilo === 'none'
                    ? 'El badge está desactivado para este combo.'
                    : 'Si se deja vacío, muestra automáticamente el % de ahorro o "KIT / COMBO".'}
                </span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.3rem' }}>
                  Estilo Visual del Badge
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {BADGE_STYLES.map((style) => (
                    <button
                      key={style.key}
                      type="button"
                      onClick={() => setBadgeEstilo(style.key)}
                      style={{
                        padding: '0.4rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        backgroundColor: style.bg,
                        color: style.text,
                        border: badgeEstilo === style.key ? `2px solid ${style.text}` : `1px solid ${style.border}`,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
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
            <div style={{ marginBottom: '1.25rem', padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                Modo de Imagen de la Card
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setModoImagen('GRID_AUTO')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'left',
                    backgroundColor: modoImagen === 'GRID_AUTO' ? '#ffffff' : '#f1f5f9',
                    border: modoImagen === 'GRID_AUTO' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <LayoutGrid size={16} /> Cuadrícula Automática (BOM)
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Compone automáticamente las fotos de los componentes ocupando el 100% del área disponible.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setModoImagen('PROPIA')}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '8px',
                    textAlign: 'left',
                    backgroundColor: modoImagen === 'PROPIA' ? '#ffffff' : '#f1f5f9',
                    border: modoImagen === 'PROPIA' ? '2px solid #0f172a' : '1px solid #cbd5e1',
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <ImageIcon size={16} /> Imagen Propia del Pack
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Sube una foto exclusiva del kit armado o diseño promocional.
                  </div>
                </button>
              </div>

              {/* Upload input when PROPIA is selected */}
              {modoImagen === 'PROPIA' && (
                <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px dashed #cbd5e1' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
                    Subir Foto del Pack / Combo:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        backgroundColor: '#ffffff',
                        border: '1px solid #cbd5e1',
                        padding: '0.5rem 0.8rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      <Upload size={14} /> Seleccionar archivo
                      <input type="file" accept="image/*" onChange={handleImageFileChange} style={{ display: 'none' }} />
                    </label>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {selectedImageFile ? selectedImageFile.name : existingImageUrl ? 'Imagen actual cargada' : 'Sin imagen seleccionada'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Destacado en portada */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={destacadoPortada}
                  onChange={(e) => setDestacadoPortada(e.target.checked)}
                  style={{ width: '16px', height: '16px', accentColor: '#0f172a' }}
                />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                    Destacar en la sección de Combos & Ofertas del E-commerce
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Le da prioridad al pack en la página principal y la sección de promociones.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Card 4: Disponibilidad */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.25rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarClock size={18} color="#0f172a" /> 4. Disponibilidad
              </h3>
              {[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length > 0 && (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: '#0f172a', color: '#ffffff' }}>
                  {[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length} activa{[vigenciaEnabled, diasEnabled, cupoEnabled].filter(Boolean).length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Mode badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
                Cada restricción es independiente y se combina automáticamente.
              </p>
              <span style={{
                flexShrink: 0,
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '0.18rem 0.55rem',
                borderRadius: '999px',
                border: '1.5px solid',
                borderColor: modoVenta === 'PERMANENTE' ? '#cbd5e1' : '#0f172a',
                backgroundColor: modoVenta === 'PERMANENTE' ? '#f8fafc' : '#f1f5f9',
                color: modoVenta === 'PERMANENTE' ? '#94a3b8' : '#0f172a',
                whiteSpace: 'nowrap',
              }}>
                {modoVenta === 'PERMANENTE' && 'Permanente'}
                {modoVenta === 'RANGO_FECHAS' && 'Temporal'}
                {modoVenta === 'CUPO_FIJO' && 'Con cupo'}
                {modoVenta === 'MIXTO' && 'Temporal + cupo'}
              </span>
            </div>

            {/* Toggle 1 — Período de vigencia */}
            <div style={{ borderRadius: '10px', border: `1.5px solid ${vigenciaEnabled ? '#0f172a' : '#e2e8f0'}`, overflow: 'hidden', marginBottom: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setVigenciaEnabled(!vigenciaEnabled)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', backgroundColor: vigenciaEnabled ? '#0f172a' : '#f8fafc', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: `2px solid ${vigenciaEnabled ? '#fff' : '#94a3b8'}`, backgroundColor: vigenciaEnabled ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {vigenciaEnabled && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0f172a' }} />}
                  </div>
                  <span style={{ fontSize: '0.87rem', fontWeight: 600, color: vigenciaEnabled ? '#ffffff' : '#0f172a' }}>Período de vigencia</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: vigenciaEnabled ? '#94a3b8' : '#64748b' }}>
                  {vigenciaEnabled ? 'Activo' : 'Siempre disponible'}
                </span>
              </button>
              {vigenciaEnabled && (
                <div style={{ padding: '1rem', backgroundColor: '#ffffff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {/* Desde */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disponible desde</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="date"
                        value={vigenciaInicio}
                        onChange={(e) => setVigenciaInicio(e.target.value)}
                        style={{ flex: '1 1 60%', padding: '0.5rem 0.6rem', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', minWidth: 0 }}
                      />
                      <input
                        type="time"
                        value={vigenciaInicioHora}
                        onChange={(e) => setVigenciaInicioHora(e.target.value)}
                        style={{ flex: '1 1 40%', padding: '0.5rem 0.4rem', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', minWidth: 0 }}
                      />
                    </div>
                  </div>
                  {/* Hasta */}
                  <div>
                    <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Disponible hasta</label>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <input
                        type="date"
                        value={vigenciaFin}
                        onChange={(e) => setVigenciaFin(e.target.value)}
                        style={{ flex: '1 1 60%', padding: '0.5rem 0.6rem', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', minWidth: 0 }}
                      />
                      <input
                        type="time"
                        value={vigenciaFinHora}
                        onChange={(e) => setVigenciaFinHora(e.target.value)}
                        style={{ flex: '1 1 40%', padding: '0.5rem 0.4rem', borderRadius: '7px', border: '1.5px solid #cbd5e1', fontSize: '0.85rem', color: '#0f172a', minWidth: 0 }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle 2 — Días específicos */}
            <div style={{ borderRadius: '10px', border: `1.5px solid ${diasEnabled ? '#0f172a' : '#e2e8f0'}`, overflow: 'hidden', marginBottom: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setDiasEnabled(!diasEnabled)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', backgroundColor: diasEnabled ? '#0f172a' : '#f8fafc', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: `2px solid ${diasEnabled ? '#fff' : '#94a3b8'}`, backgroundColor: diasEnabled ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {diasEnabled && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0f172a' }} />}
                  </div>
                  <span style={{ fontSize: '0.87rem', fontWeight: 600, color: diasEnabled ? '#ffffff' : '#0f172a' }}>Solo en días específicos</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: diasEnabled ? '#94a3b8' : '#64748b' }}>
                  {diasEnabled
                    ? diasSemana.length > 0
                      ? (['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'] as string[]).filter((_, i) => diasSemana.includes(i)).join(', ')
                      : 'Seleccioná días'
                    : 'Todos los días'}
                </span>
              </button>
              {diasEnabled && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {([1,2,3,4,5,6,0] as number[]).map((day) => {
                      const labels: Record<number,string> = { 0:'Dom', 1:'Lun', 2:'Mar', 3:'Mié', 4:'Jue', 5:'Vie', 6:'Sáb' };
                      const isOn = diasSemana.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => setDiasSemana(isOn ? diasSemana.filter(d => d !== day) : [...diasSemana, day])}
                          style={{ padding: '0.4rem 0.8rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: isOn ? 700 : 500, cursor: 'pointer', border: `2px solid ${isOn ? '#0f172a' : '#e2e8f0'}`, backgroundColor: isOn ? '#0f172a' : '#f8fafc', color: isOn ? '#ffffff' : '#64748b', transition: 'all 0.12s' }}
                        >
                          {labels[day]}
                        </button>
                      );
                    })}
                  </div>
                  {diasSemana.length === 0 && (
                    <p style={{ margin: '0.55rem 0 0 0', fontSize: '0.74rem', color: '#f59e0b' }}>Seleccioná al menos un día o desactivá esta restricción.</p>
                  )}
                </div>
              )}
            </div>

            {/* Toggle 3 — Cupo máximo */}
            <div style={{ borderRadius: '10px', border: `1.5px solid ${cupoEnabled ? '#0f172a' : '#e2e8f0'}`, overflow: 'hidden' }}>
              <button
                type="button"
                onClick={() => setCupoEnabled(!cupoEnabled)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', backgroundColor: cupoEnabled ? '#0f172a' : '#f8fafc', border: 'none', cursor: 'pointer' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
                  <div style={{ width: 17, height: 17, borderRadius: '50%', border: `2px solid ${cupoEnabled ? '#fff' : '#94a3b8'}`, backgroundColor: cupoEnabled ? '#fff' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {cupoEnabled && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#0f172a' }} />}
                  </div>
                  <span style={{ fontSize: '0.87rem', fontWeight: 600, color: cupoEnabled ? '#ffffff' : '#0f172a' }}>Limitar cupo de ventas</span>
                </div>
                <span style={{ fontSize: '0.74rem', color: cupoEnabled ? '#94a3b8' : '#64748b' }}>
                  {cupoEnabled ? (cupoMaximo ? `${cupoMaximo} kits máx.` : 'Sin definir') : 'Sin límite'}
                </span>
              </button>
              {cupoEnabled && (
                <div style={{ padding: '0.85rem 1rem', backgroundColor: '#ffffff' }}>
                  <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cupo máximo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={cupoMaximo}
                        onChange={(e) => setCupoMaximo(e.target.value)}
                        placeholder="0"
                        style={{ width: '100%', padding: '0.5rem 3rem 0.5rem 0.7rem', borderRadius: '7px', border: `1.5px solid ${cupoInvalido ? '#ef4444' : '#cbd5e1'}`, fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', backgroundColor: cupoInvalido ? '#fef2f2' : '#ffffff', boxSizing: 'border-box' as const }}
                      />
                      <span style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.73rem', color: '#94a3b8', fontWeight: 600, pointerEvents: 'none' }}>kits</span>
                    </div>
                    {cupoUsado > 0 && <span style={{ fontSize: '0.77rem', color: '#64748b', whiteSpace: 'nowrap' }}>{cupoUsado} vendido{cupoUsado !== 1 ? 's' : ''}</span>}
                  </div>
                  {cupoExcedeStock && (
                    <div style={{ marginTop: '0.7rem', padding: '0.65rem 0.9rem', backgroundColor: '#fef2f2', border: '1.5px solid #fca5a5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}>
                        <AlertTriangle size={14} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: '0.77rem', color: '#991b1b' }}>El cupo supera el stock virtual (<strong>{virtualStock}</strong> kits armables)</span>
                      </div>
                      <button type="button" onClick={() => setCupoMaximo(String(virtualStock))} style={{ flexShrink: 0, padding: '0.3rem 0.6rem', borderRadius: '6px', border: '1.5px solid #fca5a5', backgroundColor: '#ffffff', color: '#991b1b', fontSize: '0.74rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Ajustar a {virtualStock}</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Canal de Publicación */}
            <div style={{ marginTop: '0.75rem', padding: '0.85rem 1rem', backgroundColor: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'block', fontSize: '0.73rem', fontWeight: 700, color: '#475569', marginBottom: '0.45rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Canal de Publicación
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
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
                      style={{
                        padding: '0.55rem 0.4rem',
                        borderRadius: '8px',
                        border: isSel ? '2px solid #0f172a' : '1px solid #cbd5e1',
                        backgroundColor: isSel ? '#0f172a' : '#ffffff',
                        color: isSel ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{c.label}</div>
                      <div style={{ fontSize: '0.68rem', color: isSel ? '#94a3b8' : '#64748b', marginTop: '2px' }}>{c.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {!vigenciaEnabled && !diasEnabled && !cupoEnabled && (
              <div style={{ marginTop: '0.85rem', padding: '0.65rem 1rem', backgroundColor: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  Sin restricciones de fecha/cupo — se vende siempre que haya stock disponible.
                </span>
              </div>
            )}
          </div>
        </div>


        {/* Right Column: Pricing, Availability & Live Card Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '1rem' }}>
          {/* Card Pricing */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            }}
          >
            <h3 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
              Precio & Ahorro
            </h3>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', color: '#64748b', fontWeight: 500, marginBottom: '0.3rem' }}>
                Suma Individual de Componentes:
              </label>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#475569' }}>
                Bs. {subtotalComponentes.toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.3rem' }}>
                Precio Promocional del Combo *
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '1rem' }}>Bs.</span>
                <input
                  type="number"
                  step="0.10"
                  min="0.10"
                  placeholder="0.00"
                  value={precioBase}
                  onChange={(e) => setPrecioBase(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '6px',
                    border: '1.5px solid #0f172a',
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                  required
                />
              </div>
            </div>

            {/* Savings Box */}
            <div
              style={{
                backgroundColor: ahorroMonto > 0 ? '#ecfdf5' : '#f8fafc',
                border: ahorroMonto > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: ahorroMonto > 0 ? '#065f46' : '#64748b', fontWeight: 600 }}>
                Ahorro para el Cliente:
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 800, color: ahorroMonto > 0 ? '#059669' : '#94a3b8', marginTop: '0.2rem' }}>
                {ahorroMonto > 0 ? `Bs. ${ahorroMonto.toFixed(2)} (${ahorroPorcentaje}%)` : 'Sin Ahorro'}
              </div>
            </div>

            {/* Virtual Availability Box */}
            <div
              style={{
                backgroundColor: sellableInfo.sellable > 0 ? '#f0fdf4' : '#fef2f2',
                border: sellableInfo.sellable > 0 ? '1px solid #bbf7d0' : '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: sellableInfo.sellable > 0 ? '#166534' : '#991b1b', fontWeight: 600 }}>
                Disponibilidad Inmediata:
              </div>
              <div
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  color: sellableInfo.sellable > 0 ? '#16a34a' : '#ef4444',
                  marginTop: '0.2rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {sellableInfo.sellable > 0 ? <CheckCircle size={17} /> : <AlertCircle size={17} />}
                {sellableInfo.sellable} kit{sellableInfo.sellable !== 1 ? 's' : ''} disponibles
              </div>
              {estadoLabel && (
                <span
                  style={{
                    display: 'inline-block',
                    marginTop: '0.4rem',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '999px',
                    backgroundColor: sellableInfo.estado === 'ACTIVO' ? '#dcfce7' : '#fee2e2',
                    color: sellableInfo.estado === 'ACTIVO' ? '#166534' : '#991b1b',
                    border: `1px solid ${sellableInfo.estado === 'ACTIVO' ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  {estadoLabel}
                </span>
              )}
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.7rem', color: '#64748b' }}>
                Stock dinámico según el producto con menor disponibilidad, vigencia y cupo configurados.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving || cupoInvalido}
              style={{
                width: '100%',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                border: 'none',
                padding: '0.8rem',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
              }}
            >
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              {isEditing ? 'Guardar Cambios del Combo' : 'Publicar Combo Promocional'}
            </button>
          </div>

          {/* Interactive Live Card Preview */}
          <div
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.25rem',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Eye size={16} /> Vista Previa en Vivo
              </div>
              <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewTab('ecommerce')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: previewTab === 'ecommerce' ? '#ffffff' : 'transparent',
                    color: previewTab === 'ecommerce' ? '#0f172a' : '#64748b',
                    boxShadow: previewTab === 'ecommerce' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <ShoppingBag size={13} /> E-com
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab('pos')}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: '4px',
                    border: 'none',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: previewTab === 'pos' ? '#ffffff' : 'transparent',
                    color: previewTab === 'pos' ? '#0f172a' : '#64748b',
                    boxShadow: previewTab === 'pos' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}
                >
                  <Monitor size={13} /> POS
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
              {previewTab === 'ecommerce' ? (
                /* E-COMMERCE CARD MOCKUP */
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Image container */}
                  <div
                    style={{
                      position: 'relative',
                      height: '160px',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Badge */}
                    {showBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '8px',
                          left: '8px',
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          textTransform: 'uppercase',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '4px',
                          backgroundColor: selectedBadgeStyleObj.bg,
                          color: selectedBadgeStyleObj.text,
                          border: `1px solid ${selectedBadgeStyleObj.border}`,
                          zIndex: 2,
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
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : componentImages.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: componentImages.length <= 2 ? '1fr' : '1fr 1fr',
                          gridTemplateRows: componentImages.length === 1 ? '1fr' : '1fr 1fr',
                          width: '100%',
                          height: '100%',
                          gap: '2px',
                          backgroundColor: '#f1f5f9',
                          padding: '2px',
                        }}
                      >
                        {componentImages.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gridRow: componentImages.length === 3 && idx === 0 ? 'span 2' : undefined,
                            }}
                          >
                            <img src={img} alt="comp" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Package size={36} color="#cbd5e1" />
                    )}
                  </div>

                  {/* Card Content */}
                  <div style={{ padding: '0.85rem' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                      {categorias.find((c) => c.id?.toString() === categoriaId)?.nombre || 'COMBO / PACK'}
                    </div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        color: '#0f172a',
                        lineHeight: 1.25,
                        marginBottom: '0.35rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {nombre || 'Nombre del Combo'}
                    </div>



                    {/* Price and Action */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                      <div>
                        {ahorroMonto > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 500 }}>
                            Bs. {subtotalComponentes.toFixed(2)}
                          </div>
                        )}
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                          Bs. {Number(precioBase || 0).toFixed(2)}
                        </div>
                      </div>

                      <button
                        type="button"
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #2563eb',
                          color: '#2563eb',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          cursor: 'pointer',
                        }}
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* POS CARD MOCKUP */
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    padding: '0.75rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    {showBadge ? (
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          padding: '0.15rem 0.4rem',
                          borderRadius: '4px',
                          backgroundColor: selectedBadgeStyleObj.bg,
                          color: selectedBadgeStyleObj.text,
                          border: `1px solid ${selectedBadgeStyleObj.border}`,
                        }}
                      >
                        {resolvedBadgeText}
                      </span>
                    ) : <span />}

                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: virtualStock > 0 ? '#16a34a' : '#ef4444',
                        backgroundColor: virtualStock > 0 ? '#dcfce7' : '#fee2e2',
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                      }}
                    >
                      Stock: {virtualStock}
                    </span>
                  </div>

                  <div
                    style={{
                      height: '80px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '6px',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      border: '1px solid #f1f5f9',
                    }}
                  >
                    {modoImagen === 'PROPIA' && (imagePreviewUrl || existingImageUrl) ? (
                      <img
                        src={imagePreviewUrl || (existingImageUrl?.startsWith('http') ? existingImageUrl : `http://localhost:3001${existingImageUrl}`)}
                        alt="Pack"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    ) : componentImages.length > 0 ? (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: componentImages.length === 1 ? '1fr' : '1fr 1fr',
                          gridTemplateRows: componentImages.length <= 2 ? '1fr' : '1fr 1fr',
                          width: '100%',
                          height: '100%',
                          gap: '2px',
                          backgroundColor: '#f1f5f9',
                        }}
                      >
                        {componentImages.slice(0, 4).map((img, idx) => (
                          <div
                            key={idx}
                            style={{
                              backgroundColor: '#ffffff',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gridRow: componentImages.length === 3 && idx === 0 ? 'span 2' : undefined,
                            }}
                          >
                            <img src={img} alt="comp" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Package size={28} color="#cbd5e1" />
                    )}
                  </div>

                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a', marginBottom: '0.1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {nombre || 'Nombre del Combo'}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.4rem' }}>
                    SKU: {sku || 'COMBO-AUTO'}
                  </div>



                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.3rem' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a' }}>
                      Bs. {Number(precioBase || 0).toFixed(2)}
                    </div>
                    {ahorroMonto > 0 && (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#059669', backgroundColor: '#ecfdf5', padding: '0.15rem 0.35rem', borderRadius: '4px' }}>
                        -{ahorroPorcentaje}%
                      </span>
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

'use client';
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, FileText, Tags, Image, Package, Loader2, Save, ArrowLeft } from 'lucide-react';
import styles from '../productos.module.css';
import { api } from '../../../../lib/axios';
import InfoGeneralSection from './InfoGeneralSection';
import AtributosSection from './AtributosSection';
import MediaSection from './MediaSection';
import VariantesSection from './VariantesSection';

interface Props {
  mode: 'create' | 'edit';
  tipo: string;
  categorias: any[];
  marcas: any[];
  initialProduct?: any;
}

export default function ProductEditor({ mode, tipo, categorias, marcas, initialProduct }: Props) {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>(mode);
  const [currentTab, setCurrentTab] = useState<'datos' | 'medios'>('datos');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [savedProduct, setSavedProduct] = useState<any>(initialProduct || null);

  const [productPayload, setProductPayload] = useState<any>({
    nombre: initialProduct?.nombre || '',
    sku: initialProduct?.sku || '',
    naturaleza: initialProduct?.naturaleza || tipo,
    tipo_producto: initialProduct?.tipo_producto || 'SIMPLE',
    precio_base: initialProduct?.precio_base || 0,
    precio_promocional: initialProduct?.precio_promocional || '',
    categoria_id: initialProduct?.categoria_id || (categorias.length > 0 ? categorias[0].id : ''),
    marca_id: initialProduct?.marca_id || '',
    atributos: initialProduct?.atributos || {},
  });

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    info: true,
    atributos: true,
    media: true,
    variantes: true,
  });

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async (shouldExit: boolean = false) => {
    setSaving(true);
    setSuccessMsg(null);
    try {
      const catId = productPayload.categoria_id;
      if (!catId) throw new Error('Debe seleccionar una categoría');
      if (!productPayload.nombre?.trim()) throw new Error('El nombre es obligatorio');

      const payload = {
        nombre: productPayload.nombre,
        sku: productPayload.sku || undefined,
        naturaleza: productPayload.naturaleza,
        tipo_producto: productPayload.tipo_producto || 'SIMPLE',
        precio_base: Number(productPayload.precio_base) || 0,
        precio_promocional: productPayload.precio_promocional ? Number(productPayload.precio_promocional) : undefined,
        categoria_id: Number(catId),
        marca_id: productPayload.marca_id ? Number(productPayload.marca_id) : undefined,
        atributos: productPayload.atributos,
      };

      let res;
      if (editorMode === 'edit' && savedProduct?.id) {
        res = await api.patch(`/productos/${savedProduct.id}`, payload);
        const savedData = res.data.data || res.data;
        setSavedProduct(savedData);
        setSuccessMsg(shouldExit ? 'Producto actualizado. Volviendo al catálogo...' : 'Cambios guardados.');
      } else {
        res = await api.post('/productos', payload);
        const savedData = res.data.data || res.data;
        setSavedProduct(savedData);
        setEditorMode('edit');
        setCurrentTab('medios');
        setSuccessMsg(shouldExit ? 'Producto creado. Volviendo al catálogo...' : 'Producto creado con éxito. Ahora podés gestionar imágenes y variantes.');
        if (savedData?.id) {
          window.history.replaceState({}, '', `/catalogo/productos/${savedData.id}`);
        }
      }

      if (shouldExit) {
        setTimeout(() => {
          router.push('/catalogo');
        }, 800);
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const refreshProduct = useCallback(async () => {
    if (!savedProduct?.id) return;
    try {
      const res = await api.get(`/productos/${savedProduct.id}`);
      const savedData = res.data.data || res.data;
      setSavedProduct(savedData);
    } catch { /* silent */ }
  }, [savedProduct?.id]);

  const sections = [];

  if (currentTab === 'datos') {
    sections.push(
      {
        key: 'info' as const,
        title: 'Información General',
        icon: <FileText size={18} />,
        content: <InfoGeneralSection productPayload={productPayload} setProductPayload={setProductPayload} marcas={marcas} categorias={categorias} />,
      },
      {
        key: 'atributos' as const,
        title: 'Atributos Específicos',
        icon: <Tags size={18} />,
        content: <AtributosSection productPayload={productPayload} setProductPayload={setProductPayload} categorias={categorias} selectedNaturaleza={productPayload.naturaleza || tipo} />,
      }
    );
  }

  if (currentTab === 'medios' && editorMode === 'edit') {
    sections.push({
      key: 'media' as const,
      title: 'Galería de Imágenes',
      icon: <Image size={18} />,
      content: <MediaSection productoId={savedProduct?.id?.toString() || null} imagenes={savedProduct?.imagenes || []} onRefresh={refreshProduct} />,
    });
    sections.push({
      key: 'variantes' as const,
      title: 'Variantes / Presentaciones',
      icon: <Package size={18} />,
      content: <VariantesSection productoId={savedProduct?.id?.toString() || null} productoSku={savedProduct?.sku || productPayload.sku || ''} imagenes={savedProduct?.imagenes || []} productoPrecioBase={savedProduct?.precio_base || productPayload.precio_base || 0} />,
    });
  }

  return (
    <div>
      {/* Save bar */}
      <div className={styles.saveBar}>
        <div className={styles.saveBarLeft}>
          <a 
            href="/catalogo" 
            className={styles.backLink}
            title="Volver al catálogo principal"
          >
            <ArrowLeft size={18} />
            Volver al catálogo
          </a>
          <span className={styles.saveBarTitle}>
            {editorMode === 'edit' ? `Editar: ${savedProduct?.nombre || ''}` : `Nuevo: ${productPayload.naturaleza || 'Producto'}`}
          </span>
        </div>
        <div className={styles.saveBarActions}>
          <button className={styles.btnSecondary} onClick={() => router.push('/catalogo')} disabled={saving}>
            Cancelar
          </button>
          {editorMode === 'create' ? (
            <button className={styles.btnPrimary} onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
              Guardar y Continuar
            </button>
          ) : (
            <button className={styles.btnPrimary} onClick={() => handleSave(false)} disabled={saving}>
              {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
              Guardar Cambios
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation for edit mode */}
      {editorMode === 'edit' && (
        <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '2px solid #e2e8f0', marginBottom: '1.5rem', paddingBottom: '0' }}>
          <button 
            type="button"
            onClick={() => setCurrentTab('datos')}
            style={{ 
              background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              color: currentTab === 'datos' ? '#0f172a' : '#64748b',
              borderBottom: currentTab === 'datos' ? '2px solid #0f172a' : '2px solid transparent',
              paddingBottom: '0.75rem', marginBottom: '-2px', transition: 'all 0.2s'
            }}
          >
            Datos Principales
          </button>
          <button 
            type="button"
            onClick={() => setCurrentTab('medios')}
            style={{ 
              background: 'none', border: 'none', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
              color: currentTab === 'medios' ? '#0f172a' : '#64748b',
              borderBottom: currentTab === 'medios' ? '2px solid #0f172a' : '2px solid transparent',
              paddingBottom: '0.75rem', marginBottom: '-2px', transition: 'all 0.2s'
            }}
          >
            Imágenes y Variantes
          </button>
        </div>
      )}

      {/* Success message */}
      {successMsg && (
        <div className={styles.successMessage} style={{ marginBottom: '1rem' }}>
          {successMsg}
        </div>
      )}

      {/* Sections */}
      <div className={styles.editorLayout}>
        {sections.map(sec => (
          <div key={sec.key} className={styles.section}>
            <div className={styles.sectionHeader} onClick={() => toggleSection(sec.key)}>
              <div className={styles.sectionHeaderLeft}>
                <div className={styles.sectionIcon}>{sec.icon}</div>
                <span className={styles.sectionTitle}>{sec.title}</span>
              </div>
              <ChevronDown
                size={18}
                className={`${styles.sectionChevron} ${openSections[sec.key] ? styles.sectionChevronOpen : ''}`}
              />
            </div>
            {openSections[sec.key] && (
              <div className={styles.sectionBody}>
                {sec.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

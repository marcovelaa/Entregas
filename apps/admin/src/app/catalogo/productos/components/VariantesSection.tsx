'use client';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Loader2, Plus, Package, ImagePlus, Edit2, Check, X } from 'lucide-react';
import styles from '../productos.module.css';
import { api } from '../../../../lib/axios';
import EmpaquesSection from './EmpaquesSection';

interface Props {
  productoId: string | null;
  productoSku: string;
  imagenes?: any[];
  productoPrecioBase?: number;
}

export default function VariantesSection({ productoId, productoSku, imagenes = [], productoPrecioBase = 0 }: Props) {
  const [variantes, setVariantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingVariantId, setUploadingVariantId] = useState<string | null>(null);
  const [openGalleryDropdown, setOpenGalleryDropdown] = useState<string | null>(null);
  const [selectedVariante, setSelectedVariante] = useState<any | null>(null);

  const [editingVarianteId, setEditingVarianteId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchVariantes = useCallback(async () => {
    if (!productoId) return;
    setLoading(true);
    try {
      const res = await api.get(`/variantes/producto/${productoId}`);
      setVariantes(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [productoId]);

  useEffect(() => {
    if (productoId) fetchVariantes();
  }, [productoId, fetchVariantes]);

  const handleSelectGalleryImage = async (variantId: string, url: string) => {
    try {
      await api.patch(`/variantes/${variantId}`, { imagen_url: url });
      fetchVariantes();
    } catch {
      alert('Error al asignar foto de galería');
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !productoId) return;
    setSubmitting(true);
    try {
      const names = nombre.split(',').map(n => n.trim()).filter(Boolean);
      
      const bulkPayload = names.map(item => ({
        producto_id: Number(productoId),
        nombre: item,
        sku_base: `${productoSku || 'PRD'}-${item.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      }));

      await api.post('/variantes/bulk', { variantes: bulkPayload });
      
      setNombre('');
      setPrecio('');
      fetchVariantes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al agregar');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/variantes/${id}`, { activo: !activo });
      fetchVariantes();
    } catch {
      alert('Error al actualizar');
    }
  };

  const handleStartEdit = (v: any) => {
    setEditingVarianteId(v.id);
    setEditValues({
      nombre: v.nombre,
      sku_base: v.sku_base,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingVarianteId) return;
    setSavingEdit(true);
    try {
      await api.patch(`/variantes/${editingVarianteId}`, {
        nombre: editValues.nombre,
        sku_base: editValues.sku_base,
      });
      setEditingVarianteId(null);
      fetchVariantes();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingVariantId) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
      const res = await fetch(`${API_URL}/variantes/upload-imagen/${uploadingVariantId}`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Error al subir imagen');
      }
      fetchVariantes();
    } catch (err: any) {
      alert(err.message || 'Error al subir imagen de variante');
    } finally {
      setUploadingVariantId(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!productoId) {
    return (
      <div className={styles.infoMessage}>
        <Package size={20} />
        <span>Guardá el producto primero para agregar variantes.</span>
      </div>
    );
  }

  return (
    <div>
      {/* Quick add form */}
      <form onSubmit={handleAdd} className={styles.variantAddRow}>
        <div className={styles.formGroup} style={{ flex: 2 }}>
          <label className={styles.formLabel}>Nombre de variante</label>
          <input
            required
            className={styles.formInput}
            placeholder="Ej. Azul, Rojo, Negro, Verde (separar por comas para lote)"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          
        </div>
        <button type="submit" className={styles.btnPrimary} disabled={submitting || !nombre.trim()} style={{ height: '42px', marginBottom: '0.4rem' }}>
          {submitting ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
          Agregar
        </button>
      </form>

      {/* Variantes table */}
      {loading ? (
        <div className={styles.loadingCenter} style={{ padding: '2rem' }}>
          <Loader2 className={styles.spin} size={24} color="#64748b" />
        </div>
      ) : variantes.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          No hay variantes aún. Agregá la primera arriba.
        </div>
      ) : (
        <table className={styles.variantTable}>
          <thead>
            <tr>
              <th>Imagen</th>
              <th>Variante</th>
              <th>SKU</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {variantes.map(v => (
              <tr key={v.id} style={{ opacity: v.activo ? 1 : 0.5 }}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div
                      className={styles.variantImgCell}
                      onClick={() => { setUploadingVariantId(v.id); fileInputRef.current?.click(); }}
                      title="Click para subir foto de archivo"
                    >
                      {v.imagen_url ? (
                        <img src={`http://localhost:3001${v.imagen_url}`} alt="" className={styles.variantImgCellImg} />
                      ) : (
                        <ImagePlus size={18} color="#94a3b8" />
                      )}
                    </div>
                    {imagenes && imagenes.length > 0 && (
                      <div style={{ position: 'relative' }}>
                        <button
                          type="button"
                          className={styles.btnSecondary}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', gap: '0.3rem', background: '#fff', borderColor: '#e2e8f0' }}
                          onClick={() => setOpenGalleryDropdown(openGalleryDropdown === v.id ? null : v.id)}
                          title="Seleccionar foto de la galería del producto"
                        >
                          <ImagePlus size={14} /> Galería
                        </button>
                        
                        {openGalleryDropdown === v.id && (
                          <div style={{
                            marginTop: '0.5rem', background: '#fff',
                            border: '1px solid #e2e8f0', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                            width: '160px', maxHeight: '200px', overflowY: 'auto', padding: '0.4rem', 
                            display: 'flex', flexDirection: 'column', gap: '0.25rem'
                          }}>
                            {imagenes.map((img: any) => (
                              <div
                                key={img.id}
                                onClick={() => {
                                  handleSelectGalleryImage(v.id, img.url);
                                  setOpenGalleryDropdown(null);
                                }}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.4rem',
                                  borderRadius: '6px', cursor: 'pointer', background: v.imagen_url === img.url ? '#f1f5f9' : 'transparent'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f1f5f9'}
                                onMouseLeave={e => e.currentTarget.style.background = v.imagen_url === img.url ? '#f1f5f9' : 'transparent'}
                              >
                                <img src={`http://localhost:3001${img.url}`} alt="" style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #e2e8f0', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {img.es_principal ? 'Portada' : `Imagen`}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                {editingVarianteId === v.id ? (
                  <>
                    <td>
                      <input 
                        className={styles.formInput} 
                        style={{ height: '32px', padding: '0 0.4rem', width: '100%' }}
                        value={editValues.nombre}
                        onChange={ev => setEditValues({...editValues, nombre: ev.target.value})}
                      />
                    </td>
                    <td>
                      <input 
                        className={styles.formInput} 
                        style={{ height: '32px', padding: '0 0.4rem', width: '100%' }}
                        value={editValues.sku_base}
                        onChange={ev => setEditValues({...editValues, sku_base: ev.target.value})}
                      />
                    </td>
                    <td>
                      <span className={`${styles.pill} ${v.activo ? styles.pillGreen : styles.pillRed}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.3rem' }}>
                      <button className={styles.btnSecondary} onClick={() => setEditingVarianteId(null)} disabled={savingEdit} title="Cancelar" style={{ padding: '0.4rem', height: '32px' }}>
                        <X size={14} />
                      </button>
                      <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={savingEdit} title="Guardar" style={{ padding: '0.4rem', height: '32px' }}>
                        {savingEdit ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ fontWeight: 600 }}>{v.nombre}</td>
                    <td><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{v.sku_base}</code></td>
                    <td>
                      <span className={`${styles.pill} ${v.activo ? styles.pillGreen : styles.pillRed}`}>
                        {v.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleStartEdit(v)}
                        title="Editar"
                        style={{ padding: '0.4rem', height: '32px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => setSelectedVariante(selectedVariante?.id === v.id ? null : v)}
                        style={{ height: '32px', padding: '0 0.5rem' }}
                      >
                        Empaques
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleToggle(v.id, v.activo)}
                        style={{ padding: '0 0.5rem', height: '32px' }}
                      >
                        {v.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedVariante && (
        <EmpaquesSection 
          varianteId={selectedVariante.id} 
          varianteNombre={selectedVariante.nombre} 
          varianteSku={selectedVariante.sku_base}
          todasVariantes={variantes}
          productoPrecioBase={productoPrecioBase}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        style={{ display: 'none' }}
        onChange={handleUploadImage}
      />
    </div>
  );
}

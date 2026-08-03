'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Package, Copy, Edit2, X, Check } from 'lucide-react';
import styles from '../productos.module.css';
import { api } from '../../../../lib/axios';

interface Props {
  varianteId: string | null;
  varianteNombre: string;
  varianteSku: string;
  todasVariantes?: any[];
  productoPrecioBase?: number;
}

export default function EmpaquesSection({ varianteId, varianteNombre, varianteSku, todasVariantes, productoPrecioBase = 0 }: Props) {
  const [empaques, setEmpaques] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [selectedVariantsToApply, setSelectedVariantsToApply] = useState<string[]>([String(varianteId)]);
  
  const [nombre, setNombre] = useState('Unidad');
  const [multiplicador, setMultiplicador] = useState(1);
  const [precio, setPrecio] = useState('');
  const [precioModificadoManualmente, setPrecioModificadoManualmente] = useState(false);

  // Auto calculate when multiplicador changes (only if not manually modified)
  useEffect(() => {
    const basePriceNum = Number(productoPrecioBase) || 0;
    if (!precioModificadoManualmente && basePriceNum > 0) {
      setPrecio((basePriceNum * multiplicador).toFixed(2));
    }
  }, [multiplicador, productoPrecioBase, precioModificadoManualmente]);

  const [editingEmpaqueId, setEditingEmpaqueId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchEmpaques = useCallback(async () => {
    if (!varianteId) return;
    setLoading(true);
    try {
      const res = await api.get(`/empaques/variante/${varianteId}`);
      setEmpaques(res.data);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [varianteId]);

  useEffect(() => {
    if (varianteId) {
      fetchEmpaques();
      setSelectedVariantsToApply([String(varianteId)]);
    }
  }, [varianteId, fetchEmpaques]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !varianteId || !precio || selectedVariantsToApply.length === 0) return;
    setSubmitting(true);
    try {
      const bulkPayload = selectedVariantsToApply.map(vIdStr => {
        const targetV = todasVariantes?.find(v => String(v.id) === String(vIdStr));
        const skuBase = targetV ? targetV.sku_base : varianteSku;
        const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
        return {
          variante_id: Number(vIdStr),
          nombre,
          sku: `${skuBase}-${nombre.replace(/\s+/g, '').substring(0, 4).toUpperCase()}-${rand}`,
          multiplicador_unidades: Number(multiplicador),
          precio: Number(precio),
        };
      });

      await api.post('/empaques/bulk', { empaques: bulkPayload });
      
      setNombre('');
      setMultiplicador(1);
      setPrecioModificadoManualmente(false);
      const basePriceNum = Number(productoPrecioBase) || 0;
      setPrecio(basePriceNum > 0 ? basePriceNum.toFixed(2) : '');
      setSelectedVariantsToApply([String(varianteId)]);
      fetchEmpaques();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al agregar empaque');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (id: string, activo: boolean) => {
    try {
      await api.patch(`/empaques/${id}`, { activo: !activo });
      fetchEmpaques();
    } catch {
      alert('Error al actualizar');
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEmpaqueId) return;
    setSavingEdit(true);
    try {
      await api.patch(`/empaques/${editingEmpaqueId}`, {
        nombre: editValues.nombre,
        multiplicador_unidades: Number(editValues.multiplicador_unidades),
        precio: Number(editValues.precio),
      });
      setEditingEmpaqueId(null);
      fetchEmpaques();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleStartEdit = (emp: any) => {
    setEditingEmpaqueId(emp.id);
    setEditValues({
      nombre: emp.nombre,
      multiplicador_unidades: emp.multiplicador_unidades,
      precio: emp.precio,
    });
  };



  if (!varianteId) {
    return (
      <div className={styles.infoMessage}>
        <Package size={20} />
        <span>Seleccioná una variante para agregar empaques.</span>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h4 style={{ color: '#334155', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
          <Package size={18} />
          Empaques de {varianteNombre}
        </h4>
      </div>
      
      <form onSubmit={handleAdd} className={styles.variantAddRow} style={{ marginBottom: '1rem' }}>
        <div className={styles.formGroup} style={{ flex: 2 }}>
          <label className={styles.formLabel}>Nombre (Ej: Unidad, Caja x12)</label>
          <input
            required
            className={styles.formInput}
            value={nombre}
            onChange={e => setNombre(e.target.value)}
          />
        </div>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.formLabel}>Contiene (Unidades)</label>
          <input
            required
            type="number"
            min="1"
            className={styles.formInput}
            value={multiplicador}
            onChange={e => setMultiplicador(Number(e.target.value))}
          />
        </div>
        <div className={styles.formGroup} style={{ flex: 1 }}>
          <label className={styles.formLabel}>Precio (Bs.)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            className={styles.formInput}
            placeholder="0.00"
            value={precio}
            onChange={e => {
              setPrecio(e.target.value);
              setPrecioModificadoManualmente(true);
            }}
          />
        </div>
        <button type="submit" className={styles.btnPrimary} disabled={submitting} style={{ height: '42px', marginBottom: '0.4rem' }}>
          {submitting ? <Loader2 size={16} className={styles.spin} /> : <Plus size={16} />}
          Agregar
        </button>
      </form>
      
      {todasVariantes && todasVariantes.length > 1 && (
        <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '6px', marginBottom: '1.5rem', border: '1px solid #e2e8f0' }}>
          <span style={{ display: 'block', fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>
            ¿Aplicar este empaque también a otras variantes?
          </span>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {todasVariantes.map(v => {
              const isCurrent = String(v.id) === String(varianteId);
              return (
                <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', cursor: isCurrent ? 'not-allowed' : 'pointer', color: isCurrent ? '#94a3b8' : '#334155' }}>
                  <input 
                    type="checkbox"
                    checked={selectedVariantsToApply.includes(String(v.id))}
                    disabled={isCurrent}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedVariantsToApply([...selectedVariantsToApply, String(v.id)]);
                      } else {
                        setSelectedVariantsToApply(selectedVariantsToApply.filter(id => id !== String(v.id)));
                      }
                    }}
                  />
                  {v.nombre}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.loadingCenter}>
          <Loader2 className={styles.spin} size={20} color="#64748b" />
        </div>
      ) : empaques.length === 0 ? (
        <div style={{ padding: '1rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
          No hay empaques. Agregá uno.
        </div>
      ) : (
        <table className={styles.variantTable}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>SKU</th>
              <th>Contiene</th>
              <th>Precio</th>
              <th>Estado</th>
              <th style={{ textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empaques.map(e => (
              <tr key={e.id} style={{ opacity: e.activo ? 1 : 0.5 }}>
                {editingEmpaqueId === e.id ? (
                  <>
                    <td>
                      <input 
                        className={styles.formInput} 
                        style={{ height: '32px', padding: '0 0.4rem', width: '100%' }}
                        value={editValues.nombre}
                        onChange={ev => setEditValues({...editValues, nombre: ev.target.value})}
                      />
                    </td>
                    <td><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.sku}</code></td>
                    <td>
                      <input 
                        className={styles.formInput} 
                        type="number"
                        min="1"
                        style={{ height: '32px', padding: '0 0.4rem', width: '80px' }}
                        value={editValues.multiplicador_unidades}
                        onChange={ev => {
                          const newMult = Number(ev.target.value);
                          const basePriceNum = Number(productoPrecioBase) || 0;
                          setEditValues({
                            ...editValues, 
                            multiplicador_unidades: newMult,
                            precio: (basePriceNum * newMult).toFixed(2)
                          });
                        }}
                      />
                    </td>
                    <td>
                      <input 
                        className={styles.formInput} 
                        type="number"
                        step="0.01"
                        min="0"
                        style={{ height: '32px', padding: '0 0.4rem', width: '100px' }}
                        value={editValues.precio}
                        onChange={ev => setEditValues({...editValues, precio: ev.target.value})}
                      />
                    </td>
                    <td>
                      <span className={`${styles.pill} ${e.activo ? styles.pillGreen : styles.pillRed}`}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button className={styles.btnSecondary} onClick={() => setEditingEmpaqueId(null)} disabled={savingEdit} title="Cancelar" style={{ padding: '0.4rem', height: '32px' }}>
                        <X size={14} />
                      </button>
                      <button className={styles.btnPrimary} onClick={handleSaveEdit} disabled={savingEdit} title="Guardar" style={{ padding: '0.4rem', height: '32px' }}>
                        {savingEdit ? <Loader2 size={14} className={styles.spin} /> : <Check size={14} />}
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ fontWeight: 600 }}>{e.nombre}</td>
                    <td><code style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.sku}</code></td>
                    <td>{e.multiplicador_unidades} unid.</td>
                    <td style={{ fontWeight: 600 }}>Bs. {Number(e.precio).toFixed(2)}</td>
                    <td>
                      <span className={`${styles.pill} ${e.activo ? styles.pillGreen : styles.pillRed}`}>
                        {e.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '0.3rem', justifyContent: 'flex-end' }}>
                      <button
                        className={styles.btnSecondary}
                        onClick={() => handleStartEdit(e)}
                        title="Editar"
                        style={{ padding: '0.4rem', height: '32px' }}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleToggle(e.id, e.activo)}
                        style={{ padding: '0 0.5rem', height: '32px' }}
                      >
                        {e.activo ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

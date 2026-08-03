'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Trash2, RefreshCw, Save } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../page.module.css';
import { api } from '../../../lib/axios';
import { Producto } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  producto: Producto | null;
}

export default function VariantesModal({ isOpen, onClose, producto }: Props) {
  const [variantes, setVariantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Matriz de opciones multi-dimensionales
  const [opciones, setOpciones] = useState<{nombre: string, valores: string[]}[]>([]);

  const fetchVariantes = useCallback(async () => {
    if (!producto?.id) return;
    setLoading(true);
    try {
      const res = await api.get(`/presentaciones/producto/${producto.id}`);
      setVariantes(res.data);
    } catch (err) {
      console.error('Error al cargar variantes');
    } finally {
      setLoading(false);
    }
  }, [producto?.id]);

  useEffect(() => {
    if (isOpen) {
      fetchVariantes();
      if (producto?.opciones_variantes) {
        setOpciones(producto.opciones_variantes);
      } else {
        setOpciones([]);
      }
    }
  }, [isOpen, fetchVariantes, producto]);

  const addOpcion = () => setOpciones([...opciones, { nombre: '', valores: [] }]);
  const removeOpcion = (index: number) => setOpciones(opciones.filter((_, i) => i !== index));
  const updateOpcionNombre = (index: number, nombre: string) => {
    const newOpciones = [...opciones];
    newOpciones[index].nombre = nombre;
    setOpciones(newOpciones);
  };
  const updateOpcionValores = (index: number, str: string) => {
    const newOpciones = [...opciones];
    newOpciones[index].valores = str.split(',').map(v => v.trim()).filter(Boolean);
    setOpciones(newOpciones);
  };

  function cartesian(args: string[][]) {
    var r: string[][] = [], max = args.length - 1;
    function helper(arr: string[], i: number) {
      for (var j = 0, l = args[i].length; j < l; j++) {
        var a = arr.slice(0);
        a.push(args[i][j]);
        if (i == max) r.push(a);
        else helper(a, i + 1);
      }
    }
    if (args.length > 0) helper([], 0);
    return r;
  }

  async function generarCombinaciones() {
    if (!producto) return;
    if (opciones.length === 0 || opciones.some(o => !o.nombre || o.valores.length === 0)) {
      alert('Define dimensiones (ej. Color) y sus valores (ej. Rojo, Azul) antes de generar.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Guardar estructura base
      await api.patch(`/productos/${producto.id}`, { opciones_variantes: opciones });

      // 2. Generar cruces
      const arraysDeValores = opciones.map(o => o.valores);
      const combinaciones = cartesian(arraysDeValores);

      // 3. Crear las que falten
      let creadas = 0;
      for (const comb of combinaciones) {
        const combObj: Record<string, string> = {};
        opciones.forEach((opc, i) => { combObj[opc.nombre] = comb[i]; });
        const nombreCorto = Object.values(combObj).join(' - ');

        const exists = variantes.find(v => {
          if (!v.combinacion_opciones) return v.nombre === nombreCorto;
          return Object.entries(combObj).every(([k, val]) => v.combinacion_opciones[k] === val);
        });

        if (!exists) {
          const randomPart = Math.random().toString(36).substring(2, 6).toUpperCase();
          const autoSku = `${producto.sku || 'PRD'}-${nombreCorto.replace(/\\s+/g, '').substring(0, 4).toUpperCase()}-${randomPart}`;
          await api.post('/presentaciones', {
            producto_id: Number(producto.id),
            nombre: nombreCorto,
            sku: autoSku,
            precio: Number(producto.precio_base || 0),
            multiplicador_unidades: 1,
            combinacion_opciones: combObj
          });
          creadas++;
        }
      }

      if (creadas > 0) {
        alert(`¡Matriz generada! Se crearon ${creadas} nuevas combinaciones.`);
        fetchVariantes();
      } else {
        alert('La matriz está al día, todas las combinaciones ya existen.');
      }
    } catch(err) {
      alert('Error generando combinaciones. Verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActivo(id: string, activo: boolean) {
    try {
      await api.patch(`/presentaciones/${id}`, { activo: !activo });
      fetchVariantes();
    } catch (err) {
      alert('Error al actualizar estado');
    }
  }

  if (!producto) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Matriz de Variantes: ${producto.nombre}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* CONSTRUCTOR DE OPCIONES MULTIDIMENSIONALES */}
        <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            Constructor de Opciones
            <button type="button" onClick={addOpcion} className={styles.btnSecondary} style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>
              <Plus size={14} style={{ marginRight: '0.4rem' }}/> Añadir Dimensión
            </button>
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
            {opciones.length === 0 && <p style={{ fontSize: '0.9rem', color: '#64748b' }}>No hay dimensiones configuradas. Añade una (ej: Color, Empaque).</p>}
            {opciones.map((opcion, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label className={styles.formLabel}>Nombre (ej: Color)</label>
                  <input className={styles.formInput} value={opcion.nombre} onChange={e => updateOpcionNombre(i, e.target.value)} placeholder="Atributo..." />
                </div>
                <div style={{ flex: 3 }}>
                  <label className={styles.formLabel}>Valores (separados por coma)</label>
                  <input className={styles.formInput} value={opcion.valores.join(', ')} onChange={e => updateOpcionValores(i, e.target.value)} placeholder="Ej: Rojo, Azul, Verde" />
                </div>
                <button type="button" onClick={() => removeOpcion(i)} style={{ marginTop: '28px', background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className={styles.btnPrimary} onClick={generarCombinaciones} disabled={submitting}>
              {submitting ? <Loader2 size={16} className={styles.spin} /> : <RefreshCw size={16} />}
              Generar / Actualizar Matriz
            </button>
          </div>
        </div>

        {/* TABLA DE COMBINACIONES (PRESENTACIONES) */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a', marginBottom: '1rem' }}>Presentaciones (SKUs Finales)</h3>
          <div className={styles.tableWrapper} style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {loading ? (
              <div className={styles.loadingCenter}><Loader2 className={styles.spin} size={24} color="var(--color-blue)" /></div>
            ) : variantes.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>No hay variantes. Haz clic en "Generar Matriz" para crear combinaciones automáticamente.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre / Combinación</th>
                    <th>SKU</th>
                    <th>Precio (Bs.)</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {variantes.map(v => (
                    <tr key={v.id} style={{ opacity: v.activo ? 1 : 0.5 }}>
                      <td style={{ fontWeight: 500 }}>
                        {v.nombre}
                        {v.combinacion_opciones && Object.keys(v.combinacion_opciones).length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                            {Object.entries(v.combinacion_opciones).map(([k, val]) => `${k}: ${val}`).join(' | ')}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: '#475569' }}>{v.sku}</td>
                      <td>{Number(v.precio).toFixed(2)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                          <button type="button" className={styles.btnSecondary} style={{ padding: '0.4rem', color: v.activo ? '#ef4444' : '#10b981' }} onClick={() => handleToggleActivo(v.id, v.activo)} title={v.activo ? 'Desactivar' : 'Activar'}>
                            {v.activo ? 'Ocultar' : 'Mostrar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
          <button type="button" className={styles.btnPrimary} onClick={onClose} style={{ minWidth: '150px' }}>Finalizar</button>
        </div>

      </div>
    </Modal>
  );
}

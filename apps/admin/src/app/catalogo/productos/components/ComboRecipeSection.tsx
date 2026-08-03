'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Plus, Minus, Trash2, Search, CheckCircle, AlertCircle, AlertTriangle, Sparkles, Package } from 'lucide-react';
import { api } from '../../../../lib/axios';
import { CatalogBrowseModal, CatalogProduct } from '@/app/descuentos/combos/components/CatalogBrowseModal';
import { ComboProductOmnibox } from '@/app/descuentos/combos/components/ComboProductOmnibox';
import styles from '../productos.module.css';

interface ComponenteItem {
  componente_prod_id: string;
  variante_id?: string | null;
  empaque_id?: string | null;
  cantidad: number;
  nombre?: string;
  sku?: string;
  precio_unitario?: number;
  stock_disponible?: number;
}

interface Props {
  productPayload: any;
  setProductPayload: (p: any) => void;
}

export default function ComboRecipeSection({ productPayload, setProductPayload }: Props) {
  const [catalogoProductos, setCatalogoProductos] = useState<any[]>([]);
  const [loadingProds, setLoadingProds] = useState(false);
  const [isBrowseModalOpen, setIsBrowseModalOpen] = useState(false);

  const tipoProducto = productPayload.tipo_producto || 'SIMPLE';
  const componentes: ComponenteItem[] = productPayload.componentes_combo || [];

  useEffect(() => {
    fetchCatalogo();
  }, []);

  const fetchCatalogo = async () => {
    setLoadingProds(true);
    try {
      const res = await api.get('/productos?limit=100');
      const prods = res.data.data || [];
      // Filter out combos from being components of other combos to prevent circularity
      setCatalogoProductos(prods.filter((p: any) => p.tipo_producto !== 'COMBO'));
    } catch (err) {
      console.error('Error fetching catalog for combo builder:', err);
    } finally {
      setLoadingProds(false);
    }
  };

  const handleTipoChange = (tipo: 'SIMPLE' | 'COMBO') => {
    setProductPayload({
      ...productPayload,
      tipo_producto: tipo,
      componentes_combo: tipo === 'COMBO' ? productPayload.componentes_combo || [] : [],
    });
  };

  const handleAddProduct = (prod: CatalogProduct, qty: number = 1) => {
    const idStr = prod.id.toString();
    const existingIndex = componentes.findIndex((c) => c.componente_prod_id === idStr);
    let updated: ComponenteItem[];

    const stock = prod.Inventario?.[0]
      ? prod.Inventario[0].cantidad_disponible - prod.Inventario[0].reservado
      : 0;

    if (existingIndex >= 0) {
      updated = [...componentes];
      updated[existingIndex].cantidad += qty;
    } else {
      updated = [
        ...componentes,
        {
          componente_prod_id: idStr,
          cantidad: qty,
          nombre: prod.nombre,
          sku: prod.sku,
          precio_unitario: Number(prod.precio_base) || 0,
          stock_disponible: Math.max(0, stock),
        },
      ];
    }

    setProductPayload({
      ...productPayload,
      componentes_combo: updated,
    });
  };

  const handleAddSelectedFromModal = (items: Array<{ producto: CatalogProduct; cantidad: number }>) => {
    const updated = [...componentes];
    items.forEach(({ producto, cantidad }) => {
      const idStr = producto.id.toString();
      const existingIndex = updated.findIndex((c) => c.componente_prod_id === idStr);
      const stock = producto.Inventario?.[0]
        ? producto.Inventario[0].cantidad_disponible - producto.Inventario[0].reservado
        : 0;

      if (existingIndex >= 0) {
        updated[existingIndex].cantidad += cantidad;
      } else {
        updated.push({
          componente_prod_id: idStr,
          cantidad: cantidad,
          nombre: producto.nombre,
          sku: producto.sku,
          precio_unitario: Number(producto.precio_base) || 0,
          stock_disponible: Math.max(0, stock),
        });
      }
    });

    setProductPayload({
      ...productPayload,
      componentes_combo: updated,
    });
  };

  const handleRemoveComponent = (index: number) => {
    const updated = componentes.filter((_, i) => i !== index);
    setProductPayload({
      ...productPayload,
      componentes_combo: updated,
    });
  };

  const handleUpdateCantidad = (index: number, cantidad: number) => {
    const updated = [...componentes];
    updated[index].cantidad = Math.max(1, cantidad);
    setProductPayload({
      ...productPayload,
      componentes_combo: updated,
    });
  };

  // Calculations for Summary
  const { subtotalComponentes, virtualStock, ahorroMonto, ahorroPorcentaje } = useMemo(() => {
    const subtotal = componentes.reduce(
      (acc, c) => acc + (c.precio_unitario || 0) * (c.cantidad || 1),
      0
    );

    let stockKits = 0;
    if (componentes.length > 0) {
      const limits = componentes.map((c) => {
        const prod = catalogoProductos.find((p) => p.id?.toString() === c.componente_prod_id);
        const stockFisico = prod?.Inventario?.[0]
          ? Math.max(0, prod.Inventario[0].cantidad_disponible - prod.Inventario[0].reservado)
          : c.stock_disponible || 0;
        return Math.floor(stockFisico / (c.cantidad || 1));
      });
      stockKits = Math.min(...limits);
    }

    const precioCombo = Number(productPayload.precio_base) || 0;
    const ahorro = Math.max(0, subtotal - precioCombo);
    const porcentaje = subtotal > 0 && ahorro > 0 ? Math.round((ahorro / subtotal) * 100) : 0;

    return {
      subtotalComponentes: subtotal,
      virtualStock: stockKits,
      ahorroMonto: ahorro,
      ahorroPorcentaje: porcentaje,
    };
  }, [componentes, productPayload.precio_base, catalogoProductos]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Product Type Selector */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <label className={styles.formLabel}>Tipo de Estructura de Producto</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          <div
            onClick={() => handleTipoChange('SIMPLE')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              border: tipoProducto === 'SIMPLE' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              backgroundColor: tipoProducto === 'SIMPLE' ? '#eff6ff' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: tipoProducto === 'SIMPLE' ? '5px solid #2563eb' : '2px solid #cbd5e1',
                marginTop: '3px',
              }}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem' }}>Producto Individual / Simple</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Producto estándar con stock físico propio en almacén.
              </div>
            </div>
          </div>

          <div
            onClick={() => handleTipoChange('COMBO')}
            style={{
              padding: '1rem 1.25rem',
              borderRadius: '10px',
              border: tipoProducto === 'COMBO' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              backgroundColor: tipoProducto === 'COMBO' ? '#f5f3ff' : '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: tipoProducto === 'COMBO' ? '5px solid #7c3aed' : '2px solid #cbd5e1',
                marginTop: '3px',
              }}
            />
            <div>
              <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} color="#7c3aed" /> Kit / Combo Promocional
              </div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                Compuesto por múltiples productos (Receta BOM). El stock se calcula automáticamente.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Combo Builder Interface */}
      {tipoProducto === 'COMBO' && (
        <div
          style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1.25rem',
            backgroundColor: '#faf5ff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h4 style={{ margin: 0, color: '#4c1d95', fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#7c3aed" /> Receta de Componentes del Combo
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', color: '#6b21a8', fontSize: '0.8rem' }}>
                Selecciona los productos que integran este kit. Al venderlo, el stock de cada componente se descontará automáticamente.
              </p>
            </div>
          </div>

          {/* Add Component Omnibox & Modal */}
          <div>
            <ComboProductOmnibox
              onAddProduct={handleAddProduct}
              onOpenBrowseModal={() => setIsBrowseModalOpen(true)}
              existingComponentIds={componentes.map((c) => c.componente_prod_id)}
            />
          </div>

          <CatalogBrowseModal
            isOpen={isBrowseModalOpen}
            onClose={() => setIsBrowseModalOpen(false)}
            onAddSelected={handleAddSelectedFromModal}
            existingComponentIds={componentes.map((c) => c.componente_prod_id)}
          />

          {/* Components Table */}
          {componentes.length === 0 ? (
            <div
              style={{
                padding: '2rem',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
                color: '#64748b',
                fontSize: '0.85rem',
              }}
            >
              <Layers size={32} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
              <div>No has agregado componentes a este combo todavía.</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                Usa el selector superior para añadir los productos que componen el paquete.
              </div>
            </div>
          ) : (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: 600 }}>Producto Componente</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Cant. en Combo</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>P. Unitario</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600 }}>Subtotal</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 600 }}>Stock Físico</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center', width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {componentes.map((comp, idx) => {
                    const sub = (comp.precio_unitario || 0) * (comp.cantidad || 1);
                    return (
                      <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>{comp.nombre || 'Producto #' + comp.componente_prod_id}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SKU: {comp.sku || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <input
                            type="number"
                            min="1"
                            value={comp.cantidad}
                            onChange={(e) => handleUpdateCantidad(idx, parseInt(e.target.value, 10) || 1)}
                            style={{
                              width: '60px',
                              padding: '0.3rem',
                              textAlign: 'center',
                              borderRadius: '4px',
                              border: '1px solid #cbd5e1',
                              fontSize: '0.85rem',
                            }}
                          />
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#64748b' }}>
                          Bs. {Number(comp.precio_unitario || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: 600, color: '#0f172a' }}>
                          Bs. {sub.toFixed(2)}
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <span
                            style={{
                              padding: '0.2rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: (comp.stock_disponible || 0) >= comp.cantidad ? '#dcfce7' : '#fee2e2',
                              color: (comp.stock_disponible || 0) >= comp.cantidad ? '#166534' : '#991b1b',
                            }}
                          >
                            {comp.stock_disponible !== undefined ? comp.stock_disponible : '-'} unid.
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveComponent(idx)}
                            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                            title="Eliminar componente"
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

          {/* Dynamic Metrics & Calculations */}
          {componentes.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem',
                marginTop: '0.5rem',
              }}
            >
              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Suma Individual de Componentes</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  Bs. {subtotalComponentes.toFixed(2)}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Precio del Combo</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#7c3aed', marginTop: '0.2rem' }}>
                  Bs. {(Number(productPayload.precio_base) || 0).toFixed(2)}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Ahorro al Cliente</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: ahorroMonto > 0 ? '#16a34a' : '#64748b', marginTop: '0.2rem' }}>
                  {ahorroMonto > 0 ? `Bs. ${ahorroMonto.toFixed(2)} (${ahorroPorcentaje}%)` : 'Sin Descuento'}
                </div>
              </div>

              <div style={{ backgroundColor: '#ffffff', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 500 }}>Disponibilidad Virtual</div>
                <div
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: virtualStock > 0 ? '#16a34a' : '#ef4444',
                    marginTop: '0.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {virtualStock > 0 ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                  {virtualStock} kit{virtualStock !== 1 ? 's' : ''} disponibles
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

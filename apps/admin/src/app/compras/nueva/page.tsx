'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../../lib/axios';
import { Modal } from '../../../components/molecules/Modal/Modal';
import { Loader2, Search, ArrowLeft, Plus, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import styles from './page.module.css';

export default function NuevaCompraPage() {
  const router = useRouter();
  
  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  
  // Catalog state
  const [productos, setProductos] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [variantes, setVariantes] = useState<any[]>([]);
  const [empaques, setEmpaques] = useState<any[]>([]);
  
  // Proveedores state
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [proveedorId, setProveedorId] = useState<string>('');
  const [numeroRecibo, setNumeroRecibo] = useState<string>('');
  
  const [loadingVariantes, setLoadingVariantes] = useState(false);
  const [loadingEmpaques, setLoadingEmpaques] = useState(false);
  
  // Form state
  const [selectedVarianteId, setSelectedVarianteId] = useState<string>('');
  const [selectedEmpaqueId, setSelectedEmpaqueId] = useState<string>('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number | undefined>(undefined);
  
  // Cart state
  const [cart, setCart] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCatalog();
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      const res = await api.get('/proveedores');
      setProveedores(res.data.data || []);
    } catch (err) {
      console.error('Error fetching proveedores:', err);
    }
  };

  const fetchCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const res = await api.get('/productos?limit=100');
      setProductos(res.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingCatalog(false);
    }
  };

  const handleProductClick = async (product: any) => {
    setSelectedProduct(product);
    setVariantes([]);
    setEmpaques([]);
    setSelectedVarianteId('');
    setSelectedEmpaqueId('');
    setCantidad(1);
    setCostoUnitario(Number(product.precio_base) || 0);
    setPrecioVenta(Number(product.precio_promocional) || Number(product.precio_base) || undefined);
    
    // Fetch variants
    setLoadingVariantes(true);
    try {
      const res = await api.get(`/variantes/producto/${product.id}`);
      setVariantes(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingVariantes(false);
    }
  };

  useEffect(() => {
    if (selectedVarianteId) {
      fetchEmpaques(selectedVarianteId);
    } else {
      setEmpaques([]);
      setSelectedEmpaqueId('');
    }
  }, [selectedVarianteId]);

  const fetchEmpaques = async (varianteId: string) => {
    setLoadingEmpaques(true);
    try {
      const res = await api.get(`/empaques/variante/${varianteId}`);
      setEmpaques(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmpaques(false);
    }
  };

  useEffect(() => {
    if (selectedEmpaqueId) {
      const empaque = empaques.find(e => e.id === selectedEmpaqueId);
      if (empaque) {
        setCostoUnitario(Number(empaque.precio) || 0);
        setPrecioVenta(Number(empaque.precio_promocional) || Number(empaque.precio) || undefined);
      }
    } else if (selectedProduct) {
      setCostoUnitario(Number(selectedProduct.precio_base) || 0);
      setPrecioVenta(Number(selectedProduct.precio_promocional) || Number(selectedProduct.precio_base) || undefined);
    }
  }, [selectedEmpaqueId, empaques, selectedProduct]);

  const closeModal = () => {
    setSelectedProduct(null);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    if (cantidad <= 0 || costoUnitario < 0) return;
    
    const variante = variantes.find(v => v.id === selectedVarianteId);
    const empaque = empaques.find(e => e.id === selectedEmpaqueId);
    
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      producto_id: selectedProduct.id,
      producto_nombre: selectedProduct.nombre,
      producto_sku: selectedProduct.sku,
      variante_id: selectedVarianteId || undefined,
      variante_nombre: variante?.nombre,
      empaque_id: selectedEmpaqueId || undefined,
      empaque_nombre: empaque?.nombre,
      multiplicador: empaque?.multiplicador_unidades || 1,
      cantidad,
      costo_unitario: costoUnitario,
      precio_venta: precioVenta,
      subtotal: cantidad * costoUnitario,
    };
    
    setCart([...cart, newItem]);
    closeModal();
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const confirmPurchase = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        proveedor_id: proveedorId ? proveedorId : undefined,
        numero_recibo: numeroRecibo ? numeroRecibo : undefined,
        detalles: cart.map(item => ({
          producto_id: item.producto_id.toString(),
          variante_id: item.variante_id ? item.variante_id.toString() : undefined,
          empaque_id: item.empaque_id ? item.empaque_id.toString() : undefined,
          cantidad: Number(item.cantidad),
          costo_unitario: Number(item.costo_unitario),
          precio_venta: item.precio_venta ? Number(item.precio_venta) : undefined
        }))
      };
      await api.post('/compras', payload);
      router.push('/compras');
    } catch (err) {
      console.error('Error confirming purchase:', err);
      setSubmitting(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return productos;
    const lower = searchQuery.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(lower) || 
      p.sku.toLowerCase().includes(lower)
    );
  }, [productos, searchQuery]);

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <button 
            onClick={() => router.back()} 
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', marginBottom: '0.5rem' }}
          >
            <ArrowLeft size={16} /> Volver
          </button>
          <h1 className={styles.title}>Registrar Compra</h1>
          <p className={styles.subtitle}>Añade productos al carrito para ingresarlos al inventario.</p>
        </div>
      </div>

      <div className={styles.wizardContainer}>
        <div className={styles.wizardSteps}>
          <div className={step === 1 ? styles.stepActive : styles.step} onClick={() => setStep(1)}>
            1. Seleccionar Productos
          </div>
          <div className={step === 2 ? styles.stepActive : styles.step} onClick={() => setStep(2)}>
            2. Revisar Carrito ({cart.length})
          </div>
        </div>

        <div className={styles.stepContent}>
          {step === 1 && (
            <div>
              <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  className={styles.searchBar} 
                  placeholder="Buscar producto por nombre o SKU..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              {loadingCatalog ? (
                <div className={styles.loadingCenter}>
                  <Loader2 className={styles.spin} size={32} />
                </div>
              ) : (
                <div className={styles.productGrid}>
                  {filteredProducts.map(p => (
                    <div key={p.id} className={styles.productCard} onClick={() => handleProductClick(p)}>
                      <div className={styles.productName}>{p.nombre}</div>
                      <div className={styles.productSku}>SKU: {p.sku}</div>
                      <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                        Base: Bs. {Number(p.precio_base).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                  <p>El carrito está vacío. Vuelve al paso 1 para añadir productos.</p>
                  <button className={styles.btnPrimary} style={{ marginTop: '1rem' }} onClick={() => setStep(1)}>
                    Añadir Productos
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Proveedor (Opcional)</label>
                      <select 
                        value={proveedorId} 
                        onChange={(e) => setProveedorId(e.target.value)}
                        style={{ backgroundColor: '#f8fafc' }}
                      >
                        <option value="">-- Sin Proveedor --</option>
                        {proveedores.map(prov => (
                          <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formGroup} style={{ margin: 0 }}>
                      <label style={{ fontSize: '0.85rem', color: '#475569' }}>Recibo/Factura (Opcional)</label>
                      <input 
                        type="text" 
                        value={numeroRecibo}
                        onChange={(e) => setNumeroRecibo(e.target.value)}
                        placeholder="Ej. F-12345"
                        style={{ backgroundColor: '#f8fafc' }}
                      />
                    </div>
                  </div>
                  <table className={styles.cartTable}>
                    <thead>
                      <tr>
                        <th>Producto</th>
                        <th>Cant.</th>
                        <th>Costo Unit.</th>
                        <th>Subtotal</th>
                        <th>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.id}>
                          <td>
                            <div style={{ fontWeight: 600 }}>{item.producto_nombre}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {item.producto_sku}
                              {item.variante_nombre && ` • Var: ${item.variante_nombre}`}
                              {item.empaque_nombre && ` • Emp: ${item.empaque_nombre}`}
                            </div>
                          </td>
                          <td>{item.cantidad}</td>
                          <td>Bs. {item.costo_unitario.toFixed(2)}</td>
                          <td style={{ fontWeight: 700 }}>Bs. {item.subtotal.toFixed(2)}</td>
                          <td>
                            <button className={styles.btnDanger} onClick={() => removeFromCart(item.id)}>
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className={styles.cartSummary}>
                    <div>
                      <span style={{ color: '#64748b' }}>Total de ítems: </span>
                      <strong>{cart.reduce((acc, i) => acc + i.cantidad, 0)}</strong>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div className={styles.totalText}>
                        Total: Bs. {cartTotal.toFixed(2)}
                      </div>
                      <button 
                        className={styles.btnPrimary} 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                        onClick={confirmPurchase}
                        disabled={submitting}
                      >
                        {submitting ? <Loader2 className={styles.spin} size={18} /> : <CheckCircle size={18} />}
                        Confirmar Compra
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={!!selectedProduct} onClose={closeModal} title="Añadir al Carrito" maxWidth="500px">
        {selectedProduct && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a' }}>{selectedProduct.nombre}</h3>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>SKU: {selectedProduct.sku}</p>
            </div>

            {loadingVariantes ? (
              <div style={{ padding: '1rem', textAlign: 'center' }}><Loader2 className={styles.spin} /></div>
            ) : variantes.length > 0 ? (
              <div className={styles.formGroup}>
                <label>Variante</label>
                <select value={selectedVarianteId} onChange={(e) => setSelectedVarianteId(e.target.value)}>
                  <option value="">-- Seleccionar Variante --</option>
                  {variantes.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </div>
            ) : null}

            {loadingEmpaques ? (
              <div style={{ padding: '1rem', textAlign: 'center' }}><Loader2 className={styles.spin} /></div>
            ) : empaques.length > 0 ? (
              <div className={styles.formGroup}>
                <label>Empaque</label>
                <select value={selectedEmpaqueId} onChange={(e) => setSelectedEmpaqueId(e.target.value)}>
                  <option value="">-- Seleccionar Empaque --</option>
                  {empaques.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre} (x{e.multiplicador_unidades} unidades)</option>
                  ))}
                </select>
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label>
                  Cantidad {selectedEmpaqueId ? '(de Empaques)' : '(Unidades)'}
                </label>
                <input 
                  type="number" 
                  min="1" 
                  value={cantidad} 
                  onChange={(e) => setCantidad(Number(e.target.value))} 
                />
                {selectedEmpaqueId && (
                  <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '0.25rem' }}>
                    Se ingresarán: <strong>{cantidad * (empaques.find(e => e.id === selectedEmpaqueId)?.multiplicador_unidades || 1)} unidades</strong> al inventario.
                  </span>
                )}
              </div>
              <div className={styles.formGroup}>
                <label>Costo Unitario (Bs.)</label>
                <input 
                  type="number" 
                  min="0" 
                  step="0.01" 
                  value={costoUnitario} 
                  onChange={(e) => setCostoUnitario(Number(e.target.value))} 
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Nuevo Precio de Venta (Opcional)</label>
              <input 
                type="number" 
                min="0" 
                step="0.01" 
                value={precioVenta || ''} 
                onChange={(e) => setPrecioVenta(e.target.value ? Number(e.target.value) : undefined)} 
                placeholder="Bs."
              />
            </div>

            <div className={styles.modalActions}>
              <button className={styles.btnSecondary} onClick={closeModal}>Cancelar</button>
              <button className={styles.btnPrimary} onClick={addToCart}>
                Añadir al Carrito
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

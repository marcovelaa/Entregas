'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Search, ShoppingCart, Plus, Minus, Trash2, CreditCard, Banknote, CheckCircle2, QrCode, AlertTriangle, Tag, Package, Layers } from 'lucide-react';
import { api } from '../../lib/axios';
import { Modal } from '../../components/molecules/Modal/Modal';
import styles from './page.module.css';

export default function CajaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [productos, setProductos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [carrito, setCarrito] = useState<any[]>([]);
  
  const [categorias, setCategorias] = useState<any[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('');
  const [productoConVariantes, setProductoConVariantes] = useState<any>(null);
  
  // Discount & Coupon State
  const [codigoCuponInput, setCodigoCuponInput] = useState('');
  const [descuentoAplicado, setDescuentoAplicado] = useState<any>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState<string>('');
  const [metodoPago, setMetodoPago] = useState<'EFECTIVO' | 'TARJETA' | 'QR'>('EFECTIVO');
  const [montoPagado, setMontoPagado] = useState<string>('');
  
  const [toastMessage, setToastMessage] = useState<{msg: string, type: 'error'|'success'} | null>(null);
  const showToast = (msg: string, type: 'error'|'success' = 'error') => {
    setToastMessage({msg, type});
    setTimeout(() => setToastMessage(null), 3500);
  };
  
  const [ticketData, setTicketData] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
    fetchClientes();
    fetchCategorias();
    fetchProductos();
  }, []);

  const fetchClientes = async () => {
    try {
      const res = await api.get('/clientes');
      setClientes(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchCategorias = async () => {
    try {
      const res = await api.get('/categorias');
      setCategorias(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchProductos = async () => {
    try {
      const res = await api.get('/productos?limit=100&visibilidad=publica');
      setProductos(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  // Evaluate Discounts on Cart Change or Coupon Change
  useEffect(() => {
    if (carrito.length === 0) {
      setDescuentoAplicado(null);
      return;
    }

    const payload = {
      cupon: codigoCuponInput ? codigoCuponInput.trim() : undefined,
      canal: 'POS',
      clienteId: clienteSeleccionado || undefined,
      items: carrito.map((c) => ({
        productoId: String(c.id),
        varianteId: c.variante_id ? String(c.variante_id) : undefined,
        empaqueId: c.empaque_id ? String(c.empaque_id) : undefined,
        cantidad: Number(c.cantidad) * c.multiplicador,
        precioUnitario: Number(c.precio) / c.multiplicador,
      })),
    };

    api.post('/descuentos/validar', payload)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setDescuentoAplicado(res.data.data);
        } else {
          setDescuentoAplicado(null);
        }
      })
      .catch((err) => console.error(err));
  }, [carrito, codigoCuponInput, clienteSeleccionado]);

  const getStock = (prod: any, varId?: string) => {
    if (typeof prod.stock_vendible === 'number') {
      return prod.stock_vendible;
    }
    if (prod.tipo_producto === 'COMBO' && prod.componentes_combo && prod.componentes_combo.length > 0) {
      const componentRatios = prod.componentes_combo.map((comp: any) => {
        const compProd = comp.componente_producto;
        if (!compProd || !compProd.Inventario) return 0;
        const inv = compProd.Inventario.find((i: any) => i.variante_id === (comp.variante_id || null));
        const available = inv ? Math.max(0, inv.cantidad_disponible - inv.reservado) : 0;
        const required = Number(comp.cantidad) || 1;
        return Math.floor(available / required);
      });
      return Math.min(...componentRatios);
    }
    if (!prod.Inventario) return 0;
    const inv = prod.Inventario.find((i: any) => i.variante_id === (varId || null));
    return inv ? (inv.cantidad_disponible - inv.reservado) : 0;
  };

  const productosFiltrados = productos.filter(p => {
    if (p.estado_venta === 'VENCIDO' || p.estado_venta === 'AGOTADO') return false;
    const matchCat = categoriaSeleccionada ? p.categoria_id === categoriaSeleccionada : true;
    const matchSearch = (p.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) || (p.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchVar = (p.variantes || []).some((v: any) => (v.sku_base || '').toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCat && (matchSearch || matchVar);
  });

  const addToCart = (prod: any, variante?: any, empaque?: any) => {
    const cartId = variante 
      ? (empaque ? `${prod.id}-${variante.id}-${empaque.id}` : `${prod.id}-${variante.id}`) 
      : prod.id.toString();
      
    const stockAvailable = getStock(prod, variante?.id);
    const multiplicador = empaque?.multiplicador_unidades || 1;
    if (stockAvailable < multiplicador) return showToast('No hay stock disponible para este empaque');

    const existing = carrito.find(item => item.cart_id === cartId);
    if (existing) {
      if ((existing.cantidad + 1) * multiplicador > stockAvailable) return showToast('No puedes exceder el stock disponible');
      setCarrito(carrito.map(item => item.cart_id === cartId ? { ...item, cantidad: item.cantidad + 1 } : item));
    } else {
      let nombre = prod.nombre;
      if (variante) nombre += ` (${variante.nombre})`;
      if (empaque) nombre += ` [${empaque.nombre}]`;

      const precio = empaque 
        ? parseFloat(empaque.precio) 
        : parseFloat(variante?.precio_adicional ? (parseFloat(prod.precio_base) + parseFloat(variante.precio_adicional)).toString() : prod.precio_base);

      setCarrito([...carrito, { 
        cart_id: cartId,
        id: prod.id, 
        variante_id: variante?.id || null,
        empaque_id: empaque?.id || null,
        multiplicador,
        nombre, 
        sku: empaque ? empaque.sku : (variante ? variante.sku_base : prod.sku), 
        precio,
        cantidad: 1,
        maxStock: Math.floor(stockAvailable / multiplicador)
      }]);
    }
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const setCantidadValue = (cartId: string, val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return;
    
    setCarrito(carrito.map(item => {
      if (item.cart_id === cartId) {
        if (num < 1) return { ...item, cantidad: 1 };
        if (num > item.maxStock) {
          showToast('No puedes exceder el stock disponible');
          return { ...item, cantidad: item.maxStock };
        }
        return { ...item, cantidad: num };
      }
      return item;
    }));
  };

  const updateCantidad = (cartId: string, delta: number) => {
    setCarrito(carrito.map(item => {
      if (item.cart_id === cartId) {
        const newCant = item.cantidad + delta;
        if (newCant < 1) return item;
        if (newCant > item.maxStock) {
          showToast('No puedes exceder el stock disponible');
          return item;
        }
        return { ...item, cantidad: newCant };
      }
      return item;
    }));
  };

  const removeFromCart = (cartId: string) => {
    setCarrito(carrito.filter(item => item.cart_id !== cartId));
  };

  const subtotalBruto = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
  const montoDescuento = descuentoAplicado ? descuentoAplicado.montoDescontado : 0;
  const totalNeto = Math.max(0, subtotalBruto - montoDescuento);

  const pagado = parseFloat(montoPagado) || 0;
  const vuelto = pagado >= totalNeto ? pagado - totalNeto : 0;

  const handleCobrar = async () => {
    if (carrito.length === 0) return showToast('El carrito está vacío');
    if (metodoPago === 'EFECTIVO' && pagado < totalNeto) return showToast('El monto pagado es insuficiente');

    try {
      const payload = {
        cliente_id: clienteSeleccionado || undefined,
        metodo_pago: metodoPago,
        monto_pagado: metodoPago === 'EFECTIVO' ? pagado : totalNeto,
        descuento_id: descuentoAplicado ? descuentoAplicado.id : undefined,
        descuento_total: montoDescuento,
        codigo_cupon: codigoCuponInput ? codigoCuponInput.trim().toUpperCase() : undefined,
        detalles: carrito.map(c => ({
          producto_id: String(c.id),
          variante_id: c.variante_id ? String(c.variante_id) : undefined,
          empaque_id: c.empaque_id ? String(c.empaque_id) : undefined,
          cantidad: Number(c.cantidad) * c.multiplicador,
          precio_unitario: Number(c.precio) / c.multiplicador
        }))
      };

      const res = await api.post('/ventas', payload);
      setTicketData(res.data.data);
      
      // Reset POS
      setCarrito([]);
      setDescuentoAplicado(null);
      setCodigoCuponInput('');
      setIsCheckoutOpen(false);
      setMontoPagado('');
      setClienteSeleccionado('');
      setMetodoPago('EFECTIVO');
      fetchProductos(); 
      
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message;
      showToast(`Error: ${Array.isArray(msg) ? msg.join(', ') : (msg || err.message)}`);
    }
  };

  const imprimirBoletaSilenciosa = (htmlContent: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    }
  };

  return (
    <div className={styles.posContainer}>
      {toastMessage && (
        <div className={`${styles.toast} ${toastMessage.type === 'error' ? styles.toastError : styles.toastSuccess}`}>
          {toastMessage.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* LEFT PANEL - PRODUCTS */}
      <div className={styles.leftPanel}>
        <div className={styles.searchHeader}>
          <div className={styles.searchBox}>
            <Search size={20} className={styles.searchIcon} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Buscar producto por nombre o SKU..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.categoriesWrapper}>
            <button 
              className={`${styles.categoryBtn} ${categoriaSeleccionada === '' ? styles.categoryBtnActive : ''}`}
              onClick={() => setCategoriaSeleccionada('')}
            >
              Todas
            </button>
            {categorias.map(cat => (
              <button 
                key={cat.id}
                className={`${styles.categoryBtn} ${categoriaSeleccionada === cat.id ? styles.categoryBtnActive : ''}`}
                onClick={() => setCategoriaSeleccionada(cat.id)}
              >
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.productsGrid}>
          {productosFiltrados.map(p => {
            const hasVariants = p.variantes && p.variantes.length > 0;
            const stockPrincipal = getStock(p);
            const totalVariantsStock = hasVariants ? p.variantes.reduce((acc: number, v: any) => acc + getStock(p, v.id), 0) : 0;
            const stockToShow = hasVariants ? totalVariantsStock : stockPrincipal;
                       const isCombo = p.tipo_producto === 'COMBO';
            const pv = p.atributos?.presentacion_visual;
            const badgeStyle = pv?.badge_estilo || 'indigo';
            const showBadge = badgeStyle !== 'none' && pv?.mostrar_badge !== false;
            const badgeBg = badgeStyle === 'red' ? '#fef2f2' : badgeStyle === 'emerald' ? '#ecfdf5' : badgeStyle === 'blue' ? '#eff6ff' : badgeStyle === 'amber' ? '#fffbeb' : badgeStyle === 'slate' ? '#f8fafc' : '#f3e8ff';
            const badgeColor = badgeStyle === 'red' ? '#991b1b' : badgeStyle === 'emerald' ? '#065f46' : badgeStyle === 'blue' ? '#1e40af' : badgeStyle === 'amber' ? '#92400e' : badgeStyle === 'slate' ? '#334155' : '#7c3aed';
            const badgeBorder = badgeStyle === 'red' ? '#fecaca' : badgeStyle === 'emerald' ? '#a7f3d0' : badgeStyle === 'blue' ? '#bfdbfe' : badgeStyle === 'amber' ? '#fde68a' : badgeStyle === 'slate' ? '#cbd5e1' : '#ddd6fe';

            let compsSubtotal = 0;
            const componentImages: string[] = [];
            if (isCombo && p.componentes_combo && p.componentes_combo.length > 0) {
              p.componentes_combo.forEach((c: any) => {
                const comp = c.componente_producto;
                if (comp) {
                  compsSubtotal += (Number(comp.precio_base) || 0) * (c.cantidad || 1);
                  if (comp.imagenes && comp.imagenes.length > 0) {
                    const imgUrl = comp.imagenes[0].url;
                    componentImages.push(imgUrl.startsWith('http') ? imgUrl : `http://localhost:3001${imgUrl}`);
                  }
                }
              });
            }
            const precioCombo = parseFloat(p.precio_base) || 0;
            const tieneAhorro = isCombo && compsSubtotal > precioCombo;
            const ahorroPorcentaje = tieneAhorro ? Math.round(((compsSubtotal - precioCombo) / compsSubtotal) * 100) : 0;
            const badgeLabel = showBadge ? (pv?.badge_texto || (isCombo ? (tieneAhorro ? `Ahorrá ${ahorroPorcentaje}%` : 'KIT / COMBO') : null)) : null;
            const hasCustomImage = Boolean(p.imagenes && p.imagenes.length > 0 && pv?.modo_imagen === 'PROPIA');
            const useGridImages = isCombo && !hasCustomImage && componentImages.length > 0;

            return (
              <div 
                key={p.id} 
                className={styles.productCard}
                onClick={() => {
                  if (hasVariants) setProductoConVariantes(p);
                  else if (stockPrincipal > 0) addToCart(p);
                }}
                style={{ opacity: stockToShow <= 0 ? 0.6 : 1, position: 'relative' }}
              >
                {badgeLabel && (
                  <span style={{ 
                    position: 'absolute', 
                    top: '8px', 
                    left: '8px', 
                    fontSize: '0.65rem', 
                    fontWeight: 800, 
                    color: badgeColor, 
                    backgroundColor: badgeBg, 
                    padding: '0.2rem 0.5rem', 
                    borderRadius: '4px',
                    border: `1px solid ${badgeBorder}`,
                    zIndex: 2,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    {badgeLabel}
                  </span>
                )}
                <div style={{ 
                  height: '110px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px', 
                  marginBottom: '0.8rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden', 
                  border: '1px solid #f1f5f9',
                  position: 'relative'
                }}>
                  {useGridImages ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: componentImages.length === 1 ? '1fr' : '1fr 1fr',
                      gridTemplateRows: componentImages.length <= 2 ? '1fr' : '1fr 1fr',
                      width: '100%',
                      height: '100%',
                      gap: '2px',
                      backgroundColor: '#f1f5f9'
                    }}>
                      {componentImages.slice(0, 4).map((img, idx) => (
                        <div 
                          key={idx} 
                          style={{ 
                            backgroundColor: '#ffffff', 
                            overflow: 'hidden', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            gridRow: componentImages.length === 3 && idx === 0 ? 'span 2' : undefined
                          }}
                        >
                          <img src={img} alt="comp" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }} />
                        </div>
                      ))}
                    </div>
                  ) : p.imagenes && p.imagenes.length > 0 ? (
                    <img src={p.imagenes[0].url.startsWith('http') ? p.imagenes[0].url : `http://localhost:3001${p.imagenes[0].url}`} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  ) : (
                    <ShoppingCart size={32} color="#cbd5e1" />
                  )}
                </div>
                
                <div className={styles.productCardName} title={p.nombre}>{p.nombre}</div>
                <div className={styles.productCardSku}>{p.sku || 'N/A'}</div>

                {isCombo && pv?.mostrar_desglose_pos !== false && p.componentes_combo && p.componentes_combo.length > 0 && (
                  <div style={{ 
                    fontSize: '0.68rem', 
                    color: '#64748b', 
                    padding: '0.2rem 0', 
                    margin: '0.2rem 0',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }} title={p.componentes_combo.map((c: any) => `${c.cantidad > 1 ? `${c.cantidad}x ` : ''}${c.componente_producto?.nombre || 'Item'}`).join(', ')}>
                    Incluye: {p.componentes_combo.map((c: any) => `${c.cantidad > 1 ? `${c.cantidad}x ` : ''}${c.componente_producto?.nombre || 'Item'}`).join(', ')}
                  </div>
                )}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto' }}>
                  <div>
                    {tieneAhorro && (
                      <div style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through', fontWeight: 500 }}>
                        Bs. {compsSubtotal.toFixed(2)}
                      </div>
                    )}
                    <div className={styles.productCardPrice}>
                      Bs. {parseFloat(p.precio_base).toFixed(2)}
                    </div>
                  </div>

                  {hasVariants ? (
                    <button style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: 700, 
                      color: 'white', 
                      backgroundColor: '#3b82f6', 
                      padding: '0.4rem 0.8rem', 
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}>
                      Ver Variantes
                    </button>
                  ) : (
                    stockPrincipal > 0 ? (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.3rem 0.8rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>Stock: {stockPrincipal}</span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#ef4444', backgroundColor: '#fef2f2', padding: '0.3rem 0.8rem', borderRadius: '6px', whiteSpace: 'nowrap' }}>Agotado</span>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - CART */}
      <div className={styles.rightPanel}>
        <div className={styles.cartContainer}>
          {carrito.length === 0 ? (
            <div className={styles.emptyCart}>
              <ShoppingCart size={48} color="#cbd5e1" />
              <p>El carrito está vacío</p>
            </div>
          ) : (
            <table className={styles.cartTable}>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style={{ textAlign: 'center' }}>Cant.</th>
                  <th style={{ textAlign: 'right' }}>SubT</th>
                  <th style={{ width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {carrito.map(item => (
                  <tr key={item.cart_id}>
                    <td>
                      <div className={styles.cartItemName}>{item.nombre}</div>
                      <div className={styles.cartItemSku}>{item.sku}</div>
                    </td>
                    <td>
                      <div className={styles.quantityControl}>
                        <button onClick={() => updateCantidad(item.cart_id, -1)}><Minus size={14} /></button>
                        <input 
                          type="number" 
                          value={item.cantidad} 
                          onChange={(e) => setCantidadValue(item.cart_id, e.target.value)}
                          onBlur={(e) => {
                            if (!e.target.value || e.target.value === '0') setCantidadValue(item.cart_id, '1');
                          }}
                          style={{
                            width: '40px', textAlign: 'center', border: '1px solid #cbd5e1', 
                            borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#0f172a',
                            padding: '0.2rem', outline: 'none'
                          }}
                        />
                        <button onClick={() => updateCantidad(item.cart_id, 1)}><Plus size={14} /></button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>Bs. {(item.precio * item.cantidad).toFixed(2)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button className={styles.deleteBtn} onClick={() => removeFromCart(item.cart_id)}><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className={styles.totalsSection}>
          {/* Coupon Input */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Tag size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Código de cupón..."
                value={codigoCuponInput}
                onChange={(e) => setCodigoCuponInput(e.target.value.toUpperCase())}
                style={{
                  width: '100%',
                  padding: '0.4rem 0.5rem 0.4rem 2rem',
                  fontSize: '0.8rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  outline: 'none',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}
              />
            </div>
          </div>

          {descuentoAplicado && (
            <div style={{ 
              backgroundColor: '#ecfdf5', 
              border: '1px solid #a7f3d0', 
              borderRadius: '6px', 
              padding: '0.4rem 0.6rem', 
              fontSize: '0.8rem', 
              color: '#065f46',
              fontWeight: 600,
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem'
            }}>
              <span>🏷️ {descuentoAplicado.nombre}</span>
              <span>- Bs. {descuentoAplicado.montoDescontado.toFixed(2)}</span>
            </div>
          )}

          <div className={styles.totalRow}>
            <span>Subtotal</span>
            <span>Bs. {subtotalBruto.toFixed(2)}</span>
          </div>
          {montoDescuento > 0 && (
            <div className={styles.totalRow} style={{ color: '#16a34a', fontWeight: 600 }}>
              <span>Descuento Aplicado</span>
              <span>- Bs. {montoDescuento.toFixed(2)}</span>
            </div>
          )}
          <div className={styles.totalRowLarge}>
            <span>TOTAL</span>
            <span>Bs. {totalNeto.toFixed(2)}</span>
          </div>
          <button 
            className={styles.checkoutBtn} 
            disabled={carrito.length === 0}
            onClick={() => setIsCheckoutOpen(true)}
          >
            COBRAR Bs. {totalNeto.toFixed(2)}
          </button>
        </div>
      </div>

      {/* CHECKOUT MODAL */}
      <Modal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} title="Confirmar Venta" maxWidth="500px">
        <div className={styles.modalCheckoutContent}>
          
          <div>
            <label className={styles.label}>Cliente</label>
            <select 
              className={styles.select} 
              value={clienteSeleccionado}
              onChange={(e) => setClienteSeleccionado(e.target.value)}
            >
              <option value="">Consumidor Final</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} - {c.documento_id || 'Sin CI'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={styles.label}>Método de Pago</label>
            <div className={styles.paymentMethods}>
              <button 
                className={`${styles.payBtn} ${metodoPago === 'EFECTIVO' ? styles.payBtnActive : ''}`}
                onClick={() => setMetodoPago('EFECTIVO')}
              >
                <Banknote size={24} /> EFECTIVO
              </button>
              <button 
                className={`${styles.payBtn} ${metodoPago === 'TARJETA' ? styles.payBtnActive : ''}`}
                onClick={() => setMetodoPago('TARJETA')}
              >
                <CreditCard size={24} /> TARJETA
              </button>
              <button 
                className={`${styles.payBtn} ${metodoPago === 'QR' ? styles.payBtnActive : ''}`}
                onClick={() => setMetodoPago('QR')}
              >
                <QrCode size={24} /> QR FIJO
              </button>
            </div>
          </div>

          {metodoPago === 'EFECTIVO' && (
            <div className={styles.cashSection}>
              <div className={styles.cashInputGroup}>
                <label className={styles.label}>Monto Recibido</label>
                <div className={styles.currencyInput}>
                  <span>Bs. </span>
                  <input 
                    type="number" 
                    value={montoPagado} 
                    onChange={(e) => setMontoPagado(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div className={styles.quickCashBtns}>
                <button className={styles.quickBtn} onClick={() => setMontoPagado(totalNeto.toString())}>Exacto</button>
                <button className={styles.quickBtn} onClick={() => setMontoPagado('20')}>Bs. 20</button>
                <button className={styles.quickBtn} onClick={() => setMontoPagado('50')}>Bs. 50</button>
                <button className={styles.quickBtn} onClick={() => setMontoPagado('100')}>Bs. 100</button>
              </div>
              <div className={styles.changeDisplay}>
                <span>Vuelto:</span>
                <span className={vuelto > 0 ? styles.positiveChange : ''}>Bs. {vuelto.toFixed(2)}</span>
              </div>
            </div>
          )}

          <button 
            className={styles.checkoutBtn} 
            onClick={handleCobrar}
            style={{ marginTop: '0', backgroundColor: '#10b981' }}
          >
            <CheckCircle2 size={24} style={{ marginRight: '0.5rem' }} />
            CONFIRMAR VENTA (Bs. {totalNeto.toFixed(2)})
          </button>
        </div>
      </Modal>

      {/* VARIANT SELECTION MODAL */}
      <Modal isOpen={!!productoConVariantes} onClose={() => setProductoConVariantes(null)} title="Seleccionar Variante" maxWidth="600px">
        {productoConVariantes && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
            <div style={{ padding: '0 1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {productoConVariantes.imagenes && productoConVariantes.imagenes.length > 0 ? (
                <img src={`http://localhost:3001${productoConVariantes.imagenes[0].url}`} alt={productoConVariantes.nombre} style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              ) : (
                <div style={{ width: '60px', height: '60px', backgroundColor: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                  <ShoppingCart size={24} color="#cbd5e1" />
                </div>
              )}
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, color: '#0f172a' }}>{productoConVariantes.nombre}</h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>Selecciona la variante deseada</p>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '400px', overflowY: 'auto', padding: '0 1rem' }}>
              {productoConVariantes.variantes?.map((v: any) => {
                const stockVar = getStock(productoConVariantes, v.id);
                const pBase = parseFloat(productoConVariantes.precio_base);
                const pAdd = v.precio_adicional ? parseFloat(v.precio_adicional) : 0;
                const precioTotal = pBase + pAdd;
                return (
                  <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {v.imagen_url && (
                        <img src={`http://localhost:3001${v.imagen_url}`} alt={v.nombre} style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#fff' }} />
                      )}
                      <div>
                        <span style={{ fontSize: '1rem', fontWeight: 600, display: 'block', textTransform: 'capitalize' }}>{v.nombre || 'Variante'}</span>
                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>SKU: {v.sku_base}</span>
                        
                        {v.empaques && v.empaques.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {v.empaques.map((emp: any) => (
                              <button
                                key={emp.id}
                                onClick={(e) => { e.stopPropagation(); addToCart(productoConVariantes, v, emp); setProductoConVariantes(null); }}
                                style={{
                                  fontSize: '0.75rem', fontWeight: 600, padding: '0.3rem 0.6rem',
                                  backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px',
                                  color: '#0f172a', cursor: 'pointer'
                                }}
                              >
                                {emp.nombre} (Bs. {parseFloat(emp.precio).toFixed(2)})
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>Bs. {precioTotal.toFixed(2)}</span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: stockVar > 0 ? '#0f172a' : '#ef4444', backgroundColor: stockVar > 0 ? '#f1f5f9' : '#fef2f2', padding: '0.2rem 0.6rem', borderRadius: '20px' }}>
                          {stockVar > 0 ? `Stock: ${stockVar}` : 'Agotado'}
                        </span>
                      </div>
                      <button 
                        className={styles.btnSecondary} 
                        style={{ padding: '0.6rem 1.2rem', backgroundColor: '#0f172a', color: 'white', border: 'none', borderRadius: '12px', cursor: stockVar <= 0 ? 'not-allowed' : 'pointer' }} 
                        disabled={stockVar <= 0}
                        onClick={() => { addToCart(productoConVariantes, v); setProductoConVariantes(null); }}
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Modal>

      {/* TICKET PRINTER MODAL */}
      <Modal isOpen={!!ticketData} onClose={() => setTicketData(null)} title="Comprobante de Venta" maxWidth="400px">
        {ticketData && (
          <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div id="printable-ticket" style={{
              width: '100%', maxWidth: '300px', backgroundColor: '#fff', padding: '1rem',
              fontFamily: '"Courier New", Courier, monospace', color: '#000', border: '1px solid #e2e8f0',
              borderRadius: '4px', margin: '0 auto', lineHeight: '1.2'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, fontFamily: 'sans-serif', letterSpacing: '-1px', textTransform: 'uppercase' }}>
                  ENTREGAS<span style={{ textTransform: 'lowercase', letterSpacing: 'normal' }}>.com.bo</span>
                </h2>
                <p style={{ margin: '0.2rem 0', fontSize: '0.8rem' }}>Santa Cruz, Bolivia</p>
                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>COMPROBANTE DE VENTA</p>
              </div>
              <div style={{ borderBottom: '1px dashed #000', paddingBottom: '0.5rem', marginBottom: '0.5rem', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Ticket #:</span> <span>{String(ticketData.id).padStart(7, '0')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Fecha:</span> <span>{new Date(ticketData.creado_en).toLocaleString('es-BO')}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Método:</span> <span>{ticketData.metodo_pago}</span></div>
              </div>
              <table style={{ width: '100%', fontSize: '0.75rem', marginBottom: '0.5rem', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed #000' }}>
                    <th style={{ textAlign: 'left', paddingBottom: '0.3rem', width: '15%' }}>Cant</th>
                    <th style={{ textAlign: 'left', paddingBottom: '0.3rem', width: '55%' }}>Desc</th>
                    <th style={{ textAlign: 'right', paddingBottom: '0.3rem', width: '30%' }}>Subt</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketData.detalles?.map((d: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ verticalAlign: 'top', paddingTop: '0.4rem' }}>{d.cantidad}</td>
                      <td style={{ verticalAlign: 'top', paddingTop: '0.4rem' }}>{d.producto?.nombre || `Prod ID: ${d.producto_id}`}</td>
                      <td style={{ verticalAlign: 'top', textAlign: 'right', paddingTop: '0.4rem' }}>{parseFloat(d.subtotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ borderTop: '1px dashed #000', paddingTop: '0.5rem', fontSize: '0.8rem' }}>
                {ticketData.descuento_total > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                    <span>DESC.:</span>
                    <span>- Bs. {parseFloat(ticketData.descuento_total).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', marginBottom: '0.3rem' }}>
                  <span>TOTAL:</span>
                  <span>Bs. {parseFloat(ticketData.total).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}>
              <button className={styles.btnSecondary} onClick={() => setTicketData(null)}>Cerrar</button>
              <button 
                className={styles.btnPrimary} 
                onClick={() => {
                  const content = document.getElementById('printable-ticket')?.innerHTML;
                  if (content) {
                    const html = `<html><head><style>@page { margin: 0; size: 80mm auto; } body { font-family: "Courier New", Courier, monospace; margin: 0; padding: 10px; color: #000; width: 300px; }</style></head><body>${content}</body></html>`;
                    imprimirBoletaSilenciosa(html);
                  }
                }}
              >
                Imprimir Boleta
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

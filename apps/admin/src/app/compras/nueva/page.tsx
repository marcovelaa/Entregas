'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../../lib/axios';
import { Producto, Proveedor, CartItem } from './components/NuevaCompraTypes';
import { CatalogStep } from './components/CatalogStep';
import { CartStep } from './components/CartStep';
import { ProductSelectionModal } from './components/ProductSelectionModal';
import styles from './page.module.css';

export default function NuevaCompraPage() {
  const router = useRouter();
  
  // Wizard state
  const [step, setStep] = useState<1 | 2>(1);
  
  // Catalog state
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  
  // Modal state
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  
  // Proveedores state
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorId, setProveedorId] = useState<string>('');
  const [numeroRecibo, setNumeroRecibo] = useState<string>('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const handleAddToCart = (
    varianteId: string,
    varianteNombre: string | undefined,
    empaqueId: string,
    empaqueNombre: string | undefined,
    multiplicador: number,
    cantidad: number,
    costoUnitario: number,
    precioVenta: number | undefined
  ) => {
    if (!selectedProduct) return;
    
    const newItem: CartItem = {
      id: Math.random().toString(36).substr(2, 9),
      producto_id: selectedProduct.id,
      producto_nombre: selectedProduct.nombre,
      producto_sku: selectedProduct.sku,
      variante_id: varianteId || undefined,
      variante_nombre: varianteNombre,
      empaque_id: empaqueId || undefined,
      empaque_nombre: empaqueNombre,
      multiplicador,
      cantidad,
      costo_unitario: costoUnitario,
      precio_venta: precioVenta,
      subtotal: cantidad * costoUnitario,
    };
    
    setCart([...cart, newItem]);
    setSelectedProduct(null);
  };

  const updateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setCart(prevCart => prevCart.map(item => 
      item.id === id 
        ? { ...item, cantidad: newQuantity, subtotal: newQuantity * item.costo_unitario }
        : item
    ));
  };

  const confirmPurchase = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const payload = {
        proveedor_id: proveedorId ? proveedorId : undefined,
        numero_recibo: numeroRecibo ? numeroRecibo : undefined,
        estado: 'COMPLETADO',
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
            <CatalogStep 
              productos={productos} 
              loadingCatalog={loadingCatalog} 
              onProductClick={(p) => setSelectedProduct(p)} 
            />
          )}

          {step === 2 && (
            <CartStep 
              cart={cart}
              proveedores={proveedores}
              proveedorId={proveedorId}
              setProveedorId={setProveedorId}
              numeroRecibo={numeroRecibo}
              setNumeroRecibo={setNumeroRecibo}
              removeFromCart={(id) => setCart(cart.filter(item => item.id !== id))}
              updateQuantity={updateQuantity}
              confirmPurchase={confirmPurchase}
              submitting={submitting}
              onBackToCatalog={() => setStep(1)}
            />
          )}
        </div>
      </div>

      <ProductSelectionModal 
        isOpen={!!selectedProduct}
        selectedProduct={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from '../../../../components/molecules/Modal/Modal';
import { Producto, Variante, Empaque } from './NuevaCompraTypes';
import { api } from '../../../../lib/axios';
import styles from '../page.module.css';

interface ProductSelectionModalProps {
  isOpen: boolean;
  selectedProduct: Producto | null;
  onClose: () => void;
  onAddToCart: (
    varianteId: string,
    varianteNombre: string | undefined,
    empaqueId: string,
    empaqueNombre: string | undefined,
    multiplicador: number,
    cantidad: number,
    costoUnitario: number,
    precioVenta: number | undefined
  ) => void;
}

export function ProductSelectionModal({
  isOpen,
  selectedProduct,
  onClose,
  onAddToCart
}: ProductSelectionModalProps) {
  
  const [variantes, setVariantes] = useState<Variante[]>([]);
  const [empaques, setEmpaques] = useState<Empaque[]>([]);
  
  const [loadingVariantes, setLoadingVariantes] = useState(false);
  const [loadingEmpaques, setLoadingEmpaques] = useState(false);
  
  const [selectedVarianteId, setSelectedVarianteId] = useState<string>('');
  const [selectedEmpaqueId, setSelectedEmpaqueId] = useState<string>('');
  
  const [cantidad, setCantidad] = useState<number>(1);
  const [costoUnitario, setCostoUnitario] = useState<number>(0);
  const [precioVenta, setPrecioVenta] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (isOpen && selectedProduct) {
      setVariantes([]);
      setEmpaques([]);
      setSelectedVarianteId('');
      setSelectedEmpaqueId('');
      setCantidad(1);
      setCostoUnitario(Number(selectedProduct.precio_base) || 0);
      setPrecioVenta(Number(selectedProduct.precio_promocional) || Number(selectedProduct.precio_base) || undefined);
      fetchVariantes(selectedProduct.id);
    }
  }, [isOpen, selectedProduct]);

  const fetchVariantes = async (productId: string) => {
    setLoadingVariantes(true);
    try {
      const res = await api.get(`/variantes/producto/${productId}`);
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

  const handleAddToCart = () => {
    if (!selectedProduct) return;
    if (cantidad <= 0 || costoUnitario < 0) return;
    
    const variante = variantes.find(v => v.id === selectedVarianteId);
    const empaque = empaques.find(e => e.id === selectedEmpaqueId);
    
    onAddToCart(
      selectedVarianteId,
      variante?.nombre,
      selectedEmpaqueId,
      empaque?.nombre,
      empaque?.multiplicador_unidades || 1,
      cantidad,
      costoUnitario,
      precioVenta
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Añadir al Carrito" maxWidth="500px">
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

          <div className={styles.twoColumnGrid} style={{ marginBottom: '1rem', paddingBottom: 0, borderBottom: 'none' }}>
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
            <button className={styles.btnSecondary} onClick={onClose}>Cancelar</button>
            <button className={styles.btnPrimary} onClick={handleAddToCart}>
              Añadir al Carrito
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

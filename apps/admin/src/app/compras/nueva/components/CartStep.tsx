import React from 'react';
import { ShoppingCart, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { CartItem, Proveedor } from './NuevaCompraTypes';
import styles from '../page.module.css';

interface CartStepProps {
  cart: CartItem[];
  proveedores: Proveedor[];
  proveedorId: string;
  setProveedorId: (val: string) => void;
  numeroRecibo: string;
  setNumeroRecibo: (val: string) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, newQuantity: number) => void;
  confirmPurchase: () => void;
  submitting: boolean;
  onBackToCatalog: () => void;
}

export function CartStep({
  cart,
  proveedores,
  proveedorId,
  setProveedorId,
  numeroRecibo,
  setNumeroRecibo,
  removeFromCart,
  updateQuantity,
  confirmPurchase,
  submitting,
  onBackToCatalog
}: CartStepProps) {

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  if (cart.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <ShoppingCart size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <p>El carrito está vacío. Vuelve al paso 1 para añadir productos.</p>
        <button className={styles.btnPrimary} style={{ marginTop: '1rem' }} onClick={onBackToCatalog}>
          Añadir Productos
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.twoColumnGrid}>
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
      
      <div className={styles.tableWrapper}>
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
                <td>
                  <input 
                    type="number" 
                    min="1" 
                    value={item.cantidad} 
                    onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
                    style={{ width: '60px', padding: '0.25rem', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                  />
                </td>
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
      </div>

      <div className={styles.cartSummary}>
        <div>
          <span style={{ color: '#64748b' }}>Total de ítems: </span>
          <strong>{cart.reduce((acc, i) => acc + i.cantidad, 0)}</strong>
        </div>
        <div className={styles.cartSummaryActions}>
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
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './CartDrawer.module.css';
import { useCart } from '@/context/CartContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const [mounted, setMounted] = useState(false);
  const { cart, removeFromCart, updateQuantity, totalItems } = useCart();

  useEffect(() => {
    setMounted(true);
    // Prevent background scrolling when open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted) return null;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`${styles.backdrop} ${isOpen ? styles.backdropOpen : ''}`} 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside className={`${styles.drawer} ${isOpen ? styles.drawerOpen : ''}`} role="dialog" aria-modal="true" aria-label="Carrito de compras">
        <header className={styles.header}>
          <h2>Mi Carrito ({totalItems})</h2>
          <button onClick={onClose} className={styles.closeBtn} aria-label="Cerrar carrito">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </header>

        <div className={styles.itemsList}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
              Tu carrito está vacío.
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                <div className={styles.itemImage}>
                  <Image src={item.imageUrl} alt={item.title} fill className={styles.img} sizes="(max-width: 768px) 100px, 100px" />
                </div>
                <div className={styles.itemInfo}>
                  <div className={styles.itemHeader}>
                    <h4 title={item.title}>{item.title}</h4>
                    <button className={styles.removeBtn} aria-label="Eliminar producto" onClick={() => removeFromCart(item.id)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.itemMeta}>{item.category}</div>
                  <div className={styles.itemBottom}>
                    <div className={styles.qtyBox}>
                      <button aria-label="Disminuir" onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button aria-label="Aumentar" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className={styles.itemPrice}>Bs. {(item.price * item.quantity).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className={styles.footer}>
          <div className={styles.summaryRow}>
            <span>Subtotal</span>
            <span className={styles.summaryValue}>Bs. {subtotal.toFixed(2)}</span>
          </div>
          <p className={styles.shippingNote}>Los costos de envío se calcularán en el pago.</p>
          
          <Link href="/checkout" className={styles.checkoutBtn} onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
            PROCEDER AL PAGO
          </Link>
          
          <button className={styles.continueBtn} onClick={onClose}>
            Seguir comprando
          </button>
        </footer>
      </aside>
    </>
  );
};

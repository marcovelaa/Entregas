import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './checkout.module.css';

export default function CheckoutPage() {
  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        <div className={styles.checkoutLayout}>
          
          {/* Left Column: Form */}
          <div className={styles.formSection}>
            <h1 className={styles.pageTitle}>Finalizar Compra</h1>

            {/* Código de Referido / Colegio */}
            <section className={styles.formBlock}>
              <h2 className={styles.blockTitle}>Código de Colegio / Referido</h2>
              <p className={styles.blockDesc}>Si tu colegio te dio un código o tenés un referido, ingresalo acá para enlazar la compra.</p>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="referral">Código (Opcional)</label>
                  <div className={styles.referralWrapper}>
                    <input type="text" id="referral" placeholder="Ej: COL-ENTREGAS-2026" className={styles.input} />
                    <button className={styles.applyBtn}>Aplicar</button>
                  </div>
                </div>
              </div>
            </section>

            {/* Contacto */}
            <section className={styles.formBlock}>
              <h2 className={styles.blockTitle}>Contacto</h2>
              <div className={styles.inputGroup}>
                <label htmlFor="email">Correo electrónico</label>
                <input type="email" id="email" placeholder="tu@email.com" className={styles.input} />
              </div>
            </section>

            {/* Envío */}
            <section className={styles.formBlock}>
              <h2 className={styles.blockTitle}>Dirección de envío</h2>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Nombre</label>
                  <input type="text" id="name" className={styles.input} />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="lastname">Apellidos</label>
                  <input type="text" id="lastname" className={styles.input} />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="address">Dirección completa</label>
                <input type="text" id="address" placeholder="Calle, Número, Zona" className={styles.input} />
              </div>
              <div className={styles.inputRow}>
                <div className={styles.inputGroup}>
                  <label htmlFor="city">Ciudad</label>
                  <select id="city" className={styles.input}>
                    <option>Santa Cruz</option>
                    <option>La Paz</option>
                    <option>Cochabamba</option>
                    <option>Resto del país</option>
                  </select>
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Teléfono / WhatsApp</label>
                  <input type="tel" id="phone" className={styles.input} />
                </div>
              </div>
            </section>

            {/* Pago */}
            <section className={styles.formBlock}>
              <h2 className={styles.blockTitle}>Método de Pago</h2>
              <div className={styles.paymentMethods}>
                <label className={styles.paymentOption}>
                  <input type="radio" name="payment" defaultChecked />
                  <span className={styles.radioCustom}></span>
                  <div className={styles.paymentInfo}>
                    <span className={styles.paymentTitle}>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px', verticalAlign: 'middle', color: 'var(--color-blue)' }}>
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      Pago con QR Simple
                    </span>
                    <span className={styles.paymentDesc}>Al finalizar, se generará un código QR seguro para pagar desde la app de tu banco.</span>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* Right Column: Order Summary */}
          <div className={styles.summarySection}>
            <div className={styles.summarySticky}>
              <h2 className={styles.summaryTitle}>Resumen del Pedido</h2>
              
              <div className={styles.summaryItems}>
                <div className={styles.summaryItem}>
                  <div className={styles.itemImage}>
                    <Image src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop" alt="Libro" fill className={styles.img} sizes="(max-width: 768px) 100px, 100px" />
                    <span className={styles.itemBadge}>1</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <h4>El monstruo de colores</h4>
                    <span>PLAN LECTOR</span>
                  </div>
                  <div className={styles.itemPrice}>Bs. 60.00</div>
                </div>

                <div className={styles.summaryItem}>
                  <div className={styles.itemImage}>
                    <Image src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop" alt="Libro" fill className={styles.img} sizes="(max-width: 768px) 100px, 100px" />
                    <span className={styles.itemBadge}>1</span>
                  </div>
                  <div className={styles.itemInfo}>
                    <h4>Matemáticas Avanzadas</h4>
                    <span>SECUNDARIA</span>
                  </div>
                  <div className={styles.itemPrice}>Bs. 120.00</div>
                </div>
              </div>

              <div className={styles.totalsBlock}>
                <div className={styles.totalsRow}>
                  <span>Subtotal</span>
                  <span>Bs. 165.00</span>
                </div>
                <div className={styles.totalsRow}>
                  <span>Envío</span>
                  <span className={styles.freeShipping}>Gratis (Santa Cruz)</span>
                </div>
                <div className={styles.totalsRowTotal}>
                  <span>Total</span>
                  <div className={styles.totalPriceWrapper}>
                    <span className={styles.currency}>BOB</span>
                    <span className={styles.totalValue}>Bs. 165.00</span>
                  </div>
                </div>
              </div>

              <Link href="/success" className={styles.placeOrderBtn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                PAGAR Y FINALIZAR
              </Link>
              
              <div className={styles.secureCheckout}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.secureIcon}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <span>Pago seguro y encriptado</span>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

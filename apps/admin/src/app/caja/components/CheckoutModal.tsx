"use client";

import { Banknote, CheckCircle2, CreditCard, QrCode } from "lucide-react";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { CartItem, PaymentMethod, PosCustomer } from "../pos-types";
import styles from "../page.module.css";

interface CheckoutModalProps {
  isOpen: boolean;
  customers: PosCustomer[];
  cart: CartItem[];
  selectedCustomerId: string;
  isEditingCustomer: boolean;
  customerQuery: string;
  paymentMethod: PaymentMethod;
  paidAmount: string;
  total: number;
  change: number;
  isSubmitting: boolean;
  onClose: () => void;
  onCustomerChange: (customerId: string) => void;
  onCustomerEditingChange: (isEditing: boolean) => void;
  onCustomerQueryChange: (query: string) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onPaidAmountChange: (amount: string) => void;
  onSubmit: () => void;
}

export function CheckoutModal({
  isOpen,
  customers,
  cart,
  selectedCustomerId,
  isEditingCustomer,
  customerQuery,
  paymentMethod,
  paidAmount,
  total,
  change,
  isSubmitting,
  onClose,
  onCustomerChange,
  onCustomerEditingChange,
  onCustomerQueryChange,
  onPaymentMethodChange,
  onPaidAmountChange,
  onSubmit,
}: CheckoutModalProps) {
  const selectedCustomer = customers.find(
    (customer) => customer.id === selectedCustomerId,
  );
  const filteredCustomers = customers.filter((customer) => {
    const query = customerQuery.trim().toLowerCase();
    return (
      !query ||
      `${customer.nombre} ${customer.documento_id ?? ""}`
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Venta"
      maxWidth="500px"
    >
      <div className={styles.modalCheckoutContent}>
        <section aria-labelledby="checkout-customer-label">
          <h3 id="checkout-customer-label" className={styles.label}>
            Cliente
          </h3>
          {!isEditingCustomer ? (
            <div className={styles.selectedCustomer}>
              <div>
                <p className={styles.selectedCustomerName}>
                  {selectedCustomer?.nombre ?? "Consumidor Final"}
                </p>
                <p className={styles.selectedCustomerDocument}>
                  {selectedCustomer
                    ? `Doc: ${selectedCustomer.documento_id ?? "S/N"}`
                    : "Sin Documento"}
                </p>
              </div>
              <button
                type="button"
                className={styles.linkButton}
                onClick={() => onCustomerEditingChange(true)}
                disabled={isSubmitting}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div className={styles.customerPicker}>
              <div className={styles.customerSearchRow}>
                <label
                  className={styles.visuallyHidden}
                  htmlFor="checkout-customer-search"
                >
                  Buscar cliente
                </label>
                <input
                  id="checkout-customer-search"
                  type="search"
                  placeholder="Buscar cliente..."
                  value={customerQuery}
                  onChange={(event) =>
                    onCustomerQueryChange(event.target.value)
                  }
                  className={`${styles.inputRefined} ${styles.compactInput}`}
                  autoFocus
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => {
                    onCustomerChange("");
                    onCustomerEditingChange(false);
                  }}
                  className={`${styles.btnSecondary} ${styles.compactButton}`}
                  disabled={isSubmitting}
                >
                  Consumidor Final
                </button>
              </div>
              <div
                className={styles.selectableList}
                role="listbox"
                aria-label="Clientes disponibles"
              >
                {filteredCustomers.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    role="option"
                    aria-selected={customer.id === selectedCustomerId}
                    onClick={() => {
                      onCustomerChange(customer.id);
                      onCustomerEditingChange(false);
                    }}
                    className={styles.userListItem}
                    disabled={isSubmitting}
                  >
                    <span className={styles.listItemTitle}>
                      {customer.nombre}
                    </span>
                    <span className={styles.listItemSubtitle}>
                      Doc: {customer.documento_id ?? "S/N"}
                    </span>
                  </button>
                ))}
                {!filteredCustomers.length && (
                  <p className={styles.emptyList}>
                    No hay clientes registrados.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>

        <fieldset className={styles.paymentFieldset} disabled={isSubmitting}>
          <legend className={styles.label}>Método de Pago</legend>
          <div className={styles.paymentMethods}>
            <PaymentMethodButton
              method="EFECTIVO"
              label="EFECTIVO"
              active={paymentMethod === "EFECTIVO"}
              onSelect={onPaymentMethodChange}
            >
              <Banknote size={22} aria-hidden="true" />
            </PaymentMethodButton>
            <PaymentMethodButton
              method="TARJETA"
              label="TARJETA"
              active={paymentMethod === "TARJETA"}
              onSelect={onPaymentMethodChange}
            >
              <CreditCard size={22} aria-hidden="true" />
            </PaymentMethodButton>
            <PaymentMethodButton
              method="QR"
              label="QR FIJO"
              active={paymentMethod === "QR"}
              onSelect={onPaymentMethodChange}
            >
              <QrCode size={22} aria-hidden="true" />
            </PaymentMethodButton>
          </div>
        </fieldset>

        {paymentMethod === "EFECTIVO" && (
          <section
            className={styles.cashSection}
            aria-labelledby="cash-payment-label"
          >
            <div className={styles.cashInputGroup}>
              <label
                id="cash-payment-label"
                className={styles.label}
                htmlFor="cash-received"
              >
                Monto Recibido
              </label>
              <div className={styles.currencyInput}>
                <span>Bs.</span>
                <input
                  id="cash-received"
                  type="number"
                  min="0"
                  value={paidAmount}
                  onChange={(event) => onPaidAmountChange(event.target.value)}
                  placeholder="0.00"
                  autoFocus
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className={styles.quickCashBtns}>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={() => onPaidAmountChange(total.toString())}
                disabled={isSubmitting}
              >
                Exacto
              </button>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={() => onPaidAmountChange("20")}
                disabled={isSubmitting}
              >
                Bs. 20
              </button>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={() => onPaidAmountChange("50")}
                disabled={isSubmitting}
              >
                Bs. 50
              </button>
              <button
                type="button"
                className={styles.quickBtn}
                onClick={() => onPaidAmountChange("100")}
                disabled={isSubmitting}
              >
                Bs. 100
              </button>
            </div>
            <div className={styles.changeDisplay}>
              <span>Vuelto:</span>
              <span className={change > 0 ? styles.positiveChange : ""}>
                Bs. {change.toFixed(2)}
              </span>
            </div>
          </section>
        )}

        <button
          type="button"
          className={styles.checkoutBtn}
          onClick={onSubmit}
          disabled={!cart.length || isSubmitting}
          aria-busy={isSubmitting}
        >
          <CheckCircle2 size={22} aria-hidden="true" />
          {isSubmitting
            ? "REGISTRANDO VENTA…"
            : `CONFIRMAR VENTA (Bs. ${total.toFixed(2)})`}
        </button>
      </div>
    </Modal>
  );
}

function PaymentMethodButton({
  method,
  label,
  active,
  onSelect,
  children,
}: {
  method: PaymentMethod;
  label: string;
  active: boolean;
  onSelect: (method: PaymentMethod) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`${styles.payBtn} ${active ? styles.payBtnActive : ""}`}
      aria-pressed={active}
      onClick={() => onSelect(method)}
    >
      {children}
      {label}
    </button>
  );
}

"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/molecules/Modal/Modal";
import type { CartItem, PosApprover } from "../pos-types";
import styles from "../page.module.css";

interface PriceAdjustmentModalProps {
  item: CartItem | null;
  approvers: PosApprover[];
  selectedApprover: PosApprover | null;
  approverQuery: string;
  newPrice: string;
  reason: string;
  onClose: () => void;
  onApproverChange: (approver: PosApprover | null) => void;
  onApproverQueryChange: (query: string) => void;
  onNewPriceChange: (price: string) => void;
  onReasonChange: (reason: string) => void;
  onApply: () => void;
}

export function PriceAdjustmentModal({
  item,
  approvers,
  selectedApprover,
  approverQuery,
  newPrice,
  reason,
  onClose,
  onApproverChange,
  onApproverQueryChange,
  onNewPriceChange,
  onReasonChange,
  onApply,
}: PriceAdjustmentModalProps) {
  const requiresApproval = item
    ? Number(newPrice) < item.precio_catalogo - 0.0001
    : false;
  const filteredApprovers = approvers.filter((approver) => {
    const query = approverQuery.trim().toLowerCase();
    return (
      !query ||
      `${approver.nombres} ${approver.apellidos} ${approver.email}`
        .toLowerCase()
        .includes(query)
    );
  });

  return (
    <Modal
      isOpen={Boolean(item)}
      onClose={onClose}
      title="Ajuste de Precio Manual"
      maxWidth="450px"
    >
      {item && (
        <div className={styles.adjustmentContent}>
          <div className={styles.adjustmentItemSummary}>
            <p className={styles.adjustmentItemName}>{item.nombre}</p>
            <p className={styles.adjustmentItemPrice}>
              Catálogo: Bs. {item.precio_catalogo.toFixed(2)}
            </p>
          </div>
          <div>
            <label className={styles.label} htmlFor="manual-price">
              Nuevo Precio de Venta (Bs.)
            </label>
            <input
              id="manual-price"
              type="number"
              step="0.5"
              min="0"
              value={newPrice}
              onChange={(event) => onNewPriceChange(event.target.value)}
              className={`${styles.inputRefined} ${styles.priceInput}`}
              autoFocus
            />
          </div>

          {requiresApproval && (
            <>
              <div className={styles.adjustmentWarning}>
                <AlertTriangle size={18} aria-hidden="true" />
                <p>
                  <strong>Rebaja detectada.</strong> Debes adjuntar al superior
                  que autorizó la rebaja y un motivo.
                </p>
              </div>
              <div>
                <h3 className={styles.label}>Autorizado por</h3>
                {selectedApprover ? (
                  <div className={styles.selectedApprover}>
                    <div>
                      <p className={styles.selectedApproverName}>
                        {selectedApprover.nombres} {selectedApprover.apellidos}
                      </p>
                      <p className={styles.selectedApproverEmail}>
                        {selectedApprover.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      className={styles.linkButtonWarning}
                      onClick={() => onApproverChange(null)}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div className={styles.customerPicker}>
                    <label
                      className={styles.visuallyHidden}
                      htmlFor="approver-search"
                    >
                      Buscar administrador
                    </label>
                    <div className={styles.listSearch}>
                      <input
                        id="approver-search"
                        type="search"
                        placeholder="Buscar administrador..."
                        value={approverQuery}
                        onChange={(event) =>
                          onApproverQueryChange(event.target.value)
                        }
                        className={`${styles.inputRefined} ${styles.compactInput}`}
                      />
                    </div>
                    <div
                      className={styles.selectableList}
                      role="listbox"
                      aria-label="Administradores disponibles"
                    >
                      {filteredApprovers.map((approver) => (
                        <button
                          key={approver.id}
                          type="button"
                          role="option"
                          aria-selected={false}
                          className={styles.userListItem}
                          onClick={() => onApproverChange(approver)}
                        >
                          <span className={styles.listItemTitle}>
                            {approver.nombres} {approver.apellidos}
                          </span>
                          <span className={styles.listItemSubtitle}>
                            {approver.email}
                          </span>
                        </button>
                      ))}
                      {!filteredApprovers.length && (
                        <p className={styles.emptyList}>
                          No hay administradores disponibles.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className={styles.label} htmlFor="adjustment-reason">
                  Motivo del Ajuste
                </label>
                <input
                  id="adjustment-reason"
                  type="text"
                  placeholder="Ej: Fidelidad, descuento por cantidad..."
                  value={reason}
                  onChange={(event) => onReasonChange(event.target.value)}
                  className={styles.inputRefined}
                />
              </div>
            </>
          )}
          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={onClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className={styles.btnPrimary}
              onClick={onApply}
            >
              Aplicar Ajuste
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

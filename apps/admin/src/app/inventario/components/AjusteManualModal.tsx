import React, { useState } from 'react';
import { api } from '../../../lib/axios';
import { Loader2, X, AlertCircle } from 'lucide-react';
import { StockItem } from '../InventarioTypes';
import styles from './AjusteManualModal.module.css';

interface AjusteManualModalProps {
  item: StockItem;
  onClose: () => void;
  onSuccess: () => void;
}

export function AjusteManualModal({ item, onClose, onSuccess }: AjusteManualModalProps) {
  const [tipoMovimiento, setTipoMovimiento] = useState<'INGRESO_MANUAL' | 'SALIDA_MANUAL'>('INGRESO_MANUAL');
  const [cantidad, setCantidad] = useState<number | ''>('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cantidad || Number(cantidad) <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }

    if (tipoMovimiento === 'SALIDA_MANUAL' && Number(cantidad) > item.cantidad_disponible) {
      setError('La cantidad a restar supera el stock disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/inventario/movimientos', {
        producto_id: item.producto_id,
        variante_id: item.variante_id || undefined,
        tipo_movimiento: tipoMovimiento,
        cantidad: Number(cantidad),
        motivo: motivo || 'Ajuste manual',
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ocurrió un error al registrar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ajuste Manual de Stock</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.body}>
          {error && (
            <div className={styles.errorAlert}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Producto:</span>
              <span className={styles.infoValue}>
                {item.producto?.nombre}
                {item.variante ? ` - ${item.variante.nombre}` : ''}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Stock Actual:</span>
              <span className={styles.infoValue}>{item.cantidad_disponible}</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Tipo de Movimiento</label>
            <div className={styles.radioGroup}>
              <label className={`${styles.radioCard} ${tipoMovimiento === 'INGRESO_MANUAL' ? styles.radioCardActiveIn : ''}`}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="INGRESO_MANUAL" 
                  checked={tipoMovimiento === 'INGRESO_MANUAL'}
                  onChange={() => setTipoMovimiento('INGRESO_MANUAL')}
                />
                <span>Entrada (+)</span>
              </label>
              <label className={`${styles.radioCard} ${tipoMovimiento === 'SALIDA_MANUAL' ? styles.radioCardActiveOut : ''}`}>
                <input 
                  type="radio" 
                  name="tipo" 
                  value="SALIDA_MANUAL" 
                  checked={tipoMovimiento === 'SALIDA_MANUAL'}
                  onChange={() => setTipoMovimiento('SALIDA_MANUAL')}
                />
                <span>Salida (-)</span>
              </label>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="cantidad">Cantidad a ajustar</label>
            <input
              id="cantidad"
              type="number"
              min="1"
              step="1"
              className={styles.input}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ej. 5"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="motivo">Motivo / Observaciones</label>
            <textarea
              id="motivo"
              className={styles.textarea}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Ajuste por merma, conteo físico, etc."
              rows={3}
            />
          </div>

          <div className={styles.footer}>
            <button type="button" className={styles.btnCancel} onClick={onClose} disabled={loading}>
              Cancelar
            </button>
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? <Loader2 className={styles.spin} size={18} /> : 'Guardar Ajuste'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

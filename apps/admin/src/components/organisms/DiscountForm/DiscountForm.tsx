'use client';

import React, { useState } from 'react';
import styles from './DiscountForm.module.css';
import { TargetSelector, TargetItem } from './TargetSelector';
import { LivePromoSimulator } from './LivePromoSimulator';
import { Tag, Layers, Calendar, Sliders, Save, Loader2 } from 'lucide-react';

export interface DiscountFormProps {
  initialData?: any;
  onSubmit: (data: any) => Promise<void>;
  isEditing?: boolean;
  categories?: TargetItem[];
  products?: TargetItem[];
  variants?: TargetItem[];
  empaques?: TargetItem[];
  onCancel?: () => void;
}

export function DiscountForm({
  initialData,
  onSubmit,
  isEditing = false,
  categories = [],
  products = [],
  variants = [],
  empaques = [],
  onCancel,
}: DiscountFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nombre: initialData?.nombre ?? '',
    descripcion: initialData?.descripcion ?? '',
    codigoCupon: initialData?.codigoCupon ?? '',
    canal: initialData?.canal ?? 'TODOS',
    alcance: initialData?.alcance ?? 'GLOBAL',
    tipo: initialData?.tipo ?? 'PORCENTAJE',
    valor: initialData?.valor ?? '',
    maxMontoDescuento: initialData?.maxMontoDescuento ?? '',
    cantidadRequerida: initialData?.cantidadRequerida ?? '2',
    cantidadPaga: initialData?.cantidadPaga ?? '1',
    montoMinimoCompra: initialData?.montoMinimoCompra ?? '',
    limiteUsos: initialData?.limiteUsos ?? '',
    limiteUsosPorCliente: initialData?.limiteUsosPorCliente ?? '1',
    esAcumulable: Boolean(initialData?.esAcumulable),
    prioridad: initialData?.prioridad ?? '0',
    fechaInicio: initialData?.fechaInicio
      ? new Date(initialData.fechaInicio).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    fechaFin: initialData?.fechaFin
      ? new Date(initialData.fechaFin).toISOString().split('T')[0]
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    categoriaIds: (initialData?.categorias?.map((c: any) => c.id.toString()) || initialData?.categoriaIds || []) as string[],
    productoIds: (initialData?.productos?.map((p: any) => p.id.toString()) || initialData?.productoIds || []) as string[],
    varianteIds: (initialData?.variantes?.map((v: any) => v.id.toString()) || initialData?.varianteIds || []) as string[],
    empaqueIds: (initialData?.empaques?.map((e: any) => e.id.toString()) || initialData?.empaqueIds || []) as string[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.nombre.trim()) {
      setErrorMsg('El nombre de la promoción es obligatorio.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        categoriaIds: formData.alcance === 'CATEGORIA' ? formData.categoriaIds : [],
        productoIds: formData.alcance === 'PRODUCTO' ? formData.productoIds : [],
        varianteIds: formData.alcance === 'VARIANTE' ? formData.varianteIds : [],
        empaqueIds: formData.alcance === 'EMPAQUE' ? formData.empaqueIds : [],
      };
      await onSubmit(payload);
    } catch (err: any) {
      console.error('Error al guardar promoción:', err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar el formulario.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <div className={styles.leftColumn}>
        {errorMsg && <div className={styles.errorBanner}>{errorMsg}</div>}

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Tag size={16} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Información General</h3>
              <p className={styles.cardSubtitle}>Define el nombre, canal de venta y código promocional</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>
                Nombre de la Promoción / Campaña <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                required
                className={styles.input}
                placeholder="ej: Oferta Inicio de Clases 15% OFF"
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                disabled={submitting}
              />
            </div>

            <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
              <div className={styles.field}>
                <label className={styles.label}>Canal de Venta</label>
                <select
                  className={styles.select}
                  value={formData.canal}
                  onChange={(e) => setFormData({ ...formData, canal: e.target.value })}
                  disabled={submitting}
                >
                  <option value="TODOS">Todos (POS Caja + E-Commerce)</option>
                  <option value="POS">Solo POS (Caja ERP)</option>
                  <option value="ECOMMERCE">Solo E-Commerce (Tienda Web)</option>
                </select>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Código de Cupón (Opcional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="ej: VERANO2026 (Vacío = Automático)"
                  value={formData.codigoCupon}
                  onChange={(e) => setFormData({ ...formData, codigoCupon: e.target.value.toUpperCase() })}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción Interna / Notas</label>
              <textarea
                className={styles.textarea}
                placeholder="Detalles u observaciones de la campaña para el equipo comercial..."
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                disabled={submitting}
              />
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Layers size={16} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Alcance y Objetivos</h3>
              <p className={styles.cardSubtitle}>
                Especifica a qué productos, categorías o empaques se aplicará la regla
              </p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label className={styles.label}>Alcance del Descuento</label>
              <select
                className={styles.select}
                value={formData.alcance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    alcance: e.target.value,
                    categoriaIds: [],
                    productoIds: [],
                    varianteIds: [],
                    empaqueIds: [],
                  })
                }
                disabled={submitting}
              >
                <option value="GLOBAL">Toda la Tienda (Global)</option>
                <option value="CATEGORIA">Categorías Específicas</option>
                <option value="PRODUCTO">Productos Específicos</option>
                <option value="VARIANTE">Variantes Específicas</option>
                <option value="EMPAQUE">Empaques Específicos</option>
              </select>
            </div>

            {formData.alcance !== 'GLOBAL' && (
              <TargetSelector
                alcance={formData.alcance}
                categories={categories}
                products={products}
                variants={variants}
                empaques={empaques}
                selectedCategoryIds={formData.categoriaIds}
                selectedProductIds={formData.productoIds}
                selectedVariantIds={formData.varianteIds}
                selectedEmpaqueIds={formData.empaqueIds}
                onSelectCategory={(ids) => setFormData({ ...formData, categoriaIds: ids })}
                onSelectProduct={(ids) => setFormData({ ...formData, productoIds: ids })}
                onSelectVariant={(ids) => setFormData({ ...formData, varianteIds: ids })}
                onSelectEmpaque={(ids) => setFormData({ ...formData, empaqueIds: ids })}
                disabled={submitting}
              />
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Sliders size={16} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Regla y Tipo de Descuento</h3>
              <p className={styles.cardSubtitle}>Configura el cálculo del beneficio y restricciones de consumo</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
              <div className={styles.field}>
                <label className={styles.label}>Tipo de Descuento</label>
                <select
                  className={styles.select}
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  disabled={submitting}
                >
                  <option value="PORCENTAJE">Porcentaje (% OFF)</option>
                  <option value="MONTO_FIJO_POR_UNIDAD">Monto Fijo por Unidad (Bs. OFF por cada ítem)</option>
                  <option value="MONTO_FIJO">Monto Fijo Global (Bs. OFF en orden)</option>
                  <option value="LLEVA_X_PAGA_Y">Lleva X Paga Y (ej: 2x1, 3x2)</option>
                  <option value="COMBO">Combo Promocional</option>
                </select>
              </div>

              {formData.tipo === 'PORCENTAJE' && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    Porcentaje de Descuento (% OFF) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    className={styles.input}
                    placeholder="ej: 15"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              )}

              {formData.tipo === 'MONTO_FIJO_POR_UNIDAD' && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    Descuento Fijo por Unidad (Bs.) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={styles.input}
                    placeholder="ej: 10.00"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              )}

              {formData.tipo === 'MONTO_FIJO' && (
                <div className={styles.field}>
                  <label className={styles.label}>
                    Monto Fijo Global (Bs.) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className={styles.input}
                    placeholder="ej: 20.50"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              )}
            </div>

            {(formData.tipo === 'PORCENTAJE' || formData.tipo === 'MONTO_FIJO_POR_UNIDAD') && (
              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>Tope Máximo de Descuento (Bs. Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.input}
                    placeholder="ej: 100 (Vacío = Sin tope)"
                    value={formData.maxMontoDescuento ?? ''}
                    onChange={(e) => setFormData({ ...formData, maxMontoDescuento: e.target.value })}
                    disabled={submitting}
                  />
                  <span className={styles.helpText}>Límite máximo que no podrá exceder el descuento total.</span>
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Monto Mínimo de Compra (Bs.)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className={styles.input}
                    placeholder="ej: 150.00"
                    value={formData.montoMinimoCompra ?? ''}
                    onChange={(e) => setFormData({ ...formData, montoMinimoCompra: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}

            {formData.tipo === 'MONTO_FIJO' && (
              <div className={styles.field}>
                <label className={styles.label}>Monto Mínimo de Compra (Bs.)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={styles.input}
                  placeholder="ej: 150.00"
                  value={formData.montoMinimoCompra ?? ''}
                  onChange={(e) => setFormData({ ...formData, montoMinimoCompra: e.target.value })}
                  disabled={submitting}
                />
              </div>
            )}

            {(formData.tipo === 'LLEVA_X_PAGA_Y' || formData.tipo === 'COMBO') && (
              <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
                <div className={styles.field}>
                  <label className={styles.label}>Cantidad Requerida (Lleva X)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={styles.input}
                    placeholder="2"
                    value={formData.cantidadRequerida}
                    onChange={(e) => setFormData({ ...formData, cantidadRequerida: e.target.value })}
                    disabled={submitting}
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Cantidad Cobrada (Paga Y)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className={styles.input}
                    placeholder="1"
                    value={formData.cantidadPaga}
                    onChange={(e) => setFormData({ ...formData, cantidadPaga: e.target.value })}
                    disabled={submitting}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Calendar size={16} />
            </div>
            <div>
              <h3 className={styles.cardTitle}>Vigencia y Restricciones</h3>
              <p className={styles.cardSubtitle}>Establece el rango de fechas y límites de uso por cliente</p>
            </div>
          </div>

          <div className={styles.formGrid}>
            <div className={`${styles.formGrid} ${styles.formGridTwo}`}>
              <div className={styles.field}>
                <label className={styles.label}>
                  Fecha Inicio <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  required
                  className={styles.input}
                  value={formData.fechaInicio}
                  onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>
                  Fecha Fin <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  required
                  className={styles.input}
                  value={formData.fechaFin}
                  onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className={`${styles.formGrid} ${styles.formGridThree}`}>
              <div className={styles.field}>
                <label className={styles.label}>Usos Totales Máximos</label>
                <input
                  type="number"
                  min="0"
                  className={styles.input}
                  placeholder="Sin límite"
                  value={formData.limiteUsos ?? ''}
                  onChange={(e) => setFormData({ ...formData, limiteUsos: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Usos por Cliente</label>
                <input
                  type="number"
                  min="1"
                  className={styles.input}
                  placeholder="1"
                  value={formData.limiteUsosPorCliente ?? ''}
                  onChange={(e) => setFormData({ ...formData, limiteUsosPorCliente: e.target.value })}
                  disabled={submitting}
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Prioridad de Regla</label>
                <input
                  type="number"
                  className={styles.input}
                  placeholder="0"
                  value={formData.prioridad}
                  onChange={(e) => setFormData({ ...formData, prioridad: e.target.value })}
                  disabled={submitting}
                />
              </div>
            </div>

            <label className={styles.checkboxGroup}>
              <input
                type="checkbox"
                className={styles.checkboxInput}
                checked={Boolean(formData.esAcumulable)}
                onChange={(e) => setFormData({ ...formData, esAcumulable: e.target.checked })}
                disabled={submitting}
              />
              <span className={styles.checkboxLabel}>¿Es acumulable con otros cupones o promociones activas?</span>
            </label>
          </div>
        </div>

        <div className={styles.actionsBar}>
          {onCancel && (
            <button type="button" onClick={onCancel} className={styles.cancelBtn} disabled={submitting}>
              Cancelar
            </button>
          )}

          <button type="submit" className={styles.submitBtn} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Guardando...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>{isEditing ? 'Actualizar Promoción' : 'Guardar Campaña'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className={styles.rightColumn}>
        <LivePromoSimulator formState={formData} />
      </div>
    </form>
  );
}

export default DiscountForm;

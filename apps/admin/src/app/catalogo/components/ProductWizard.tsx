'use client';
import React, { useState, useEffect } from 'react';
import { Loader2, ChevronRight, BookText, Library, FileText, PenTool, LayoutTemplate } from 'lucide-react';
import { Modal } from '../../../components/molecules/Modal/Modal';
import styles from '../page.module.css';
import { api } from '../../../lib/axios';
import { Marca, Categoria } from '../types';
import TextosEscolaresForm from './TextosEscolaresForm';
import CuadernosForm from './CuadernosForm';
import DynamicProductForm from './DynamicProductForm';

const TIPOS_PRODUCTO = [
  { id: 'Textos Escolares', icon: <BookText size={32} />, desc: 'Textos de Inicial, Primaria, Secundaria y Plan Lector' },
  { id: 'Material Escolar', icon: <PenTool size={32} />, desc: 'Lapiceros, lápices, colores, pegamentos, reglas' },
  { id: 'Cuadernos', icon: <LayoutTemplate size={32} />, desc: 'Cuadernos por paquete, pallet, espiral, cosido' },
  { id: 'Papel', icon: <FileText size={32} />, desc: 'Hojas bond, cartulinas, papel sábana (resma/caja)' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: (producto?: any) => void;
  marcas: Marca[];
  categorias: Categoria[];
  editingProduct?: any;
}

export default function ProductWizard({ isOpen, onClose, onProductCreated, marcas, categorias, editingProduct }: Props) {
  const [wizardStep, setWizardStep] = useState<'selector' | 'form'>('selector');
  const [selectedNaturaleza, setSelectedNaturaleza] = useState<string>('');
  const [productPayload, setProductPayload] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingProduct) {
        setWizardStep('form');
        setSelectedNaturaleza(editingProduct.naturaleza || '');
        setProductPayload({
          ...editingProduct,
          precio_base: editingProduct.precio_base || '',
          marca_id: editingProduct.marca?.id || '',
          categoria_id: editingProduct.categoria?.id || '',
          atributos: editingProduct.atributos || {}
        });
      } else {
        setWizardStep('selector');
        setSelectedNaturaleza('');
        setProductPayload({ nombre: '', sku: '', precio_base: '', marca_id: '', categoria_id: '', atributos: {} });
      }
    }
  }, [isOpen, editingProduct]);

  function startProductWizard(naturaleza: string) {
    setSelectedNaturaleza(naturaleza);
    const catDb = categorias.find(c => c.nombre.toLowerCase() === naturaleza.toLowerCase());
    setProductPayload({ ...productPayload, naturaleza, categoria_id: catDb ? catDb.id : '' });
    setWizardStep('form');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const catId = productPayload.categoria_id;
      if (!catId) throw new Error("Debe seleccionar una categoría base del sistema");
      const payload = {
        nombre: productPayload.nombre, sku: productPayload.sku, naturaleza: productPayload.naturaleza,
        precio_base: 0,
        categoria_id: Number(catId), marca_id: productPayload.marca_id ? Number(productPayload.marca_id) : undefined,
        atributos: productPayload.atributos
      };
      let res;
      if (editingProduct) {
        res = await api.patch(`/productos/${editingProduct.id}`, payload);
      } else {
        res = await api.post('/productos', payload);
      }
      onProductCreated(res.data);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err.message;
      alert(Array.isArray(msg) ? msg.join('\n') : msg || 'Error al guardar');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={wizardStep === 'selector' ? '¿Qué tipo de producto vas a ingresar?' : `${editingProduct ? 'Editar' : 'Nuevo'}: ${selectedNaturaleza}`}
    >
      {wizardStep === 'selector' ? (
        <div className={styles.selectorGrid}>
          {TIPOS_PRODUCTO.map(tipo => (
            <button key={tipo.id} className={styles.selectorCard} onClick={() => startProductWizard(tipo.id)}>
              <div className={styles.selectorIcon}>{tipo.icon}</div>
              <div className={styles.selectorInfo}>
                <h3 className={styles.selectorTitle}>{tipo.id}</h3>
                <p className={styles.selectorDesc}>{tipo.desc}</p>
              </div>
              <ChevronRight size={20} color="#cbd5e1" />
            </button>
          ))}
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1 }}>
            {selectedNaturaleza === 'Textos Escolares' && <TextosEscolaresForm productPayload={productPayload} setProductPayload={setProductPayload} marcas={marcas} />}
            {selectedNaturaleza === 'Cuadernos' && <CuadernosForm productPayload={productPayload} setProductPayload={setProductPayload} marcas={marcas} />}
            {selectedNaturaleza !== 'Textos Escolares' && selectedNaturaleza !== 'Cuadernos' && (
              <DynamicProductForm productPayload={productPayload} setProductPayload={setProductPayload} marcas={marcas} categorias={categorias} selectedNaturaleza={selectedNaturaleza} />
            )}
          </div>
          <div className={styles.formActions} style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
            {!editingProduct && <button type="button" className={styles.btnSecondary} onClick={() => setWizardStep('selector')}>Volver a Tipos</button>}
            <div style={{ display: 'flex', gap: '1rem', marginLeft: editingProduct ? 'auto' : 0 }}>
              <button type="button" className={styles.btnCancel} onClick={onClose} disabled={submitting}>Cancelar</button>
              <button type="submit" className={styles.btnPrimary} disabled={submitting}>
                {submitting ? <Loader2 size={16} className={styles.spin} /> : null}
                {submitting ? 'Guardando...' : 'Guardar y Continuar a Presentaciones'}
              </button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

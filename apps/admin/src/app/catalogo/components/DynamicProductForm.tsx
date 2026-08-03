'use client';
import React from 'react';
import { LayoutTemplate } from 'lucide-react';
import styles from '../page.module.css';
import { Marca, Categoria } from '../types';

interface Props {
  productPayload: any;
  setProductPayload: (payload: any) => void;
  marcas: Marca[];
  categorias: Categoria[];
  selectedNaturaleza: string;
}

export default function DynamicProductForm({ productPayload, setProductPayload, marcas, categorias, selectedNaturaleza }: Props) {
  const cat = categorias.find(c => c.nombre.toLowerCase() === selectedNaturaleza.toLowerCase());
  
  let plantilla = cat?.plantilla_atributos;
  if (typeof plantilla === 'string') {
    try { plantilla = JSON.parse(plantilla); } catch (e) { plantilla = []; }
  }
  const attrs = Array.isArray(plantilla) ? plantilla : [];
  
  if (attrs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <LayoutTemplate size={48} style={{ margin: '0 auto 1rem', opacity: 0.2 }} />
        <p>Esta categoría no tiene atributos dinámicos configurados en la base de datos.</p>
      </div>
    );
  }
  
  const { atributos = {} } = productPayload;
  
  return (
    <div className={styles.wizardForm}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nombre del Producto *</label>
          <input required className={styles.formInput} placeholder={`Ej. ${selectedNaturaleza} ...`} value={productPayload.nombre || ''} onChange={e => setProductPayload({ ...productPayload, nombre: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>{selectedNaturaleza === 'Libros' ? 'Editorial (Marca)' : 'Marca'}</label>
          <select className={styles.formSelect} value={productPayload.marca_id || ''} onChange={e => setProductPayload({ ...productPayload, marca_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
      </div>

      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', marginTop: '1rem' }}>Atributos Específicos</h4>
      <div className={styles.formRow} style={{ flexWrap: 'wrap' }}>
        {attrs.map((attr: any) => (
          <div className={styles.formGroup} key={attr.name} style={{ flexBasis: '48%' }}>
            <label className={styles.formLabel}>{attr.label}</label>
            {attr.type === 'select' ? (
              <select className={styles.formSelect} value={atributos[attr.name] || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, [attr.name]: e.target.value } })}>
                <option value="">Seleccionar...</option>
                {attr.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : attr.type === 'checkbox' ? (
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={atributos[attr.name] || false} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, [attr.name]: e.target.checked } })} />
                <strong>{attr.label}</strong>
              </label>
            ) : (
              <input type={attr.type || 'text'} className={styles.formInput} value={atributos[attr.name] || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, [attr.name]: e.target.value } })} />
            )}
          </div>
        ))}
      </div>

      <div className={styles.formRow} style={{ marginTop: '1rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>SKU (Dejar vacío para auto)</label>
          <input className={styles.formInput} value={productPayload.sku || ''} onChange={e => setProductPayload({ ...productPayload, sku: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

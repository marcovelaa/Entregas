'use client';
import React from 'react';
import styles from '../page.module.css';

interface Props {
  productPayload: any;
  setProductPayload: (payload: any) => void;
  marcas: any[];
}

export default function TextosEscolaresForm({ productPayload, setProductPayload, marcas }: Props) {
  const { atributos = {} } = productPayload;
  return (
    <div className={styles.wizardForm}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nombre del Texto *</label>
          <input required className={styles.formInput} placeholder="Ej. Nacho Lee, Matemáticas 1" value={productPayload.nombre || ''} onChange={e => setProductPayload({ ...productPayload, nombre: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Editorial (Marca) *</label>
          <select required className={styles.formSelect} value={productPayload.marca_id || ''} onChange={e => setProductPayload({ ...productPayload, marca_id: e.target.value })}>
            <option value="">Seleccionar Editorial...</option>
            {marcas.map(m => (
              <option key={m.id} value={m.id}>{m.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Serie / Proyecto</label>
          <input className={styles.formInput} placeholder="Ej. Bicentenario" value={atributos.serie || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, serie: e.target.value } })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Materia</label>
          <input className={styles.formInput} placeholder="Ej. Matemáticas" value={atributos.materia || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, materia: e.target.value } })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Autor(es)</label>
          <input className={styles.formInput} placeholder="Ej. García Márquez" value={atributos.autor || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, autor: e.target.value } })} />
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nivel Escolar</label>
          <select className={styles.formSelect} value={atributos.nivel || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, nivel: e.target.value, subnivel: '' } })}>
            <option value="">Seleccionar Nivel (Opcional si es solo Plan Lector)</option>
            <option value="Inicial">Inicial</option>
            <option value="Primaria">Primaria</option>
            <option value="Secundaria">Secundaria</option>
          </select>
        </div>
        
        {atributos.nivel === 'Inicial' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Sub-Nivel Inicial</label>
            <select className={styles.formSelect} value={atributos.subnivel || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, subnivel: e.target.value } })}>
              <option value="">Seleccionar...</option>
              <option value="Pollito">Pollito</option>
              <option value="Nidito">Nidito</option>
              <option value="Prekinder">Prekinder</option>
              <option value="Kinder">Kinder</option>
            </select>
          </div>
        )}
        {(atributos.nivel === 'Primaria' || atributos.nivel === 'Secundaria') && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Grado</label>
            <select className={styles.formSelect} value={atributos.subnivel || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, subnivel: e.target.value } })}>
              <option value="">Seleccionar...</option>
              {['1ro', '2do', '3ro', '4to', '5to', '6to'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
          <label className={styles.formLabel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <input type="checkbox" style={{ width: '20px', height: '20px' }} checked={atributos.es_plan_lector || false} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, es_plan_lector: e.target.checked } })} />
            <strong>Pertenece a Plan Lector</strong>
          </label>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ISBN</label>
          <input className={styles.formInput} placeholder="ISBN del libro" value={atributos.isbn || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, isbn: e.target.value } })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>SKU (Dejar vacío para auto)</label>
          <input className={styles.formInput} placeholder="Ej. MAT-1-BIC" value={productPayload.sku || ''} onChange={e => setProductPayload({ ...productPayload, sku: e.target.value })} />
        </div>
      </div>
    </div>
  );
}

'use client';
import React from 'react';
import styles from '../page.module.css';
import { Marca } from '../types';

interface Props {
  productPayload: any;
  setProductPayload: (payload: any) => void;
  marcas: Marca[];
}

export default function CuadernosForm({ productPayload, setProductPayload, marcas }: Props) {
  const { atributos = {} } = productPayload;
  return (
    <div className={styles.wizardForm}>
      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Nombre del Cuaderno *</label>
          <input required className={styles.formInput} placeholder="Ej. Cuaderno Espiral 100 Hojas" value={productPayload.nombre || ''} onChange={e => setProductPayload({ ...productPayload, nombre: e.target.value })} />
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Marca</label>
          <select className={styles.formSelect} value={productPayload.marca_id || ''} onChange={e => setProductPayload({ ...productPayload, marca_id: e.target.value })}>
            <option value="">Seleccionar...</option>
            {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tamaño</label>
          <select className={styles.formSelect} value={atributos.tamano || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, tamano: e.target.value } })}>
            <option value="">Seleccionar...</option>
            <option value="Medio Oficio">Medio Oficio</option>
            <option value="Carta">Carta</option>
            <option value="Oficio">Oficio</option>
            <option value="A4">A4</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tipo de Tapa</label>
          <select className={styles.formSelect} value={atributos.tipo_tapa || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, tipo_tapa: e.target.value } })}>
            <option value="">Seleccionar...</option>
            <option value="Dura">Dura</option>
            <option value="Blanda">Blanda</option>
            <option value="Plástica">Plástica</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Cantidad de Hojas</label>
          <select className={styles.formSelect} value={atributos.cantidad_hojas || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, cantidad_hojas: e.target.value } })}>
            <option value="">Seleccionar...</option>
            <option value="50">50 Hojas</option>
            <option value="100">100 Hojas</option>
            <option value="200">200 Hojas</option>
            <option value="400">400 Hojas</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Tipo de Hojas</label>
          <select className={styles.formSelect} value={atributos.tipo_hojas || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, tipo_hojas: e.target.value } })}>
            <option value="">Seleccionar...</option>
            <option value="Cuadriculada">Cuadriculada</option>
            <option value="Rayada">Rayada</option>
            <option value="Blanca">Blanca</option>
            <option value="Doble Línea">Doble Línea</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>Encuadernación / Anillado</label>
          <select className={styles.formSelect} value={atributos.tipo_anillado || ''} onChange={e => setProductPayload({ ...productPayload, atributos: { ...atributos, tipo_anillado: e.target.value } })}>
            <option value="">Seleccionar...</option>
            <option value="Anillado">Anillado</option>
            <option value="Espiral">Espiral</option>
            <option value="Doble Ring">Doble Ring</option>
            <option value="Cosido">Cosido</option>
            <option value="Engrapado">Engrapado</option>
          </select>
        </div>
      </div>
      
      <div className={styles.formRow} style={{ marginTop: '0.5rem' }}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>SKU (Dejar vacío para auto)</label>
          <input className={styles.formInput} value={productPayload.sku || ''} onChange={e => setProductPayload({ ...productPayload, sku: e.target.value })} />
        </div>
        <div className={styles.formGroup}></div>
      </div>
    </div>
  );
}

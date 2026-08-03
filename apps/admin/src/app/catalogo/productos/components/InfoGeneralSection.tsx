import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { api } from '../../../../lib/axios';
import { Modal } from '../../../../components/molecules/Modal/Modal';
import { slugify, emptyMarca } from '../../utils';
import styles from '../productos.module.css';

interface Props {
  productPayload: any;
  setProductPayload: (p: any) => void;
  marcas: any[];
  categorias: any[];
}

export default function InfoGeneralSection({ productPayload, setProductPayload, marcas, categorias }: Props) {
  const [localMarcas, setLocalMarcas] = useState<any[]>([]);
  const [isAddingMarca, setIsAddingMarca] = useState(false);
  const [marcaForm, setMarcaForm] = useState({ ...emptyMarca });
  const [savingMarca, setSavingMarca] = useState(false);

  useEffect(() => {
    setLocalMarcas(marcas);
  }, [marcas]);

  const handleCategoryChange = (catId: string) => {
    const cat = categorias.find((c: any) => c.id.toString() === catId);
    setProductPayload({
      ...productPayload,
      categoria_id: catId,
      naturaleza: cat ? cat.nombre : productPayload.naturaleza
    });
  };

  const handleAddMarca = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMarca(true);
    try {
      const payload = { ...marcaForm, slug: marcaForm.slug || slugify(marcaForm.nombre) };
      const res = await api.post('/marcas', payload);
      const newMarca = res.data.data || res.data;
      setLocalMarcas(prev => [...prev, newMarca]);
      setProductPayload({ ...productPayload, marca_id: newMarca.id.toString() });
      setIsAddingMarca(false);
      setMarcaForm({ ...emptyMarca });
    } catch (err: any) {
      alert('Error al crear la marca');
    } finally {
      setSavingMarca(false);
    }
  };

  return (
    <div className={styles.formGrid}>
      <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
        <label className={styles.formLabel}>Categoría / Tipo de Producto *</label>
        <select
          required
          className={styles.formSelect}
          value={productPayload.categoria_id || ''}
          onChange={e => handleCategoryChange(e.target.value)}
        >
          <option value="">Seleccionar Categoría (Textos Escolares, Material Escolar, Cuadernos, Papel...)</option>
          {categorias.map((c: any) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Nombre del Producto *</label>
        <input
          required
          className={styles.formInput}
          placeholder="Ej. Bolígrafo Faber Castell Azul o Cuaderno Top 100H"
          value={productPayload.nombre || ''}
          onChange={e => setProductPayload({ ...productPayload, nombre: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>SKU</label>
        <input
          className={styles.formInput}
          placeholder="Auto-generado si se deja vacío"
          value={productPayload.sku || ''}
          onChange={e => setProductPayload({ ...productPayload, sku: e.target.value })}
        />
        <span className={styles.formHint}>Identificador único del producto</span>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>Marca / Fabricante</span>
          <button 
            type="button"
            onClick={() => setIsAddingMarca(true)}
            style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontWeight: 600 }}
          >
            <Plus size={14} /> Nueva
          </button>
        </label>

        <select
          className={styles.formSelect}
          value={productPayload.marca_id || ''}
          onChange={e => setProductPayload({ ...productPayload, marca_id: e.target.value })}
        >
          <option value="">Seleccionar...</option>
          {localMarcas.map((m: any) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Precio Base (Bs.) *</label>
        <input
          required
          type="number"
          step="0.01"
          min="0"
          className={styles.formInput}
          placeholder="0.00"
          value={productPayload.precio_base || ''}
          onChange={e => setProductPayload({ ...productPayload, precio_base: e.target.value })}
        />
      </div>
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Precio Promocional (Bs.)</label>
        <input
          type="number"
          step="0.01"
          min="0"
          className={styles.formInput}
          placeholder="Opcional"
          value={productPayload.precio_promocional || ''}
          onChange={e => setProductPayload({ ...productPayload, precio_promocional: e.target.value })}
        />
        <span className={styles.formHint}>Dejar vacío si no hay promoción</span>
      </div>
      
      <Modal isOpen={isAddingMarca} onClose={() => setIsAddingMarca(false)} title="Nueva Marca">
        <form onSubmit={handleAddMarca} className={styles.slideForm}>
          <div className={styles.formSection}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Nombre *</label>
              <input required autoFocus className={styles.formInput} value={marcaForm.nombre} onChange={e => setMarcaForm(f => ({ ...f, nombre: e.target.value, slug: slugify(e.target.value) }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Slug (URL friendly)</label>
              <input className={styles.formInput} value={marcaForm.slug} onChange={e => setMarcaForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descripción</label>
              <textarea className={styles.formTextarea} value={marcaForm.descripcion} onChange={e => setMarcaForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
            </div>
          </div>
          <div className={styles.formFooter} style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button type="button" className={styles.btnSecondary} onClick={() => setIsAddingMarca(false)} disabled={savingMarca}>Cancelar</button>
            <button type="submit" className={styles.btnPrimary} disabled={savingMarca}>{savingMarca ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

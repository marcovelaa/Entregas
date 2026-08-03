'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Upload, Star, Trash2, Loader2, ImagePlus } from 'lucide-react';
import styles from '../productos.module.css';
import { api } from '../../../../lib/axios';

interface Props {
  productoId: string | null;
  imagenes: any[];
  onRefresh: () => void;
}

export default function MediaSection({ productoId, imagenes, onRefresh }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    if (!productoId) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const formData = new FormData();
        formData.append('image', file);
        const res = await fetch(`http://localhost:3001/api/producto-imagenes/upload/${productoId}`, {
          method: 'POST',
          body: formData,
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || 'Error al subir imagen');
        }
      }
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
    }
  }, [productoId, onRefresh]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDelete = async (imgId: string) => {
    try {
      await api.delete(`/producto-imagenes/${imgId}`);
      onRefresh();
    } catch {
      alert('Error al eliminar imagen');
    }
  };

  const handleSetPrincipal = async (imgId: string) => {
    try {
      await api.patch(`/producto-imagenes/${imgId}`, { es_principal: true });
      onRefresh();
    } catch {
      alert('Error al marcar como principal');
    }
  };

  if (!productoId) {
    return (
      <div className={styles.infoMessage}>
        <ImagePlus size={20} />
        <span>Guardá el producto primero para subir imágenes.</span>
      </div>
    );
  }

  return (
    <div>
      {/* Drop zone */}
      <div
        className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''}`}
        onDragOver={e => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 size={32} className={styles.spin} style={{ color: '#64748b' }} />
        ) : (
          <>
            <Upload size={32} className={styles.dropZoneIcon} />
            <p className={styles.dropZoneText}>Arrastrá imágenes aquí o hacé click para seleccionar</p>
            <p className={styles.dropZoneHint}>JPG, PNG, WebP o GIF · Máximo 5MB por imagen</p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        style={{ display: 'none' }}
        onChange={e => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Image grid */}
      {imagenes.length > 0 && (
        <div className={styles.imageGrid}>
          {imagenes.map((img: any) => (
            <div
              key={img.id}
              className={`${styles.imageThumb} ${img.es_principal ? styles.imageThumbPrincipal : ''}`}
            >
              <img
                src={`http://localhost:3001${img.url}`}
                alt=""
                className={styles.imageThumbImg}
              />
              {img.es_principal && <Star size={16} className={styles.imageThumbStar} fill="#f59e0b" />}
              <div className={styles.imageThumbOverlay}>
                {!img.es_principal && (
                  <button className={styles.imageThumbBtn} onClick={() => handleSetPrincipal(img.id)} title="Marcar como principal">
                    <Star size={16} />
                  </button>
                )}
                <button className={styles.imageThumbBtn} onClick={() => setDeleteConfirmId(img.id)} title="Eliminar">
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(6px)', padding: '1rem'
        }}>
          <div style={{
            background: '#fff', padding: '2rem', borderRadius: '20px', width: '100%', maxWidth: '360px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
          }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%', background: '#fee2e2', color: '#dc2626',
              display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem'
            }}>
              <Trash2 size={28} />
            </div>
            
            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>
              Eliminar foto
            </h3>
            <p style={{ margin: '0 0 1.75rem 0', color: '#64748b', fontSize: '0.95rem', lineHeight: 1.5 }}>
              ¿Estás seguro? Esta imagen se borrará permanentemente del catálogo y no podrás recuperarla.
            </p>
            
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
              <button 
                type="button"
                className={styles.btnSecondary} 
                onClick={() => setDeleteConfirmId(null)}
                style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', fontSize: '0.95rem' }}
              >
                Cancelar
              </button>
              <button 
                type="button"
                onClick={() => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  handleDelete(id);
                }}
                style={{ 
                  flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', 
                  background: '#dc2626', color: '#fff', border: 'none', padding: '0.75rem', 
                  borderRadius: '8px', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#b91c1c'}
                onMouseLeave={e => e.currentTarget.style.background = '#dc2626'}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '../../../../lib/axios';
import ProductEditor from '../components/ProductEditor';
import styles from '../productos.module.css';

export default function EditarProductoPage() {
  const params = useParams();
  const id = params?.id as string;

  const [producto, setProducto] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.get(`/productos/${id}`),
      api.get('/categorias'),
      api.get('/marcas')
    ])
      .then(([pRes, cRes, mRes]) => {
        setProducto(pRes.data.data || pRes.data);
        setCategorias(Array.isArray(cRes.data) ? cRes.data : cRes.data.data || []);
        setMarcas(Array.isArray(mRes.data) ? mRes.data : mRes.data.data || []);
      })
      .catch((err: any) => {
        setError(err?.response?.data?.message || 'Error al cargar producto');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Loader2 className={styles.spin} size={32} color="#64748b" />
        <p className={styles.loadingText}>Cargando producto...</p>
      </div>
    );
  }

  if (error || !producto) {
    return (
      <div className={styles.loadingCenter}>
        <p style={{ color: '#ef4444', fontWeight: 600 }}>⚠️ {error || 'Producto no encontrado'}</p>
        <a href="/catalogo" className={styles.btnSecondary} style={{ marginTop: '1rem' }}>
          ← Volver al catálogo
        </a>
      </div>
    );
  }

  return (
    <ProductEditor
      mode="edit"
      tipo={producto.naturaleza || producto.categoria?.nombre || 'Textos Escolares'}
      categorias={categorias}
      marcas={marcas}
      initialProduct={producto}
    />
  );
}

'use client';
import React, { useState, useEffect, Suspense } from 'react';
import axios from 'axios';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { api } from '../../../../lib/axios';
import ProductEditor from '../components/ProductEditor';
import styles from '../productos.module.css';

function NuevoProductoContent() {
  const searchParams = useSearchParams();
  const tipo = searchParams.get('tipo') || '';
  const [categorias, setCategorias] = useState<any[]>([]);
  const [marcas, setMarcas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    Promise.all([
      api.get('/categorias', { signal: controller.signal }),
      api.get('/marcas', { signal: controller.signal }),
    ])
      .then(([cRes, mRes]) => {
        setCategorias(Array.isArray(cRes.data) ? cRes.data : cRes.data.data || []);
        setMarcas(Array.isArray(mRes.data) ? mRes.data : mRes.data.data || []);
      })
      .catch((err: any) => {
        if (axios.isCancel(err) || err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        setError(err?.response?.data?.message || 'Error al cargar categorías y marcas.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingCenter}>
        <Loader2 className={styles.spin} size={32} color="#64748b" />
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)} className={styles.errorClose}>✕</button>
        </div>
      )}
      <ProductEditor
        mode="create"
        tipo={tipo}
        categorias={categorias}
        marcas={marcas}
      />
    </>
  );
}

export default function NuevoProductoPage() {
  return (
    <Suspense fallback={
      <div className={styles.loadingCenter}>
        <Loader2 className={styles.spin} size={32} color="#64748b" />
        <p className={styles.loadingText}>Cargando...</p>
      </div>
    }>
      <NuevoProductoContent />
    </Suspense>
  );
}

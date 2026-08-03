'use client';
import React, { useState, useEffect, Suspense } from 'react';
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

  useEffect(() => {
    Promise.all([api.get('/categorias'), api.get('/marcas')])
      .then(([cRes, mRes]) => {
        setCategorias(Array.isArray(cRes.data) ? cRes.data : cRes.data.data || []);
        setMarcas(Array.isArray(mRes.data) ? mRes.data : mRes.data.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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
    <ProductEditor
      mode="create"
      tipo={tipo}
      categorias={categorias}
      marcas={marcas}
    />
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

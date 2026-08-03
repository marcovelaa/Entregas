'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { api } from '@/lib/axios';
import { DiscountForm } from '@/components/organisms/DiscountForm';

export default function EditarDescuentoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [promotion, setPromotion] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [empaques, setEmpaques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [resPromo, resCat, resProd] = await Promise.all([
          api.get(`/descuentos/${id}`),
          api.get('/categorias'),
          api.get('/productos?limit=100'),
        ]);

        if (resPromo.data.success && resPromo.data.data) {
          setPromotion(resPromo.data.data);
        } else {
          setErrorMsg('No se encontró la promoción solicitada.');
        }

        const cats = (resCat.data.data || []).map((c: any) => ({
          id: c.id.toString(),
          nombre: c.nombre,
          code: `CAT-${c.id}`,
        }));

        const prodsRaw = resProd.data.data || [];
        const prods = prodsRaw.map((p: any) => ({
          id: p.id.toString(),
          nombre: p.nombre,
          code: p.sku || `PROD-${p.id}`,
          subtitle: `Bs. ${parseFloat(p.precio_base || 0).toFixed(2)}`,
        }));

        const vars: any[] = [];
        const emps: any[] = [];

        prodsRaw.forEach((p: any) => {
          if (p.variantes && p.variantes.length > 0) {
            p.variantes.forEach((v: any) => {
              vars.push({
                id: v.id.toString(),
                nombre: v.nombre || 'Variante General',
                code: v.sku_base || `VAR-${v.id}`,
                subtitle: `Producto Padre: ${p.nombre} • Bs. ${(parseFloat(p.precio_base || 0) + parseFloat(v.precio_adicional || 0)).toFixed(2)}`,
              });

              if (v.empaques && v.empaques.length > 0) {
                v.empaques.forEach((e: any) => {
                  emps.push({
                    id: e.id.toString(),
                    nombre: e.nombre,
                    code: e.sku || `EMP-${e.id}`,
                    subtitle: `${p.nombre} > ${v.nombre || 'Variante'} • Bs. ${parseFloat(e.precio || 0).toFixed(2)} (${e.multiplicador_unidades || 1} un/caja)`,
                  });
                });
              }
            });
          }
        });

        setCategories(cats);
        setProducts(prods);
        setVariants(vars);
        setEmpaques(emps);
      } catch (err) {
        console.error('Error al cargar promoción:', err);
        setErrorMsg('Error al cargar los datos de la promoción.');
      } finally {
        setLoading(false);
      }
    }

    if (id) loadData();
  }, [id]);

  const handleUpdate = async (formData: any) => {
    await api.put(`/descuentos/${id}`, formData);
    router.push('/descuentos');
  };

  return (
    <main style={{ padding: '1.5rem', maxWidth: '1400px', margin: '0 auto' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            type="button"
            onClick={() => router.push('/descuentos')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
              Editar Promoción #{id}
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#64748b', margin: '0.2rem 0 0 0' }}>
              Modifica las condiciones, vigencia o alcance del beneficio
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>Cargando promoción...</p>
      ) : errorMsg ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>{errorMsg}</div>
      ) : (
        <DiscountForm
          initialData={promotion}
          isEditing={true}
          categories={categories}
          products={products}
          variants={variants}
          empaques={empaques}
          onSubmit={handleUpdate}
          onCancel={() => router.push('/descuentos')}
        />
      )}
    </main>
  );
}

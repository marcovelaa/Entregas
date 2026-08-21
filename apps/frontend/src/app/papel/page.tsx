'use client';
import React from 'react';
import styles from './papel.module.css';
import { MaterialCard } from '@/components/molecules/MaterialCard/MaterialCard';

export default function PapelPage() {
  const [products, setProducts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos?page=1&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const filtered = data.data.filter((p: any) => p.categoria?.slug === 'papel');
          setProducts(filtered);
        }
      })
      .catch(err => console.error('Error fetching products', err));
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <div className={styles.layout}>
          {/* SIDEBAR DE FILTROS */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3>Categorías</h3>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-resmas" />
                <label htmlFor="cat-resmas">Resmas de Papel</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-hojas" />
                <label htmlFor="cat-hojas">Hojas Sueltas</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-cartulinas" />
                <label htmlFor="cat-cartulinas">Cartulinas</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-especiales" />
                <label htmlFor="cat-especiales">Papeles Especiales</label>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>Marcas</h3>
              <div className={styles.filterOption}>
                <input type="checkbox" id="brand-chamex" />
                <label htmlFor="brand-chamex">Chamex</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="brand-report" />
                <label htmlFor="brand-report">Report</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="brand-top" />
                <label htmlFor="brand-top">Top</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="brand-lider" />
                <label htmlFor="brand-lider">Líder</label>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>Formato</h3>
              <div className={styles.filterOption}>
                <input type="checkbox" id="format-carta" />
                <label htmlFor="format-carta">Carta</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="format-oficio" />
                <label htmlFor="format-oficio">Oficio</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="format-a4" />
                <label htmlFor="format-a4">A4</label>
              </div>
            </div>
          </aside>

          {/* CATÁLOGO DE PRODUCTOS */}
          <div className={styles.content}>
            <div className={styles.grid}>
              {products.map(product => {
                const imageUrl = product.imagenes && product.imagenes.length > 0 
                  ? (product.imagenes[0].url.startsWith('http') ? product.imagenes[0].url : `http://localhost:3001${product.imagenes[0].url}`)
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';
                const numericPrice = Number(product.precio_base) || 0;
                return (
                  <MaterialCard
                    key={product.id}
                    id={product.id.toString()}
                    title={product.nombre}
                    category={product.categoria?.nombre || 'General'}
                    pricing={{ unidad: numericPrice }}
                    imageUrl={imageUrl}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

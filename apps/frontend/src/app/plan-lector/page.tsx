'use client';
import React, { useState } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar';
import { ApiProduct } from '@/types/api';
import { getProducts } from '@/services/productService';
import styles from './planLector.module.css';

const levels = [
  { id: 'inicial', name: 'Inicial', colorClass: '', href: null },
  { id: 'primaria', name: 'Primaria', colorClass: '', href: null },
  { id: 'secundaria', name: 'Secundaria', colorClass: '', href: null },
  { id: 'otros', name: 'Otros', colorClass: '', href: null }
];

const catalogData: Record<string, { id: string; name: string; subjects: { id: string; name: string }[] }[]> = {
  inicial: [
    { id: 'ini-pollito', name: 'Pollito (2 años)', subjects: [] },
    { id: 'ini-nidito', name: 'Nidito (3 años)', subjects: [] },
    { id: 'ini-prekinder', name: 'Prekínder', subjects: [] },
    { id: 'ini-kinder', name: 'Kínder', subjects: [] },
  ],
  primaria: [
    { id: 'pri-1', name: '1ro', subjects: [] },
    { id: 'pri-2', name: '2do', subjects: [] },
    { id: 'pri-3', name: '3ro', subjects: [] },
    { id: 'pri-4', name: '4to', subjects: [] },
    { id: 'pri-5', name: '5to', subjects: [] },
    { id: 'pri-6', name: '6to', subjects: [] },
  ],
  secundaria: [
    { id: 'sec-1', name: '1ro', subjects: [] },
    { id: 'sec-2', name: '2do', subjects: [] },
    { id: 'sec-3', name: '3ro', subjects: [] },
    { id: 'sec-4', name: '4to', subjects: [] },
    { id: 'sec-5', name: '5to', subjects: [] },
    { id: 'sec-6', name: '6to', subjects: [] },
  ],
  otros: [
    { id: 'otros-all', name: 'Todas las obras', subjects: [] }
  ]
};

export default function PlanLectorPage() {
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [activeGrade, setActiveGrade] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    getProducts({ page: 1, limit: 50 })
      .then(data => {
        if (data && data.data) {
          const filtered = data.data.filter(prod => {
            const cat = prod.categoria;
            const attrs = prod.atributos;
            return cat?.slug === 'plan-lector' || (cat?.slug === 'textos-escolares' && (!attrs || !attrs.nivel));
          });
          setProducts(filtered);
        }
      })
      .catch(err => console.error('Error fetching plan lector products', err));
  }, []);

  const filteredBooks = products;

  const getActiveGradeName = () => {
    if (!activeGrade) return 'Todos los Grados';
    const levelFound = Object.keys(catalogData).find(lvl => 
      catalogData[lvl].some(g => g.id === activeGrade)
    );
    if (!levelFound) return 'Todos los Grados';
    const gradeFound = catalogData[levelFound].find(g => g.id === activeGrade);
    const levelName = levels.find(l => l.id === levelFound)?.name;
    return `${levelName} - ${gradeFound?.name}`;
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.layoutContainer}>
        <CatalogSidebar 
          levels={levels}
          catalogData={catalogData}
          activeLevel={activeLevel}
          setActiveLevel={setActiveLevel}
          activeGrade={activeGrade}
          setActiveGrade={setActiveGrade}
          setActiveSubject={setActiveSubject}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          styles={styles}
        />

        <main className={styles.mainContent}>
          <div className={styles.catalogHeader}>
            <div className={styles.headerTitleRow}>
              <div>
                <h2 className={styles.catalogTitle}>{getActiveGradeName()}</h2>
                <p className={styles.activeSubjectSubtitle}>
                  {activeGrade 
                    ? `Mostrando todo el material`
                    : 'Explora nuestro plan lector organizado por nivel y grado.'
                  }
                </p>
              </div>
              <button className={styles.mobileFilterBtn} onClick={() => setIsMobileMenuOpen(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="4" y1="21" x2="4" y2="14"></line>
                  <line x1="4" y1="10" x2="4" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12" y2="3"></line>
                  <line x1="20" y1="21" x2="20" y2="16"></line>
                  <line x1="20" y1="12" x2="20" y2="3"></line>
                  <line x1="1" y1="14" x2="7" y2="14"></line>
                  <line x1="9" y1="8" x2="15" y2="8"></line>
                  <line x1="17" y1="16" x2="23" y2="16"></line>
                </svg>
                Filtros
              </button>
            </div>
          </div>

          <div className={styles.resultsBar}>
            <span className={styles.resultsCount}>
              Mostrando {filteredBooks.length} resultados
            </span>
          </div>

          {filteredBooks.length > 0 ? (
            <div className={styles.booksGrid}>
              {filteredBooks.map((book: unknown, idx) => {
                const b = book as Record<string, unknown>;
                const id = String(b.id || '');
                const nombre = String(b.nombre || '');
                const precio = Number(b.precio_promocional || b.precio_base || 0);
                const precioOriginal = b.precio_promocional ? Number(b.precio_base) : undefined;
                const badge = b.precio_promocional ? 'Oferta' : undefined;
                const tipo_producto = b.tipo_producto as string | undefined;
                const categoria = b.categoria as { nombre?: string } | undefined;
                const imagenes = b.imagenes as { url: string }[] | undefined;

                const imageUrl = imagenes && imagenes.length > 0 
                  ? (imagenes[0].url.startsWith('http') 
                      ? imagenes[0].url 
                      : `http://localhost:3001${imagenes[0].url.startsWith('/') ? '' : '/'}${imagenes[0].url}`) 
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';

                return (
                  <div key={id}>
                    <ProductCard
                      id={id}
                      title={nombre}
                      category={categoria?.nombre || 'General'}
                      categoryColor="var(--color-blue)"
                      price={precio}
                      precioOriginal={precioOriginal}
                      badge={badge}
                      tipo_producto={tipo_producto}
                      imageUrl={imageUrl}
                      isBook={!nombre.toLowerCase().match(/(bol[ií]grafo|cuaderno|l[aá]piz|borrador|marcador|mochila)/)}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <h3>No se encontraron libros</h3>
              <p>Prueba con otros términos de búsqueda o selecciona otro grado escolar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

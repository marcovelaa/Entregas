'use client';
import React, { useState } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar';
import styles from './planLector.module.css';

const levels = [
  { id: 'inicial', name: 'Inicial', colorClass: '', href: null },
  { id: 'primaria', name: 'Primaria', colorClass: '', href: null },
  { id: 'secundaria', name: 'Secundaria', colorClass: '', href: null },
  { id: 'otros', name: 'Otros', colorClass: '', href: null }
];

const catalogData: Record<string, { id: string; name: string; subjects: { id: string; name: string }[] }[]> = {
  inicial: [
    { id: 'ini-pollito', name: 'Pollito', subjects: [] },
    { id: 'ini-nidito', name: 'Nidito', subjects: [] },
    { id: 'ini-prekinder', name: 'Prekínder', subjects: [] },
    { id: 'ini-kinder', name: 'Kínder', subjects: [] },
  ],
  primaria: [
    { id: 'pri-1', name: 'Primero', subjects: [] },
    { id: 'pri-2', name: 'Segundo', subjects: [] },
    { id: 'pri-3', name: 'Tercero', subjects: [] },
    { id: 'pri-4', name: 'Cuarto', subjects: [] },
    { id: 'pri-5', name: 'Quinto', subjects: [] },
    { id: 'pri-6', name: 'Sexto', subjects: [] },
  ],
  secundaria: [
    { id: 'sec-1', name: 'Primero', subjects: [] },
    { id: 'sec-2', name: 'Segundo', subjects: [] },
    { id: 'sec-3', name: 'Tercero', subjects: [] },
    { id: 'sec-4', name: 'Cuarto', subjects: [] },
    { id: 'sec-5', name: 'Quinto', subjects: [] },
    { id: 'sec-6', name: 'Sexto', subjects: [] },
  ],
  otros: [
    { id: 'otros-all', name: 'Todas las obras', subjects: [] }
  ]
};

export default function PlanLectorPage() {
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [activeGrade, setActiveGrade] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos?page=1&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const filtered = data.data.filter((p: any) => 
            p.categoria?.slug === 'textos-escolares' && 
            (!p.atributos || !p.atributos.nivel)
          );
          setProducts(filtered);
        }
      })
      .catch(err => console.error('Error fetching products', err));
  }, []);

  const filteredBooks = products;

  const getActiveGradeName = () => {
    if (!activeGrade) return 'Todas las lecturas';
    const levelFound = Object.keys(catalogData).find(lvl => 
      catalogData[lvl].some(g => g.id === activeGrade)
    );
    if (!levelFound) return 'Todas las lecturas';
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

        <main>
          <div className={styles.catalogHeader}>
            <div className={styles.headerTitleRow}>
              <div>
                <h2 className={styles.catalogTitle}>{getActiveGradeName()}</h2>
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

          {filteredBooks.length > 0 ? (
            <div className={styles.booksGrid}>
              {filteredBooks.map(book => {
                const imageUrl = book.imagenes && book.imagenes.length > 0 
                  ? `http://localhost:3001${book.imagenes[0].url}`
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';

                return (
                  <ProductCard
                    key={book.id}
                    id={book.id.toString()}
                    title={book.nombre}
                    category={book.categoria?.nombre || 'General'}
                    categoryColor="var(--color-blue)"
                    price={book.precio_base}
                    imageUrl={imageUrl}
                    isBook={true}
                  />
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.emptyIcon}>
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
              </svg>
              <h3>No se encontraron libros</h3>
              <p>Prueba con otros términos de búsqueda o selecciona otro grado escolar.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

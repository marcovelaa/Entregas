'use client';

import React, { useState, useRef } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar';
import { ApiProduct } from '@/types/api';
import { getProducts } from '@/services/productService';
import styles from './textosescolares.module.css';

// Levels con colores para el header
const levels = [
  { id: 'inicial', name: 'Inicial', colorClass: styles.tabInicial, href: null },
  { id: 'primaria', name: 'Primaria', colorClass: styles.tabPrimaria, href: null },
  { id: 'secundaria', name: 'Secundaria', colorClass: styles.tabSecundaria, href: null }
];

// Catalog Data: Nivel -> Grado -> Materias
const catalogData: Record<string, { id: string; name: string; subjects: { id: string; name: string }[] }[]> = {
  inicial: [
    { 
      id: 'ini-2', name: 'Pollito (2 años)', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-3', name: 'Nidito (3 años)', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-4', name: 'Pre-Kínder', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-5', name: 'Kínder', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ],
  primaria: [
    {
      id: 'pri-1', name: '1ro',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-2', name: '2do',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-3', name: '3ro',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-4', name: '4to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-5', name: '5to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-6', name: '6to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ],
  secundaria: [
    {
      id: 'sec-1', name: '1ro',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-2', name: '2do',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-3', name: '3ro',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-4', name: '4to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-5', name: '5to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-6', name: '6to',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ]
};



export default function TextosEscolaresPage() {
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [activeGrade, setActiveGrade] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Lógica para drag-to-scroll en PC
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsDragging(false);
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  React.useEffect(() => {
    const params: Record<string, any> = {
      page: 1,
      limit: 50,
      categoria_slug: 'textos-escolares'
    };
    
    if (activeLevel) {
      params.atributo_nivel = activeLevel.charAt(0).toUpperCase() + activeLevel.slice(1);
    }
    
    // if (activeGrade) params.atributo_grado = activeGrade;
    // if (activeSubject && activeSubject !== 'all') params.atributo_materia = activeSubject;

    getProducts(params)
      .then(data => {
        if (data && data.data) {
          setProducts(data.data);
        }
      })
      .catch(err => console.error('Error fetching products', err));
  }, [activeLevel, activeSubject]);

  const currentLevelName = levels.find(l => l.id === activeLevel)?.name || 'Todos los Niveles';
  const currentGradeObj = activeLevel && catalogData[activeLevel] ? catalogData[activeLevel].find(g => g.id === activeGrade) : null;
  const currentGradeName = currentGradeObj?.name || 'Todos los Grados';
  const currentSubjectName = currentGradeObj?.subjects.find(s => s.id === activeSubject)?.name || 'Todas las materias';

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

        {/* Content Area */}
        <main className={styles.mainContent}>
          <div className={styles.catalogHeader}>
            <div className={styles.headerTitleRow}>
              <div>
                <h2 className={styles.catalogTitle}>
                  {activeGrade ? `${currentLevelName} - ${currentGradeName}` : 'Todos los Grados'}
                </h2>
                <p className={styles.activeSubjectSubtitle}>
                  {activeGrade 
                    ? `Mostrando ${activeSubject === 'all' ? 'todo el material' : currentSubjectName.toLowerCase()}`
                    : 'Explora nuestros textos escolares organizados por nivel y grado.'
                  }
                </p>
              </div>
              {/* Mobile Filter Button */}
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
              Mostrando {products.length} resultados
            </span>
          </div>

          {/* Píldoras de Materias Dinámicas (solo si hay grado activo) */}
          {activeGrade && currentGradeObj && currentGradeObj.subjects && currentGradeObj.subjects.length > 0 && (
            <div 
              className={styles.subjectPills}
              ref={scrollContainerRef}
              onMouseDown={handleMouseDown}
              onMouseLeave={handleMouseLeave}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
              {currentGradeObj.subjects.map(sub => (
                <button
                  key={sub.id}
                  className={`${styles.pillBtn} ${activeSubject === sub.id ? styles.pillActive : ''}`}
                  onClick={() => setActiveSubject(sub.id)}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          )}

          {products.length > 0 ? (
            <div className={styles.booksGrid} key={`${activeLevel}-${activeGrade}-${activeSubject}`}>
              {products.map((p: unknown, idx: number) => {
                const product = p as Record<string, unknown>;
                const id = String(product.id || '');
                const nombre = String(product.nombre || '');
                const precio = Number(product.precio_promocional || product.precio_base || 0);
                const precioOriginal = product.precio_promocional ? Number(product.precio_base) : undefined;
                const badge = product.precio_promocional ? 'Oferta' : undefined;
                const tipo_producto = product.tipo_producto as string | undefined;
                const categoria = product.categoria as { nombre?: string } | undefined;
                const imagenes = product.imagenes as { url: string }[] | undefined;
                
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
                )
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

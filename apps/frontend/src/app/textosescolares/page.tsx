'use client';

import React, { useState, useRef } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import { CatalogSidebar } from '@/components/organisms/CatalogSidebar/CatalogSidebar';
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
      id: 'ini-2', name: 'Pollito 2 Años', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-3', name: 'Nidito 3 Años', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-4', name: 'Pre-Kínder 4 Años', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    { 
      id: 'ini-5', name: 'Kínder 5 Años', 
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'com', name: 'Comunicación' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ],
  primaria: [
    {
      id: 'pri-1', name: 'Primero de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-2', name: 'Segundo de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-3', name: 'Tercero de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-4', name: 'Cuarto de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-5', name: 'Quinto de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'pri-6', name: 'Sexto de Primaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas' }, { id: 'len', name: 'Lenguaje' }, { id: 'cie', name: 'Ciencias Naturales' }, { id: 'soc', name: 'Ciencias Sociales' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ],
  secundaria: [
    {
      id: 'sec-1', name: 'Primero de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-2', name: 'Segundo de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-3', name: 'Tercero de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-4', name: 'Cuarto de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-5', name: 'Quinto de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    },
    {
      id: 'sec-6', name: 'Sexto de Secundaria',
      subjects: [{ id: 'all', name: 'Todas las materias' }, { id: 'mat', name: 'Matemáticas (Álgebra/Geometría)' }, { id: 'lit', name: 'Literatura' }, { id: 'bio', name: 'Biología' }, { id: 'ing', name: 'Inglés' }, { id: 'fis', name: 'Física' }, { id: 'qui', name: 'Química' }, { id: 'planlector', name: 'Plan Lector' }]
    }
  ]
};

const mockBooks = [
  { id: '1', title: 'Matemáticas Activas', author: 'Ediciones Norma', price: 120, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-blue)', subject: 'mat', level: 'primaria' },
  { id: '2', title: 'Lenguaje y Comunicación', author: 'Santillana', price: 135, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-red)', subject: 'len', level: 'primaria' },
  { id: '3', title: 'Biología Interactiva', author: 'Pearson', price: 150, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-green)', subject: 'bio', level: 'secundaria' },
  { id: '4', title: 'El Principito (Edición Escolar)', author: 'Editorial Salamandra', price: 65, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-blue)', subject: 'planlector', level: 'primaria' },
  { id: '5', title: 'Trazos y Letras', author: 'Editorial Corefo', price: 85, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-blue)', subject: 'com', level: 'inicial' },
  { id: '6', title: 'Cien Años de Soledad', author: 'Editorial Sudamericana', price: 95, image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop', color: 'var(--color-blue)', subject: 'planlector', level: 'secundaria' },
];

export default function TextosEscolaresPage() {
  const [activeLevel, setActiveLevel] = useState<string>('');
  const [activeGrade, setActiveGrade] = useState<string>('');
  const [activeSubject, setActiveSubject] = useState<string>('all');
  const [products, setProducts] = useState<any[]>([]);
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos?page=1&limit=50`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) {
          const filtered = data.data.filter((p: any) => 
            p.categoria?.slug === 'textos-escolares' && 
            p.atributos && p.atributos.nivel
          );
          setProducts(filtered);
        }
      })
      .catch(err => console.error('Error fetching products', err));
  }, []);

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
        <main>
          <div className={styles.catalogHeader}>
            <div className={styles.headerTitleRow}>
              <div>
                <h2 className={styles.catalogTitle}>{currentGradeName}</h2>
                <p className={styles.activeSubjectSubtitle}>
                  Mostrando {activeSubject === 'all' ? 'todo el material' : currentSubjectName.toLowerCase()}
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

          {/* Píldoras de Materias Dinámicas */}
          {currentGradeObj && currentGradeObj.subjects && currentGradeObj.subjects.length > 0 && (
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

          <div className={styles.booksGrid}>
            {products.length === 0 && <p>No hay productos disponibles.</p>}
            {products
              // .filter(book => (activeLevel ? book.nivel === activeLevel : true) && (activeSubject === 'all' || book.materia === activeSubject))
              .map((p: any) => {
                const imageUrl = p.imagenes && p.imagenes.length > 0 
                  ? `http://localhost:3001${p.imagenes[0].url}`
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';
                return (
                  <ProductCard
                    key={p.id}
                    id={p.id.toString()}
                    title={p.nombre}
                    category={p.categoria?.nombre || 'General'}
                    categoryColor="var(--color-blue)"
                    price={p.precio_base}
                    imageUrl={imageUrl}
                    isBook={true}
                  />
                )
              })}
          </div>
        </main>
      </div>
    </div>
  );
}

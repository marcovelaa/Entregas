'use client';

import React, { useState } from 'react';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import PageHeader from '@/components/organisms/PageHeader/PageHeader';
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

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos`)
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
      {/* Banner Esmeralda */}
      <PageHeader 
        title="Textos Escolares"
        subtitle="Descubre la colección completa de libros de texto para todos los niveles y materias, alineados a la currícula escolar vigente."
      />

      {/* TABS Nivel Educativo (Header principal colorido) */}
      <div className={styles.levelTabsContainer}>
        <div className={styles.tabsInner}>
          {levels.map(lvl => {
            if (lvl.href) {
              return (
                <a
                  key={lvl.id}
                  href={lvl.href}
                  className={`${styles.levelTabBtn} ${lvl.colorClass}`}
                >
                  {lvl.name}
                </a>
              );
            }
            return (
              <button
                key={lvl.id}
                className={`${styles.levelTabBtn} ${lvl.colorClass} ${activeLevel === lvl.id ? styles.levelTabActive : ''}`}
                onClick={() => {
                  if (activeLevel === lvl.id) {
                    setActiveLevel('');
                    setActiveGrade('');
                    setActiveSubject('all');
                  } else {
                    setActiveLevel(lvl.id);
                    setActiveGrade('');
                    setActiveSubject('all');
                  }
                }}
              >
                {lvl.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.layoutContainer}>
        {/* Sidebar Accordion (Grado -> Materia) */}
        <aside className={styles.sidebarSticky}>
          <h3 className={styles.sidebarTitle}>
            {activeLevel ? `Grados de ${currentLevelName}` : 'Grados'}
          </h3>
          <nav className={styles.categoryNav}>
            {!activeLevel ? (
              <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Selecciona un nivel en la parte superior para ver los grados disponibles.
              </p>
            ) : catalogData[activeLevel].map(grade => {
              const isExpanded = activeGrade === grade.id;

              return (
                <div key={grade.id} className={styles.categoryGroup}>
                  <button 
                    className={`${styles.categoryBtn} ${isExpanded ? styles.categoryExpanded : ''}`}
                    onClick={() => {
                      if (activeGrade === grade.id) {
                        setActiveGrade('');
                      } else {
                        setActiveGrade(grade.id);
                        setActiveSubject('all');
                      }
                    }}
                  >
                    <span className={styles.categoryName}>{grade.name}</span>
                    <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  {/* Materias dentro del grado */}
                  <div className={`${styles.gradesWrapper} ${isExpanded ? styles.gradesOpen : ''}`}>
                    <div className={styles.gradesInner}>
                      <div className={styles.gradesList}>
                        {grade.subjects.map(sub => (
                          <button
                            key={sub.id}
                            className={`${styles.gradeBtn} ${activeSubject === sub.id ? styles.gradeActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveGrade(grade.id); // Asegura que estemos en este grado
                              setActiveSubject(sub.id);
                            }}
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main>
          <div className={styles.catalogHeader}>
            <div>
              <h2 className={styles.catalogTitle}>{currentGradeName}</h2>
              <p className={styles.activeSubjectSubtitle}>{currentSubjectName}</p>
            </div>
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" placeholder={`Buscar en ${currentGradeName}...`} className={styles.searchInput} />
            </div>
          </div>

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
                  />
                )
              })}
          </div>
        </main>
      </div>
    </div>
  );
}

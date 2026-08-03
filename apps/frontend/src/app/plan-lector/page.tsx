'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import PageHeader from '@/components/organisms/PageHeader/PageHeader';
import styles from './planLector.module.css';

// Estructura de categorías jerárquicas
const categories = [
  {
    id: 'inicial',
    name: 'Inicial',
    subGrades: [
      { id: 'ini-pollito', name: 'Pollito' },
      { id: 'ini-nidito', name: 'Nidito' },
      { id: 'ini-prekinder', name: 'Prekínder' },
      { id: 'ini-kinder', name: 'Kínder' },
    ]
  },
  {
    id: 'primaria',
    name: 'Primaria',
    subGrades: [
      { id: 'pri-1', name: 'Primero' },
      { id: 'pri-2', name: 'Segundo' },
      { id: 'pri-3', name: 'Tercero' },
      { id: 'pri-4', name: 'Cuarto' },
      { id: 'pri-5', name: 'Quinto' },
      { id: 'pri-6', name: 'Sexto' },
    ]
  },
  {
    id: 'secundaria',
    name: 'Secundaria',
    subGrades: [
      { id: 'sec-1', name: 'Primero' },
      { id: 'sec-2', name: 'Segundo' },
      { id: 'sec-3', name: 'Tercero' },
      { id: 'sec-4', name: 'Cuarto' },
      { id: 'sec-5', name: 'Quinto' },
      { id: 'sec-6', name: 'Sexto' },
    ]
  },
  {
    id: 'otros',
    name: 'Otros',
    subGrades: []
  }
];

// Flat list de grados para búsquedas rápidas de nombres
const allGradesFlat = categories.flatMap(cat => 
  cat.subGrades.length > 0 ? cat.subGrades : [{ id: cat.id, name: cat.name }]
);

// Mock data
const books = [
  { id: 1, gradeId: 'ini-prekinder', title: 'Cuentos para soñar', author: 'Ana María Machado', publisher: 'Santillana', isbn: '978-84-1234-567', price: 45, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop' },
  { id: 2, gradeId: 'ini-kinder', title: 'El monstruo de colores', author: 'Anna Llenas', publisher: 'Flamboyant', isbn: '978-84-9876-543', price: 60, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' },
  { id: 3, gradeId: 'pri-1', title: 'Mi primer libro de lectura', author: 'Varios Autores', publisher: 'Loqueleo', isbn: '978-84-1111-222', price: 55, img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop' },
  { id: 4, gradeId: 'pri-3', title: 'Matilda', author: 'Roald Dahl', publisher: 'Alfaguara', isbn: '978-84-3333-444', price: 65, img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=400&auto=format&fit=crop' },
  { id: 5, gradeId: 'sec-1', title: 'Cien años de soledad', author: 'Gabriel García Márquez', publisher: 'Sudamericana', isbn: '978-84-5555-666', price: 120, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' },
  { id: 6, gradeId: 'sec-4', title: '1984', author: 'George Orwell', publisher: 'Debolsillo', isbn: '978-84-7777-888', price: 85, img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop' },
  { id: 7, gradeId: 'otros', title: 'Diccionario Escolar', author: 'RAE', publisher: 'Espasa', isbn: '978-84-1111-999', price: 150, img: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?q=80&w=400&auto=format&fit=crop' },
];

export default function PlanLectorPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('');
  const [activeGrade, setActiveGrade] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<any[]>([]);

  React.useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos`)
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

  const filteredBooks = products.filter(b => {
    // const matchesGrade = activeGrade ? b.gradeId === activeGrade : true; 
    const titleMatch = b.nombre ? b.nombre.toLowerCase().includes(searchQuery.toLowerCase()) : false;
    return titleMatch;
  });

  const getActiveGradeName = () => {
    if (!activeGrade) return 'Todos los grados';
    const found = allGradesFlat.find(g => g.id === activeGrade);
    if (!found) return 'Todos los grados';
    // Find parent category to show full context like "Primaria - Primero"
    const parent = categories.find(c => c.subGrades.some(sub => sub.id === activeGrade));
    return parent ? `${parent.name} - ${found.name}` : found.name;
  };

  return (
    <div className={styles.pageWrapper}>
      <PageHeader 
        title="Plan Lector"
        subtitle="Descubre la selección oficial de textos y lecturas recomendadas. Organizado por grado para facilitar tu búsqueda."
      />

      <div className={styles.layoutContainer}>
        {/* Navegación lateral estilo acordeón */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarSticky}>
            <h3 className={styles.sidebarTitle}>Filtrar por Nivel</h3>
            <nav className={styles.categoryNav}>
              {categories.map(cat => {
                const isExpanded = expandedCategory === cat.id;
                const hasSubGrades = cat.subGrades.length > 0;
                const hasActiveSubGrade = hasSubGrades && cat.subGrades.some(sub => sub.id === activeGrade);
                const isActiveCat = (!hasSubGrades && activeGrade === cat.id) || hasActiveSubGrade;

                return (
                  <div key={cat.id} className={styles.categoryGroup}>
                    <button 
                      className={`${styles.categoryBtn} ${isExpanded || isActiveCat ? styles.categoryExpanded : ''}`}
                      onClick={() => {
                        if (hasSubGrades) {
                          if (expandedCategory === cat.id) {
                            // Cierra el acordeón y resetea el filtro (imitando Textos Escolares)
                            setExpandedCategory('');
                            setActiveGrade('');
                          } else {
                            setExpandedCategory(cat.id);
                            setActiveGrade(cat.subGrades[0].id);
                          }
                        } else {
                          if (activeGrade === cat.id) {
                            setActiveGrade('');
                            setExpandedCategory('');
                          } else {
                            setActiveGrade(cat.id);
                            setExpandedCategory(cat.id);
                          }
                        }
                      }}
                    >
                      <span className={styles.categoryName}>{cat.name}</span>
                      {hasSubGrades && (
                        <svg className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      )}
                    </button>
                    
                    {hasSubGrades && (
                      <div className={`${styles.subGradesWrapper} ${isExpanded ? styles.subGradesOpen : ''}`}>
                        <div className={styles.subGradesInner}>
                          <div className={styles.subGradesList}>
                            {cat.subGrades.map(sub => (
                              <button
                                key={sub.id}
                                className={`${styles.subGradeBtn} ${activeGrade === sub.id ? styles.subGradeActive : ''}`}
                                onClick={() => setActiveGrade(sub.id)}
                              >
                                {sub.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Área principal del catálogo */}
        <main className={styles.catalogArea}>
          <div className={styles.catalogHeader}>
            <h2 className={styles.catalogTitle}>{getActiveGradeName()}</h2>
            <div className={styles.searchWrapper}>
              <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                placeholder="Buscar libro en este nivel..." 
                className={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filteredBooks.length > 0 ? (
            <div className={styles.booksGrid}>
              {filteredBooks.map(book => {
                const imageUrl = book.imagenes && book.imagenes.length > 0 
                  ? `http://localhost:3001${book.imagenes[0].url}`
                  : 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop';
                const numericPrice = Number(book.precio_base) || 0;

                return (
                  <article key={book.id} className={styles.bookCard}>
                    <div className={styles.imageContainer}>
                      <Image src={imageUrl} alt={book.nombre} fill sizes="(max-width: 768px) 100vw, 300px" className={styles.bookImage} />
                    </div>
                    <div className={styles.bookContent}>
                      <div className={styles.bookMeta}>
                        <span className={styles.publisher}>{book.marca?.nombre || 'General'}</span>
                        <span className={styles.isbn}>SKU: {book.sku}</span>
                      </div>
                      <h3 className={styles.bookTitle} title={book.nombre}>{book.nombre}</h3>
                      <p className={styles.bookAuthor}>{book.categoria?.nombre || 'General'}</p>
                      <div className={styles.bookFooter}>
                        <span className={styles.bookPrice}>Bs. {numericPrice.toFixed(2)}</span>
                        <button className={styles.addToCartBtn} aria-label="Añadir al carrito">
                          Añadir
                        </button>
                      </div>
                    </div>
                  </article>
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

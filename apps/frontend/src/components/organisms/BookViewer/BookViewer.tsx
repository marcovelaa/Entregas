'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import styles from './BookViewer.module.css';

export interface BookViewerProps {
  images: string[];
  title: string;
  id?: string;
}

export const BookViewer: React.FC<BookViewerProps> = ({ images, title, id }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const nextPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage < images.length - 1) setCurrentPage(currentPage + 1);
  };

  const prevPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentPage > 0) setCurrentPage(currentPage - 1);
  };

  if (!images || images.length === 0) return null;

  return (
    <div className={styles.viewerContainer}>
      <div 
        className={`${styles.book} ${currentPage > 0 ? styles.bookOpen : ''}`}
        style={id ? { viewTransitionName: `book-cover-${id}` } as React.CSSProperties : undefined}
      >
        {images.map((img, idx) => {
          const isTurned = currentPage > idx;
          return (
            <div 
              key={idx} 
              className={`${styles.page} ${isTurned ? styles.pageTurned : ''}`}
              style={{ zIndex: images.length - idx }}
              onClick={isTurned ? prevPage : nextPage}
            >
              <div className={styles.pageFront}>
                <Image src={img} alt={`${title} - página ${idx + 1}`} fill sizes="(max-width: 768px) 100vw, 500px" style={{ objectFit: 'contain', backgroundColor: '#fff' }} priority={idx === 0} />
                <div className={styles.pageShadow}></div>
              </div>
              <div className={styles.pageBack}>
                <div className={styles.pageBackContent}>
                  {/* Watermark removed as requested */}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {images.length > 1 && (
        <div className={styles.controls}>
          <button onClick={prevPage} disabled={currentPage === 0} className={styles.controlBtn}>&larr;</button>
          <span className={styles.pageIndicator}>{currentPage + 1} / {images.length}</span>
          <button onClick={nextPage} disabled={currentPage === images.length - 1} className={styles.controlBtn}>&rarr;</button>
        </div>
      )}
    </div>
  );
};

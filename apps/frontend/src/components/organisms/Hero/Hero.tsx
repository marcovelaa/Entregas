'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './Hero.module.css';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  imageAlt: string;
}

const SLIDES: Slide[] = [
  {
    id: 1,
    title: 'Armá la lista de útiles de tu colegio en minutos',
    subtitle: 'Textos oficiales, plan lector y material académico con entrega a todo Bolivia.',
    image: '/hero/slide1.1.png',
    imageAlt: 'Mochila y material escolar para el nuevo año académico',
  },
  {
    id: 2,
    title: 'Textos escolares y Plan Lector 2026',
    subtitle: 'Editorial Comunicarte y todas las editoriales certificadas que pide tu colegio.',
    image: '/hero/slide2.1.png',
    imageAlt: 'Libros de literatura y plan lector escolar',
  },
  {
    id: 3,
    title: 'Packs de papelería y material académico',
    subtitle: 'Cuadernos, carpetas y útiles de calidad con precios especiales por combo.',
    image: '/hero/slide3.1.png',
    imageAlt: 'Cuadernos y suministros de papelería escolar',
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 5500);
    return () => clearInterval(timer);
  }, [nextSlide, isPaused]);

  return (
    <section
      className={styles.heroWrapper}
      aria-label="Banners principales"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className={styles.bannerStage}>
        {SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;
          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${isActive ? styles.slideActive : ''}`}
              aria-hidden={!isActive}
            >
              {/* Full Native Panoramic Banner (1920x640) */}
              <div className={styles.imageWrapper}>
                <Image
                  src={slide.image}
                  alt={slide.imageAlt}
                  fill
                  priority={index <= 1}
                  sizes="(max-width: 1400px) 100vw, 1300px"
                  className={styles.bannerImage}
                />
              </div>

              {/* Clean Typography Overlay */}
              <div className={styles.captionOverlay}>
                <h1 className={styles.headline}>{slide.title}</h1>
                <p className={styles.subheadline}>{slide.subtitle}</p>
              </div>
            </div>
          );
        })}

        {/* Minimal Corner Navigation */}
        <div className={styles.cornerNav}>
          <button
            type="button"
            onClick={prevSlide}
            className={styles.navBtn}
            aria-label="Slide anterior"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <div className={styles.indicators}>
            {SLIDES.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => setCurrentSlide(idx)}
                className={`${styles.pill} ${idx === currentSlide ? styles.pillActive : ''}`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextSlide}
            className={styles.navBtn}
            aria-label="Slide siguiente"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}

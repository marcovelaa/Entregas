'use client';
import React, { useState, useEffect } from 'react';
import styles from './ofertas.module.css';
import Image from 'next/image';

interface OfferCardProps {
  id: string;
  title: string;
  category: string;
  oldPrice: number;
  newPrice: number;
  discountBadge: string;
  imageUrl: string;
}

function OfferCard({ title, category, oldPrice, newPrice, discountBadge, imageUrl }: OfferCardProps) {
  return (
    <article className={styles.offerCard}>
      <div className={styles.imageContainer}>
        <span className={styles.discountBadge}>{discountBadge}</span>
        <Image src={imageUrl} alt={title} fill sizes="(max-width: 768px) 100vw, 250px" className={styles.productImg} />
      </div>
      <div className={styles.cardInfo}>
        <span className={styles.category}>{category}</span>
        <h3 className={styles.title} title={title}>{title}</h3>
        
        <div className={styles.priceRow}>
          <div className={styles.priceCol}>
            <span className={styles.oldPrice}>Bs. {oldPrice.toFixed(2)}</span>
            <span className={styles.newPrice}>Bs. {newPrice.toFixed(2)}</span>
          </div>
          <button className={styles.addBtn} aria-label="Agregar al carrito">
            Añadir
          </button>
        </div>
      </div>
    </article>
  );
}

export default function OfertasPage() {
  const [timeLeft, setTimeLeft] = useState({
    days: 2,
    hours: 14,
    minutes: 35,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;
        if (seconds > 0) seconds--;
        else {
          seconds = 59;
          if (minutes > 0) minutes--;
          else {
            minutes = 59;
            if (hours > 0) hours--;
            else {
              hours = 23;
              if (days > 0) days--;
            }
          }
        }
        return { days, hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const offers: OfferCardProps[] = [
    {
      id: 'o1',
      title: 'Mochila Escolar Totto 20L',
      category: 'Mochilas',
      oldPrice: 350.00,
      newPrice: 280.00,
      discountBadge: '-20%',
      imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'o2',
      title: 'Set de Arte Profesional 120 piezas',
      category: 'Arte y Dibujo',
      oldPrice: 420.00,
      newPrice: 294.00,
      discountBadge: '-30%',
      imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'o3',
      title: 'Pack 10 Resmas Papel Carta Chamex',
      category: 'Papel',
      oldPrice: 350.00,
      newPrice: 299.00,
      discountBadge: '-15%',
      imageUrl: 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'o4',
      title: 'Diccionario Enciclopédico Santillana',
      category: 'Textos Escolares',
      oldPrice: 180.00,
      newPrice: 90.00,
      discountBadge: '-50%',
      imageUrl: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'o5',
      title: 'Caja 50 Bolígrafos Faber-Castell',
      category: 'Escritura',
      oldPrice: 100.00,
      newPrice: 75.00,
      discountBadge: '-25%',
      imageUrl: 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?q=80&w=400&auto=format&fit=crop'
    },
    {
      id: 'o6',
      title: 'Calculadora Científica Casio FX-991',
      category: 'Electrónica Escolar',
      oldPrice: 220.00,
      newPrice: 187.00,
      discountBadge: '-15%',
      imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop'
    }
  ];

  return (
    <main className={styles.main}>
      <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Ofertas Especiales</h1>
          <p className={styles.heroSubtitle}>Descuentos exclusivos por tiempo limitado en todas las categorías. ¡Aprovecha antes de que se agoten!</p>
          
          <div className={styles.countdownBox}>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>{String(timeLeft.days).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>Días</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>:</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>{String(timeLeft.hours).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>Horas</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>:</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>{String(timeLeft.minutes).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>Min</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>:</span>
            </div>
            <div className={styles.timeUnit}>
              <span className={styles.timeNumber}>{String(timeLeft.seconds).padStart(2, '0')}</span>
              <span className={styles.timeLabel}>Seg</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.container}>
        <div className={styles.layout}>
          {/* SIDEBAR DE FILTROS */}
          <aside className={styles.sidebar}>
            <div className={styles.filterGroup}>
              <h3>Categorías en Oferta</h3>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-textos" />
                <label htmlFor="cat-textos">Textos Escolares</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-material" />
                <label htmlFor="cat-material">Material Escolar</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-papel" />
                <label htmlFor="cat-papel">Papel</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="cat-mochilas" />
                <label htmlFor="cat-mochilas">Mochilas</label>
              </div>
            </div>

            <div className={styles.filterGroup}>
              <h3>Nivel de Descuento</h3>
              <div className={styles.filterOption}>
                <input type="checkbox" id="desc-50" />
                <label htmlFor="desc-50">50% o más</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="desc-30" />
                <label htmlFor="desc-30">30% a 49%</label>
              </div>
              <div className={styles.filterOption}>
                <input type="checkbox" id="desc-10" />
                <label htmlFor="desc-10">10% a 29%</label>
              </div>
            </div>
          </aside>

          {/* CATÁLOGO DE PRODUCTOS EN OFERTA */}
          <div className={styles.content}>
            <div className={styles.catalogHeader}>
              <h2 className={styles.catalogTitle}>Liquidación</h2>
              <span className={styles.itemCount}>{offers.length} productos con descuento</span>
            </div>
            <div className={styles.grid}>
              {offers.map(offer => (
                <OfferCard key={offer.id} {...offer} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

import React from 'react';
import Link from 'next/link';
import styles from './RecommendedProducts.module.css';
import { ProductCard } from '../../molecules/ProductCard/ProductCard';
import { daysUntilLocal, parseUtcOrLocal } from '@/lib/combo-rules';

export default async function RecommendedProducts() {
  // Fetch real products from backend
  let products = [];
  try {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    const res = await fetch(`${API_URL}/productos?visibilidad=publica&page=1&limit=50`, { next: { revalidate: 0 } });
    const data = await res.json();
    // Safety net: skip combos the backend marked as sold out or expired
    const allProducts = (data.data || []).filter((p: { estado_venta?: string }) => p.estado_venta !== 'VENCIDO' && p.estado_venta !== 'AGOTADO');
    // Prioritize products marked as destacado_portada or combos, then newest
    allProducts.sort((a: unknown, b: unknown) => {
      const aDest = a.atributos?.presentacion_visual?.destacado_portada ? 1 : 0;
      const bDest = b.atributos?.presentacion_visual?.destacado_portada ? 1 : 0;
      if (bDest !== aDest) return bDest - aDest;
      const aCombo = a.tipo_producto === 'COMBO' ? 1 : 0;
      const bCombo = b.tipo_producto === 'COMBO' ? 1 : 0;
      if (bCombo !== aCombo) return bCombo - aCombo;
      return (b.id || 0) - (a.id || 0);
    });
    products = allProducts.slice(0, 12);
  } catch (error) {
    console.error('Error fetching products for e-commerce', error);
  }

  return (
    <section className={styles.section} aria-labelledby="recommended-title">
      <div className={styles.sectionHeader}>
        <div>
          <h2 id="recommended-title" className={styles.sectionTitle}>Recomendados para ti</h2>
          <p className={styles.sectionSubtitle}>Catálogo y paquetes disponibles en nuestra tienda.</p>
        </div>
      </div>

      <div className={styles.productsGrid}>
        {products.length === 0 ? (
          <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay productos registrados en el sistema todavía.</p>
        ) : (
          products.map((p: unknown) => {
            const isCombo = p.tipo_producto === 'COMBO';
            const pv = p.atributos?.presentacion_visual;
            let compsSubtotal = 0;
            const componentImages: string[] = [];
            const mappedComponents: unknown[] = [];

            if (isCombo && p.componentes_combo && p.componentes_combo.length > 0) {
              p.componentes_combo.forEach((c: unknown) => {
                const comp = c.componente_producto;
                if (comp) {
                  compsSubtotal += (Number(comp.precio_base) || 0) * (c.cantidad || 1);
                  const img = comp.imagenes?.[0]?.url;
                  if (img) {
                    componentImages.push(img.startsWith('http') ? img : `http://localhost:3001${img}`);
                  }
                  mappedComponents.push({
                    nombre: comp.nombre,
                    cantidad: c.cantidad || 1,
                    imagen_url: img ? (img.startsWith('http') ? img : `http://localhost:3001${img}`) : undefined,
                  });
                }
              });
            }

            const precioCombo = Number(p.precio_base) || 0;
            const tieneAhorro = isCombo && compsSubtotal > precioCombo;
            const ahorroPorcentaje = tieneAhorro ? Math.round(((compsSubtotal - precioCombo) / compsSubtotal) * 100) : 0;
            
            const badgeStyle = pv?.badge_estilo || 'emerald';
            const badgeLabel = pv?.badge_texto || (isCombo ? (tieneAhorro ? `Ahorrá ${ahorroPorcentaje}%` : 'KIT / COMBO') : undefined);

            const hasCustomImage = Boolean(p.imagenes && p.imagenes.length > 0);
            const imageUrl = hasCustomImage
              ? (p.imagenes[0].url.startsWith('http') 
                  ? p.imagenes[0].url 
                  : `http://localhost:3001${p.imagenes[0].url.startsWith('/') ? '' : '/'}${p.imagenes[0].url}`)
              : undefined;

            let urgencyLabel: string | undefined;
            if (isCombo && (!p.estado_venta || p.estado_venta === 'ACTIVO') && p.vigencia_fin) {
              const dias = daysUntilLocal(parseUtcOrLocal(p.vigencia_fin), new Date());
              if (dias >= 1 && dias <= 3) {
                urgencyLabel = dias === 1 ? 'Termina en 1 día' : `Termina en ${dias} días`;
              }
            }
            
            const categoryName = p.categoria?.nombre || 'General';
            const isBook = Boolean(
              !p.nombre.toLowerCase().match(/(bol[ií]grafo|cuaderno|l[aá]piz|borrador|marcador|mochila)/) &&
              (
                p.naturaleza === 'TEXTO' || 
                p.naturaleza === 'PLAN_LECTOR' || 
                p.tipo_producto === 'LIBRO' || 
                categoryName.toLowerCase().includes('texto') || 
                categoryName.toLowerCase().includes('lector')
              )
            );

            return (
              <ProductCard 
                key={p.id}
                id={p.id.toString()}
                title={p.nombre}
                category={categoryName}
                categoryColor="var(--color-blue)"
                price={p.precio_base}
                imageUrl={imageUrl}
                tipo_producto={p.tipo_producto}
                badge={badgeLabel}
                badgeStyle={badgeStyle}
                urgencyLabel={urgencyLabel}
                precioOriginal={tieneAhorro ? compsSubtotal : undefined}
                componentes={mappedComponents}
                componentesImagenes={componentImages}
                modoImagen={pv?.modo_imagen || 'GRID_AUTO'}
                isBook={isBook}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

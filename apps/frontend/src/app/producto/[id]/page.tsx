'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLevelColor } from '@/data/mockProducts';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
import { BookViewer } from '@/components/organisms/BookViewer/BookViewer';
import { ShoppingCart } from 'lucide-react';
import styles from './producto.module.css';
import { useCart } from '@/context/CartContext';

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [realProduct, setRealProduct] = useState<any>(null);
  const [realRelatedProducts, setRealRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [selectedVariante, setSelectedVariante] = useState<any>(null);
  const [selectedEmpaque, setSelectedEmpaque] = useState<any>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Fetch main product
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
    fetch(`${API_URL}/productos/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Product not found');
        return res.json();
      })
      .then(data => {
        setRealProduct(data);
        if (data.variantes && data.variantes.length > 0) {
          setSelectedVariante(data.variantes[0]);
          if (data.variantes[0].empaques && data.variantes[0].empaques.length > 0) {
            setSelectedEmpaque(data.variantes[0].empaques[0]);
          }
          if (data.variantes[0].combinacion_opciones) {
            setSelectedOptions(data.variantes[0].combinacion_opciones);
          }
        }
      })
      .catch(err => {
        console.warn('Could not load real product from API, using fallback', err);
      })
      .finally(() => setLoading(false));

    // Fetch related products (e.g. Materiales Escolares or general products)
    fetch(`${API_URL}/productos?visibilidad=publica&limit=8`)
      .then(res => res.json())
      .then((resData: any) => {
        const list = Array.isArray(resData) ? resData : (resData.data || []);
        const filtered = list.filter((p: any) => p.id.toString() !== id).slice(0, 4);
        setRealRelatedProducts(filtered);
      })
      .catch(err => console.warn('Could not load related products', err));
  }, [id]);

  const handleOptionChange = (optionName: string, value: string) => {
    const newOptions = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(newOptions);
    
    if (realProduct?.variantes) {
      const matchedVariant = realProduct.variantes.find((p: any) => {
        if (!p.combinacion_opciones) return false;
        // Check if all keys match exactly
        return Object.entries(newOptions).every(([k, v]) => p.combinacion_opciones[k] === v);
      });
      setSelectedVariante(matchedVariant || null);
      if (matchedVariant?.empaques && matchedVariant.empaques.length > 0) {
        setSelectedEmpaque(matchedVariant.empaques[0]);
      } else {
        setSelectedEmpaque(null);
      }
    }
  };

  // Fallback to mock product if real product not loaded
  const fallbackProduct = { title: 'Producto', price: 0, category: 'General', editorial: '', imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop' };

  // Build images array
  let galleryImages: string[] = [];
  if (realProduct && realProduct.imagenes && realProduct.imagenes.length > 0) {
    galleryImages = realProduct.imagenes.map((img: any) => img.url.startsWith('http') ? img.url : `http://localhost:3001${img.url.startsWith('/') ? '' : '/'}${img.url}`);
    
    // Add component images if combo
    const compImages: string[] = [];
    if (realProduct.componentes_combo) {
      realProduct.componentes_combo.forEach((c: any) => {
        const img = c.componente_producto?.imagenes?.[0]?.url;
        if (img) compImages.push(img.startsWith('http') ? img : `http://localhost:3001${img.startsWith('/') ? '' : '/'}${img}`);
      });
    }
    if (compImages.length > 0) {
      galleryImages = compImages;
    }
  }
  if (galleryImages.length === 0) {
    galleryImages = [
      fallbackProduct.imageUrl,
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop",
    ];
  }

  // When a variant is selected, override the image preview
  useEffect(() => {
    if (selectedVariante && selectedVariante.imagen_url) {
      setPreviewImageUrl(selectedVariante.imagen_url.startsWith('http') ? selectedVariante.imagen_url : `http://localhost:3001${selectedVariante.imagen_url.startsWith('/') ? '' : '/'}${selectedVariante.imagen_url}`);
    } else {
      setPreviewImageUrl(null);
    }
  }, [selectedVariante]);

  const currentMainImage = previewImageUrl || (galleryImages[activeImageIndex] || galleryImages[0]);

  const handleThumbnailClick = (index: number) => {
    setActiveImageIndex(index);
    setPreviewImageUrl(null);
  };

  // Determine prices
  const basePrice = selectedEmpaque ? Number(selectedEmpaque.precio) : (realProduct ? Number(realProduct.precio_base) : fallbackProduct.price);
  const promoPrice = selectedEmpaque ? (selectedEmpaque.precio_promocional ? Number(selectedEmpaque.precio_promocional) : null) : (realProduct?.precio_promocional ? Number(realProduct.precio_promocional) : null);

  const hasPromo = promoPrice !== null && promoPrice < basePrice;
  const discountPercent = hasPromo ? Math.round(((basePrice - promoPrice) / basePrice) * 100) : 0;

  const title = realProduct ? realProduct.nombre : fallbackProduct.title;
  const brand = realProduct ? realProduct.marca?.nombre : (fallbackProduct.editorial || '');
  const sku = selectedEmpaque ? selectedEmpaque.sku : (selectedVariante ? selectedVariante.sku_base : (realProduct ? realProduct.sku : `PRD-${id}`));
  const atributos = realProduct?.atributos || {};

  const isBook = Boolean(
    !realProduct?.nombre.toLowerCase().match(/(bol[ií]grafo|cuaderno|l[aá]piz|borrador|marcador|mochila)/) &&
    (
      realProduct?.naturaleza === 'TEXTO' || 
      realProduct?.naturaleza === 'PLAN_LECTOR' || 
      realProduct?.tipo_producto === 'LIBRO' || 
      realProduct?.categoria?.nombre?.toLowerCase().includes('texto') || 
      realProduct?.categoria?.nombre?.toLowerCase().includes('lector')
    )
  );
  const brandLabel = isBook ? 'Editorial' : 'Marca';
  const categoriaNombre = realProduct?.categoria?.nombre || fallbackProduct.category;
  const naturalezaReal = realProduct?.naturaleza;

  // Helper to format raw ERP attributes to friendly names
  const formatAttributeValue = (key: string, val: string) => {
    const valueMap: Record<string, string> = {
      // Niveles
      'inicial': 'Inicial', 'primaria': 'Primaria', 'secundaria': 'Secundaria',
      // Grados
      'ini-2': 'Pollito (2 años)', 'ini-pollito': 'Pollito (2 años)',
      'ini-3': 'Nidito (3 años)', 'ini-nidito': 'Nidito (3 años)',
      'ini-4': 'Pre-Kínder', 'ini-prekinder': 'Pre-Kínder',
      'ini-5': 'Kínder', 'ini-kinder': 'Kínder',
      'pri-1': '1ro de Primaria', 'pri-2': '2do de Primaria', 'pri-3': '3ro de Primaria', 
      'pri-4': '4to de Primaria', 'pri-5': '5to de Primaria', 'pri-6': '6to de Primaria',
      'sec-1': '1ro de Secundaria', 'sec-2': '2do de Secundaria', 'sec-3': '3ro de Secundaria', 
      'sec-4': '4to de Secundaria', 'sec-5': '5to de Secundaria', 'sec-6': '6to de Secundaria',
      // Materias
      'mat': 'Matemáticas', 'com': 'Comunicación', 'len': 'Lenguaje', 
      'cie': 'Ciencias Naturales', 'soc': 'Ciencias Sociales', 'ing': 'Inglés', 
      'lit': 'Literatura', 'bio': 'Biología', 'fis': 'Física', 'qui': 'Química', 
      'planlector': 'Plan Lector',
      // Naturalezas
      'texto': 'Texto Escolar', 'plan_lector': 'Plan Lector', 'material': 'Material Escolar'
    };
    
    // Si la key es nivel, grado o materia, intentamos mapear. Si no, devolvemos el valor original capitalizado.
    const lowerVal = String(val).toLowerCase();
    if (valueMap[lowerVal]) return valueMap[lowerVal];
    
    // Capitalize first letter as fallback
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  };

  // Combo calculations
  const isCombo = realProduct?.tipo_producto === 'COMBO';
  const comboComponentes = isCombo ? (realProduct?.componentes_combo || []) : [];
  const stockVendible = isCombo ? (realProduct?.stock_vendible ?? 0) : null;
  const estadoVenta = isCombo ? (realProduct?.estado_venta ?? null) : null;
  const compraBloqueada = stockVendible !== null && stockVendible <= 0;
  const disponibilidadTexto = !isCombo
    ? 'Disponible en stock'
    : estadoVenta === 'ACTIVO'
    ? 'Disponible'
    : estadoVenta === 'AGOTADO'
    ? 'Agotado'
    : 'Vencido';
  let componentesSubtotal = 0;
  comboComponentes.forEach((c: any) => {
    const compPrice = Number(c.componente_producto?.precio_base) || 0;
    componentesSubtotal += compPrice * (c.cantidad || 1);
  });
  const currentEffectivePrice = promoPrice !== null ? promoPrice : basePrice;
  const comboAhorro = isCombo && componentesSubtotal > currentEffectivePrice ? (componentesSubtotal - currentEffectivePrice) : 0;
  const comboAhorroPct = isCombo && componentesSubtotal > 0 && comboAhorro > 0
    ? Math.round((comboAhorro / componentesSubtotal) * 100)
    : 0;

  // Use real related products if available, otherwise mock
  const displayRelated = realRelatedProducts.length > 0 
    ? realRelatedProducts.map(p => {
        const category = p.naturaleza || p.categoria?.nombre || 'General';
        return {
          id: p.id,
          title: p.nombre,
          category,
          price: Number(p.precio_promocional || p.precio_base),
          imageUrl: p.imagenes?.[0]?.url 
            ? (p.imagenes[0].url.startsWith('http') 
                ? p.imagenes[0].url 
                : `http://localhost:3001${p.imagenes[0].url.startsWith('/') ? '' : '/'}${p.imagenes[0].url}`) 
            : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop",
          badge: p.precio_promocional ? 'Oferta' : undefined,
          tipo_producto: p.tipo_producto,
          precioOriginal: p.precio_promocional ? Number(p.precio_base) : undefined,
          isBook: Boolean(
            !p.nombre.toLowerCase().match(/(bol[ií]grafo|cuaderno|l[aá]piz|borrador|marcador|mochila)/) &&
            (
              p.naturaleza === 'TEXTO' || 
              p.naturaleza === 'PLAN_LECTOR' || 
              p.tipo_producto === 'LIBRO' || 
              category.toLowerCase().includes('texto') || 
              category.toLowerCase().includes('lector')
            )
          )
        };
      })
    : [];

  let categoryPath = '/';
  if (naturalezaReal?.toLowerCase().includes('texto') || categoriaNombre?.toLowerCase().includes('texto')) categoryPath = '/textosescolares';
  else if (naturalezaReal?.toLowerCase().includes('lector') || categoriaNombre?.toLowerCase().includes('lector')) categoryPath = '/plan-lector';
  else if (naturalezaReal?.toLowerCase().includes('material') || categoriaNombre?.toLowerCase().includes('material')) categoryPath = '/material-escolar';
  else categoryPath = '/productos';

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <main className={styles.mainContent}>
          {/* Skeleton Breadcrumb */}
          <nav className={styles.breadcrumb} style={{ opacity: 0.5 }}>
            <div style={{ height: '20px', width: '200px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
          </nav>
          
          <div className={styles.productContainer}>
            {/* Skeleton Image */}
            <div className={styles.gallerySection}>
              <div style={{ width: '100%', aspectRatio: '1/1.2', backgroundColor: '#e2e8f0', borderRadius: '8px', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '1rem' }}>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
                <div style={{ width: '80px', height: '80px', backgroundColor: '#e2e8f0', borderRadius: '4px', animation: 'pulse 1.5s infinite' }}></div>
              </div>
            </div>
            
            {/* Skeleton Info */}
            <div className={styles.infoSection}>
              <div style={{ height: '32px', width: '80%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '1rem', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '40px', width: '40%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '2rem', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '20px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '0.5rem', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ height: '20px', width: '90%', backgroundColor: '#e2e8f0', borderRadius: '4px', marginBottom: '2rem', animation: 'pulse 1.5s infinite' }}></div>
              
              <div style={{ height: '50px', width: '100%', backgroundColor: '#cbd5e1', borderRadius: '8px', marginTop: 'auto', animation: 'pulse 1.5s infinite' }}></div>
            </div>
          </div>
          <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          {categoriaNombre && (
            <>
              <span className={styles.separator}>/</span>
              <Link href={categoryPath}>{categoriaNombre}</Link>
            </>
          )}
          <span className={styles.separator}>/</span>
          <span className={styles.current} style={{ display: 'inline-block', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', verticalAlign: 'bottom' }}>
            {title}
          </span>
        </nav>

        {/* MAIN PRODUCT AREA */}
        <div className={styles.productContainer}>
          
          {/* Left: Image Gallery */}
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrapper}>
              {(hasPromo || comboAhorro > 0) && (
                <span className={styles.badge}>
                  -{hasPromo ? discountPercent : comboAhorroPct}%
                </span>
              )}
              <div key={currentMainImage} className={styles.mainImageInner}>
                <Image 
                  src={currentMainImage} 
                  alt={title} 
                  fill
                  priority
                  className={styles.mainImage}
                  sizes="(max-width: 768px) 100vw, 500px"
                  style={{ objectFit: 'contain' }}
                />
              </div>
            </div>
            
            {galleryImages.length > 1 && (
              <div className={styles.thumbnailsContainer}>
                <button className={styles.thumbNavBtn} onClick={() => handleThumbnailClick(activeImageIndex > 0 ? activeImageIndex - 1 : galleryImages.length - 1)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                </button>
                
                <div className={styles.thumbnailsScroll}>
                  {galleryImages.map((img, index) => {
                    const isActive = !previewImageUrl && index === activeImageIndex;
                    return (
                      <button 
                        key={index}
                        className={`${styles.thumbnailBtn} ${isActive ? styles.activeThumbnail : ''} ${isBook ? styles.bookThumbnail : ''}`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <Image src={img} alt={`Thumbnail ${index}`} fill sizes="80px" className={styles.thumbImg} />
                      </button>
                    );
                  })}
                </div>

                <button className={styles.thumbNavBtn} onClick={() => handleThumbnailClick(activeImageIndex < galleryImages.length - 1 ? activeImageIndex + 1 : 0)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className={styles.infoSection}>
            <div className={styles.headerBlock}>
              {categoriaNombre && (
                <span className={styles.kickerText}>{categoriaNombre}</span>
              )}
              <h1 className={`${styles.title} ${isBook ? styles.bookTitle : ''}`}>{title}</h1>
              {brand && <div className={styles.authorLine}>por <span className={styles.brandName}>{brand}</span></div>}
            </div>
            
            <div className={styles.priceAndStockBlock}>
              {/* Price display with promo or combo savings strikethrough */}
              <div className={styles.priceContainer}>
                {hasPromo ? (
                  <div className={styles.priceRow}>
                    <span className={styles.price} style={{ color: '#ef4444' }}>Bs. {promoPrice?.toFixed(2)}</span>
                    <span className={styles.oldPrice}>Bs. {basePrice.toFixed(2)}</span>
                  </div>
                ) : comboAhorro > 0 ? (
                  <div className={styles.priceRow}>
                    <span className={styles.price}>Bs. {basePrice.toFixed(2)}</span>
                    <span className={styles.oldPrice}>Bs. {componentesSubtotal.toFixed(2)}</span>
                  </div>
                ) : (
                  <span className={styles.price}>Bs. {basePrice.toFixed(2)}</span>
                )}
              </div>
              
              <div className={`${styles.availabilityText} ${compraBloqueada ? styles.availabilityTextAlert : ''}`}>
                {compraBloqueada ? '✗' : '✓'} {disponibilidadTexto}
              </div>
            </div>

            {sku && <div className={styles.skuLine}>SKU: {sku}</div>}

            {realProduct?.descripcion && (
              <p className={styles.productDescription}>{realProduct.descripcion}</p>
            )}

            {/* COMBO CONTENTS BREAKDOWN */}
            {isCombo && comboComponentes.length > 0 && (
              <div className={styles.comboContentsCard}>
                <div className={styles.comboContentsHeader}>
                  <span className={styles.comboContentsTitle}>Contenido del paquete ({comboComponentes.length} artículos)</span>
                  {comboAhorro > 0 && (
                    <span className={styles.comboAhorroBadge}>Ahorro {comboAhorroPct}%</span>
                  )}
                </div>
                <div className={styles.comboItemsList}>
                  {comboComponentes.map((c: any) => {
                    const comp = c.componente_producto;
                    const compImg = comp?.imagenes?.[0]?.url;
                    const fullImgUrl = compImg ? (compImg.startsWith('http') ? compImg : `http://localhost:3001${compImg.startsWith('/') ? '' : '/'}${compImg}`) : null;
                    const compPrice = Number(comp?.precio_base) || 0;
                    return (
                      <div key={c.id} className={styles.comboItemRow}>
                        <div className={styles.comboItemImgWrapper}>
                          {fullImgUrl ? (
                            <img src={fullImgUrl} alt={comp?.nombre || 'Producto'} className={styles.comboItemImg} />
                          ) : (
                            <div className={styles.comboItemImgPlaceholder} />
                          )}
                        </div>
                        <div className={styles.comboItemDetails}>
                          <div className={styles.comboItemName}>{comp?.nombre || 'Producto'}</div>
                          <div className={styles.comboItemSub}>{c.cantidad > 1 ? `${c.cantidad} unidades` : '1 unidad'} · SKU: {comp?.sku || 'N/A'}</div>
                        </div>
                        <div className={styles.comboItemPrice}>
                          Bs. {(compPrice * (c.cantidad || 1)).toFixed(2)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {comboAhorro > 0 && (
                  <div className={styles.comboPricingSummary}>
                    <div className={styles.comboSummaryRow}>
                      <span>Precio individual por separado:</span>
                      <span className={styles.comboOldPrice}>Bs. {componentesSubtotal.toFixed(2)}</span>
                    </div>
                    <div className={styles.comboSummaryRow}>
                      <span>Precio del combo:</span>
                      <span className={styles.comboNewPrice}>Bs. {currentEffectivePrice.toFixed(2)}</span>
                    </div>
                    <div className={`${styles.comboSummaryRow} ${styles.comboSavingsRow}`}>
                      <span>Ahorro total:</span>
                      <span>Bs. {comboAhorro.toFixed(2)} ({comboAhorroPct}%)</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <hr className={styles.divider} />

            {realProduct?.opciones_variantes && realProduct.opciones_variantes.length > 0 ? (
              <div className={styles.variantsSection}>
                {realProduct.opciones_variantes.map((opcion: any, index: number) => (
                  <div key={index} className={styles.optionGroup}>
                    <div className={styles.variantHeader}>
                      <span className={styles.variantTypeLabel}>{opcion.nombre}:</span>
                      <span className={styles.variantSelectedName}>{selectedOptions[opcion.nombre] || 'Selecciona'}</span>
                    </div>
                    <div className={styles.optionButtonsList}>
                      {opcion.valores.map((val: string) => {
                        const isSelected = selectedOptions[opcion.nombre] === val;
                        return (
                          <button
                            key={val}
                            className={`${styles.optionBtn} ${isSelected ? styles.activeOptionBtn : ''}`}
                            onClick={() => {
                              handleOptionChange(opcion.nombre, val);
                              setQty(1);
                            }}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* Fallback info when variant not found */}
                {!selectedVariante && (
                  <div className={styles.variantUnavailable}>
                    Combinación no disponible en este momento
                  </div>
                )}
                
                {/* Empaques after selecting a Variant */}
                {selectedVariante && selectedVariante.empaques && selectedVariante.empaques.length > 0 && (
                  <div className={styles.optionGroup} style={{ marginTop: '1.5rem' }}>
                    <div className={styles.variantHeader}>
                      <span className={styles.variantTypeLabel}>Empaque:</span>
                      <span className={styles.variantSelectedName}>{selectedEmpaque?.nombre || 'Selecciona'}</span>
                    </div>
                    <div className={styles.optionButtonsList}>
                      {selectedVariante.empaques.map((e: any) => (
                        <button
                          key={e.id}
                          className={`${styles.optionBtn} ${selectedEmpaque?.id === e.id ? styles.activeOptionBtn : ''}`}
                          onClick={() => {
                            setSelectedEmpaque(e);
                            setQty(1);
                          }}
                        >
                          {e.nombre} - Bs. {Number(e.precio).toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              realProduct?.variantes && realProduct.variantes.length > 0 && (
                <div className={styles.variantsSection}>
                  <div className={styles.variantHeader}>
                    <span className={styles.variantTypeLabel}>Variantes:</span>
                    <span className={styles.variantSelectedName}>{selectedVariante?.nombre || 'Selecciona una'}</span>
                  </div>
                  <div className={styles.volumeOptions}>
                    {realProduct.variantes.map((v: any) => (
                      <button 
                        key={v.id}
                        className={`${styles.volumeBtn} ${selectedVariante?.id === v.id ? styles.activeVolume : ''}`}
                        onClick={() => {
                          setSelectedVariante(v);
                          if (v.combinacion_opciones) setSelectedOptions(v.combinacion_opciones);
                          if (v.empaques && v.empaques.length > 0) setSelectedEmpaque(v.empaques[0]);
                          else setSelectedEmpaque(null);
                          setQty(1);
                        }}
                        title={v.nombre}
                      >
                        <div className={styles.variantImgWrapper}>
                          <Image 
                            src={v.imagen_url ? (v.imagen_url.startsWith('http') ? v.imagen_url : `http://localhost:3001${v.imagen_url.startsWith('/') ? '' : '/'}${v.imagen_url}`) : (galleryImages[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop")}
                            alt={v.nombre}
                            fill
                            className={styles.variantImg}
                            sizes="80px"
                          />
                        </div>
                        <span className={styles.variantPriceLabel}>{v.nombre}</span>
                      </button>
                    ))}
                  </div>

                  {selectedVariante && selectedVariante.empaques && selectedVariante.empaques.length > 0 && (
                    <div className={styles.optionGroup} style={{ marginTop: '1.5rem' }}>
                      <div className={styles.variantHeader}>
                        <span className={styles.variantTypeLabel}>Empaque:</span>
                        <span className={styles.variantSelectedName}>{selectedEmpaque?.nombre || 'Selecciona'}</span>
                      </div>
                      <div className={styles.optionButtonsList}>
                        {selectedVariante.empaques.map((e: any) => (
                          <button
                            key={e.id}
                            className={`${styles.optionBtn} ${selectedEmpaque?.id === e.id ? styles.activeOptionBtn : ''}`}
                            onClick={() => {
                              setSelectedEmpaque(e);
                              setQty(1);
                            }}
                          >
                            {e.nombre} - Bs. {Number(e.precio).toFixed(2)}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Cart Action Area */}
            <div className={styles.cartActionArea}>
              <div className={styles.quantitySelector}>
                <button className={styles.qtyBtn} onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos">-</button>
                <input 
                  type="number" 
                  className={styles.qtyInput} 
                  value={qty} 
                  onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} 
                />
                <button className={styles.qtyBtn} onClick={() => setQty(qty + 1)} aria-label="Más">+</button>
              </div>
              <button 
                className={styles.primaryAddBtn}
                disabled={compraBloqueada || (realProduct?.variantes?.length > 0 && !selectedVariante) || (selectedVariante && selectedVariante.empaques?.length > 0 && !selectedEmpaque)}
                onClick={() => {
                  const item = {
                    id: selectedEmpaque ? `${id}-${selectedVariante?.id}-${selectedEmpaque.id}` : (selectedVariante ? `${id}-${selectedVariante.id}` : id),
                    title: `${title}${selectedVariante ? ` - ${selectedVariante.nombre}` : ''}${selectedEmpaque ? ` (${selectedEmpaque.nombre})` : ''}`,
                    category: categoriaNombre,
                    price: promoPrice !== null ? promoPrice : basePrice,
                    imageUrl: currentMainImage
                  };
                  addToCart(item, qty);
                  alert('¡Producto agregado al carrito!');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px' }}>
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Añadir al carrito
              </button>
            </div>
          </div>
        </div>

        {/* Specifications Section (Full Width Below) */}
        {Object.keys(atributos).length > 0 || brand ? (
          <section className={styles.detailsSection}>
            <div className={styles.detailsHeader}>
              <h2 className={styles.detailsTitle}>Información Adicional</h2>
            </div>
            <div className={styles.specsContainer}>
              <div className={styles.specsGrid}>
                {brand && (
                  <div className={styles.specRow}>
                    <span className={styles.specLabel}>{brandLabel}</span>
                    <span className={styles.specDots}></span>
                    <span className={styles.specValue}>{brand}</span>
                  </div>
                )}
                {Object.entries(atributos).map(([key, val]) => {
                  const displayKey = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
                  return (
                    <div className={styles.specRow} key={key}>
                      <span className={styles.specLabel}>{displayKey}</span>
                      <span className={styles.specDots}></span>
                      <span className={styles.specValue}>{formatAttributeValue(key, String(val))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        ) : null}

        {/* Related Products */}
        <section className={styles.relatedSection}>
          <div className={styles.relatedHeader}>
            <h2 className={styles.sectionTitle}>
              {categoriaNombre?.toLowerCase().includes('texto') 
                ? 'Textos Escolares Recomendados' 
                : categoriaNombre?.toLowerCase().includes('lector') 
                  ? 'Más Títulos de Plan Lector' 
                  : 'Completa tu carrito'}
            </h2>
          </div>
          <div className={styles.relatedGrid}>
            {displayRelated.map(item => (
              <ProductCard 
                key={item.id}
                id={item.id?.toString()}
                title={item.title}
                category={item.category}
                categoryColor={getLevelColor(item.category)}
                price={item.price}
                imageUrl={item.imageUrl}
                badge={item.badge}
                tipo_producto={item.tipo_producto}
                precioOriginal={item.precioOriginal}
                isBook={item.isBook}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

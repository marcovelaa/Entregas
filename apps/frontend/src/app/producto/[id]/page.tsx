'use client';

import React, { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getLevelColor } from '@/data/mockProducts';
import { ProductCard } from '@/components/molecules/ProductCard/ProductCard';
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
    fetch(`${API_URL}/productos?limit=8`)
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
    galleryImages = realProduct.imagenes.map((img: any) => img.url.startsWith('http') ? img.url : `http://localhost:3001${img.url}`);
  } else if (realProduct?.tipo_producto === 'COMBO' && realProduct.componentes_combo && realProduct.componentes_combo.length > 0) {
    const compImages: string[] = [];
    realProduct.componentes_combo.forEach((c: any) => {
      const img = c.componente_producto?.imagenes?.[0]?.url;
      if (img) compImages.push(img.startsWith('http') ? img : `http://localhost:3001${img}`);
    });
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
      setPreviewImageUrl(`http://localhost:3001${selectedVariante.imagen_url}`);
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
  const naturaleza = realProduct ? (realProduct.naturaleza || realProduct.categoria?.nombre) : fallbackProduct.category;
  const atributos = realProduct?.atributos || {};

  const isBook = naturaleza?.toLowerCase().includes('texto') || naturaleza?.toLowerCase().includes('lector');
  const brandLabel = isBook ? 'Editorial' : 'Marca';

  // Combo calculations
  const isCombo = realProduct?.tipo_producto === 'COMBO';
  const comboComponentes = isCombo ? (realProduct?.componentes_combo || []) : [];
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
    ? realRelatedProducts.map(p => ({
        id: p.id,
        title: p.nombre,
        category: p.naturaleza || p.categoria?.nombre || 'General',
        price: Number(p.precio_promocional || p.precio_base),
        imageUrl: p.imagenes?.[0]?.url ? `http://localhost:3001${p.imagenes[0].url}` : "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop",
        badge: p.precio_promocional ? 'Oferta' : undefined
      }))
    : [];

  return (
    <div className={styles.pageWrapper}>
      <main className={styles.mainContent}>
        
        {/* Breadcrumb */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <Link href="/">Inicio</Link>
          <span className={styles.separator}>/</span>
          <Link href="/material-escolar">Material Escolar</Link>
          <span className={styles.separator}>/</span>
          <span className={styles.current}>{naturaleza || 'Producto'}</span>
        </nav>

        {/* MAIN PRODUCT AREA */}
        <div className={styles.productContainer}>
          
          {/* Left: Main Image Only (Variants act as gallery) */}
          <div className={styles.gallerySection}>
            <div className={styles.mainImageWrapper}>
              {(hasPromo || comboAhorro > 0) && (
                <span className={styles.badge}>
                  -{hasPromo ? discountPercent : comboAhorroPct}%
                </span>
              )}
              <div className={styles.mainImageInner}>
                <Image 
                  src={currentMainImage} 
                  alt={title} 
                  fill
                  priority
                  className={styles.mainImage}
                  sizes="(max-width: 768px) 100vw, 500px"
                />
              </div>
            </div>
            
            {galleryImages.length > 1 && (
              <div className={styles.thumbnailsContainer}>
                {galleryImages.map((img, index) => {
                  const isActive = !previewImageUrl && index === activeImageIndex;
                  return (
                    <button 
                      key={index}
                      className={`${styles.thumbnailBtn} ${isActive ? styles.activeThumbnail : ''}`}
                      onClick={() => handleThumbnailClick(index)}
                    >
                      <Image src={img} alt={`Thumbnail ${index}`} fill sizes="80px" style={{ objectFit: 'contain' }} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className={styles.infoSection}>
            <h1 className={styles.title}>{title}</h1>
            
            {/* Price display with promo or combo savings strikethrough */}
            <div className={styles.priceContainer}>
              {hasPromo ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                  <span className={styles.price} style={{ color: '#ef4444' }}>Bs. {promoPrice?.toFixed(2)}</span>
                  <span className={styles.oldPrice}>Bs. {basePrice.toFixed(2)}</span>
                </div>
              ) : comboAhorro > 0 ? (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                  <span className={styles.price}>Bs. {basePrice.toFixed(2)}</span>
                  <span className={styles.oldPrice}>Bs. {componentesSubtotal.toFixed(2)}</span>
                </div>
              ) : (
                <span className={styles.price}>Bs. {basePrice.toFixed(2)}</span>
              )}
            </div>
            
            <div className={styles.availability}>
              Disponible en stock
            </div>

            {realProduct?.descripcion ? (
              <p className={styles.productDescription}>{realProduct.descripcion}</p>
            ) : (
              <ul className={styles.metaSummaryList}>
                {brand && <li><strong>{brandLabel}:</strong> {brand}</li>}
                {naturaleza && <li><strong>Categoría:</strong> {naturaleza}</li>}
                {sku && <li><strong>SKU:</strong> {sku}</li>}
              </ul>
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
                    const fullImgUrl = compImg ? (compImg.startsWith('http') ? compImg : `http://localhost:3001${compImg}`) : null;
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
                            src={v.imagen_url ? `http://localhost:3001${v.imagen_url}` : (galleryImages[0] || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=200&auto=format&fit=crop")}
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
                disabled={(realProduct?.variantes?.length > 0 && !selectedVariante) || (selectedVariante && selectedVariante.empaques?.length > 0 && !selectedEmpaque)}
                onClick={() => {
                  const item = {
                    id: selectedEmpaque ? `${id}-${selectedVariante?.id}-${selectedEmpaque.id}` : (selectedVariante ? `${id}-${selectedVariante.id}` : id),
                    title: `${title}${selectedVariante ? ` - ${selectedVariante.nombre}` : ''}${selectedEmpaque ? ` (${selectedEmpaque.nombre})` : ''}`,
                    category: naturaleza,
                    price: promoPrice !== null ? promoPrice : basePrice,
                    imageUrl: currentMainImage
                  };
                  addToCart(item, qty);
                  alert('¡Producto agregado al carrito!');
                }}
              >
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
                    <span className={styles.specValue}>{brand}</span>
                  </div>
                )}
                <div className={styles.specRow}>
                  <span className={styles.specLabel}>Categoría</span>
                  <span className={styles.specValue}>{naturaleza}</span>
                </div>
                {Object.entries(atributos).map(([key, val]) => (
                  <div className={styles.specRow} key={key}>
                    <span className={styles.specLabel}>{key.replace(/_/g, ' ')}</span>
                    <span className={styles.specValue}>{String(val)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {/* Related Products */}
        <section className={styles.relatedSection}>
          <h2 className={styles.sectionTitle}>Completa tu carrito</h2>
          <div className={styles.relatedGrid}>
            {displayRelated.map(item => (
              <ProductCard 
                key={item.id}
                title={item.title}
                category={item.category}
                categoryColor={getLevelColor(item.category)}
                price={item.price}
                imageUrl={item.imageUrl}
                badge={item.badge}
              />
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

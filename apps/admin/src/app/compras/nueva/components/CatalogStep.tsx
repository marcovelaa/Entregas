import React, { useMemo, useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Producto } from './NuevaCompraTypes';
import styles from '../page.module.css';

interface CatalogStepProps {
  productos: Producto[];
  loadingCatalog: boolean;
  onProductClick: (product: Producto) => void;
}

export function CatalogStep({ productos, loadingCatalog, onProductClick }: CatalogStepProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return productos;
    const lower = searchQuery.toLowerCase();
    return productos.filter(p => 
      p.nombre.toLowerCase().includes(lower) || 
      p.sku.toLowerCase().includes(lower)
    );
  }, [productos, searchQuery]);

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input 
          type="text" 
          className={styles.searchBar} 
          placeholder="Buscar producto por nombre o SKU..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ paddingLeft: '2.5rem' }}
        />
      </div>

      {loadingCatalog ? (
        <div className={styles.loadingCenter}>
          <Loader2 className={styles.spin} size={32} />
        </div>
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map(p => (
            <div key={p.id} className={styles.productCard} onClick={() => onProductClick(p)}>
              <div className={styles.productName}>{p.nombre}</div>
              <div className={styles.productSku}>SKU: {p.sku}</div>
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
                Base: Bs. {Number(p.precio_base).toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { Product } from '../types/product';

export const mockProducts: Product[] = [
  {
    id: '1',
    title: 'Trazos y Colores - Prekínder',
    category: 'INICIAL',
    price: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
    editorial: 'Entregas Ediciones',
    inStock: true
  },
  {
    id: '2',
    title: 'Lenguaje y Lectura - 2do Primaria',
    category: 'PRIMARIA',
    price: 85.00,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
    editorial: 'Hogwarts Press',
    inStock: true,
    badge: 'Nuevo'
  },
  {
    id: '3',
    title: 'Matemáticas Avanzadas - 5to Secundaria',
    category: 'SECUNDARIA',
    price: 120.00,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
    editorial: 'Entregas Ediciones',
    inStock: true
  },
  {
    id: '4',
    title: 'El Principito - Edición Escolar',
    category: 'PLAN LECTOR',
    price: 55.00,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
    editorial: 'Salamandra',
    inStock: true,
    badge: 'Top'
  },
  {
    id: '5',
    title: 'Biología Celular',
    category: 'SECUNDARIA',
    price: 130.00,
    imageUrl: '/products/premium_sneakers.jpg',
    editorial: 'Pearson',
    inStock: true
  },
  {
    id: '6',
    title: 'Abejitas 1 - Lectoescritura',
    category: 'INICIAL',
    price: 50.00,
    imageUrl: '/products/premium_sneakers.jpg',
    editorial: 'La Hoguera',
    inStock: true
  }
];

export const getLevelColor = (level: string) => {
  switch (level) {
    case 'INICIAL': return 'var(--color-red)';
    case 'PRIMARIA': return 'var(--color-yellow)';
    case 'SECUNDARIA': return 'var(--color-green)';
    case 'PLAN LECTOR': return 'var(--color-blue)';
    default: return 'var(--text-muted)';
  }
};

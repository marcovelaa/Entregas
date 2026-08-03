export type EducationLevel = 'INICIAL' | 'PRIMARIA' | 'SECUNDARIA' | 'PLAN LECTOR' | 'PRE-U' | 'MATERIAL ESCOLAR' | 'Papel';

export interface Product {
  id: string;
  title: string;
  category: EducationLevel;
  price: number;
  imageUrl: string;
  badge?: string;
  editorial?: string;
  inStock: boolean;
}

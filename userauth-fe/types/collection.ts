export interface IProduct {
  id: string; collection_id: string; image_url: string; url: string; title: string;
  description: string | null; shop: string | null; category: string | null; created_at: string;
}
export interface ICollection {
  id: string; parent_id: string | null; name: string; slug: string; description: string | null;
  image_url: string | null; created_at: string; children: ICollection[]; products: IProduct[];
}
export interface ICollectionPayload { name: string; description?: string; image_url?: string; parent_id?: string; }
export interface IProductPayload {
  collection_id: string; image_url: string; url: string; title: string;
  description?: string; shop?: string; category?: string;
}
export interface IProductPage { items: IProduct[]; total: number; page: number; page_size: number; }

import { apiRequest } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { ICollection, ICollectionPayload, IProduct, IProductPage, IProductPayload } from "@/types/collection";

export const collectionService = {
  list: () => apiRequest<ICollection[]>(API_ENDPOINTS.catalog.collections),
  get: (slug: string) => apiRequest<ICollection>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(slug)}`),
  products: (slug: string, page: number, category: string, shop: string) => {
    const query = new URLSearchParams({ page: String(page), page_size: "12" });
    if (category) query.set("category", category);
    if (shop) query.set("shop", shop);
    return apiRequest<IProductPage>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(slug)}/products?${query}`);
  },
  product: (id: string) => apiRequest<IProduct>(`${API_ENDPOINTS.catalog.products}/${encodeURIComponent(id)}`),
  create: (data: ICollectionPayload) => apiRequest<ICollection>(API_ENDPOINTS.catalog.collections, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
  createProduct: (data: IProductPayload) => apiRequest<IProduct>(API_ENDPOINTS.catalog.products, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
};

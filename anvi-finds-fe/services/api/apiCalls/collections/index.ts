import { apiRequest } from "@/services/api/client";
import { API_ENDPOINTS } from "@/services/api/endpoints";
import type { ICollection, ICollectionPayload, IProduct, IProductPage, IProductPayload } from "@/types/collection";

export const collectionService = {
  list: () => apiRequest<ICollection[]>(API_ENDPOINTS.catalog.collections),
  adminList: () => apiRequest<ICollection[]>("/admin/collections", { refreshOnUnauthorized: true }),
  get: (slug: string) => apiRequest<ICollection>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(slug)}`),
  products: (slug: string, page: number) => {
    const query = new URLSearchParams({ page: String(page), page_size: "12" });
    return apiRequest<IProductPage>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(slug)}/products?${query}`);
  },
  product: (id: string) => apiRequest<IProduct>(`${API_ENDPOINTS.catalog.products}/${encodeURIComponent(id)}`),
  adminProduct: (id: string) => apiRequest<IProduct>(`/admin/products/${encodeURIComponent(id)}`, { refreshOnUnauthorized: true }),
  updateCollection: (id: string, data: Partial<ICollectionPayload>) => apiRequest<ICollection>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
  deleteCollection: (id: string) => apiRequest<null>(`${API_ENDPOINTS.catalog.collections}/${encodeURIComponent(id)}`, { method: "DELETE", refreshOnUnauthorized: true }),
  updateProduct: (id: string, data: Partial<IProductPayload>) => apiRequest<IProduct>(`${API_ENDPOINTS.catalog.products}/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
  deleteProduct: (id: string) => apiRequest<null>(`${API_ENDPOINTS.catalog.products}/${encodeURIComponent(id)}`, { method: "DELETE", refreshOnUnauthorized: true }),
  create: (data: ICollectionPayload) => apiRequest<ICollection>(API_ENDPOINTS.catalog.collections, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
  createProduct: (data: IProductPayload) => apiRequest<IProduct>(API_ENDPOINTS.catalog.products, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data), refreshOnUnauthorized: true }),
};

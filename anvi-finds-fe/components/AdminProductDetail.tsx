"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { ICollection, IProduct } from "@/types/collection";
import "@/assets/css/catalog.css";

function flatten(rows: ICollection[]): ICollection[] { return rows.flatMap((item) => [item, ...flatten(item.children ?? [])]); }

export default function AdminProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const [product, setProduct] = useState<IProduct | null>(null);
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { void Promise.all([collectionService.adminProduct(id), collectionService.adminList()]).then(([item, rows]) => { setProduct(item); setCollections(rows); }).catch((e) => setError(errorMessage(e, "Could not load this product."))); }, [id]);
  const all = flatten(collections);
  const owningCollection = product ? all.find((item) => item.id === product.collection_id) : undefined;
  const ancestors = owningCollection ? (() => { const chain: ICollection[] = []; let parentId = owningCollection.parent_id; while (parentId) { const parent = all.find((item) => item.id === parentId); if (!parent) break; chain.unshift(parent); parentId = parent.parent_id; } return chain; })() : [];
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!product) return; setSaving(true); setError(""); setNotice(""); const form = new FormData(event.currentTarget);
    try { const updated = await collectionService.updateProduct(product.id, { image_url: String(form.get("image_url")), url: String(form.get("url")), title: String(form.get("title")), description: String(form.get("description") || "") || null, collection_id: String(form.get("collection_id")) }); setProduct(updated); setNotice("Product details saved."); }
    catch (e) { setError(errorMessage(e, "Could not save this product.")); } finally { setSaving(false); }
  }
  async function remove() { if (!product || !window.confirm(`Delete “${product.title}”?`)) return; try { await collectionService.deleteProduct(product.id); router.replace(owningCollection ? `/collections/manage/${owningCollection.slug}` : "/collections/manage"); } catch (e) { setError(errorMessage(e, "Could not delete this product.")); } }
  if (error && !product) return <main className="manager-shell"><p role="alert" className="catalog-error">{error}</p><Link href="/collections/manage">← Back to catalog manager</Link></main>;
  if (!product) return <main className="manager-shell"><p className="catalog-loading">Loading product…</p></main>;
  return <main className="manager-shell"><div className="breadcrumbs admin-breadcrumbs"><Link href="/collections/manage">Catalog manager</Link><span>/</span>{ancestors.map((parent) => <span key={parent.id}><Link href={`/collections/manage/${parent.slug}`}>{parent.name}</Link><span> / </span></span>)}{owningCollection && <><Link href={`/collections/manage/${owningCollection.slug}`}>{owningCollection.name}</Link><span>/</span></>}<strong>{product.title}</strong></div>
    <div className="admin-detail-head"><div><p className="catalog-overline">PRODUCT DETAIL</p><h1>{product.title}</h1><p>{owningCollection?.shop || "No shop selected"} · {owningCollection?.category || "Uncategorized"}</p></div><button type="button" className="danger-button" onClick={remove}>Delete product</button></div>
    {notice && <p role="status" className="success-note">{notice}</p>}{error && <p role="alert" className="catalog-error">{error}</p>}
    <div className="admin-product-detail"><img src={product.image_url} alt={product.title}/><form className="manager-card" onSubmit={save}><p className="catalog-overline">EDIT PRODUCT</p><h2>Product details</h2><label>Image URL *<input name="image_url" type="url" required defaultValue={product.image_url}/></label><label>Product URL *<input name="url" type="url" required defaultValue={product.url}/></label><label>Title *<input name="title" required defaultValue={product.title}/></label><label>Description<textarea name="description" rows={3} defaultValue={product.description ?? ""}/></label><label>Collection *<select name="collection_id" required defaultValue={product.collection_id}>{all.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><button disabled={saving}>{saving ? "Saving…" : "Save product"}</button></form></div>
  </main>;
}

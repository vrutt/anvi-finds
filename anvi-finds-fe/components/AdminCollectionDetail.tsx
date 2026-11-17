"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { ICollection } from "@/types/collection";
import "@/assets/css/catalog.css";

function flatten(rows: ICollection[]): ICollection[] { return rows.flatMap((item) => [item, ...flatten(item.children ?? [])]); }

export default function AdminCollectionDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const [tree, setTree] = useState<ICollection[]>([]);
  const [item, setItem] = useState<ICollection | null>(null);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => { void collectionService.adminList().then((rows) => { setTree(rows); const found = flatten(rows).find((entry) => entry.slug === slug); if (found) setItem(found); else setError("Collection not found."); }).catch((e) => setError(errorMessage(e, "Could not load this collection."))); }, [slug]);
  const all = flatten(tree);
  const ancestors = item ? (() => { const chain: ICollection[] = []; let parentId = item.parent_id; while (parentId) { const parent = all.find((entry) => entry.id === parentId); if (!parent) break; chain.unshift(parent); parentId = parent.parent_id; } return chain; })() : [];
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!item) return; setSaving(true); setError(""); setNotice(""); const form = new FormData(event.currentTarget);
    const image_urls = [0, 1, 2].map((index) => String(form.get(`image_${index}`) || "")).filter(Boolean);
    try { const updated = await collectionService.updateCollection(item.id, { name: String(form.get("name")), description: String(form.get("description") || "") || null, image_urls, reel_number: String(form.get("reel_number") || "") ? Number(form.get("reel_number")) : null, shop: String(form.get("shop") || "") || null, category: String(form.get("category") || "") || null }); setItem({ ...item, ...updated, children: item.children, products: item.products }); setEditing(false); setNotice("Collection updated."); if (updated.slug !== slug) router.replace(`/collections/manage/${updated.slug}`); }
    catch (e) { setError(errorMessage(e, "Could not update this collection.")); } finally { setSaving(false); }
  }
  async function remove() { if (!item || !window.confirm(`Delete “${item.name}” and all its nested collections and products?`)) return; try { await collectionService.deleteCollection(item.id); router.replace("/collections/manage"); } catch (e) { setError(errorMessage(e, "Could not delete this collection.")); } }
  if (error && !item) return <main className="manager-shell"><p className="catalog-error" role="alert">{error}</p><Link href="/collections/manage">← Back to catalog manager</Link></main>;
  if (!item) return <main className="manager-shell"><p className="catalog-loading">Loading collection…</p></main>;
  return <main className="manager-shell"><div className="breadcrumbs admin-breadcrumbs"><Link href="/collections/manage">Catalog manager</Link><span>/</span>{ancestors.map((parent) => <span key={parent.id}><Link href={`/collections/manage/${parent.slug}`}>{parent.name}</Link><span> / </span></span>)}<strong>{item.name}</strong></div>
    <div className="admin-detail-head"><div><p className="catalog-overline">COLLECTION DETAIL</p><h1>{item.name}</h1><p>{item.description || "No description has been added."}</p></div><div className="admin-actions"><button type="button" onClick={() => setEditing(!editing)}>{editing ? "Cancel edit" : "Edit collection"}</button><button type="button" className="danger-button" onClick={remove}>Delete</button></div></div>
    {notice && <p className="success-note" role="status">{notice}</p>}{error && <p className="catalog-error" role="alert">{error}</p>}
    {editing && <form className="manager-card edit-card" onSubmit={save}><h2>Edit collection</h2><label>Name *<input name="name" required defaultValue={item.name}/></label><label>Reel number<input name="reel_number" type="number" min="0" step="1" defaultValue={item.reel_number ?? ""}/></label><div className="manager-row"><label>Shop<select name="shop" defaultValue={item.shop ?? ""}><option value="">Choose shop</option><option>Amazon</option><option>Myntra</option><option>Meesho</option></select></label><label>Category<input name="category" defaultValue={item.category ?? ""}/></label></div><div className="image-url-fields"><p>Collection images (up to 3)</p>{[0,1,2].map((index) => <label key={index}>Image {index + 1} URL<input type="url" name={`image_${index}`} defaultValue={item.image_urls?.[index] ?? ""}/></label>)}</div><label>Description<textarea name="description" rows={3} defaultValue={item.description ?? ""}/></label><button disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></form>}
    {!!item.image_urls?.length && <div className="admin-image-gallery">{item.image_urls.map((image) => <img key={image} src={image} alt="Collection"/>)}</div>}
    <div className="section-heading admin-section-title"><div><p className="catalog-overline">NESTED COLLECTIONS</p><h2>Inside this edit</h2></div><span>{item.children.length} collections</span></div>
    {item.children.length ? <div className="admin-list">{item.children.map((child) => <Link className="admin-list-row" href={`/collections/manage/${child.slug}`} key={child.id}><span><strong>{child.name}</strong><small>{child.children.length} subcollections · {child.products.length} products</small></span><span>Open detail →</span></Link>)}</div> : <p className="admin-empty">No subcollections yet.</p>}
    <div className="section-heading admin-section-title"><div><p className="catalog-overline">PRODUCT LISTING</p><h2>Products in {item.name}</h2></div><span>{item.products.length} products</span></div>
    {item.products.length ? <div className="admin-products">{item.products.map((product) => <Link className="admin-product-row" href={`/collections/manage/products/${product.id}`} key={product.id}><img src={product.image_url} alt=""/><span><strong>{product.title}</strong><small>{item.shop || "No shop"} · {item.category || "Uncategorized"}</small></span><span>View detail →</span></Link>)}</div> : <p className="admin-empty">No products in this collection yet.</p>}
  </main>;
}

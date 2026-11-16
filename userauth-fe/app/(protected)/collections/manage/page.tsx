"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { ICollection } from "@/types/collection";
import "@/assets/css/catalog.css";

function flatten(rows: ICollection[]): ICollection[] { return rows.flatMap((row) => [row, ...flatten(row.children ?? [])]); }

export default function CatalogManager() {
  const [collections, setCollections] = useState<ICollection[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [parentId, setParentId] = useState("");
  const [productCollection, setProductCollection] = useState("");
  const [collectionImages, setCollectionImages] = useState(["", "", ""]);
  const [productImage, setProductImage] = useState("");
  useEffect(() => { void collectionService.adminList().then(setCollections).catch(() => setError("Couldn't load collections.")); }, []);
  const all = flatten(collections);

  async function submitCollection(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await collectionService.create({ name: String(form.get("name")), description: String(form.get("description") || "") || undefined, image_urls: collectionImages.filter(Boolean), reel_number: String(form.get("reel_number") || "") ? Number(form.get("reel_number")) : null, shop: String(form.get("shop") || "") || null, category: String(form.get("category") || "") || null, parent_id: parentId || undefined });
      setNotice("Your collection is live in the catalog."); event.currentTarget.reset(); setParentId(""); setCollectionImages(["", "", ""]);
      setCollections(await collectionService.adminList());
    } catch (e) { setError(errorMessage(e, "Couldn't create this collection.")); } finally { setSaving(false); }
  }
  async function submitProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    const form = new FormData(event.currentTarget);
    try {
      await collectionService.createProduct({ collection_id: productCollection, image_url: productImage, url: String(form.get("url")), title: String(form.get("title")), description: String(form.get("description") || "") || undefined });
      setNotice("Product added to the selected collection."); event.currentTarget.reset(); setProductImage("");
    } catch (e) { setError(errorMessage(e, "Couldn't add this product.")); } finally { setSaving(false); }
  }
  return <main className="manager-shell"><div className="manager-top"><div><p className="catalog-overline">CATALOG STUDIO</p><h1>Make a little magic.</h1><p>Build an edit, tuck in a subcollection, and add the finds that belong.</p></div><Link href="/collections" className="manager-preview">View public catalog ↗</Link></div>
    {notice && <p className="success-note" role="status">{notice}</p>}{error && <p className="catalog-error" role="alert">{error}</p>}
    <div className="manager-grid"><form className="manager-card" onSubmit={submitCollection}><span className="step-mark">01</span><p className="catalog-overline">START AN EDIT</p><h2>Create a collection</h2><label>Collection name <b>*</b><input name="name" required maxLength={160} placeholder="e.g. Everyday favourites"/></label><label>Reel number<input name="reel_number" type="number" min="0" step="1" placeholder="e.g. 24"/></label><div className="manager-row"><label>Shop<select name="shop"><option value="">Choose shop</option><option>Amazon</option><option>Myntra</option><option>Meesho</option></select></label><label>Category<input name="category" placeholder="e.g. Short Kurtis"/></label></div><div className="image-url-fields"><p>Collection images (up to 3)</p>{collectionImages.map((image, index) => <label key={index}>Image {index + 1} URL<input type="url" value={image} onChange={(e) => setCollectionImages((values) => values.map((value, i) => i === index ? e.target.value : value))} placeholder="https://…"/></label>)}</div>{collectionImages.filter(Boolean).length > 0 && <div className="image-preview-row">{collectionImages.filter(Boolean).map((image) => <img className="image-preview" src={image} alt="Collection preview" key={image}/>)}</div>}<label>Description<textarea name="description" rows={4} placeholder="A little note about this edit"/></label><label>Parent collection<select value={parentId} onChange={(e) => setParentId(e.target.value)}><option value="">Top level collection</option>{all.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button disabled={saving}>{saving ? "Saving…" : "Create collection →"}</button></form>
    <form className="manager-card" onSubmit={submitProduct}><span className="step-mark">02</span><p className="catalog-overline">ADD A GOOD FIND</p><h2>Add a product</h2><label>Product image URL <b>*</b><input type="url" required value={productImage} onChange={(e) => setProductImage(e.target.value)} placeholder="https://…"/></label>{productImage && <img className="image-preview" src={productImage} alt="Product preview"/>}<label>Product URL <b>*</b><input name="url" type="url" required placeholder="https://shop…"/></label><label>Title <b>*</b><input name="title" required maxLength={240} placeholder="Product title"/></label><label>Description<textarea name="description" rows={3} placeholder="What makes it a find?"/></label><label>Add to collection <b>*</b><select required value={productCollection} onChange={(e) => setProductCollection(e.target.value)}><option value="">Choose a collection</option>{all.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><button disabled={saving || !productCollection}>{saving ? "Saving…" : "Add to collection →"}</button></form></div>
    <div className="section-heading admin-section-title"><div><p className="catalog-overline">YOUR CATALOG</p><h2>Collections & products</h2></div><span>{all.length} collections</span></div>
    <div className="admin-list">{collections.map((item) => <Link className="admin-list-row" href={`/collections/manage/${item.slug}`} key={item.id}><span><strong>{item.name}</strong><small>{item.children.length} subcollections · {item.products.length} products</small></span><span>Open detail →</span></Link>)}{!collections.length && <p className="admin-empty">Your catalog is ready for its first collection.</p>}</div>
  </main>;
}

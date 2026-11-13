"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { ICollection, IProduct } from "@/types/collection";
import "@/assets/css/catalog.css";

const PAGE_SIZE = 12;
const COLLECTION_PAGE_SIZE = 9;
function CollectionCard({ item }: { item: ICollection }) {
  return <Link className="catalog-card collection-card" href={`/collections/${item.slug}`}>
    <div className="catalog-image">{item.image_url ? <img src={item.image_url} alt="" /> : <span>✳</span>}</div>
    <div className="catalog-card-copy"><span className="card-kicker">{item.children?.length ?? 0} EDITS</span><h3>{item.name}</h3><p>{item.description || "A considered edit of pieces to love."}</p><span className="card-arrow">Explore collection ↗</span></div>
  </Link>;
}
function ProductCard({ item }: { item: IProduct }) {
  return <Link className="catalog-card product-card" href={`/products/${item.id}`}>
    <div className="catalog-image">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>✳</span>}</div>
    <div className="catalog-card-copy"><span className="card-kicker">{item.shop || "CURATED FIND"}{item.category ? ` · ${item.category}` : ""}</span><h3>{item.title}</h3><p>{item.description || "A find from our latest edit."}</p><span className="card-arrow">Shop the find ↗</span></div>
  </Link>;
}

export default function Catalog({ slug }: { slug?: string }) {
  const [collection, setCollection] = useState<ICollection | null>(null);
  const [roots, setRoots] = useState<ICollection[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const [category, setCategory] = useState("");
  const [shop, setShop] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let active = true;
    setBusy(true); setError("");
    const load = slug ? collectionService.get(slug) : collectionService.list();
    void load.then((data) => { if (active) slug ? setCollection(data as ICollection) : setRoots(data as ICollection[]); })
      .catch((e) => { if (active) setError(errorMessage(e, "We couldn't load this edit right now.")); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (!slug) return;
    let active = true;
    void collectionService.products(slug, page, category, shop).then((data) => { if (active) { setProducts(data.items); setTotalProducts(data.total); } })
      .catch((e) => { if (active) setError(errorMessage(e, "Products could not be loaded.")); });
    return () => { active = false; };
  }, [slug, page, category, shop]);

  const childCollections = collection?.children ?? [];
  const pageCount = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const pagedProducts = products;
  const collectionPageCount = Math.max(1, Math.ceil(roots.length / COLLECTION_PAGE_SIZE));
  const pagedCollections = roots.slice((collectionPage - 1) * COLLECTION_PAGE_SIZE, collectionPage * COLLECTION_PAGE_SIZE);
  const categories = [...new Set([...(collection?.products ?? []).map((p) => p.category), ...products.map((p) => p.category)].filter(Boolean))] as string[];
  const shops = [...new Set([...(collection?.products ?? []).map((p) => p.shop), ...products.map((p) => p.shop)].filter(Boolean))] as string[];

  return <main className="catalog-shell">
    <header className="catalog-nav"><Link href="/collections" className="brand-mark">the edit<span>.</span></Link><nav><Link href="/collections">Collections</Link><Link href="/login">Curator sign in</Link></nav></header>
    <section className="catalog-hero"><p className="catalog-overline">A LITTLE INSPIRATION, WELL FOUND</p><h1>Pieces worth<br/><em>passing along.</em></h1><p className="hero-subtitle">Thoughtful edits, lovely finds, and the stories behind them.</p><span className="hero-stamp">CURATED<br/>FOR YOU ✳</span></section>
    <div className="catalog-content">
      <div className="breadcrumbs"><Link href="/collections">All collections</Link>{collection && <><span>/</span><strong>{collection.name}</strong></>}</div>
      {collection && <div className="collection-heading"><div><p className="catalog-overline">THE COLLECTION</p><h2>{collection.name}</h2><p>{collection.description}</p></div>{collection.image_url && <img src={collection.image_url} alt=""/>}</div>}
      {error && <p role="alert" className="catalog-error">{error}</p>}
      {busy ? <p className="catalog-loading">Gathering the good things…</p> : <>
        {!slug && <><div className="section-heading"><div><p className="catalog-overline">BROWSE THE EDITS</p><h2>Find your kind of lovely</h2></div><span>{roots.length} collections</span></div><div className="catalog-grid">{pagedCollections.map((item) => <CollectionCard item={item} key={item.id}/>)}</div>{collectionPageCount > 1 && <div className="pagination"><button disabled={collectionPage <= 1} onClick={() => setCollectionPage(collectionPage-1)}>← Previous</button><span>Page {collectionPage} of {collectionPageCount}</span><button disabled={collectionPage >= collectionPageCount} onClick={() => setCollectionPage(collectionPage+1)}>Next →</button></div>}</>}
        {slug && <>
          {childCollections.length > 0 && <><div className="section-heading"><div><p className="catalog-overline">MORE TO EXPLORE</p><h2>Inside this edit</h2></div></div><div className="catalog-grid">{childCollections.map((item) => <CollectionCard item={item} key={item.id}/>)}</div></>}
          {(products.length > 0 || !childCollections.length) && <><div className="section-heading product-section-title"><div><p className="catalog-overline">THE GOOD FINDS</p><h2>Shop the collection</h2></div><div className="filters"><label>Category<select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}><option value="">All categories</option>{categories.map((x) => <option key={x}>{x}</option>)}</select></label><label>Shop<select value={shop} onChange={(e) => { setShop(e.target.value); setPage(1); }}><option value="">All shops</option>{shops.map((x) => <option key={x}>{x}</option>)}</select></label><label>Sort<select defaultValue="recent"><option value="recent">Most recent</option></select></label></div></div>{pagedProducts.length ? <div className="catalog-grid">{pagedProducts.map((p) => <ProductCard item={p} key={p.id}/>)}</div> : <p className="empty-state">No finds here just yet. Try another edit soon.</p>}{pageCount > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page-1)}>← Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(page+1)}>Next →</button></div>}</>}
        </>}
      </>}
      <footer className="catalog-footer">A thoughtful little corner of the internet <span>✳</span></footer>
    </div>
  </main>;
}

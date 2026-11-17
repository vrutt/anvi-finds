"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { ICollection, IProduct } from "@/types/collection";
import "@/assets/css/catalog.css";

const PAGE_SIZE = 12;
const COLLECTION_PAGE_SIZE = 9;

function CollectionCard({ item }: { item: ICollection }) {
  const [active, setActive] = useState(0);
  const images = item.image_urls ?? [];
  useEffect(() => {
    if (images.length < 2) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % images.length), 1800);
    return () => window.clearInterval(timer);
  }, [images.length]);
  return <article className="catalog-card collection-card">
    <div className="catalog-image">{images.length ? <Link href={`/collections/${item.slug}`} aria-label={`Open ${item.name}`}><img src={images[active % images.length]} alt={`${item.name}, image ${(active % images.length) + 1}`} /></Link> : <span>✳</span>}
      {images.length > 1 && <><button className="card-carousel-arrow card-carousel-prev" type="button" aria-label={`Previous ${item.name} image`} onClick={() => setActive((active + images.length - 1) % images.length)}>←</button><button className="card-carousel-arrow card-carousel-next" type="button" aria-label={`Next ${item.name} image`} onClick={() => setActive((active + 1) % images.length)}>→</button><div className="card-carousel-dots">{images.map((image, index) => <button key={`${image}-${index}`} type="button" aria-label={`Show image ${index + 1}`} aria-current={active === index} onClick={() => setActive(index)} />)}</div></>}
    </div>
    <Link className="catalog-card-copy" href={`/collections/${item.slug}`}>
      {item.reel_number != null ? <span className="reel-number-display"><small>REEL</small><strong>{item.reel_number}</strong></span> : <span className="card-kicker">{item.children?.length ?? 0} EDITS</span>}
      <h3>{item.name}</h3><p>{item.description || "A considered edit of pieces to love."}</p><span className="card-arrow">Explore collection ↗</span>
    </Link>
  </article>;
}

function ProductCard({ item }: { item: IProduct }) {
  return <Link className="catalog-card product-card" href={`/products/${item.id}`}>
    <div className="catalog-image">{item.image_url ? <img src={item.image_url} alt={item.title} /> : <span>✳</span>}</div>
    <div className="catalog-card-copy"><span className="card-kicker">CURATED FIND</span><h3>{item.title}</h3><p>{item.description || "A find from our latest edit."}</p><span className="card-arrow">Shop the find ↗</span></div>
  </Link>;
}

export default function Catalog({ slug }: { slug?: string }) {
  const [collection, setCollection] = useState<ICollection | null>(null);
  const [roots, setRoots] = useState<ICollection[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [page, setPage] = useState(1);
  const [collectionPage, setCollectionPage] = useState(1);
  const [nameSearch, setNameSearch] = useState("");
  const [reelSearch, setReelSearch] = useState("");
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
    void collectionService.products(slug, page).then((data) => { if (active) { setProducts(data.items); setTotalProducts(data.total); } })
      .catch((e) => { if (active) setError(errorMessage(e, "Products could not be loaded.")); });
    return () => { active = false; };
  }, [slug, page]);

  const childCollections = collection?.children ?? [];
  const pageCount = Math.max(1, Math.ceil(totalProducts / PAGE_SIZE));
  const categories = [...new Set(roots.map((item) => item.category).filter(Boolean))] as string[];
  const shops = [...new Set(roots.map((item) => item.shop).filter(Boolean))] as string[];
  const filteredCollections = useMemo(() => roots.filter((item) =>
    (!nameSearch || item.name.toLowerCase().includes(nameSearch.trim().toLowerCase())) &&
    (!reelSearch || String(item.reel_number ?? "").includes(reelSearch)) &&
    (!category || item.category === category) && (!shop || item.shop === shop)),
  [roots, nameSearch, reelSearch, category, shop]);
  const collectionPageCount = Math.max(1, Math.ceil(filteredCollections.length / COLLECTION_PAGE_SIZE));
  const pagedCollections = filteredCollections.slice((collectionPage - 1) * COLLECTION_PAGE_SIZE, collectionPage * COLLECTION_PAGE_SIZE);

  return <main className="catalog-shell">
    <header className="catalog-nav"><Link href="/collections" className="brand-mark">the edit<span>.</span></Link><nav><Link href="/collections">Collections</Link><Link href="/login">Curator sign in</Link></nav></header>
    <section className="catalog-hero"><p className="catalog-overline">A LITTLE INSPIRATION, WELL FOUND</p><h1>Pieces worth<br/><em>passing along.</em></h1><p className="hero-subtitle">Thoughtful edits, lovely finds, and the stories behind them.</p><span className="hero-stamp">CURATED<br/>FOR YOU ✳</span></section>
    <div className="catalog-content">
      <div className="breadcrumbs"><Link href="/collections">All collections</Link>{collection && <><span>/</span><strong>{collection.name}</strong></>}</div>
      {collection && <div className="collection-heading"><div><p className="catalog-overline">{collection.reel_number != null ? `Curation · Reel ${collection.reel_number}` : "THE COLLECTION"}</p><h2>{collection.name}</h2><p>{collection.description}</p>{(collection.shop || collection.category) && <div className="collection-tags">{collection.shop && <span>{collection.shop}</span>}{collection.category && <span>{collection.category}</span>}</div>}</div></div>}
      {error && <p role="alert" className="catalog-error">{error}</p>}
      {busy ? <p className="catalog-loading">Gathering the good things…</p> : <>
        {!slug && <><div className="section-heading"><div><p className="catalog-overline">BROWSE THE EDITS</p><h2>Find your kind of lovely</h2></div><span>{filteredCollections.length} collections</span></div><div className="collection-filters"><label>Search collections<input type="search" value={nameSearch} onChange={(e) => { setNameSearch(e.target.value); setCollectionPage(1); }} placeholder="Collection name"/></label><label>Reel number<input type="number" min="0" inputMode="numeric" value={reelSearch} onChange={(e) => { setReelSearch(e.target.value); setCollectionPage(1); }} placeholder="Search reel #"/></label><label>Category<select value={category} onChange={(e) => { setCategory(e.target.value); setCollectionPage(1); }}><option value="">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}</select></label><label>Shop<select value={shop} onChange={(e) => { setShop(e.target.value); setCollectionPage(1); }}><option value="">All shops</option>{shops.map((value) => <option key={value}>{value}</option>)}</select></label><label>Sort<select defaultValue="recent"><option value="recent">Most recent</option></select></label></div><div className="catalog-grid">{pagedCollections.map((item) => <CollectionCard item={item} key={item.id}/>)}</div>{!pagedCollections.length && <p className="empty-state">No collections match those filters.</p>}{collectionPageCount > 1 && <div className="pagination"><button disabled={collectionPage <= 1} onClick={() => setCollectionPage(collectionPage-1)}>← Previous</button><span>Page {collectionPage} of {collectionPageCount}</span><button disabled={collectionPage >= collectionPageCount} onClick={() => setCollectionPage(collectionPage+1)}>Next →</button></div>}</>}
        {slug && <>
          {childCollections.length > 0 && <><div className="section-heading"><div><p className="catalog-overline">MORE TO EXPLORE</p><h2>Inside this edit</h2></div></div><div className="catalog-grid">{childCollections.map((item) => <CollectionCard item={item} key={item.id}/>)}</div></>}
          {(products.length > 0 || !childCollections.length) && <><div className="section-heading product-section-title"><div><p className="catalog-overline">THE GOOD FINDS</p><h2>Shop the collection</h2></div></div>{products.length ? <div className="catalog-grid">{products.map((product) => <ProductCard item={product} key={product.id}/>)}</div> : <p className="empty-state">No finds here just yet. Try another edit soon.</p>}{pageCount > 1 && <div className="pagination"><button disabled={page <= 1} onClick={() => setPage(page-1)}>← Previous</button><span>Page {page} of {pageCount}</span><button disabled={page >= pageCount} onClick={() => setPage(page+1)}>Next →</button></div>}</>}
        </>}
      </>}
      <footer className="catalog-footer">A thoughtful little corner of the internet <span>✳</span></footer>
    </div>
  </main>;
}

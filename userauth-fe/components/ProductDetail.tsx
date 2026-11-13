"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collectionService } from "@/services/api/apiCalls/collections";
import { errorMessage } from "@/services/api/client";
import type { IProduct } from "@/types/collection";
import "@/assets/css/catalog.css";

export default function ProductDetail({ id }: { id: string }) {
  const [product, setProduct] = useState<IProduct | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { void collectionService.product(id).then(setProduct).catch((e) => setError(errorMessage(e, "We couldn't find this product."))); }, [id]);
  return <main className="catalog-shell"><header className="catalog-nav"><Link href="/collections" className="brand-mark">the edit<span>.</span></Link><nav><Link href="/collections">Collections</Link><Link href="/login">Curator sign in</Link></nav></header><div className="product-detail-wrap"><p className="breadcrumbs"><Link href="/collections">All collections</Link><span>/</span> A good find</p>{error ? <p role="alert" className="catalog-error">{error}</p> : !product ? <p className="catalog-loading">Finding the details…</p> : <article className="product-detail"><img src={product.image_url} alt={product.title}/><div><p className="catalog-overline">{product.shop || "CURATED FIND"}{product.category ? ` · ${product.category}` : ""}</p><h1>{product.title}</h1><p>{product.description || "A thoughtful find from our collection."}</p><a className="shop-button" href={product.url} target="_blank" rel="noreferrer">Shop this find ↗</a><p className="detail-note">You’ll continue to {product.shop || "the retailer"} to view this piece.</p></div></article>}</div></main>;
}

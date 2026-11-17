import Catalog from "@/components/Catalog";

export default async function CollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <Catalog slug={slug} />;
}

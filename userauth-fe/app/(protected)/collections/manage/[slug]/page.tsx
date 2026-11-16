import AdminCollectionDetail from "@/components/AdminCollectionDetail";

export default async function AdminCollectionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <AdminCollectionDetail slug={slug} />;
}

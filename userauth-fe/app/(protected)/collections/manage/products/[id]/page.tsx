import AdminProductDetail from "@/components/AdminProductDetail";

export default async function AdminProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminProductDetail id={id} />;
}

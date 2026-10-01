import { requireAdmin } from "@/lib/auth";
import { listCategoriesAdmin } from "@/lib/data/admin";
import { CategoriesManager } from "@/components/admin/CategoriesManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories | Admin" };

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const kind = sp.kind ?? "ALL";
  const categories = await listCategoriesAdmin(kind);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#07111F]">Categories</h1>
        <p className="text-sm text-[#334155]">Organise the storefront into categories, occasions and recipient groups.</p>
      </div>
      <CategoriesManager kind={kind} initial={categories.map(serialize)} />
    </div>
  );
}

type Row = Awaited<ReturnType<typeof listCategoriesAdmin>>[number];

function serialize(c: Row) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    kind: c.kind,
    description: c.description,
    image: c.image,
    sortOrder: c.sortOrder,
    active: c.active,
    productCount: c._count.products,
    childCount: c._count.children,
  };
}

export type SerializedCategory = ReturnType<typeof serialize>;

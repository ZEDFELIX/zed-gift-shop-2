import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { CollectionManager } from "@/components/admin/CollectionManager";
import { prisma } from "@/lib/prisma";
export const dynamic="force-dynamic";
export const metadata={title:"Collections | Admin"};
export default async function AdminCollectionsPage(){
 const user=await getCurrentUser();if(user?.role!=="ADMIN")redirect("/admin");
 const collections=await prisma.collection.findMany({include:{_count:{select:{products:true}}},orderBy:{updatedAt:"desc"}});
 return <CollectionManager initial={collections.map(c=>({id:c.id,name:c.name,slug:c.slug,description:c.description??"",image:c.image??"",featured:c.featured,productCount:c._count.products,updatedAt:c.updatedAt.toISOString()}))}/>;
}
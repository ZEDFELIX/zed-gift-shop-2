import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, fail } from "@/lib/api";
import { writeAuditLog,requestMeta } from "@/lib/audit";
const schema=z.object({name:z.string().trim().min(1).max(80),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100),description:z.string().max(2000).optional().nullable(),image:z.string().url().max(2000).optional().or(z.literal("")).nullable(),featured:z.boolean().optional()});
export const runtime="nodejs";
export async function GET(){try{await requirePermission("content.manage");const data=await prisma.collection.findMany({include:{_count:{select:{products:true}}},orderBy:{updatedAt:"desc"}});return NextResponse.json({data});}catch{return fail("You do not have permission to view collections.",403)}}
export async function POST(req:Request){let actor;try{actor=await requirePermission("content.manage")}catch{return fail("You do not have permission to manage collections.",403)}const parsed=schema.safeParse(await req.json().catch(()=>null));if(!parsed.success)return fail(parsed.error.issues[0]?.message??"Invalid collection.",400);try{const data=await prisma.collection.create({data:{...parsed.data,image:parsed.data.image||null,description:parsed.data.description||null}});const meta=await requestMeta();await writeAuditLog({...meta,actorId:actor.id,actorEmail:actor.email,actorRole:actor.role,action:"collection.created",entity:"Collection",entityId:data.id,after:data});return NextResponse.json({data},{status:201})}catch(e){const code=e&&typeof e==="object"&&"code"in e?String(e.code):"";return fail(code==="P2002"?"That collection slug is already in use.":"Could not create collection.",code==="P2002"?409:500)}}

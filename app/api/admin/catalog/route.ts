import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { catalogItems } from '@/db/schema';
import { isAdmin } from '@/lib/admin';
import { categories, loadStore } from '@/lib/store';

export async function GET(request:Request) {
  if (!isAdmin(request)) return Response.json({error:'Acesso restrito.'},{status:403});
  try { const { catalog } = await loadStore(); return Response.json({products:catalog}); }
  catch(error) { console.error(error); return Response.json({error:'Cardápio indisponível.'},{status:503}); }
}
export async function PUT(request:Request) {
  if (!isAdmin(request)) return Response.json({error:'Acesso restrito.'},{status:403});
  try {
    const input=await request.json() as Record<string,unknown>;
    const id=typeof input.id==='string' && /^[\w-]{1,60}$/.test(input.id)?input.id:crypto.randomUUID();
    const name=String(input.name??'').trim(), description=String(input.description??'').trim(), category=String(input.category??'');
    const price=Number(input.price), active=input.active===true;
    if(name.length<2 || name.length>100 || description.length>400 || !categories.includes(category as typeof categories[number]) || !Number.isInteger(price) || price<100 || price>100000) return Response.json({error:'Confira os dados e o preço do produto.'},{status:400});
    await getDb().insert(catalogItems).values({id,name,description,category,price,active,updatedAt:new Date().toISOString()}).onConflictDoUpdate({target:catalogItems.id,set:{name,description,category,price,active,updatedAt:new Date().toISOString()}});
    return Response.json({id});
  } catch(error) { console.error(error); return Response.json({error:'Não foi possível salvar o produto.'},{status:503}); }
}

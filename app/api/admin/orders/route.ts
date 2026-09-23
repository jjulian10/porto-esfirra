import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders } from '@/db/schema';
import { isAdmin } from '@/lib/admin';

const statuses = ['received', 'preparing', 'out_for_delivery', 'complete', 'cancelled'];
export async function GET(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Acesso restrito à equipe.' }, { status: 403 });
  try {
    const rows = await getDb().select().from(orders).orderBy(desc(orders.createdAt)).limit(100);
    return Response.json({ orders: rows.map(({itemsJson,trackingHash,checkoutKey,pixCode,pixQr,...row}) => ({ ...row, items: JSON.parse(itemsJson) })) });
  } catch (error) { console.error('Order listing failed', error); return Response.json({ error: 'Pedidos indisponíveis agora.' }, { status: 503 }); }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Acesso restrito à equipe.' }, { status: 403 });
  try {
    const input = await request.json() as { id?: unknown; status?: unknown; paidAmount?:unknown };
    if (typeof input.id !== 'string') return Response.json({ error: 'Alteração inválida.' }, { status: 400 });
    const [row]=await getDb().select().from(orders).where(eq(orders.id,input.id)).limit(1);
    if(!row) return Response.json({error:'Pedido não encontrado.'},{status:404});
    const changes:Partial<typeof orders.$inferInsert>={};
    if(typeof input.status==='string') {
      if(!statuses.includes(input.status)) return Response.json({error:'Status inválido.'},{status:400});
      if(row.paymentMethod==='pix' && row.paymentStatus!=='paid' && !['received','cancelled'].includes(input.status)) return Response.json({error:'Aguarde a confirmação integral do Pix antes de preparar o pedido.'},{status:409});
      changes.status=input.status;
    }
    if(input.paidAmount!==undefined){
      if(row.paymentMethod!=='at_pickup'||!Number.isInteger(input.paidAmount)||Number(input.paidAmount)<0||Number(input.paidAmount)>row.total) return Response.json({error:'Valor recebido inválido.'},{status:400});
      changes.paidAmount=Number(input.paidAmount);changes.paymentStatus=Number(input.paidAmount)>=row.total?'paid':Number(input.paidAmount)>0?'partial':'unpaid';
    }
    if(!Object.keys(changes).length) return Response.json({error:'Nenhuma alteração recebida.'},{status:400});
    const changed = await getDb().update(orders).set(changes).where(eq(orders.id, input.id)).returning({ id: orders.id });
    return changed.length ? Response.json({ ok: true }) : Response.json({ error: 'Pedido não encontrado.' }, { status: 404 });
  } catch (error) { console.error('Order update failed', error); return Response.json({ error: 'Não foi possível atualizar o pedido.' }, { status: 503 }); }
}

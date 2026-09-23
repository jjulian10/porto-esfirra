import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders } from '@/db/schema';

export async function GET(request:Request){
  const params=new URL(request.url).searchParams;
  const code=params.get('code')??'',token=params.get('token')??'';
  if(!/^[A-F0-9]{8}$/.test(code)||!/^[a-f0-9-]{36}$/i.test(token)) return Response.json({error:'Código inválido.'},{status:400});
  try{
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('');
    const [row]=await getDb().select().from(orders).where(eq(orders.code,code)).limit(1);
    if(!row || row.trackingHash!==hash) return Response.json({error:'Pedido não encontrado.'},{status:404});
    return Response.json({code:row.code,status:row.status,paymentStatus:row.paymentStatus,paidAmount:row.paidAmount,total:row.total||row.subtotal,qrCode:row.pixCode,qrBase64:row.pixQr},{headers:{'Cache-Control':'no-store'}});
  }catch(error){console.error(error);return Response.json({error:'Status indisponível.'},{status:503});}
}

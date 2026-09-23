import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders } from '@/db/schema';
import { fetchMpOrder, validMpSignature } from '@/lib/mercado-pago';
import { paymentState } from '@/lib/payment-state';

export async function POST(request:Request){
  const url=new URL(request.url),id=url.searchParams.get('data.id')??'';
  if(url.searchParams.get('type')!=='order'||!await validMpSignature(request,id)) return Response.json({error:'Notificação inválida.'},{status:401});
  try{
    const result=await fetchMpOrder(id);
    if(result.id.toLowerCase()!==id.toLowerCase()||!result.external_reference) return Response.json({ok:true});
    const db=getDb();
    const [row]=await db.select().from(orders).where(eq(orders.id,result.external_reference)).limit(1);
    if(!row || row.paymentMethod!=='pix' || row.providerOrderId!==result.id) return Response.json({ok:true});
    const amount=Math.round(Number(result.total_amount??'0')*100);
    if(amount!==row.total) {console.error('Provider total mismatch',row.id);return Response.json({error:'Valor divergente.'},{status:409});}
    const {paidAmount:paid,paymentStatus}=paymentState(result,row.total);
    const pix=result.transactions?.payments?.[0]?.payment_method;
    await db.update(orders).set({paidAmount:paid,paymentStatus,status:paymentStatus==='paid'&&row.status==='awaiting_payment'?'received':row.status,
      pixCode:pix?.qr_code??row.pixCode,pixQr:pix?.qr_code_base64??row.pixQr}).where(eq(orders.id,row.id));
    return Response.json({ok:true});
  }catch(error){console.error('Provider notification processing failed',error);return Response.json({error:'Não processado.'},{status:503});}
}

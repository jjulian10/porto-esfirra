import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { orders } from '@/db/schema';
import { loadStore } from '@/lib/store';
import { createPixOrder, paymentReady } from '@/lib/mercado-pago';
import { isAdmin } from '@/lib/admin';

type InputItem = { id?: unknown; quantity?: unknown };
const hash=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
const display=(row:typeof orders.$inferSelect)=>({code:row.code,trackingToken:undefined,subtotal:row.subtotal,deliveryFee:row.deliveryFee,total:row.total||row.subtotal,paymentMethod:row.paymentMethod,paymentStatus:row.paymentStatus,qrCode:row.pixCode,qrBase64:row.pixQr});

export async function POST(request:Request) {
  try {
    const payload=await request.json() as Record<string,unknown>;
    const name=String(payload.customerName??'').trim(),phone=String(payload.phone??'').trim(),email=String(payload.email??'').trim().toLowerCase();
    const fulfillment=String(payload.fulfillment??''),address=String(payload.address??'').trim(),note=String(payload.note??'').trim();
    const paymentMethod=String(payload.paymentMethod??'test'),zoneId=String(payload.zoneId??'');
    const checkoutKey=String(payload.checkoutKey??''),trackingToken=String(payload.trackingToken??'');
    const items=payload.items;
    if(name.length<2||name.length>80||!/^[0-9()+.\s-]{10,20}$/.test(phone)||!['pickup','delivery'].includes(fulfillment)||address.length>240||note.length>300||
      (fulfillment==='delivery'&&address.length<8)||!Array.isArray(items)||items.length<1||items.length>30||
      !/^[a-f0-9-]{36}$/i.test(checkoutKey)||!/^[a-f0-9-]{36}$/i.test(trackingToken)) return Response.json({error:'Confira seus dados e tente novamente.'},{status:400});
    const {catalog,zones,settings}=await loadStore();
    const demo=!settings.ordersEnabled;
    if(demo && !isAdmin(request)) return Response.json({error:'A loja ainda não está recebendo pedidos.'},{status:503});
    if(!demo && (fulfillment==='pickup'?!settings.pickupEnabled:!settings.deliveryEnabled)) return Response.json({error:'Esta modalidade não está disponível no momento.'},{status:400});
    if(!demo && !['pix','at_pickup'].includes(paymentMethod)) return Response.json({error:'Forma de pagamento inválida.'},{status:400});
    if(!demo && paymentMethod==='at_pickup' && (fulfillment!=='pickup'||!settings.payOnPickupEnabled)) return Response.json({error:'Pagamento na retirada indisponível.'},{status:400});
    if(!demo && paymentMethod==='pix' && (!settings.pixEnabled||!paymentReady())) return Response.json({error:'Pix indisponível no momento.'},{status:503});
    if(!demo && paymentMethod==='pix' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return Response.json({error:'Informe um e-mail válido para o Pix.'},{status:400});
    const zone=zones.find(z=>z.id===zoneId&&z.active);
    if(fulfillment==='delivery'&&!zone && !demo) return Response.json({error:'Escolha um bairro atendido.'},{status:400});
    const seen=new Set<string>();
    const selected=(items as InputItem[]).map(item=>{
      const id=String(item.id??''),quantity=item.quantity,p=catalog.find(p=>p.id===id&&p.active);
      if(!p||seen.has(id)||typeof quantity!=='number'||!Number.isInteger(quantity)||quantity<1||quantity>30) throw new Error('invalid-items');
      seen.add(id);return {id:p.id,name:p.name,price:p.price,quantity};
    });
    if(selected.reduce((n,p)=>n+p.quantity,0)>50) throw new Error('invalid-items');
    const subtotal=selected.reduce((n,p)=>n+p.price*p.quantity,0),deliveryFee=fulfillment==='delivery'&&zone?zone.fee:0,total=subtotal+deliveryFee;
    const db=getDb(),tokenHash=await hash(trackingToken);
    let [order]=await db.select().from(orders).where(eq(orders.checkoutKey,checkoutKey)).limit(1);
    if(order && order.trackingHash!==tokenHash) return Response.json({error:'Pedido já registrado com esta chave.'},{status:409});
    if(!order){
      const id=crypto.randomUUID();
      await db.insert(orders).values({id,code:crypto.randomUUID().slice(0,8).toUpperCase(),customerName:name,phone,customerEmail:email,fulfillment,
        address:fulfillment==='delivery'?address:'',note,itemsJson:JSON.stringify(selected),subtotal,deliveryFee,total,zoneId:zone?.id??'',
        paymentMethod:demo?'test':paymentMethod,paymentStatus:'unpaid',paidAmount:0,status:demo?'test':paymentMethod==='pix'?'awaiting_payment':'received',
        checkoutKey,trackingHash:tokenHash,createdAt:new Date().toISOString()}).onConflictDoNothing();
      [order]=await db.select().from(orders).where(eq(orders.checkoutKey,checkoutKey)).limit(1);
    }
    if(!order) throw new Error('Order not persisted');
    if(order.paymentMethod==='pix'&&!order.providerOrderId){
      const result=await createPixOrder({id:order.id,amount:order.total,email:order.customerEmail});
      const method=result.transactions?.payments?.[0]?.payment_method;
      await db.update(orders).set({providerOrderId:result.id,pixCode:method?.qr_code??null,pixQr:method?.qr_code_base64??null}).where(eq(orders.id,order.id));
      [order]=await db.select().from(orders).where(eq(orders.id,order.id)).limit(1);
    }
    return Response.json({...display(order),trackingToken},{status:201});
  }catch(error){
    if(error instanceof SyntaxError||error instanceof Error&&error.message==='invalid-items') return Response.json({error:'Confira os itens selecionados.'},{status:400});
    console.error('Order creation failed',error);
    return Response.json({error:'Não foi possível finalizar agora. Sua sacola foi preservada; tente novamente.'},{status:503});
  }
}

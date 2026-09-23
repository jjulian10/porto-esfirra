import { eq } from 'drizzle-orm';
import { env } from 'cloudflare:workers';
import { getDb } from '@/db';
import { deliveryZones, storeSettings } from '@/db/schema';
import { isAdmin } from '@/lib/admin';
import { loadStore } from '@/lib/store';

const configured=()=>Boolean((env as Cloudflare.Env & {MERCADO_PAGO_ACCESS_TOKEN?:string; MERCADO_PAGO_WEBHOOK_SECRET?:string}).MERCADO_PAGO_ACCESS_TOKEN && (env as Cloudflare.Env & {MERCADO_PAGO_WEBHOOK_SECRET?:string}).MERCADO_PAGO_WEBHOOK_SECRET);
export async function GET(request:Request) {
  if(!isAdmin(request)) return Response.json({error:'Acesso restrito.'},{status:403});
  try {const {settings,zones}=await loadStore();return Response.json({settings,zones,pixConfigured:configured()});}
  catch(error){console.error(error);return Response.json({error:'Configuração indisponível.'},{status:503});}
}
export async function PUT(request:Request) {
  if(!isAdmin(request)) return Response.json({error:'Acesso restrito.'},{status:403});
  try {
    const body=await request.json() as Record<string,unknown>;
    const {settings,zones}=await loadStore();
    if(body.kind==='settings') {
      const next={ordersEnabled:body.ordersEnabled===true,pickupEnabled:body.pickupEnabled===true,deliveryEnabled:body.deliveryEnabled===true,payOnPickupEnabled:body.payOnPickupEnabled===true,pixEnabled:body.pixEnabled===true};
      if(next.ordersEnabled && (!next.pickupEnabled && !next.deliveryEnabled || !next.payOnPickupEnabled && !next.pixEnabled)) return Response.json({error:'Ative uma modalidade de entrega e uma forma de pagamento.'},{status:400});
      if(next.ordersEnabled && next.deliveryEnabled && !next.pixEnabled) return Response.json({error:'Para entrega, ative o pagamento por Pix após configurar a conta.'},{status:400});
      if(next.ordersEnabled && next.deliveryEnabled && !zones.some(z=>z.active)) return Response.json({error:'Cadastre ao menos um bairro atendido antes de ativar entregas.'},{status:400});
      if(next.ordersEnabled && next.pixEnabled && !configured()) return Response.json({error:'Configure as credenciais de pagamento e a assinatura das notificações antes de ativar o Pix.'},{status:400});
      await getDb().insert(storeSettings).values({id:1,...next}).onConflictDoUpdate({target:storeSettings.id,set:next});
      return Response.json({ok:true});
    }
    if(body.kind==='zone') {
      const id=typeof body.id==='string' && /^[\w-]{1,60}$/.test(body.id)?body.id:crypto.randomUUID();
      const name=String(body.name??'').trim(); const fee=Number(body.fee);
      if(name.length<2 || name.length>70 || !Number.isInteger(fee) || fee<0 || fee>10000) return Response.json({error:'Confira o bairro e a taxa em centavos.'},{status:400});
      await getDb().insert(deliveryZones).values({id,name,fee,active:body.active!==false}).onConflictDoUpdate({target:deliveryZones.id,set:{name,fee,active:body.active!==false}});
      return Response.json({id});
    }
    return Response.json({error:'Operação inválida.'},{status:400});
  } catch(error){console.error(error);return Response.json({error:'Não foi possível salvar a configuração.'},{status:503});}
}

import { env } from 'cloudflare:workers';

type MpPayment={amount?:string;paid_amount?:string;status?:string;payment_method?:{qr_code?:string;qr_code_base64?:string;ticket_url?:string}};
export type MpOrder={id:string;external_reference?:string;status?:string;total_amount?:string;total_paid_amount?:string;transactions?:{payments?:MpPayment[]}};
const credentials=()=>env as Cloudflare.Env & {MERCADO_PAGO_ACCESS_TOKEN?:string;MERCADO_PAGO_WEBHOOK_SECRET?:string};
export function paymentReady(){return Boolean(credentials().MERCADO_PAGO_ACCESS_TOKEN && credentials().MERCADO_PAGO_WEBHOOK_SECRET);}
export async function fetchMpOrder(id:string):Promise<MpOrder>{
  if(!/^[A-Z0-9_-]{10,80}$/i.test(id)) throw new Error('Invalid provider id');
  const response=await fetch(`https://api.mercadopago.com/v1/orders/${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${credentials().MERCADO_PAGO_ACCESS_TOKEN}`,Accept:'application/json'}});
  if(!response.ok) throw new Error(`Provider GET ${response.status}`);
  return response.json() as Promise<MpOrder>;
}
export async function createPixOrder(args:{id:string;amount:number;email:string}):Promise<MpOrder>{
  const value=(args.amount/100).toFixed(2);
  const response=await fetch('https://api.mercadopago.com/v1/orders',{method:'POST',headers:{Authorization:`Bearer ${credentials().MERCADO_PAGO_ACCESS_TOKEN}`,'Content-Type':'application/json','X-Idempotency-Key':args.id},body:JSON.stringify({type:'online',total_amount:value,external_reference:args.id,processing_mode:'automatic',transactions:{payments:[{amount:value,payment_method:{id:'pix',type:'bank_transfer'},expiration_time:'PT1H'}]},payer:{email:args.email}})});
  if(!response.ok){console.error('Pix provider rejected order',response.status);throw new Error('Não foi possível gerar o Pix agora. Tente novamente.');}
  return response.json() as Promise<MpOrder>;
}
export function paidCents(result:MpOrder){const amount=Number(result.total_paid_amount??'0');return Number.isFinite(amount)?Math.max(0,Math.round(amount*100)):0;}
export async function validMpSignature(request:Request,id:string){
  const secret=credentials().MERCADO_PAGO_WEBHOOK_SECRET;
  const header=request.headers.get('x-signature')??'';
  const reqId=request.headers.get('x-request-id')??'';
  const parts=Object.fromEntries(header.split(',').map(part=>part.trim().split('=',2))) as Record<string,string>;
  const ts=parts.ts,v1=parts.v1;
  if(!secret || !reqId || !id || !/^\d{10,16}$/.test(ts??'') || !/^[a-f0-9]{64}$/i.test(v1??'')) return false;
  if(Math.abs(Date.now()-Number(ts))>10*60*1000) return false;
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
  const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(`id:${id.toLowerCase()};request-id:${reqId};ts:${ts};`));
  const expected=new Uint8Array(signature),received=Uint8Array.from(v1.match(/.{2}/g)??[],byte=>parseInt(byte,16));
  return expected.length===received.length && expected.reduce((diff,byte,i)=>diff|(byte^received[i]),0)===0;
}

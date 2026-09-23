import { loadStore } from '@/lib/store';
import { env } from 'cloudflare:workers';

export async function GET() {
  try {
    const { catalog, zones, settings } = await loadStore();
    const pixConfigured = Boolean((env as Cloudflare.Env & { MERCADO_PAGO_ACCESS_TOKEN?:string; MERCADO_PAGO_WEBHOOK_SECRET?:string }).MERCADO_PAGO_ACCESS_TOKEN && (env as Cloudflare.Env & { MERCADO_PAGO_WEBHOOK_SECRET?:string }).MERCADO_PAGO_WEBHOOK_SECRET);
    return Response.json({
      products: catalog.filter(p => p.active).map(({updatedAt, active, ...p}) => p),
      zones: settings.deliveryEnabled ? zones.filter(z => z.active) : [],
      settings: { ordersEnabled:settings.ordersEnabled, pickupEnabled:settings.pickupEnabled,
        deliveryEnabled:settings.deliveryEnabled && zones.some(z => z.active),
        payOnPickupEnabled:settings.payOnPickupEnabled,
        pixEnabled:settings.pixEnabled && pixConfigured },
    }, {headers: {'Cache-Control':'no-store'}});
  } catch (error) { console.error('Catalog unavailable',error); return Response.json({error:'Cardápio indisponível no momento.'},{status:503}); }
}

import { getDb } from '@/db';
import { catalogItems, deliveryZones, storeSettings } from '@/db/schema';
import { products, type Product, type Category } from '@/lib/catalog';

export const categories: Category[] = ['Esfirras salgadas', 'Esfirras doces', 'Pizzas', 'Bebidas'];
export async function loadStore() {
  const db = getDb();
  const [overrides, zones, rows] = await Promise.all([
    db.select().from(catalogItems), db.select().from(deliveryZones), db.select().from(storeSettings).limit(1),
  ]);
  const changes = new Map(overrides.map(p => [p.id, p]));
  const catalog = [
    ...products.map(p => ({ ...p, ...(changes.get(p.id) ?? { active:true, updatedAt:'' }) })),
    ...overrides.filter(p => !products.some(original => original.id === p.id)),
  ] as (Product & {active:boolean; updatedAt:string})[];
  const defaults = { ordersEnabled:false, pickupEnabled:true, deliveryEnabled:false, payOnPickupEnabled:false, pixEnabled:false };
  return { catalog, zones, settings: rows[0] ?? { id:1, ...defaults } };
}

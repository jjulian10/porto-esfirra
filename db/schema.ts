import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  fulfillment: text('fulfillment').notNull(),
  address: text('address').notNull().default(''),
  note: text('note').notNull().default(''),
  itemsJson: text('items_json').notNull(),
  subtotal: integer('subtotal').notNull(),
  status: text('status').notNull().default('received'),
  createdAt: text('created_at').notNull(),
  customerEmail: text('customer_email').notNull().default(''),
  checkoutKey: text('checkout_key').unique(),
  trackingHash: text('tracking_hash'),
  zoneId: text('zone_id').notNull().default(''),
  deliveryFee: integer('delivery_fee').notNull().default(0),
  total: integer('total').notNull().default(0),
  paymentMethod: text('payment_method').notNull().default('test'),
  paymentStatus: text('payment_status').notNull().default('unpaid'),
  paidAmount: integer('paid_amount').notNull().default(0),
  providerOrderId: text('provider_order_id').unique(),
  pixCode: text('pix_code'),
  pixQr: text('pix_qr'),
});

export const catalogItems = sqliteTable('catalog_items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  category: text('category').notNull(),
  price: integer('price').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull(),
});

export const storeSettings = sqliteTable('store_settings', {
  id: integer('id').primaryKey(),
  ordersEnabled: integer('orders_enabled', { mode: 'boolean' }).notNull().default(false),
  pickupEnabled: integer('pickup_enabled', { mode: 'boolean' }).notNull().default(true),
  deliveryEnabled: integer('delivery_enabled', { mode: 'boolean' }).notNull().default(false),
  payOnPickupEnabled: integer('pay_on_pickup_enabled', { mode: 'boolean' }).notNull().default(false),
  pixEnabled: integer('pix_enabled', { mode: 'boolean' }).notNull().default(false),
});

export const deliveryZones = sqliteTable('delivery_zones', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  fee: integer('fee').notNull(),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
});

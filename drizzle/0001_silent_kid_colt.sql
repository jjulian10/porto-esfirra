CREATE TABLE `catalog_items` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `delivery_zones` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`fee` integer NOT NULL,
	`active` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `store_settings` (
	`id` integer PRIMARY KEY NOT NULL,
	`orders_enabled` integer DEFAULT false NOT NULL,
	`pickup_enabled` integer DEFAULT true NOT NULL,
	`delivery_enabled` integer DEFAULT false NOT NULL,
	`pay_on_pickup_enabled` integer DEFAULT false NOT NULL,
	`pix_enabled` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_email` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `checkout_key` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_hash` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `zone_id` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `delivery_fee` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `total` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method` text DEFAULT 'test' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_status` text DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `paid_amount` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `provider_order_id` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pix_code` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `pix_qr` text;--> statement-breakpoint
CREATE UNIQUE INDEX `orders_checkout_key_unique` ON `orders` (`checkout_key`);--> statement-breakpoint
CREATE UNIQUE INDEX `orders_provider_order_id_unique` ON `orders` (`provider_order_id`);
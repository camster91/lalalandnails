CREATE TABLE `booking_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`name` text NOT NULL,
	`email` text,
	`phone` text,
	`preferred_date` text NOT NULL,
	`preferred_time` text NOT NULL,
	`service_slug` text DEFAULT 'european-manicure' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL CHECK (`status` IN ('pending', 'contacted', 'confirmed', 'declined', 'completed')),
	`admin_note` text DEFAULT '' NOT NULL,
	`consent_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_booking_requests_status_created` ON `booking_requests` (`status`,`created_at`);--> statement-breakpoint
CREATE TABLE `chat_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_chat_rate_limits_expires` ON `chat_rate_limits` (`expires_at`);

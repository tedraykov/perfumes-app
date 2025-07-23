CREATE TABLE `houses` (
	`name` text PRIMARY KEY NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `inventory` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`perfume_id` integer,
	`volume` integer NOT NULL,
	`is_tester` integer,
	`price` real NOT NULL,
	`website` text,
	`url` text,
	FOREIGN KEY (`perfume_id`) REFERENCES `perfumes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`website`) REFERENCES `websites`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `notes` (
	`name` text PRIMARY KEY NOT NULL,
	`image_url` text
);
--> statement-breakpoint
CREATE TABLE `perfume_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`perfume_id` integer,
	`note` text,
	`note_type` text,
	FOREIGN KEY (`perfume_id`) REFERENCES `perfumes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`note`) REFERENCES `notes`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `perfumes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`house` text NOT NULL,
	`image_url` text,
	`fragrantica_url` text,
	`gender` text NOT NULL,
	`concentration` text NOT NULL,
	FOREIGN KEY (`house`) REFERENCES `houses`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `perfume_name_idx` ON `perfumes` (`name`);--> statement-breakpoint
CREATE INDEX `perfume_house_idx` ON `perfumes` (`house`);--> statement-breakpoint
CREATE UNIQUE INDEX `perfumes_name_house_gender_concentration_unique` ON `perfumes` (`name`,`house`,`gender`,`concentration`);--> statement-breakpoint
CREATE TABLE `websites` (
	`name` text PRIMARY KEY NOT NULL,
	`address` text NOT NULL,
	`logo` text NOT NULL
);

CREATE TABLE `unprocessed_descriptions` (
	`website` text NOT NULL,
	`description` text NOT NULL,
	PRIMARY KEY(`website`, `description`)
);
--> statement-breakpoint
CREATE TABLE `unprocessed_gender` (
	`website` text NOT NULL,
	`gender` text NOT NULL,
	PRIMARY KEY(`website`, `gender`)
);
--> statement-breakpoint
CREATE TABLE `unprocessed_perfumes` (
	`website` text NOT NULL,
	`perfume_url` text NOT NULL,
	PRIMARY KEY(`website`, `perfume_url`)
);

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_perfume_notes` (
	`perfume_id` integer,
	`note_name` text,
	`note_type` text,
	PRIMARY KEY(`perfume_id`, `note_name`),
	FOREIGN KEY (`perfume_id`) REFERENCES `perfumes`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`note_name`) REFERENCES `notes`(`name`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_perfume_notes`("perfume_id", "note_name", "note_type") SELECT "perfume_id", "note_name", "note_type" FROM `perfume_notes`;--> statement-breakpoint
DROP TABLE `perfume_notes`;--> statement-breakpoint
ALTER TABLE `__new_perfume_notes` RENAME TO `perfume_notes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;
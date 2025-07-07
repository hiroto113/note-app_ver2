PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_posts_to_categories` (
	`post_id` integer NOT NULL,
	`category_id` integer NOT NULL,
	PRIMARY KEY(`post_id`, `category_id`),
	FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_posts_to_categories`("post_id", "category_id") SELECT "post_id", "category_id" FROM `posts_to_categories`;--> statement-breakpoint
DROP TABLE `posts_to_categories`;--> statement-breakpoint
ALTER TABLE `__new_posts_to_categories` RENAME TO `posts_to_categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `posts_to_categories_post_id_idx` ON `posts_to_categories` (`post_id`);--> statement-breakpoint
CREATE INDEX `posts_to_categories_category_id_idx` ON `posts_to_categories` (`category_id`);
ALTER TABLE "images" RENAME COLUMN "url" TO "unique_name";--> statement-breakpoint
ALTER TABLE "images" ALTER COLUMN "author_id" SET NOT NULL;
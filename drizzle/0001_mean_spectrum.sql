ALTER TABLE "images" RENAME COLUMN "uploader_id" TO "author_id";--> statement-breakpoint
ALTER TABLE "images" DROP CONSTRAINT "images_uploader_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "url" text NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD CONSTRAINT "images_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
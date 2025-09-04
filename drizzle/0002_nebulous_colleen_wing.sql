ALTER TABLE "images" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "images" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;
CREATE TABLE "apps" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"api_key" text NOT NULL,
	"bucket_name" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "apps_name_unique" UNIQUE("name"),
	CONSTRAINT "apps_bucket_name_unique" UNIQUE("bucket_name")
);

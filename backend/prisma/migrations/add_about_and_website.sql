-- Add aboutDescription and website fields to users table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "aboutDescription" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "website" VARCHAR(255);

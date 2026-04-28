ALTER TABLE "components" DROP COLUMN IF EXISTS "image_path";
ALTER TABLE "components" ADD COLUMN IF NOT EXISTS "package" VARCHAR(100);
ALTER TABLE "components" ADD COLUMN IF NOT EXISTS "category" VARCHAR(100);
CREATE INDEX IF NOT EXISTS "components_category_idx" ON "components"("category");
DROP TABLE IF EXISTS "email_verifications";

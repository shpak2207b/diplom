CREATE TABLE "manufacturers" (
  "id" SERIAL PRIMARY KEY,
  "name" VARCHAR(100) NOT NULL UNIQUE,
  "country" VARCHAR(100),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "manufacturers_name_idx" ON "manufacturers"("name");

INSERT INTO "manufacturers" ("name")
SELECT DISTINCT "manufacturer" FROM "components"
WHERE "manufacturer" IS NOT NULL AND "manufacturer" != ''
ON CONFLICT DO NOTHING;

ALTER TABLE "components" ADD COLUMN "manufacturer_id" INTEGER;

UPDATE "components" c
SET "manufacturer_id" = m.id
FROM "manufacturers" m
WHERE c.manufacturer = m.name;

ALTER TABLE "components"
ADD CONSTRAINT "components_manufacturer_id_fkey"
FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE SET NULL;

CREATE INDEX "components_manufacturer_id_idx" ON "components"("manufacturer_id");

ALTER TABLE "components" DROP COLUMN IF EXISTS "manufacturer";

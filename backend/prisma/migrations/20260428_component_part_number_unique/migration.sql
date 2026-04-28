DELETE FROM components
WHERE id NOT IN (
  SELECT MIN(id) FROM components GROUP BY part_number
);
CREATE UNIQUE INDEX IF NOT EXISTS components_part_number_key ON components(part_number);

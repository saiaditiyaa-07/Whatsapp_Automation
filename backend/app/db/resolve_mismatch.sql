-- Drop the obsolete columns from whatsapp_connections
ALTER TABLE whatsapp_connections DROP COLUMN IF EXISTS connected_at;
ALTER TABLE whatsapp_connections DROP COLUMN IF EXISTS status;

-- Optionally drop the unused custom type connectionstatus
DROP TYPE IF EXISTS connectionstatus;

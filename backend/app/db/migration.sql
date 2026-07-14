-- Align whatsapp_connections table with WhatsAppConnection model
ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS app_secret VARCHAR(255) DEFAULT '' NOT NULL;
ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL;
ALTER TABLE whatsapp_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL;

-- If there are any existing rows, copy connected_at to created_at
UPDATE whatsapp_connections SET created_at = connected_at WHERE created_at IS NULL AND connected_at IS NOT NULL;

-- Align conversations table with Conversation model
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_time TIMESTAMP WITHOUT TIME ZONE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS unread_count INTEGER DEFAULT 0 NOT NULL;

-- Copy last_message_at to last_message_time for existing rows
UPDATE conversations SET last_message_time = last_message_at WHERE last_message_time IS NULL AND last_message_at IS NOT NULL;

-- Align messages table with Message model
ALTER TABLE messages ADD COLUMN IF NOT EXISTS meta_message_id VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS text TEXT;

-- For existing messages, copy content to text
UPDATE messages SET text = content WHERE text IS NULL AND content IS NOT NULL;
-- Set empty string default if any text is still null (to satisfy NOT NULL)
UPDATE messages SET text = '' WHERE text IS NULL;

-- Alter text column to be NOT NULL to match SQLAlchemy model definition
ALTER TABLE messages ALTER COLUMN text SET NOT NULL;

-- Create unique index on meta_message_id to match SQLAlchemy model unique=True, index=True
CREATE UNIQUE INDEX IF NOT EXISTS ix_messages_meta_message_id ON messages (meta_message_id);

-- Also, copy whatsapp_message_id to meta_message_id for existing messages
UPDATE messages SET meta_message_id = whatsapp_message_id WHERE meta_message_id IS NULL AND whatsapp_message_id IS NOT NULL;

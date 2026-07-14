-- Migration SQL for Module 5: Automation Engine
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;

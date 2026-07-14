from app.db.session import engine
from sqlalchemy import text

def run_migration():
    print("Running Database migrations...")
    try:
        with engine.begin() as conn:
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb NOT NULL;"))
            conn.execute(text("ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id) ON DELETE SET NULL;"))
            conn.execute(text("ALTER TABLE automation_workflows ADD COLUMN IF NOT EXISTS canvas JSONB DEFAULT '{}'::jsonb;"))
        print("Migration completed successfully.")
    except Exception as e:
        print(f"Migration error (might be running SQLite or columns already exist): {e}")

if __name__ == "__main__":
    run_migration()

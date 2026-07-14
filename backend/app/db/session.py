from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create engine with pre-ping validation to verify connection stability
# Clean up Prisma schema query parameters if present, since SQLAlchemy/psycopg2 does not support them.
db_url = settings.DATABASE_URL
if "?schema=" in db_url:
    db_url = db_url.split("?schema=")[0]
engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

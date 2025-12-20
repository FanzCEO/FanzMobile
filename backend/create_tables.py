"""
Create database tables for WickedCRM.
Run this script to create all necessary tables.
"""

from app.database import engine, Base
from app.models.user import User
from app.models.contact import Contact
from app.models.event import Event

def create_tables():
    """Create all tables in the database."""
    print("Creating database tables...")

    # Create all tables
    Base.metadata.create_all(bind=engine)

    print("Tables created successfully!")
    print("Tables: users, contacts, events")

if __name__ == "__main__":
    create_tables()

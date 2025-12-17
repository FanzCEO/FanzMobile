#!/usr/bin/env python3
"""
Database initialization script for CRM Escort AI
Loads schema.sql and creates initial tables
"""
import os
import sys
import psycopg2
from pathlib import Path

# Get database URL from environment
DB_URL = os.getenv("DB_URL", "postgresql://crm_user:change_me_in_prod@localhost:5432/crm_escort")


def init_database():
    """Initialize database with schema"""
    print("🔧 Initializing CRM Escort AI database...")
    
    try:
        # Connect to database
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Read schema file
        schema_path = Path(__file__).parent.parent / "schema.sql"
        with open(schema_path, "r") as f:
            schema_sql = f.read()
        
        # Execute schema
        print("📋 Executing schema.sql...")
        cur.execute(schema_sql)
        conn.commit()
        
        print("✅ Database initialized successfully!")
        
        # Close connections
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        sys.exit(1)


if __name__ == "__main__":
    init_database()

import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def fix_db():
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        conn.autocommit = True
        cur = conn.cursor()
        print("Adding is_resolved column to detectionevent...")
        cur.execute("ALTER TABLE detectionevent ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT FALSE")
        print("Column added successfully.")
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    fix_db()

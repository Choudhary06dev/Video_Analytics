import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

def clear_blacklist():
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
        print("Clearing blacklistperson table...")
        cur.execute("TRUNCATE TABLE blacklistperson RESTART IDENTITY")
        print("Table cleared and IDs reset.")
        cur.close()
        conn.close()
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    clear_blacklist()

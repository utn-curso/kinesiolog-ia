import sqlite3
import os

db_path = 'kinemov.db'
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute('ALTER TABLE notifications ADD COLUMN is_read BOOLEAN DEFAULT 0')
        conn.commit()
        print('Column is_read added successfully to notifications table.')
    except sqlite3.OperationalError as e:
        if 'duplicate column name' in str(e).lower():
            print('Column is_read already exists.')
        else:
            print(f'Error: {e}')
    finally:
        conn.close()
else:
    print('Database file not found. It will be created with the new schema on next startup.')

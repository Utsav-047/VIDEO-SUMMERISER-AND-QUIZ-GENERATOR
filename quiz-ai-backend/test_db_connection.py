"""
Quick test: confirms Flask/Python can talk to your XAMPP MySQL database.
Run this once, then delete it (or keep it for future debugging).

Usage: python test_db_connection.py
"""

from models.db import insert_video, get_history

print("Inserting a test video row...")
video_id = insert_video(
    source_type="youtube",
    source_ref="https://youtube.com/watch?v=test123",
    title="Test video - DB connection check",
)
print(f"Inserted successfully. New video_id = {video_id}")

print("\nReading back history from the database...")
rows = get_history()
for row in rows:
    print(row)

print("\nSUCCESS: Flask can read and write to quiz_ai_db.")
print("Go check phpMyAdmin -> quiz_ai_db -> videos table, you should see the test row.")
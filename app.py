"""Clothing search API — Flask + TiDB Cloud (MySQL compatible)."""
import os
import ssl
from decimal import Decimal
from datetime import date, datetime

import pymysql
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
# Demo course frontend; restrict this origin for browser CORS.
CORS(app, resources={r"/api/*": {"origins": "https://diamondk123.github.io"}})

def get_connection():
    required = ("TIDB_HOST", "TIDB_USER", "TIDB_PASSWORD")
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise RuntimeError("Missing environment variables: " + ", ".join(missing))
    return pymysql.connect(
        host=os.environ["TIDB_HOST"],
        port=int(os.getenv("TIDB_PORT", "4000")),
        user=os.environ["TIDB_USER"],
        password=os.environ["TIDB_PASSWORD"],
        database=os.getenv("TIDB_DATABASE", "clothing_homework"),
        charset="utf8mb4",
        ssl=ssl.create_default_context(),
        connect_timeout=10,
        read_timeout=15,
        cursorclass=pymysql.cursors.DictCursor,
    )

@app.get("/")
def home():
    return jsonify({"service": "Clothing Search API", "status": "running",
                    "endpoint": "/api/clothing"})

@app.get("/api/clothing")
def search_clothing():
    keyword = request.args.get("keyword", "").strip()
    color = request.args.get("color", "").strip()
    category = request.args.get("category", "").strip()
    max_price_raw = request.args.get("max_price", "").strip()

    if len(keyword) > 100 or len(color) > 30 or len(category) > 50:
        return jsonify({"error": "搜尋條件過長"}), 400
    try:
        max_price = Decimal(max_price_raw) if max_price_raw else Decimal("999999")
        if not max_price.is_finite() or max_price < 0:
            raise ValueError()
    except (ValueError, ArithmeticError, __import__("decimal").InvalidOperation):
        return jsonify({"error": "max_price 必須是非負數字"}), 400

    sql = """
        SELECT c.product_id, c.product_name, ca.category_name,
               b.brand_name, c.color, c.size, c.price, c.stock_qty,
               c.listed_date, c.image_url
        FROM clothing AS c
        JOIN categories AS ca ON c.category_id = ca.category_id
        JOIN brands AS b ON c.brand_id = b.brand_id
        WHERE c.product_name LIKE %s
          AND (%s = '' OR c.color = %s)
          AND (%s = '' OR ca.category_name = %s)
          AND c.price <= %s
        ORDER BY c.price ASC, c.product_id ASC
        LIMIT 200
    """
    params = (f"%{keyword}%", color, color, category, category, max_price)
    try:
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute(sql, params)
                rows = cursor.fetchall()
        finally:
            conn.close()
    except Exception:
        app.logger.exception("Database query failed")
        return jsonify({"error": "資料庫查詢暫時失敗，請稍後再試"}), 503

    for row in rows:
        for key, value in row.items():
            if isinstance(value, Decimal):
                row[key] = float(value)
            elif isinstance(value, (date, datetime)):
                row[key] = value.isoformat()
    return jsonify({"count": len(rows), "products": rows})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "5000")))

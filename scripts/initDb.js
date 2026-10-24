const { Client } = require('pg');
require('dotenv').config();

async function initDatabase() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT, 10) || 5432;
  const user = process.env.DB_USER || 'postgres';
  const password = process.env.DB_PASSWORD || 'postgres';
  const dbName = process.env.DB_NAME || 'fsoft_db';

  console.log(`🔌 Kết nối tới PostgreSQL Server tại ${host}:${port}...`);

  // Step 1: Connect to default 'postgres' db and create target db if not exists
  const rootClient = new Client({ host, port, user, password, database: 'postgres' });

  try {
    await rootClient.connect();
    const res = await rootClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`🔨 Đang tạo Cơ sở dữ liệu "${dbName}"...`);
      await rootClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Đã tạo CSDL "${dbName}" thành công!`);
    }
  } catch (err) {
    console.warn(`⚠️ Cảnh báo khi kết nối root database: ${err.message}`);
  } finally {
    await rootClient.end().catch(() => {});
  }

  // Step 2: Trigger schema auto initialization from config/database
  console.log(`📋 Đang khởi tạo 20+ bảng CSDL và nạp dữ liệu mẫu FSOFT...`);
  const db = require('../config/database');
  await db.autoInitSchema();
  console.log(`\n🎉 HOÀN THÀNH KHỞI TẠO CSDL FSOFT HRMS (PostgreSQL)!`);
  process.exit(0);
}

initDatabase();

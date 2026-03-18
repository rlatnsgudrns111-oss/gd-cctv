// server/db/database.js - SQLite 데이터베이스 초기화 및 더미 데이터

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'cctv.db');
const db = new Database(dbPath);

// WAL 모드 활성화 (성능 향상)
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 테이블 생성
function initializeDatabase() {
  // 사용자 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 카메라 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS cameras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      location TEXT NOT NULL,
      rtsp_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      display_order INTEGER NOT NULL DEFAULT 0,
      stream_key TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 기본 관리자 계정 생성
  createDefaultAdmin();

  // 더미 카메라 데이터 삽입
  insertDummyCameras();
}

// 기본 관리자 계정 생성
function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);
  if (!existingAdmin) {
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(
      adminUsername,
      hashedPassword,
      'admin'
    );
    console.log(`[DB] 기본 관리자 계정 생성 완료: ${adminUsername}`);
  }
}

// 개발용 카메라 20대 더미 데이터
function insertDummyCameras() {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM cameras').get().cnt;
  if (count > 0) return; // 이미 데이터가 있으면 건너뛰기

  const cameras = [
    { name: '정문 입구', location: '본관 1층 정문', rtspUrl: 'rtsp://admin:1234@192.168.1.101:554/stream1', status: 'online', order: 1 },
    { name: '주차장 A구역', location: '지하 1층 주차장', rtspUrl: 'rtsp://admin:1234@192.168.1.102:554/stream1', status: 'online', order: 2 },
    { name: '주차장 B구역', location: '지하 2층 주차장', rtspUrl: 'rtsp://admin:1234@192.168.1.103:554/stream1', status: 'online', order: 3 },
    { name: '후문 출입구', location: '본관 1층 후문', rtspUrl: 'rtsp://admin:1234@192.168.1.104:554/stream1', status: 'online', order: 4 },
    { name: '로비 중앙', location: '본관 1층 로비', rtspUrl: 'rtsp://admin:1234@192.168.1.105:554/stream1', status: 'online', order: 5 },
    { name: '엘리베이터 홀 1', location: '본관 2층', rtspUrl: 'rtsp://admin:1234@192.168.1.106:554/stream1', status: 'online', order: 6 },
    { name: '엘리베이터 홀 2', location: '본관 3층', rtspUrl: 'rtsp://admin:1234@192.168.1.107:554/stream1', status: 'offline', order: 7 },
    { name: '자재 창고', location: '별관 1층', rtspUrl: 'rtsp://admin:1234@192.168.1.108:554/stream1', status: 'online', order: 8 },
    { name: '장비 보관소', location: '별관 지하 1층', rtspUrl: 'rtsp://admin:1234@192.168.1.109:554/stream1', status: 'online', order: 9 },
    { name: '옥상 출입구', location: '본관 옥상', rtspUrl: 'rtsp://admin:1234@192.168.1.110:554/stream1', status: 'online', order: 10 },
    { name: '현장 사무소', location: '현장 A구역', rtspUrl: 'rtsp://admin:1234@192.168.1.111:554/stream1', status: 'online', order: 11 },
    { name: '굴착 현장', location: '현장 B구역', rtspUrl: 'rtsp://admin:1234@192.168.1.112:554/stream1', status: 'reconnecting', order: 12 },
    { name: '타워크레인 1', location: '현장 C구역', rtspUrl: 'rtsp://admin:1234@192.168.1.113:554/stream1', status: 'online', order: 13 },
    { name: '타워크레인 2', location: '현장 D구역', rtspUrl: 'rtsp://admin:1234@192.168.1.114:554/stream1', status: 'online', order: 14 },
    { name: '콘크리트 타설장', location: '현장 E구역', rtspUrl: 'rtsp://admin:1234@192.168.1.115:554/stream1', status: 'online', order: 15 },
    { name: '철근 가공장', location: '현장 F구역', rtspUrl: 'rtsp://admin:1234@192.168.1.116:554/stream1', status: 'online', order: 16 },
    { name: '안전 통로', location: '현장 G구역', rtspUrl: 'rtsp://admin:1234@192.168.1.117:554/stream1', status: 'offline', order: 17 },
    { name: '자재 반입구', location: '현장 H구역', rtspUrl: 'rtsp://admin:1234@192.168.1.118:554/stream1', status: 'online', order: 18 },
    { name: '비상 대피소', location: '현장 I구역', rtspUrl: 'rtsp://admin:1234@192.168.1.119:554/stream1', status: 'online', order: 19 },
    { name: '외곽 펜스', location: '외곽 경비초소', rtspUrl: 'rtsp://admin:1234@192.168.1.120:554/stream1', status: 'online', order: 20 },
  ];

  const insert = db.prepare(`
    INSERT INTO cameras (name, location, rtsp_url, status, display_order, stream_key)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((cams) => {
    for (const cam of cams) {
      insert.run(cam.name, cam.location, cam.rtspUrl, cam.status, cam.order, `cam_${cam.order}`);
    }
  });

  insertMany(cameras);
  console.log('[DB] 더미 카메라 20대 데이터 삽입 완료');
}

// 데이터베이스 초기화 실행
initializeDatabase();

module.exports = db;

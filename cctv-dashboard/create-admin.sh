#!/bin/bash
# create-admin.sh - 관리자 계정 생성 스크립트
# 사용법: bash create-admin.sh [username] [password]

INSTALL_DIR="/var/www/cctv-dashboard"

USERNAME=${1:-admin}
PASSWORD=${2:-admin123}

echo "관리자 계정 생성 중..."
echo "아이디: $USERNAME"

cd "$INSTALL_DIR/server"

node -e "
  require('dotenv').config();
  const Database = require('better-sqlite3');
  const bcrypt = require('bcryptjs');
  const path = require('path');
  const dbPath = process.env.DB_PATH || path.join(__dirname, 'db/cctv.db');
  const db = new Database(dbPath);

  const username = '$USERNAME';
  const password = '$PASSWORD';
  const hashed = bcrypt.hashSync(password, 10);

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    db.prepare('UPDATE users SET password = ?, role = ? WHERE username = ?').run(hashed, 'admin', username);
    console.log('기존 계정 비밀번호 변경 완료: ' + username);
  } else {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hashed, 'admin');
    console.log('관리자 계정 생성 완료: ' + username);
  }
  db.close();
"

echo "완료!"

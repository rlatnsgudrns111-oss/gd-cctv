// server/index.js - Express 서버 진입점

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// 데이터베이스 초기화 (모듈 로드 시 자동 실행)
require('./db/database');

const authRoutes = require('./routes/auth');
const cameraRoutes = require('./routes/cameras');
const go2rtcService = require('./services/go2rtc');

const app = express();
const PORT = process.env.PORT || 3001;

// 미들웨어
app.use(cors());
app.use(express.json());

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/cameras', cameraRoutes);

// React 빌드 파일 서빙 (프로덕션)
const clientBuildPath = path.join(__dirname, '../client/build');
app.use(express.static(clientBuildPath));

// SPA 라우팅 - API가 아닌 모든 요청을 index.html로 전달
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  }
});

// 서버 시작
app.listen(PORT, async () => {
  console.log(`[서버] CCTV 대시보드 서버 시작: http://localhost:${PORT}`);
  console.log(`[서버] go2rtc API: ${process.env.GO2RTC_API_URL || 'http://localhost:1984'}`);

  // go2rtc에 Supabase 카메라 스트림 자동 등록 (3초 대기 후)
  setTimeout(() => {
    go2rtcService.syncStreamsFromDB();
  }, 3000);
});

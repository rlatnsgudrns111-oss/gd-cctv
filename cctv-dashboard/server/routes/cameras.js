// server/routes/cameras.js - 카메라 관리 API 라우터

const express = require('express');
const db = require('../db/database');
const go2rtcService = require('../services/go2rtc');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// GET /api/cameras - 카메라 목록 조회
router.get('/', authenticateToken, async (req, res) => {
  try {
    const cameras = db.prepare(
      'SELECT * FROM cameras ORDER BY display_order ASC'
    ).all();

    // go2rtc에서 실시간 상태 조회
    const camerasWithStatus = await go2rtcService.getAllStreamStatuses(cameras);

    // RTSP URL 마스킹 (뷰어 역할인 경우)
    const result = camerasWithStatus.map(cam => ({
      id: cam.id,
      name: cam.name,
      location: cam.location,
      rtspUrl: req.user.role === 'admin' ? cam.rtsp_url : maskRtspUrl(cam.rtsp_url),
      status: cam.status,
      liveStatus: cam.liveStatus,
      displayOrder: cam.display_order,
      streamKey: cam.stream_key,
      createdAt: cam.created_at,
      updatedAt: cam.updated_at
    }));

    res.json(result);
  } catch (err) {
    console.error('[카메라] 목록 조회 오류:', err);
    res.status(500).json({ error: '카메라 목록 조회 중 오류가 발생했습니다.' });
  }
});

// POST /api/cameras - 카메라 등록 (관리자 전용)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, location, rtspUrl, displayOrder } = req.body;

  if (!name || !location || !rtspUrl) {
    return res.status(400).json({ error: '카메라 이름, 위치, RTSP URL은 필수 항목입니다.' });
  }

  if (!rtspUrl.startsWith('rtsp://')) {
    return res.status(400).json({ error: 'RTSP URL은 rtsp://로 시작해야 합니다.' });
  }

  try {
    // 다음 스트림 키 생성
    const maxId = db.prepare('SELECT MAX(id) as maxId FROM cameras').get().maxId || 0;
    const streamKey = `cam_${maxId + 1}`;

    const result = db.prepare(`
      INSERT INTO cameras (name, location, rtsp_url, status, display_order, stream_key)
      VALUES (?, ?, ?, 'offline', ?, ?)
    `).run(name, location, rtspUrl, displayOrder || 0, streamKey);

    // go2rtc에 스트림 등록
    const streamAdded = await go2rtcService.addStream(streamKey, rtspUrl);

    const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      id: camera.id,
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtsp_url,
      status: camera.status,
      displayOrder: camera.display_order,
      streamKey: camera.stream_key,
      streamConnected: streamAdded,
      createdAt: camera.created_at
    });
  } catch (err) {
    console.error('[카메라] 등록 오류:', err);
    res.status(500).json({ error: '카메라 등록 중 오류가 발생했습니다.' });
  }
});

// PUT /api/cameras/:id - 카메라 수정 (관리자 전용)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, location, rtspUrl, displayOrder, status } = req.body;

  const existing = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '카메라를 찾을 수 없습니다.' });
  }

  if (rtspUrl && !rtspUrl.startsWith('rtsp://')) {
    return res.status(400).json({ error: 'RTSP URL은 rtsp://로 시작해야 합니다.' });
  }

  try {
    db.prepare(`
      UPDATE cameras
      SET name = COALESCE(?, name),
          location = COALESCE(?, location),
          rtsp_url = COALESCE(?, rtsp_url),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, location, rtspUrl, displayOrder, status, id);

    // RTSP URL이 변경되었으면 go2rtc 스트림 업데이트
    if (rtspUrl && rtspUrl !== existing.rtsp_url) {
      await go2rtcService.removeStream(existing.stream_key);
      await go2rtcService.addStream(existing.stream_key, rtspUrl);
    }

    const camera = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
    res.json({
      id: camera.id,
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtsp_url,
      status: camera.status,
      displayOrder: camera.display_order,
      streamKey: camera.stream_key,
      updatedAt: camera.updated_at
    });
  } catch (err) {
    console.error('[카메라] 수정 오류:', err);
    res.status(500).json({ error: '카메라 수정 중 오류가 발생했습니다.' });
  }
});

// DELETE /api/cameras/:id - 카메라 삭제 (관리자 전용)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  const existing = db.prepare('SELECT * FROM cameras WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: '카메라를 찾을 수 없습니다.' });
  }

  try {
    // go2rtc에서 스트림 제거
    await go2rtcService.removeStream(existing.stream_key);

    db.prepare('DELETE FROM cameras WHERE id = ?').run(id);

    res.json({ message: '카메라가 삭제되었습니다.', id: Number(id) });
  } catch (err) {
    console.error('[카메라] 삭제 오류:', err);
    res.status(500).json({ error: '카메라 삭제 중 오류가 발생했습니다.' });
  }
});

// GET /api/cameras/status - 전체 카메라 상태 요약
router.get('/status/summary', authenticateToken, async (req, res) => {
  try {
    const cameras = db.prepare('SELECT * FROM cameras').all();
    const camerasWithStatus = await go2rtcService.getAllStreamStatuses(cameras);

    const total = camerasWithStatus.length;
    const online = camerasWithStatus.filter(c => c.liveStatus === 'online').length;
    const offline = camerasWithStatus.filter(c => c.liveStatus === 'offline').length;
    const reconnecting = camerasWithStatus.filter(c => c.status === 'reconnecting').length;

    res.json({ total, online, offline, reconnecting });
  } catch (err) {
    res.status(500).json({ error: '상태 조회 중 오류가 발생했습니다.' });
  }
});

// RTSP URL 마스킹 함수
function maskRtspUrl(url) {
  try {
    return url.replace(/(rtsp:\/\/)([^@]+)(@)/, '$1****:****$3');
  } catch {
    return '***';
  }
}

module.exports = router;

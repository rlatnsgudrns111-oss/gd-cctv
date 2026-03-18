// client/src/hooks/useCameraStatus.js - 카메라 상태 폴링 커스텀 훅

import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || '';
const POLL_INTERVAL = 10000; // 10초 간격 폴링

function useCameraStatus(token) {
  const [cameras, setCameras] = useState([]);
  const [summary, setSummary] = useState({ total: 0, online: 0, offline: 0, reconnecting: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);

  const headers = { Authorization: `Bearer ${token}` };

  // 카메라 목록 조회
  const fetchCameras = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cameras`, { headers });
      const data = res.data;
      setCameras(data);

      // 상태 요약 계산
      const total = data.length;
      const online = data.filter(c => (c.liveStatus || c.status) === 'online').length;
      const offline = data.filter(c => (c.liveStatus || c.status) === 'offline').length;
      const reconnecting = data.filter(c => (c.liveStatus || c.status) === 'reconnecting').length;
      setSummary({ total, online, offline, reconnecting });

      setError(null);
    } catch (err) {
      setError('카메라 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // 초기 로드 및 폴링 설정
  useEffect(() => {
    if (!token) return;

    fetchCameras();
    intervalRef.current = setInterval(fetchCameras, POLL_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, fetchCameras]);

  return { cameras, setCameras, summary, loading, error, refresh: fetchCameras };
}

export default useCameraStatus;

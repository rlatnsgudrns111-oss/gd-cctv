// client/src/pages/Dashboard.jsx - 메인 현황판 페이지

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Video, Wifi, WifiOff, RefreshCw } from "lucide-react";
import axios from "axios";
import { KPICard, Card, DARK } from "../components/ThemeStyles";
import LOGO_URI from "../logo";
import CameraGrid from "../components/CameraGrid";
import CameraModal from "../components/CameraModal";
import useCameraStatus from "../hooks/useCameraStatus";

const API_BASE = process.env.REACT_APP_API_URL || '';

export default function Dashboard({ user, token, onLogout }) {
  const navigate = useNavigate();
  const { cameras, setCameras, summary, loading, error, refresh } = useCameraStatus(token);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 실시간 시각 표시
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleString("ko-KR", {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    });
  };

  // 드래그 앤 드롭 순서 변경
  const handleReorder = async (reordered) => {
    setCameras(reordered);

    // 서버에 순서 저장
    try {
      const updates = reordered.map((cam, idx) => ({
        id: cam.id,
        displayOrder: idx + 1,
      }));

      await Promise.all(
        updates.map(({ id, displayOrder }) =>
          axios.put(`${API_BASE}/api/cameras/${id}`, { displayOrder }, {
            headers: { Authorization: `Bearer ${token}` }
          })
        )
      );
    } catch (err) {
      console.error('순서 저장 실패:', err);
      refresh();
    }
  };

  // 모달에서 카메라 정보 변경 시 목록 업데이트
  const handleCameraUpdate = (updatedCamera) => {
    setCameras(prev => prev.map(cam =>
      cam.id === updatedCamera.id ? { ...cam, ...updatedCamera } : cam
    ));
    setSelectedCamera(updatedCamera);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK.bg }}>
      {/* 상단 헤더 */}
      <header
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: DARK.card, borderBottom: `1px solid ${DARK.border}` }}
      >
        <div className="flex items-center gap-3">
          <img src={LOGO_URI} alt="강원개발공사" className="h-7 object-contain" />
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-white">안전 현황판</h1>
            <span className="text-[10px] px-2 py-0.5 rounded"
                  style={{ backgroundColor: DARK.cardHover, color: DARK.textMuted }}>
              토목사업부
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm font-mono" style={{ color: DARK.textSub }}>
            {formatTime(currentTime)}
          </span>

          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/admin")}
              className="px-3 py-1.5 text-xs rounded-lg transition-colors hover:text-white"
              style={{ backgroundColor: DARK.cardHover, color: DARK.textSub }}
            >
              관리
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: DARK.textMuted }}>{user?.username}</span>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs rounded-lg transition-colors text-gray-400 hover:text-white"
              style={{ backgroundColor: DARK.cardHover }}
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* KPI 요약 바 */}
      <div className="px-6 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard
            label="전체 카메라" value={summary.total} unit="대"
            color="blue" icon={<Video size={15} />}
          />
          <KPICard
            label="정상" value={summary.online} unit="대"
            sub={`${summary.total ? Math.round(summary.online / summary.total * 100) : 0}% 가동`}
            color="emerald" icon={<Wifi size={15} />}
          />
          <KPICard
            label="끊김" value={summary.offline} unit="대"
            color="red" icon={<WifiOff size={15} />}
          />
          <KPICard
            label="재연결중" value={summary.reconnecting} unit="대"
            color="amber" icon={<RefreshCw size={15} />}
          />
        </div>
      </div>

      {/* 메인 그리드 */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400">{error}</div>
        ) : (
          <CameraGrid
            cameras={cameras}
            onCameraClick={setSelectedCamera}
            onReorder={user?.role === "admin" ? handleReorder : null}
          />
        )}
      </div>

      {/* 카메라 확대 모달 */}
      {selectedCamera && (
        <CameraModal
          camera={selectedCamera}
          onClose={() => setSelectedCamera(null)}
          token={token}
          onUpdate={handleCameraUpdate}
        />
      )}
    </div>
  );
}

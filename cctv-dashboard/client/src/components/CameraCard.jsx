// client/src/components/CameraCard.jsx - 개별 카메라 카드 컴포넌트

import React from 'react';
import StatusBadge from './StatusBadge';
import WebRTCPlayer from './WebRTCPlayer';

function CameraCard({ camera, onClick }) {
  const effectiveStatus = camera.liveStatus || camera.status;

  return (
    <div
      className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
      style={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d37' }}
      onClick={() => onClick(camera)}
    >
      {/* 상단: 카메라 이름 + 상태 배지 */}
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-sm font-medium text-white truncate mr-2">
          {camera.name}
        </span>
        <StatusBadge status={effectiveStatus} />
      </div>

      {/* 영상 영역 */}
      <div className="aspect-video">
        <WebRTCPlayer
          streamKey={camera.streamKey}
          status={effectiveStatus}
          className="w-full h-full"
        />
      </div>

      {/* 하단: 위치 정보 */}
      <div className="px-3 py-2">
        <span className="text-xs" style={{ color: '#6b7280' }}>
          {camera.location}
        </span>
      </div>
    </div>
  );
}

export default CameraCard;

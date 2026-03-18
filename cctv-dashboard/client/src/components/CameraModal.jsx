// client/src/components/CameraModal.jsx - 카메라 확대 모달

import React, { useEffect } from 'react';
import StatusBadge from './StatusBadge';
import WebRTCPlayer from './WebRTCPlayer';

function CameraModal({ camera, onClose }) {
  const effectiveStatus = camera.liveStatus || camera.status;

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 배경 클릭으로 닫기
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.85)' }}
      onClick={handleBackdropClick}
    >
      <div
        className="relative w-[90vw] h-[90vh] max-w-7xl rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d37' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#2a2d37' }}>
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-white">{camera.name}</h2>
            <StatusBadge status={effectiveStatus} size="lg" />
            <span className="text-sm" style={{ color: '#6b7280' }}>{camera.location}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors hover:bg-white/10"
          >
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 영상 영역 */}
        <div className="flex-1 min-h-0">
          <WebRTCPlayer
            streamKey={camera.streamKey}
            status={effectiveStatus}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}

export default CameraModal;

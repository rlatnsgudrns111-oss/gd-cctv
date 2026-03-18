// client/src/components/StatusBadge.jsx - 카메라 연결 상태 배지

import React from 'react';

const STATUS_CONFIG = {
  online: {
    label: '정상',
    color: '#22c55e',
    bgColor: 'rgba(34, 197, 94, 0.15)',
  },
  offline: {
    label: '끊김',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
  },
  reconnecting: {
    label: '재연결중',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.15)',
  },
  unknown: {
    label: '확인중',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
  },
};

function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const sizeClass = size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClass}`}
      style={{ backgroundColor: config.bgColor, color: config.color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: config.color,
          animation: status === 'reconnecting' ? 'pulse 2s infinite' : 'none',
        }}
      />
      {config.label}
    </span>
  );
}

export default StatusBadge;

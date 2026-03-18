// client/src/components/CameraModal.jsx - 카메라 확대 모달 (제목/위치 수정 기능)

import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import StatusBadge from './StatusBadge';
import WebRTCPlayer from './WebRTCPlayer';

const API_BASE = process.env.REACT_APP_API_URL || '';

function EditableText({ value, field, onSave, className, editClassName }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    const trimmed = text.trim();
    if (!trimmed || trimmed === value) {
      setIsEditing(false);
      setText(value);
      return;
    }
    setSaving(true);
    try {
      await onSave(field, trimmed);
      setIsEditing(false);
    } catch (err) {
      console.error(`${field} 변경 실패:`, err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setIsEditing(false);
      setText(value);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleSave}
        disabled={saving}
        className={`bg-transparent border-b-2 border-blue-400 outline-none px-1 py-0.5 ${editClassName || ''}`}
      />
    );
  }

  return (
    <span
      className={`cursor-pointer hover:text-blue-400 transition-colors group ${className || ''}`}
      onClick={() => setIsEditing(true)}
      title="클릭하여 수정"
    >
      {value}
      <svg className="w-3 h-3 inline-block ml-1 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </span>
  );
}

function CameraModal({ camera, onClose, token, onUpdate }) {
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

  // 필드 저장 (name 또는 location)
  const handleFieldSave = async (field, value) => {
    await axios.put(`${API_BASE}/api/cameras/${camera.id}`, { [field]: value }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (onUpdate) onUpdate({ ...camera, [field]: value });
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
            <EditableText
              value={camera.name}
              field="name"
              onSave={handleFieldSave}
              className="text-lg font-bold text-white"
              editClassName="text-lg font-bold text-white"
            />
            <StatusBadge status={effectiveStatus} size="lg" />
            <EditableText
              value={camera.location}
              field="location"
              onSave={handleFieldSave}
              className="text-sm text-gray-500"
              editClassName="text-sm text-gray-400"
            />
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

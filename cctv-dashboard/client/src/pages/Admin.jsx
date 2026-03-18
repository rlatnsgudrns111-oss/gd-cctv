// client/src/pages/Admin.jsx - 관리자 페이지 (카메라 CRUD)
// (gd-chatbot-main ThemeStyles 디자인 패턴 기반)

import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { ChevronLeft } from "lucide-react";
import { Badge, DARK } from "../components/ThemeStyles";
import StatusBadge from "../components/StatusBadge";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function Admin({ user, token, onLogout }) {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCamera, setEditingCamera] = useState(null);
  const [formData, setFormData] = useState({ name: '', location: '', rtspUrl: '', displayOrder: 0 });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  // 카메라 목록 조회
  const fetchCameras = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/cameras`, { headers });
      setCameras(res.data);
    } catch (err) {
      console.error('카메라 목록 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // 모달 열기 (추가/수정)
  const openAddModal = () => {
    setEditingCamera(null);
    setFormData({ name: '', location: '', rtspUrl: '', displayOrder: cameras.length + 1 });
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (camera) => {
    setEditingCamera(camera);
    setFormData({
      name: camera.name,
      location: camera.location,
      rtspUrl: camera.rtspUrl,
      displayOrder: camera.displayOrder,
    });
    setFormError('');
    setShowModal(true);
  };

  // 폼 제출 (추가/수정)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name || !formData.location || !formData.rtspUrl) {
      setFormError('모든 필수 항목을 입력해주세요.');
      return;
    }
    if (!formData.rtspUrl.startsWith('rtsp://')) {
      setFormError('RTSP URL은 rtsp://로 시작해야 합니다.');
      return;
    }

    setSaving(true);
    try {
      if (editingCamera) {
        await axios.put(`${API_BASE}/api/cameras/${editingCamera.id}`, formData, { headers });
      } else {
        await axios.post(`${API_BASE}/api/cameras`, formData, { headers });
      }
      setShowModal(false);
      fetchCameras();
    } catch (err) {
      setFormError(err.response?.data?.error || '저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // 카메라 삭제
  const handleDelete = async (camera) => {
    if (!window.confirm(`"${camera.name}" 카메라를 삭제하시겠습니까?`)) return;
    try {
      await axios.delete(`${API_BASE}/api/cameras/${camera.id}`, { headers });
      fetchCameras();
    } catch (err) {
      alert('삭제에 실패했습니다.');
    }
  };

  // RTSP URL 마스킹 표시
  const maskUrl = (url) => {
    try {
      return url.replace(/(rtsp:\/\/)([^@]+)(@)/, '$1****:****$3');
    } catch {
      return '***';
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK.bg }}>
      {/* 상단 헤더 */}
      <header
        className="sticky top-0 z-40 px-6 py-3 flex items-center justify-between"
        style={{ backgroundColor: DARK.card, borderBottom: `1px solid ${DARK.border}` }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/")}
            className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
          >
            <ChevronLeft size={20} className="text-gray-400" />
          </button>
          <h1 className="text-lg font-bold text-white">카메라 관리</h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#6b7280' }}>{user?.username}</span>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 text-sm rounded-lg text-gray-400 hover:text-white"
            style={{ backgroundColor: '#252836' }}
          >
            로그아웃
          </button>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        {/* 상단 액션 */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm" style={{ color: '#6b7280' }}>
            등록된 카메라: {cameras.length}대
          </p>
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: '#3b82f6' }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#2563eb')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#3b82f6')}
          >
            + 카메라 추가
          </button>
        </div>

        {/* 카메라 테이블 */}
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d37' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid #2a2d37' }}>
                {['순서', '이름', '위치', 'RTSP 주소', '상태', '등록일', '액션'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium" style={{ color: '#6b7280' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">로딩 중...</td>
                </tr>
              ) : cameras.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">등록된 카메라가 없습니다.</td>
                </tr>
              ) : (
                cameras.map((cam) => (
                  <tr key={cam.id} className="hover:bg-white/5 transition-colors" style={{ borderBottom: '1px solid #2a2d37' }}>
                    <td className="px-4 py-3 text-sm text-gray-300">{cam.displayOrder}</td>
                    <td className="px-4 py-3 text-sm text-white font-medium">{cam.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{cam.location}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-500">{maskUrl(cam.rtspUrl)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={cam.liveStatus || cam.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {cam.createdAt ? new Date(cam.createdAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(cam)}
                          className="px-2 py-1 text-xs rounded transition-colors text-blue-400 hover:bg-blue-400/10"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(cam)}
                          className="px-2 py-1 text-xs rounded transition-colors text-red-400 hover:bg-red-400/10"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl p-6"
            style={{ backgroundColor: '#1a1d27', border: '1px solid #2a2d37' }}
          >
            <h3 className="text-lg font-bold text-white mb-6">
              {editingCamera ? '카메라 수정' : '카메라 추가'}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  카메라 이름 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#252836', border: '1px solid #2a2d37' }}
                  placeholder="예: 정문 입구"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  위치 설명 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#252836', border: '1px solid #2a2d37' }}
                  placeholder="예: 본관 1층 정문"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  RTSP URL <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.rtspUrl}
                  onChange={(e) => setFormData({ ...formData, rtspUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#252836', border: '1px solid #2a2d37' }}
                  placeholder="rtsp://username:password@ip:554/stream"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#9ca3af' }}>
                  표시 순서
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-24 px-3 py-2 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ backgroundColor: '#252836', border: '1px solid #2a2d37' }}
                  min="0"
                />
              </div>

              {formError && (
                <div className="p-3 rounded-lg text-sm text-red-400" style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
                  {formError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm rounded-lg text-gray-400 hover:text-white transition-colors"
                  style={{ backgroundColor: '#252836' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 text-sm rounded-lg font-medium text-white transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#3b82f6' }}
                >
                  {saving ? '저장 중...' : editingCamera ? '수정' : '등록'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Admin은 상단에서 export default로 선언됨

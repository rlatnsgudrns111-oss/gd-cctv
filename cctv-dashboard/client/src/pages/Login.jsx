// client/src/pages/Login.jsx - 로그인 페이지
// (gd-chatbot-main LoginPage 디자인 패턴 기반, CCTV 다크 테마 적용)

import React, { useState } from "react";
import axios from "axios";
import LOGO_URI from "../logo";

const API_BASE = process.env.REACT_APP_API_URL || "";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const tryLogin = async () => {
    if (!username) { setErr("아이디를 입력해주세요."); return; }
    if (!password) { setErr("비밀번호를 입력해주세요."); return; }

    setErr("");
    setLoading(true);

    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { username, password });
      onLogin(res.data.token, res.data.user);
    } catch (e) {
      setErr(e.response?.data?.error || "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") tryLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#0f1117" }}>
      <div className="w-full max-w-sm">
        {/* 로고 */}
        <div className="flex justify-center mb-6">
          <img src={LOGO_URI} alt="강원개발공사" className="h-14 sm:h-16 object-contain" />
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <h1 className="text-lg font-bold text-white tracking-tight">CCTV 대시보드</h1>
        </div>

        {/* 로그인 카드 */}
        <div className="rounded-2xl shadow-lg p-6 sm:p-8"
             style={{ backgroundColor: "#1a1d27", border: "1px solid #2a2d37" }}>

          {/* 오류 메시지 */}
          {err && (
            <div className="mb-4 p-3 rounded-xl text-xs font-medium"
                 style={{ backgroundColor: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171" }}>
              {err}
            </div>
          )}

          <div className="space-y-4">
            {/* 아이디 입력 */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#9ca3af" }}>
                아이디
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors placeholder:text-gray-500"
                style={{ backgroundColor: "#252836", border: "1px solid #2a2d37" }}
                placeholder="아이디를 입력하세요"
                onKeyDown={handleKeyDown}
                autoComplete="username"
                autoFocus
              />
            </div>

            {/* 비밀번호 입력 */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#9ca3af" }}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-colors placeholder:text-gray-500"
                style={{ backgroundColor: "#252836", border: "1px solid #2a2d37" }}
                placeholder="비밀번호를 입력하세요"
                onKeyDown={handleKeyDown}
                autoComplete="current-password"
              />
            </div>

            {/* 로그인 버튼 */}
            <button
              onClick={tryLogin}
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </div>

          {/* 하단 링크 */}
          <div className="flex items-center justify-center gap-3 mt-5 text-xs" style={{ color: "#6b7280" }}>
            <button className="hover:text-blue-400 transition-colors">비밀번호 찾기</button>
            <span>|</span>
            <button className="hover:text-blue-400 transition-colors">계정 문의</button>
          </div>
        </div>
      </div>
    </div>
  );
}

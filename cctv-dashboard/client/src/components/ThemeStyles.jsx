// client/src/components/ThemeStyles.jsx - 공통 테마 / UI 컴포넌트
// (gd-chatbot-main ThemeStyles 기반, CCTV 다크 테마 적용)

import {
  ArrowUp, ArrowDown, ChevronDown, Search
} from "lucide-react";

/* ============================================================
   테마 / 스타일 (Theme & Shared UI Components) — 다크 테마
   - 배지 스타일 맵
   - Badge, ProgressBar, KPICard, Card, CardHeader 등 공통 UI
   ============================================================ */

/* --- 다크 테마 색상 상수 --- */
export const DARK = {
  bg: "#0f1117",
  card: "#1a1d27",
  cardHover: "#252836",
  border: "#2a2d37",
  text: "#e5e7eb",
  textSub: "#9ca3af",
  textMuted: "#6b7280",
};

/* --- 배지 스타일 매핑 (다크 테마) --- */
export const badgeStyles = {
  "정상": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "끊김": "bg-red-500/15 text-red-400 border-red-500/30",
  "재연결중": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "online": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "offline": "bg-red-500/15 text-red-400 border-red-500/30",
  "reconnecting": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "진행": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "완료": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "계획": "bg-gray-500/15 text-gray-400 border-gray-500/30",
  "중단": "bg-red-500/15 text-red-400 border-red-500/30",
  "긴급": "bg-red-500/20 text-red-300 border-red-500/40 font-semibold",
  "주의": "bg-amber-500/15 text-amber-400 border-amber-500/30",
  "보통": "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

/* --- Badge 컴포넌트 --- */
export function Badge({ children }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeStyles[children] || "bg-gray-500/15 text-gray-400 border-gray-500/30"}`}>
      {children}
    </span>
  );
}

/* --- StatusDot 컴포넌트 --- */
export function StatusDot({ status }) {
  const colors = {
    online: "bg-emerald-400",
    offline: "bg-red-400",
    reconnecting: "bg-amber-400",
  };
  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colors[status] || "bg-gray-400"} ${status === "reconnecting" ? "animate-pulse" : ""}`} />
  );
}

/* --- ProgressBar 컴포넌트 --- */
export function ProgressBar({ value }) {
  const c = value >= 80 ? "bg-emerald-500" : value >= 50 ? "bg-blue-500" : value >= 30 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.min(value, 100)}%`, transition: "width 0.5s" }} />
      </div>
      <span className="text-xs font-semibold text-gray-400 w-9 text-right">{value}%</span>
    </div>
  );
}

/* --- KPICard 컴포넌트 --- */
const kpiColors = {
  blue: "from-blue-600 to-blue-700",
  emerald: "from-emerald-600 to-emerald-700",
  amber: "from-amber-500 to-amber-600",
  red: "from-red-500 to-red-600",
  slate: "from-gray-600 to-gray-700",
  violet: "from-violet-600 to-violet-700",
};

export function KPICard({ label, value, unit, sub, trend, trendValue, icon, color = "blue" }) {
  return (
    <div className={`bg-gradient-to-br ${kpiColors[color]} rounded-xl p-4 text-white shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-white/75">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">{icon}</div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold tracking-tight">{value}</span>
        {unit && <span className="text-xs text-white/65">{unit}</span>}
      </div>
      {(sub || trend) && (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          {trend && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/15">
              {trend === "up" ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{trendValue}
            </span>
          )}
          {sub && <span className="text-white/55">{sub}</span>}
        </div>
      )}
    </div>
  );
}

/* --- Card 컴포넌트 (다크 테마) --- */
export function Card({ children, className = "", noPad = false }) {
  return (
    <div className={`rounded-xl border shadow-sm ${noPad ? "" : "p-4"} ${className}`}
         style={{ backgroundColor: DARK.card, borderColor: DARK.border }}>
      {children}
    </div>
  );
}

/* --- CardHeader 컴포넌트 --- */
export function CardHeader({ title, sub, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {sub && <p className="text-xs mt-0.5" style={{ color: DARK.textMuted }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/* --- Select 컴포넌트 (다크 테마) --- */
export function Select({ value, onChange, options, className = "" }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className={`appearance-none rounded-lg pl-3 pr-7 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 cursor-pointer ${className}`}
        style={{ backgroundColor: DARK.cardHover, border: `1px solid ${DARK.border}`, color: DARK.textSub }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: DARK.textMuted }} />
    </div>
  );
}

/* --- SearchInput 컴포넌트 (다크 테마) --- */
export function SearchInput({ placeholder, onChange }) {
  return (
    <div className="relative">
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: DARK.textMuted }} />
      <input
        type="text"
        placeholder={placeholder || "검색..."}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 placeholder:text-gray-500"
        style={{ backgroundColor: DARK.cardHover, border: `1px solid ${DARK.border}`, color: DARK.text }}
      />
    </div>
  );
}

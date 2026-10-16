// 검색·영상 공급·유형 구성을 기존 SVG와 단위로 표시합니다.
import { KINDS, fmt, delta, change, name, yt, genreOf, genreIcon, naverA, naverB } from '../utils/programData.js';
import { Poster, LockCard } from './Common.jsx';

function FlowSlope({ a, b, unit = '', title }) {
  const safeA = Number(a) || 0, safeB = Number(b) || 0;
  const max = Math.max(1, safeA, safeB) * 1.22;
  const ya = 166 - safeA / max * 112, yb = 166 - safeB / max * 112;
  const diff = safeB - safeA;
  const formatValue = v => `${fmt(Number(v.toFixed(2)))}${unit}`;
  return <div className="v9-slope">
    <svg viewBox="0 0 520 222" role="img" aria-label={`${title}: 10월 1주차 ${formatValue(safeA)}, 10월 2주차 ${formatValue(safeB)}`}>
      <defs><linearGradient id="v9Slope" x1="0" y1="0" x2="1" y2="0"><stop stopColor="#b7b0aa" /><stop offset="1" stopColor="#eb702a" /></linearGradient><linearGradient id="v9SlopeFill" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ee7832" stopOpacity=".22" /><stop offset="1" stopColor="#ee7832" stopOpacity="0" /></linearGradient></defs>
      {[60,106,152,187].map(y => <line key={y} x1="30" x2="490" y1={y} y2={y} stroke="#eee6df" strokeDasharray="4 5" />)}
      <path d={`M 76 ${ya} L 444 ${yb} L 444 187 L 76 187 Z`} fill="url(#v9SlopeFill)" />
      <path d={`M76 ${ya} L444 ${yb}`} fill="none" stroke="url(#v9Slope)" strokeWidth="4" strokeLinecap="round" />
      <circle cx="76" cy={ya} r="8" fill="#bcb5ae" stroke="#fff" strokeWidth="3" /><circle cx="444" cy={yb} r="8" fill="#eb702a" stroke="#fff" strokeWidth="3" />
      <text x="76" y={Math.max(22, ya-18)} textAnchor="middle" fill="#796f68" fontWeight="700" fontSize="15">{formatValue(safeA)}</text>
      <text x="444" y={Math.max(22, yb-18)} textAnchor="middle" fill="#e76e2d" fontWeight="800" fontSize="15">{formatValue(safeB)}</text>
      <text x="76" y="213" textAnchor="middle" fill="#80736a" fontSize="13">10월 1주차</text><text x="444" y="213" textAnchor="middle" fill="#80736a" fontSize="13">10월 2주차</text>
    </svg>
    <div className="v9-slope-caption"><span>{title}</span><strong className={diff < 0 ? 'negative' : ''}>{diff > 0 ? '+' : ''}{formatValue(diff)} 변화</strong></div>
  </div>;
}

function SearchLineRanking({ programs, limit = 6 }) {
  const chosen = [...programs].filter((p) => typeof change(p) === 'number').sort((a, b) => change(b) - change(a)).slice(0, limit);
  return (
    <div className="line-ranking-grid">
      {chosen.map((p, i) => {
        const a = naverA(p), b = naverB(p), max = Math.max(1,a,b) * 1.20;
        const y1 = 118 - (a / max) * 84;
        const y2 = 118 - (b / max) * 84;
        return (
          <article key={p.program_id} className="line-rank-card">
            <div className="v9-ranking-poster"><Poster p={p} /><span className="v9-ranking-number">{String(i+1).padStart(2,'0')}</span></div>
            <div className="line-rank-head v9-rank-head">
              <div><h4>{name(p)}</h4><small>{genreOf(p)}</small></div>
              <strong>{delta(change(p))}</strong>
            </div>
            <svg viewBox="0 0 230 148" className="line-rank-chart" role="img" aria-label={`${name(p)} 검색지수 10월 1주차 ${a.toFixed(1)}에서 10월 2주차 ${b.toFixed(1)}로 변화`}>
              <defs><linearGradient id={`rank-fill-v9-${p.program_id}`} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#ee7c37" stopOpacity=".22" /><stop offset="1" stopColor="#ee7c37" stopOpacity="0" /></linearGradient></defs>
              {[36,62,88,114].map(y => <line key={y} x1="14" x2="218" y1={y} y2={y} stroke="#f0e7de" strokeDasharray="3 3" />)}
              <path d={`M34 ${y1} L190 ${y2} L190 127 L34 127 Z`} fill={`url(#rank-fill-v9-${p.program_id})`} />
              <path d={`M34 ${y1} L190 ${y2}`} stroke="#ed772f" strokeWidth="3.5" fill="none" />
              <circle cx="34" cy={y1} r="5.5" fill="#a9a29d" stroke="#fff" strokeWidth="2" />
              <circle cx="190" cy={y2} r="5.5" fill="#ed772f" stroke="#fff" strokeWidth="2" />
              <text x="34" y="143" fill="#978a7f" fontSize="11" textAnchor="middle">10월 1주차</text>
              <text x="190" y="143" fill="#978a7f" fontSize="11" textAnchor="middle">10월 2주차</text>
            </svg>
            <div className="line-rank-values"><span>10월 1주차 {a.toFixed(1)}</span><span>10월 2주차 {b.toFixed(1)}</span></div>
          </article>
        );
      })}
    </div>
  );
}

function BubblePanel({ programs }) {
  const rows = [...programs]
    .map((p) => ({ program: p, value: (p.racoi?.w41_posts || 0) + (p.racoi?.w41_comments || 0) }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div className="bubble-wrap">
      {rows.map((row) => {
        const size = 98 + (row.value / max) * 92;
        return (
          <div key={row.program.program_id} className="bubble-item" style={{ width: size, height: size }}>
            <span>{name(row.program)}</span>
            <strong>{fmt(row.value)}</strong>
            <small>게시글+댓글</small>
          </div>
        );
      })}
    </div>
  );
}

function SupplyCompare({ programs }) {
  const rows = [...programs].filter((p) => (p.youtube?.w40_owner_candidates || 0) > 0 || (p.youtube?.w41_owner_candidates || 0) > 0).sort((a, b) => yt(b) - yt(a)).slice(0, 8);
  if (!rows.length) return <LockCard title="유튜브 공급량 비교 준비 중" desc="프로그램별 공급량을 비교할 수 있는 데이터가 더 확보되는 대로 시각화를 확장할 예정입니다." />;
  const max = Math.max(1, ...rows.map((p) => Math.max(p.youtube?.w40_owner_candidates || 0, p.youtube?.w41_owner_candidates || 0)));
  return (
    <div className="supply-grid">
      {rows.map((p) => (
        <div key={p.program_id} className="supply-card">
          <div className="supply-head">
            <span className="genre-icon">{genreIcon(p)}</span>
            <div>
              <b>{name(p)}</b>
              <small>{genreOf(p)}</small>
            </div>
          </div>
          <div className="week-bars compact-bars">
            <div className="week-bar-row">
              <label>10월 1주차</label>
              <div className="week-track"><div className="week-fill prev" style={{ width: `${((p.youtube?.w40_owner_candidates || 0) / max) * 100}%` }}></div></div>
              <span>{fmt(p.youtube?.w40_owner_candidates)}건</span>
            </div>
            <div className="week-bar-row">
              <label>10월 2주차</label>
              <div className="week-track"><div className="week-fill curr" style={{ width: `${((p.youtube?.w41_owner_candidates || 0) / max) * 100}%` }}></div></div>
              <span>{fmt(p.youtube?.w41_owner_candidates)}건</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MixCompare({ programs }) {
  const totals = KINDS.map(([key, label, icon]) => ({
    key, label, icon,
    w40: programs.reduce((s, p) => s + (p.youtube?.type_mix?.[key]?.w40_count || 0), 0),
    w41: programs.reduce((s, p) => s + (p.youtube?.type_mix?.[key]?.w41_count || 0), 0),
  })).filter((row) => row.w40 > 0 || row.w41 > 0);
  if (!totals.length) return <LockCard title="유튜브 콘텐츠 구성 준비 중" desc="유형별 영상 분류 데이터가 충분히 확보되는 대로 콘텐츠 포맷 비교를 추가할 예정입니다." />;
  const max = Math.max(1, ...totals.map((r) => Math.max(r.w40, r.w41)));
  return (
    <div className="mix-cards">
      {totals.map((row) => (
        <div key={row.key} className="mix-card">
          <div className="mix-card__head"><span className="mix-icon">{row.icon}</span><b>{row.label}</b></div>
          <div className="mix-pill">
            <div className="mix-pill__track">
              <div className="mix-pill__prev" style={{ width: `${(row.w40 / max) * 100}%` }}></div>
            </div>
            <span>10월 1주차 {fmt(row.w40)}건</span>
          </div>
          <div className="mix-pill">
            <div className="mix-pill__track">
              <div className="mix-pill__curr" style={{ width: `${(row.w41 / max) * 100}%` }}></div>
            </div>
            <span>10월 2주차 {fmt(row.w41)}건</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export { FlowSlope, SearchLineRanking, BubblePanel, SupplyCompare, MixCompare };

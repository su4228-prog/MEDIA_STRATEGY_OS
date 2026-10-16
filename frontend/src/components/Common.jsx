// 페이지에서 함께 사용하는 헤더·포스터·지표 UI입니다.
import { programImages } from '../programImages.js';
import { PERIOD, fmt, delta, change, name } from '../utils/programData.js';

function Arrow({ right = true }) {
  return <span aria-hidden="true" className="arrow-small">{right ? '↗' : '←'}</span>;
}

function Logo() {
  return (
    <div className="brand">
      <span className="brand-mark">MBN</span>
      <span className="brand-divider"></span>
      <span className="brand-text">MEDIA STRATEGY</span>
    </div>
  );
}

function Header({ path, go }) {
  return (
    <header className="header-wrap">
      <div className="header container-wide">
        <button className="brand-btn" onClick={() => go('/')} aria-label="홈으로">
          <Logo />
        </button>
        <nav aria-label="주 메뉴">
          {[
            ['/', '홈'],
            ['/trends', '화제성 분석'],
            ['/programs', '프로그램별 분석'],
          ].map(([p, t]) => (
            <button key={p} className={path === p ? 'current' : ''} onClick={() => go(p)}>
              {t}
            </button>
          ))}
        </nav>
        <span className="header-date">분석 기간 · {PERIOD}</span>
      </div>
    </header>
  );
}

function Caption({ tag, title, desc, actions }) {
  return (
    <div className="section-head">
      <div>
        <div className="eyebrow">{tag}</div>
        <h2>{title}</h2>
        {desc && <p>{desc}</p>}
      </div>
      {actions}
    </div>
  );
}

function Metric({ value, label, caption }) {
  return (
    <div className="metric">
      <strong>{value}</strong>
      <span>{label}</span>
      {caption && <small>{caption}</small>}
    </div>
  );
}

function Poster({ p }) {
  return <img loading="lazy" className="poster-img" src={programImages[p.program_id]} alt={`${name(p)} 포스터`} />;
}

function Signal({ p }) {
  const d = change(p);
  return <span className={`signal ${d < 0 ? 'down' : 'up'}`}>{delta(d)}</span>;
}

function LockCard({ title, desc }) {
  return (
    <div className="locked">
      <div className="locked__blur" aria-hidden="true">
        <div></div><div></div><div></div>
      </div>
      <div className="locked__front">
        <span className="lock-icon">🔒</span>
        <b>{title}</b>
        <p>{desc}</p>
      </div>
    </div>
  );
}

function CompactStat({ number, unit, label, note }) {
  return <div className="v9-stat">
    <div className="v9-stat-number"><strong>{number}</strong>{unit && <span>{unit}</span>}</div>
    <b>{label}</b>{note && <small>{note}</small>}
  </div>;
}

function PeriodStrip() {
  return <div className="v9-period-strip">
    <strong>비교 기간</strong>
    <span><b>10월 1주차</b> 9월 28일~10월 4일</span>
    <i aria-hidden="true">→</i>
    <span><b>10월 2주차</b> 10월 5일~10월 11일</span>
  </div>;
}

function ReadableRacoiStat({ value, label, views = false }) {
  const n = value == null ? null : Number(value);
  const shown = n === null || Number.isNaN(n) ? '확인 불가' : views ? (n >= 100 ? Number((n / 10).toFixed(1)).toLocaleString('ko-KR') : Number(n.toFixed(1)).toLocaleString('ko-KR')) : fmt(n);
  const unit = views ? (n !== null && n >= 100 ? '만 회' : '천 회') : '건';
  return <div className="v9-racoi-stat"><div><strong>{shown}</strong>{n !== null && <span>{unit}</span>}</div><small>{label}</small></div>;
}

export { Arrow, Logo, Header, Caption, Metric, Poster, Signal, LockCard, CompactStat, PeriodStrip, ReadableRacoiStat };

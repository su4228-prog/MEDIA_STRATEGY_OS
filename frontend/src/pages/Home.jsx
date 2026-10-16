// 홈 소개·주요 프로그램·데이터 안내 화면입니다.
import { useEffect, useState } from 'react';
import { fmt, delta, change, name, yt, genreOf, naverA, naverB, qualityScore, insightCopy, computeTotals } from '../utils/programData.js';
import { Arrow, Caption, Metric, Poster, Signal, CompactStat, PeriodStrip } from '../components/Common.jsx';
import { DataModal } from '../components/DataModal.jsx';
import { SearchLineRanking } from '../components/Charts.jsx';

function HeroAnalytics({ programs, go }) {
  const ranked = [...programs]
    .filter((p) => typeof change(p) === 'number' && Number.isFinite(naverA(p)) && Number.isFinite(naverB(p)))
    .sort((a, b) => change(b) - change(a))
    .slice(0, 8);
  const [slide, setSlide] = useState(0);
  // 기존 슬라이드 초기화 시점을 유지합니다.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSlide(0), [programs.length]);
  const current = ranked[slide % Math.max(ranked.length, 1)];
  const total = ranked.length;
  const navigate = (next) => setSlide((next + total) % total);
  const max = current ? Math.max(1, naverA(current), naverB(current)) * 1.18 : 100;
  const yOf = (n) => 216 - (n / max) * 160;
  const a = current ? naverA(current) : 0;
  const b = current ? naverB(current) : 0;
  const ya = yOf(a), yb = yOf(b);
  return (
    <div className="hero-visual" aria-label="프로그램별 주간 검색 변화 슬라이드">
      <div className="hero-graph-card">
        <div className="hero-graph-head">
          <div>
            <span className="eyebrow">LIVE DATA · WEEKLY SEARCH TREND</span>
            <h3>10월 1주차 → 10월 2주차 검색 변화</h3>
          </div>
          <span className="hero-graph-tag">네이버 검색지수</span>
        </div>
        {current ? <>
          <div className="hero-slide-subhead">
            <div className="hero-slide-program">
              <div className="hero-slide-poster"><Poster p={current} /></div>
              <div><span>PROGRAM {String(slide + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span><strong>{name(current)}</strong></div>
            </div>
            <div className="hero-slide-controls">
              <button onClick={() => navigate(slide - 1)} aria-label="이전 프로그램 그래프">←</button>
              <button onClick={() => navigate(slide + 1)} aria-label="다음 프로그램 그래프">→</button>
            </div>
          </div>
          <div className="hero-graph-wrap">
            <svg viewBox="0 0 690 274" className="hero-graph-svg" role="img" aria-label={`${name(current)} 검색지수: 10월 1주차 ${a.toFixed(1)}에서 10월 2주차 ${b.toFixed(1)}로 변화`}>
              <defs>
                <linearGradient id="heroOrangeFillV9" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff853b" stopOpacity=".33" /><stop offset="1" stopColor="#ff853b" stopOpacity="0" /></linearGradient>
                <linearGradient id="heroLineStrokeV9" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#abb3bb" /><stop offset=".52" stopColor="#e9a075" /><stop offset="1" stopColor="#ff823a" /></linearGradient>
                <filter id="heroGlowV9"><feGaussianBlur stdDeviation="3" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
              </defs>
              {[46, 92, 138, 184, 230].map(y => <line key={y} x1="45" y1={y} x2="645" y2={y} stroke="rgba(255,255,255,.11)" strokeDasharray="5 8" />)}
              <path d={`M 90 ${ya} L 580 ${yb} L 580 230 L 90 230 Z`} fill="url(#heroOrangeFillV9)" />
              <path d={`M90 ${ya} L580 ${yb}`} fill="none" stroke="url(#heroLineStrokeV9)" strokeWidth="4.5" strokeLinecap="round" filter="url(#heroGlowV9)" />
              <circle cx="90" cy={ya} r="8" fill="#d5d9de" stroke="#10161d" strokeWidth="4" />
              <circle cx="580" cy={yb} r="8" fill="#ff823a" stroke="#10161d" strokeWidth="4" />
              <text x="90" y={Math.max(24,ya - 17)} fill="#e7e9ec" fontSize="17" fontWeight="800" textAnchor="middle">{a.toFixed(1)}</text>
              <text x="580" y={Math.max(24,yb - 17)} fill="#ff924f" fontSize="17" fontWeight="800" textAnchor="middle">{b.toFixed(1)}</text>
              <text x="90" y="260" fill="#b6bec6" fontSize="15" fontWeight="700" textAnchor="middle">10월 1주차</text>
              <text x="580" y="260" fill="#ff9c63" fontSize="15" fontWeight="700" textAnchor="middle">10월 2주차</text>
            </svg>
          </div>
          <div className="hero-graph-summary v9-summary">
            <div><span>주간 검색 관심 변화</span><strong className="hero-highlight">{delta(change(current))}</strong></div>
            <button className="hero-report-link" onClick={() => go(`/program/${current.program_id}`)}>이 프로그램 분석 보기 ↗</button>
          </div>
          <div className="hero-slide-pagination" aria-label="그래프 슬라이드 선택">
            {ranked.map((p, i) => <button key={p.program_id} aria-label={`${name(p)} 그래프 보기`} aria-current={i === slide ? 'true' : undefined} className={i === slide ? 'active' : ''} onClick={() => setSlide(i)} />)}
          </div>
          <p className="hero-graph-note">각 화면은 한 프로그램의 동일 검색어 변화만 비교합니다. 두 주차 사이의 일별 추이는 나타내지 않습니다.</p>
        </> : <div className="hero-graph-empty">백엔드 데이터 연결 후 검색 변화 그래프가 표시됩니다.</div>}
      </div>
    </div>
  );
}

function BrandHero({ go, programs }) {
  const totals = computeTotals(programs);
  return (
    <section className="hero container-wide">
      <div className="hero-copy">
        <div className="eyebrow">MBN · AI CONTENT STRATEGY DASHBOARD</div>
        <h1>
          <span>AI로 방송 화제성을 읽고,</span>
          <span>다음 전략을 설계하다.</span>
        </h1>
        <p>네이버 검색, RACOI 시청률·온라인 반응, 유튜브 영상 흐름을 함께 보여주며 프로그램 전략을 위한 데이터를 보기 좋게 정리한 사이트입니다.</p>
        <button className="primary" onClick={() => go('/trends')}>화제성 분석 보기 <Arrow /></button>
        <div className="hero-stats uniform-metrics">
          <Metric value={`${programs.length || "—"}`} label="분석 프로그램" />
          <Metric value={`${fmt(totals.totalVideos)}건`} label="관련 유튜브 영상" caption="프로그램별 온라인 공급량 비교" />
          <Metric value={`${fmt(totals.confirmedVideos)}건`} label="분석 확정 영상" caption="방송일과 제목 날짜 일치 영상" />
        </div>
      </div>
      <HeroAnalytics programs={programs} go={go} />
    </section>
  );
}

function QuickLink({ title, desc, cta, onClick }) {
  return (
    <button className="data-link" onClick={onClick}>
      <strong>{title}</strong>
      <span>{desc}</span>
      <em>{cta} <Arrow /></em>
    </button>
  );
}

function Guide({ programs }) {
  const totals = computeTotals(programs);
  const [modal, setModal] = useState('');
  const dataCards = [
    { title: '네이버 검색 변화', desc: `${programs.length || "—"}개 프로그램의 같은 검색어를 10월 1주차와 10월 2주차 평균값으로 비교`, cta: '데이터 보기', key: 'naver' },
    { title: 'RACOI 온라인 반응', desc: `게시글 ${fmt(totals.totalPosts)}건 · 댓글 ${fmt(totals.totalComments)}건을 공개 지표 기준으로 확인`, cta: '데이터 보기', key: 'racoi' },
    { title: '유튜브 관련 영상', desc: `관련 영상 ${fmt(totals.totalVideos)}건을 연결해 공급량과 콘텐츠 구성을 비교`, cta: '데이터 보기', key: 'youtube' },
  ];
  const topSearch = [...programs].filter((p) => typeof change(p) === 'number').sort((a, b) => change(b) - change(a)).slice(0, 4);
  const topSupply = [...programs].sort((a, b) => yt(b) - yt(a)).slice(0, 4);

  return (
    <section className="section guide">
      <Caption
        tag="ABOUT THE PLATFORM"
        title="플랫폼 핵심 안내"
        desc="사이트의 목적, 활용 데이터, 분석 방식, 활용 흐름을 한눈에 이해할 수 있도록 정리했습니다."
      />
      <div className="guide-stage-grid">
        <article className="guide-stage">
          <div className="guide-stage__num">01</div>
          <div className="guide-stage__content">
            <span className="step">PLATFORM OVERVIEW</span>
            <h3>어떤 사이트인가요?</h3>
            <p>AI를 활용해 방송 화제성을 읽고 다음 콘텐츠 전략을 설계하는 데이터 대시보드입니다. 어떤 프로그램이 주목받고 있는지, 그리고 어떤 장면과 포맷을 더 살펴봐야 하는지 빠르게 확인할 수 있도록 구성했습니다.</p>
          </div>
        </article>
        <article className="guide-stage">
          <div className="guide-stage__num">02</div>
          <div className="guide-stage__content">
            <span className="step">DATA SOURCES</span>
            <h3>어떤 데이터를 활용했나요?</h3>
            <p>네이버 검색지수, RACOI 공개 반응 지표, 유튜브 관련 영상 데이터를 한 프로그램 단위로 묶어 비교했습니다. 각 데이터는 아래 버튼을 눌러 팝업으로 바로 확인할 수 있습니다.</p>
            <div className="guide-links">
              {dataCards.map((card) => <QuickLink key={card.title} {...card} onClick={() => setModal(card.key)} />)}
            </div>
          </div>
        </article>
        <article className="guide-stage">
          <div className="guide-stage__num">03</div>
          <div className="guide-stage__content">
            <span className="step">ANALYSIS METHOD</span>
            <h3>데이터를 어떻게 분석했나요?</h3>
            <p>파이썬을 활용하여 네이버 검색 데이터, RACOI 공개 지표, 유튜브 메타데이터를 수집·정리하고 프로그램 ID 기준으로 연결했습니다. 네이버는 같은 검색어의 두 주 평균값을 비교했고, 유튜브는 제목·프로그램명·게시일 규칙을 함께 적용해 관련 영상을 찾았습니다. RACOI에서 시청률을 확인할 수 없는 항목은 0으로 바꾸지 않고 비워 두어, 실제 반응보다 낮게 해석되는 일을 막았습니다.</p>
          </div>
        </article>
        <article className="guide-stage">
          <div className="guide-stage__num">04</div>
          <div className="guide-stage__content">
            <span className="step">HOW TO USE</span>
            <h3>사이트 100% 활용법</h3>
            <ol className="howto-list">
              <li>시청률 분석, 네이버 검색어 분석, 유튜브 분석을 동시에 확인하여 전체 흐름을 파악합니다.</li>
              <li>프로그램별 분석에서 데이터를 확인하고 싶은 방송을 선택합니다.</li>
              <li>상세 페이지에서 유튜브 콘텐츠 구성과 RACOI 반응을 함께 보며 반응이 붙은 포맷을 확인합니다.</li>
              <li>AI가 분석한 리포트를 활용하여 프로그램만의 차별화된 전략을 확인합니다.</li>
            </ol>
          </div>
        </article>
      </div>

      <DataModal open={modal === 'naver'} onClose={() => setModal('')} title="네이버 검색 데이터">
        <div className="modal-summary-grid v9-modal-grid">
          <CompactStat number={programs.length} unit="개" label="비교 프로그램" note="동일한 분석 기준 적용" />
          <CompactStat number="2" unit="주" label="분석 기간" note="10월 1주차와 10월 2주차" />
          <CompactStat number={topSearch.length} unit="개" label="상승 프로그램 예시" note="팝업에 표시된 상위 프로그램" />
        </div>
        <PeriodStrip />
        <p className="modal-copy">같은 검색어를 기준으로 10월 1주차와 10월 2주차 평균 검색지수를 비교했습니다. 프로그램 간 절대 인기 순위를 보여주기보다, 같은 프로그램 안에서 관심이 얼마나 변했는지 읽는 데 초점을 맞췄습니다.</p>
        <div className="mini-table">
          {topSearch.map((p) => (
            <div key={p.program_id} className="mini-table-row">
              <b>{name(p)}</b>
              <span>10월 1주차 {fmt(naverA(p))}</span>
              <span>10월 2주차 {fmt(naverB(p))}</span>
              <strong>{delta(change(p))}</strong>
            </div>
          ))}
        </div>
      </DataModal>
      <DataModal open={modal === 'racoi'} onClose={() => setModal('')} title="RACOI 공개 반응 데이터">
        <div className="modal-summary-grid v9-modal-grid">
          <CompactStat number={fmt(totals.totalPosts)} unit="건" label="RACOI 게시글" note="10월 2주차 공개 지표 합계" />
          <CompactStat number={fmt(totals.totalComments)} unit="건" label="RACOI 댓글" note="10월 2주차 공개 지표 합계" />
          <CompactStat number="—" label="미확인 시청률" note="0%로 계산하지 않고 제외" />
        </div>
        <p className="modal-copy">RACOI에서는 게시글 수, 댓글 수, 영상 조회수, 공개된 시청률 값을 함께 읽었습니다. 시청률이 보이지 않는 경우 0으로 바꾸지 않고 비워 두어, 프로그램 반응을 실제보다 약하게 해석하지 않도록 처리했습니다.</p>
        <div className="mini-table">
          {programs
            .map((p) => ({ p, size: (p.racoi?.w41_posts || 0) + (p.racoi?.w41_comments || 0) }))
            .filter((row) => row.size > 0)
            .sort((a, b) => b.size - a.size)
            .slice(0, 4)
            .map(({ p, size }) => (
              <div key={p.program_id} className="mini-table-row">
                <b>{name(p)}</b>
                <span>게시글 {fmt(p.racoi?.w41_posts)}건</span>
                <span>댓글 {fmt(p.racoi?.w41_comments)}건</span>
                <strong>총 {fmt(size)}건</strong>
              </div>
            ))}
        </div>
      </DataModal>
      <DataModal open={modal === 'youtube'} onClose={() => setModal('')} title="유튜브 관련 영상 데이터">
        <div className="modal-summary-grid v9-modal-grid">
          <CompactStat number={fmt(totals.totalVideos)} unit="건" label="관련 유튜브 영상" note="분류된 프로그램 관련 영상" />
          <CompactStat number={fmt(totals.confirmedVideos)} unit="건" label="방송일 일치 영상" note="제목과 방송 날짜 대조" />
          <div className="v9-stat v9-rule-card"><b>영상 연결 기준</b><p>프로그램명<br />영상 제목<br />게시일</p></div>
        </div>
        <p className="modal-copy">유튜브에서는 프로그램명, 영상 제목, 게시일 정보를 함께 확인해 관련 영상을 찾았습니다. 이 데이터를 통해 어떤 프로그램이 온라인에서 더 활발히 운영되고 있는지, 그리고 어떤 포맷이 반복적으로 사용되는지를 비교할 수 있습니다.</p>
        <div className="mini-table">
          {topSupply.map((p) => (
            <div key={p.program_id} className="mini-table-row">
              <b>{name(p)}</b>
              <span>10월 1주차 {fmt(p.youtube?.w40_owner_candidates)}건</span>
              <span>10월 2주차 {fmt(p.youtube?.w41_owner_candidates)}건</span>
              <strong>총 {fmt(yt(p))}건</strong>
            </div>
          ))}
        </div>
      </DataModal>
    </section>
  );
}

function FeatureCard({ p, go }) {
  return (
    <button className="feature-card" onClick={() => go(`/program/${p.program_id}`)}>
      <div className="feature-poster"><Poster p={p} /></div>
      <div className="feature-content">
        <div className="feature-top">
          <small>{genreOf(p)}</small>
          <Signal p={p} />
        </div>
        <h3>{name(p)}</h3>
        <p>{insightCopy(p)}</p>
        <div className="feature-footer">분석 자세히 보기 <Arrow /></div>
      </div>
    </button>
  );
}

function SpotlightHome({ programs, go }) {
  const best = [...programs].sort((a, b) => qualityScore(b) - qualityScore(a)).slice(0, 4);
  return (
    <section className="section">
      <Caption tag="PROGRAM SPOTLIGHT" title="주목할 만한 프로그램" desc="검색 변화와 온라인 반응, 유튜브 운영 흐름을 함께 봤을 때 먼저 확인할 가치가 높은 프로그램입니다." />
      <div className="feature-grid">{best.map((p) => <FeatureCard key={p.program_id} p={p} go={go} />)}</div>
    </section>
  );
}

function HomeSearchOverview({ programs, go }) {
  return (
    <section className="section">
      <Caption tag="SEARCH RANKING" title="검색 관심도가 높아진 프로그램" desc="10월 1주차와 10월 2주차 평균 검색지수를 비교해 어느 프로그램에서 관심이 증가하고 있는지 확인할 수 있습니다." />
      <SearchLineRanking programs={programs} limit={6} />
      <div className="section-cta-wrap"><button className="line-button" onClick={() => go('/trends')}>전체 화제성 분석 자세히 보기 <Arrow /></button></div>
    </section>
  );
}

function Home({ programs, go }) {
  return (
    <>
      <BrandHero go={go} programs={programs} />
      <main className="container page-home">
        <Guide programs={programs} />
        <SpotlightHome programs={programs} go={go} />
        <HomeSearchOverview programs={programs} go={go} />
        <section className="section">
          <div className="next-block">
            <div>
              <span className="eyebrow">PROGRAM REPORTS</span>
              <h2>17개 프로그램 분석 리포트</h2>
              <p>프로그램별 페이지에서 검색 반응, RACOI 온라인 반응, 유튜브 공급량과 콘텐츠 구성, AI 전략 리포트를 한 번에 확인할 수 있습니다.</p>
            </div>
            <button className="primary" onClick={() => go('/programs')}>프로그램별 분석 보기 <Arrow /></button>
          </div>
        </section>
      </main>
    </>
  );
}

export { HeroAnalytics, BrandHero, QuickLink, Guide, FeatureCard, SpotlightHome, HomeSearchOverview, Home };

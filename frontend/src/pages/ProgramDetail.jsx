// 프로그램 상세 지표와 영상·전략 보고서를 연결합니다.
import { useEffect, useState } from 'react';
import { KINDS, fmt, delta, change, name, yt, genreOf, naverA, naverB, detailSummary } from '../utils/programData.js';
import { Arrow, Caption, Metric, Poster, LockCard, ReadableRacoiStat } from '../components/Common.jsx';
import { FlowSlope } from '../components/Charts.jsx';
import { Strategy } from '../components/Strategy.jsx';
import { VideosSection } from '../components/VideosSection.jsx';

function DetailSearchPanel({ p }) {
  const a = naverA(p), b = naverB(p), d = change(p);
  return <div className="panel">
    <h3>네이버 검색지수 비교</h3>
    <p>{name(p)}의 10월 1주차 평균 {a.toFixed(1)}에서 10월 2주차 평균 {b.toFixed(1)}로 바뀌었습니다. {typeof d === 'number' ? (d > 0 ? `${delta(d)} 증가한 흐름입니다.` : d < 0 ? `${Math.abs(d).toFixed(1)}% 감소한 흐름입니다.` : '두 주차에 큰 차이가 없습니다.') : '검색 변화를 확인할 수 없습니다.'}</p>
    <FlowSlope a={a} b={b} title="네이버 검색지수" />
    <p className="panel-foot">한 프로그램의 같은 검색어에 대한 평균값만 비교했습니다.</p>
  </div>;
}

function DetailSupplyPanel({ p }) {
  const a = p.youtube?.w40_owner_candidates || 0, b = p.youtube?.w41_owner_candidates || 0;
  if (a === 0 && b === 0) return <LockCard title="유튜브 공급량 비교 준비 중" desc={<>이 프로그램은 아직 주차별 관련 영상 데이터가 충분하지 않아,<br />확보된 분석부터 우선 보여주고 있습니다.</>} />;
  const diff = b - a;
  return <div className="panel">
    <h3>유튜브 공급량 비교</h3>
    <p>{name(p)}의 관련 영상은 10월 1주차 {a}건에서 10월 2주차 {b}건으로 {diff > 0 ? `${diff}건 늘었습니다.` : diff < 0 ? `${Math.abs(diff)}건 줄었습니다.` : '같은 수준을 유지했습니다.'} 검색 변화와 나란히 보면 온라인 콘텐츠 운영 흐름을 확인할 수 있습니다.</p>
    <FlowSlope a={a} b={b} unit="건" title="관련 유튜브 영상 수" />
    <p className="panel-foot">프로그램 관련 영상으로 분류한 수치이며, 공식 채널의 전체 업로드 수와는 다를 수 있습니다.</p>
  </div>;
}

function DetailMixPanel({ p }) {
  const rows = KINDS.map(([key, label, icon]) => ({ label, icon, w40: p.youtube?.type_mix?.[key]?.w40_count || 0, w41: p.youtube?.type_mix?.[key]?.w41_count || 0 })).filter((row) => row.w40 > 0 || row.w41 > 0);
  if (!rows.length) return <LockCard title="유튜브 콘텐츠 구성 준비 중" desc="이 프로그램은 아직 유형별 영상 분류 데이터가 충분하지 않아, 확보된 데이터부터 우선 보여주고 있습니다." />;
  const max = Math.max(1, ...rows.map((r) => Math.max(r.w40, r.w41)));
  return (
    <div className="panel">
      <h3>유튜브 콘텐츠 구성</h3>
      <p>클립, 무대, 예고, 다시보기·특집 중 어떤 포맷이 더 많이 사용됐는지 비교했습니다.</p>
      <div className="mix-cards detail-mix">
        {rows.map((row) => (
          <div key={row.label} className="mix-card">
            <div className="mix-card__head"><span className="mix-icon">{row.icon}</span><b>{row.label}</b></div>
            <div className="mix-pill"><div className="mix-pill__track"><div className="mix-pill__prev" style={{ width: `${(row.w40 / max) * 100}%` }}></div></div><span>10월 1주차 {fmt(row.w40)}건</span></div>
            <div className="mix-pill"><div className="mix-pill__track"><div className="mix-pill__curr" style={{ width: `${(row.w41 / max) * 100}%` }}></div></div><span>10월 2주차 {fmt(row.w41)}건</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailRacoiPanel({ p }) {
  const r = p.racoi;
  const hasAny = (r?.w41_posts || 0) || (r?.w41_comments || 0) || (r?.w41_video_views_thousand || 0);
  if (!hasAny) return <LockCard title="RACOI 온라인 반응 준비 중" desc="현재 연결된 공개 데이터가 적어, 추가 지표가 확보되면 온라인 반응을 더 자세히 보여줄 예정입니다." />;
  return <div className="panel">
    <h3>RACOI 온라인 반응</h3>
    <p>10월 2주차에 공개된 프로그램의 온라인 반응 규모입니다.</p>
    <div className="racoi-metrics v9-racoi-metrics">
      <ReadableRacoiStat value={r?.w41_posts} label="게시글" />
      <ReadableRacoiStat value={r?.w41_comments} label="댓글" />
      <ReadableRacoiStat value={r?.w41_video_views_thousand} label="영상 조회수" views />
    </div>
    <p className="panel-foot">미확인 시청률은 0%로 간주하지 않고 지표 비교에서 제외했습니다.</p>
  </div>;
}

function Detail({ p, go }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    // 프로그램 전환 시 기존 로딩 화면과 요청 순서를 유지합니다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/v1/programs/${p.program_id}/videos`)
      .then((r) => r.json())
      .then((d) => { if (live) setVideos(d.videos || []); })
      .catch(() => {})
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [p.program_id]);
  return (
    <main className="container page">
      <div className="page-back"><button onClick={() => go('/programs')}><Arrow right={false} /> 프로그램 목록</button></div>
      <div className="detail-hero">
        <div className="detail-poster"><Poster p={p} /></div>
        <div>
          <span className="eyebrow">PROGRAM REPORT · {genreOf(p)}</span>
          <h1>{name(p)}</h1>
          <p className="detail-hero-desc">네이버 검색·RACOI 온라인 반응·유튜브 콘텐츠 흐름 분석</p>
          <div className="detail-hero-metrics uniform-metrics">
            <Metric value={delta(change(p))} label="검색 관심 변화" />
            <Metric value={`${fmt(yt(p))}건`} label="관련 유튜브 영상" />
            <Metric value={`${fmt(p.racoi?.w41_comments)}건`} label="RACOI 댓글" />
          </div>
        </div>
      </div>
      <div className="v9-insight-card"><div className="v9-insight-inner"><span>데이터에서 먼저 확인되는 변화</span><p>{detailSummary(p)}</p></div></div>
      <Strategy p={p} />
      <section className="section">
        <Caption tag="DATA SNAPSHOT" title="이 프로그램에서 먼저 확인할 데이터" desc="검색 흐름, 온라인 반응, 유튜브 공급량과 콘텐츠 구성을 함께 보며 이 프로그램의 특징을 읽을 수 있습니다." />
        <div className="detail-panels detail-panels--single">
          <DetailSearchPanel p={p} />
          <DetailSupplyPanel p={p} />
          <DetailMixPanel p={p} />
          <DetailRacoiPanel p={p} />
        </div>
      </section>
      <section className="section">{loading ? <p>영상 불러오는 중…</p> : <VideosSection videos={videos} />}</section>
    </main>
  );
}

export { DetailSearchPanel, DetailSupplyPanel, DetailMixPanel, DetailRacoiPanel, Detail };

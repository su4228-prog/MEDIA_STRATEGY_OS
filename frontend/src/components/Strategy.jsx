// 수동 요청으로만 AI 전략을 생성하고 기존 보고서와 비교 차트를 표시합니다.
import { useState } from 'react';
import { Arrow } from './Common.jsx';

function StrategyComparison({ rows }) {
  if (!rows?.length) return null;
  return (
    <div className="ai-evidence">
      <div className="ai-section-kicker">DATA COMPARISON</div>
      <h4>주요 데이터 비교</h4>
      <div className="ai-week-head">
        <span><i className="ai-legend-dot before" />10월 1주차 <small>9월 28일~10월 4일</small></span>
        <span><i className="ai-legend-dot after" />10월 2주차 <small>10월 5일~11일</small></span>
      </div>
      <div className="ai-compare-grid">
        {rows.map((row, i) => {
          const a = Math.max(0, Number(row.w40) || 0);
          const b = Math.max(0, Number(row.w41) || 0);
          const max = Math.max(a, b, 1);
          const aWidth = a <= 0 ? 0 : Math.max(2.5, (a / max) * 100);
          const bWidth = b <= 0 ? 0 : Math.max(2.5, (b / max) * 100);
          return (
            <div className="ai-comparison-card" key={`${row.label}-${i}`}>
              <div className="ai-compare-top">
                <strong>{row.label}</strong>
                <span className="ai-change">{row.change_text}</span>
              </div>
              <div className="ai-compare-barline"><span>1주차</span><div className="ai-compare-track"><div className="ai-compare-fill before" style={{ width: `${aWidth}%` }} /></div><b>{row.w40_text}</b></div>
              <div className="ai-compare-barline"><span>2주차</span><div className="ai-compare-track"><div className="ai-compare-fill after" style={{ width: `${bWidth}%` }} /></div><b>{row.w41_text}</b></div>
            </div>
          );
        })}
      </div>
      <p className="ai-chart-note">각 지표 안에서 두 주의 차이를 비교한 그래프입니다. 검색지수·영상 수·비중은 서로 단위가 달라 그래프의 길이를 지표 간 비교에 사용하지 않습니다. 영상 수와 유형은 프로그램 관련 후보를 기준으로 합니다.</p>
    </div>
  );
}

function AIReport({ report }) {
  if (!report) return null;
  const racoi = report.racoi || {};
  const hasRacoi = racoi.posts != null || racoi.comments != null || racoi.video_views_thousand != null;
  return (
    <div className="ai-report-v3">
      <div className="ai-report-intro">
        <span className="ai-section-kicker">PROGRAM STRATEGY REPORT</span>
        <div className="ai-report-period">{report.period}</div>
        <h4>{report.headline}</h4>
        <p>{report.insight}</p>
      </div>
      <StrategyComparison rows={report.comparison_rows} weekLabels={report.week_labels} />
      {hasRacoi && (
        <div className="ai-racoi-block">
          <div><span className="ai-section-kicker">RACOI · 10월 2주차</span><h4>온라인 반응 규모</h4></div>
          <div className="ai-racoi-stats">
            {racoi.posts != null && <div><strong>{Number(racoi.posts).toLocaleString('ko-KR')}<small>건</small></strong><span>게시글</span></div>}
            {racoi.comments != null && <div><strong>{Number(racoi.comments).toLocaleString('ko-KR')}<small>건</small></strong><span>댓글</span></div>}
            {racoi.video_views_thousand != null && <div><strong>{racoi.video_views_display}</strong><span>영상 조회수</span></div>}
          </div>
        </div>
      )}
      <div className="ai-opportunities">
        <div className="ai-section-kicker">STRATEGY OPPORTUNITIES</div>
        <h4>데이터에서 찾은 전략적 기회</h4>
        <div className="ai-opportunity-grid">
          {(report.opportunities || []).map((item, i) => (
            <article className="ai-opportunity" key={i}>
              <div className="ai-opportunity-number">기회 {i + 1}</div>
              <h5>{item.title}</h5>
              <div className="ai-opportunity-subtitle">분석 근거</div>
              <p>{item.basis}</p>
              <div className="ai-opportunity-subtitle">전략 제안</div>
              <p>{item.action}</p>
            </article>
          ))}
        </div>
      </div>
      <section className="ai-experiment">
        <div className="ai-section-kicker">CONTENT EXPERIMENT</div>
        <h4>우선 검토할 콘텐츠 실험</h4>
        <h5>{report.experiment?.title}</h5>
        <div className="ai-experiment-grid">
          <div><b>실행 방법</b><p>{report.experiment?.plan}</p></div>
          <div><b>성과 측정</b><p>{report.experiment?.metrics}</p></div>
          <div><b>판단 기준</b><p>{report.experiment?.decision}</p></div>
        </div>
      </section>
      <section className="ai-conclusion">
        <div className="ai-section-kicker">FINAL RECOMMENDATION</div>
        <h4>최종 전략 제안</h4>
        <p>{report.conclusion}</p>
      </section>
      {!!report.limitations?.length && (
        <details className="ai-limitations">
          <summary>분석 범위와 데이터 처리 기준</summary>
          <ul>{report.limitations.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </details>
      )}
    </div>
  );
}

function Strategy({ p }) {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const call = async () => {
    setStatus('loading');
    setError('');
    setReport(null);
    try {
      const response = await fetch(`/api/v1/ai/strategy/${encodeURIComponent(p.program_id)}`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw Error(typeof data.detail === 'string' ? data.detail : `리포트 생성 오류 ${response.status}`);
      if (!data.report?.headline || !Array.isArray(data.report?.comparison_rows)) {
        throw Error('현재 백엔드가 이전 버전의 리포트를 반환했습니다. 백엔드를 재시작한 뒤 다시 생성해 주세요.');
      }
      setReport(data.report);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setError(e.message);
    }
  };
  return (
    <section className="strategy">
      <div>
        <span className="eyebrow">AI STRATEGY</span>
        <h3>이 프로그램의 다음 콘텐츠 전략</h3>
        <p>확인된 데이터를 바탕으로 프로그램별 핵심 변화, 전략적 기회, 실험 방법을 정리합니다.</p>
      </div>
      <button className="primary" onClick={call} disabled={status === 'loading'}>{status === 'loading' ? '분석 중…' : report ? 'AI 리포트 다시 생성하기' : 'AI 전략 리포트 확인하기'} <Arrow /></button>
      {status === 'error' && <p className="status-error">{error}</p>}
      {status === 'done' && <AIReport report={report} />}
    </section>
  );
}

export { StrategyComparison, AIReport, Strategy };

// 프로그램별 검색·공급·콘텐츠 구성 비교 화면입니다.
import { fmt, computeTotals } from '../utils/programData.js';
import { Arrow, Caption, Metric } from '../components/Common.jsx';
import { SearchLineRanking, BubblePanel, SupplyCompare, MixCompare } from '../components/Charts.jsx';

function TrendPage({ programs, go }) {
  const totals = computeTotals(programs);
  return (
    <main className="container page">
      <div className="page-back"><button onClick={() => go('/')}><Arrow right={false} /> 홈</button></div>
      <Caption
        tag="ATTENTION ANALYSIS"
        title="화제성 분석 대시보드"
        desc="시청률, 검색 변화, 온라인 반응, 유튜브 공급량과 콘텐츠 구성을 함께 비교해 프로그램의 관심 흐름을 확인합니다."
      />
      <div className="dashboard-metrics uniform-metrics">
        <Metric value={`${programs.length}개`} label="분석 프로그램" />
        <Metric value={`${fmt(totals.totalVideos)}건`} label="관련 유튜브 영상" caption="프로그램별 연결 데이터" />
        <Metric value={`${fmt(totals.totalComments)}건`} label="10월 2주차 RACOI 댓글" />
        <Metric value={`${fmt(totals.confirmedVideos)}건`} label="분석 확정 영상" />
      </div>
      <div className="dashboard-grid dashboard-grid--singlewide">
        <article className="panel panel--wide">
          <h3>검색 관심 상승률 순위</h3>
          <p>10월 1주차는 회색, 10월 2주차는 주황색으로 구분해 검색 관심 변화를 비교했습니다.</p>
          <SearchLineRanking programs={programs} limit={8} />
        </article>
        <article className="panel">
          <h3>RACOI 온라인 반응 규모</h3>
          <p>10월 2주차 게시글과 댓글이 많이 모인 프로그램일수록 더 크게 보이도록 시각화했습니다.</p>
          <BubblePanel programs={programs} />
        </article>
        <article className="panel">
          <h3>유튜브 공급량 비교</h3>
          <p>관련 영상이 얼마나 꾸준히 올라왔는지 주차별로 비교했습니다.</p>
          <SupplyCompare programs={programs} />
        </article>
        <article className="panel panel--wide">
          <h3>유튜브 콘텐츠 구성 비교</h3>
          <p>클립, 무대, 예고, 다시보기·특집 등 어떤 포맷이 더 많이 쓰였는지 10월 1주차와 10월 2주차를 나눠 봅니다.</p>
          <MixCompare programs={programs} />
        </article>
      </div>
      <div className="data-footnote">
        <h3>데이터 해석 기준</h3>
        <p>네이버 검색 데이터는 같은 검색어를 기준으로 10월 1주차와 10월 2주차 평균값을 비교했습니다. RACOI는 게시글·댓글·영상 조회수 등 공개된 값을 사용했고, 시청률이 보이지 않는 항목은 0으로 바꾸지 않고 비워 두어 실제 반응을 왜곡하지 않도록 처리했습니다. 유튜브는 프로그램명, 제목, 게시일 정보를 함께 사용해 관련 영상을 찾았기 때문에 실제 전체 업로드 수와는 차이가 있을 수 있습니다.</p>
      </div>
      <button className="primary" onClick={() => go('/programs')}>프로그램 상세 분석으로 이동 <Arrow /></button>
    </main>
  );
}

export { TrendPage };

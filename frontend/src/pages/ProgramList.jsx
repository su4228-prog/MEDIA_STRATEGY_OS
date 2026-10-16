// 기존 검색과 정렬 기준을 유지하는 프로그램 목록입니다.
import { useMemo, useState } from 'react';
import { fmt, change, name, yt, genreOf, qualityScore } from '../utils/programData.js';
import { Arrow, Caption, Poster, Signal } from '../components/Common.jsx';

function ProgramList({ programs, go }) {
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('quality');
  const list = useMemo(
    () =>
      programs
        .filter((p) => `${name(p)} ${genreOf(p)}`.toLowerCase().includes(filter.toLowerCase()))
        .sort((a, b) =>
          sort === 'quality'
            ? qualityScore(b) - qualityScore(a)
            : sort === 'change'
              ? (change(b) ?? -1e9) - (change(a) ?? -1e9)
              : sort === 'video'
                ? yt(b) - yt(a)
                : name(a).localeCompare(name(b), 'ko'),
        ),
    [programs, filter, sort],
  );
  return (
    <main className="container page">
      <div className="page-back"><button onClick={() => go('/')}><Arrow right={false} /> 홈</button></div>
      <Caption tag="PROGRAM DIRECTORY" title="17개 프로그램 분석 리포트" desc="데이터 흐름이 비교적 잘 드러나는 프로그램부터 먼저 확인할 수 있도록 정리했습니다." />
      <div className="directory-tools">
        <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="프로그램명 또는 장르 검색" aria-label="프로그램명 검색" />
        <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
          <option value="quality">추천순</option>
          <option value="change">검색 관심 상승순</option>
          <option value="video">관련 영상 많은 순</option>
          <option value="name">가나다순</option>
        </select>
        <span>{list.length}개 프로그램</span>
      </div>
      <div className="directory-grid">
        {list.map((p) => (
          <button key={p.program_id} className="directory-card" onClick={() => go(`/program/${p.program_id}`)}>
            <div className="directory-poster"><Poster p={p} /></div>
            <div className="directory-info">
              <span>{genreOf(p)}</span>
              <h3>{name(p)}</h3>
              <div className="directory-metrics">
                <p><span>검색 변화</span> <Signal p={p} /></p>
                <p><span>관련 영상</span> <b>{fmt(yt(p))}건</b></p>
                <p><span>RACOI 게시글</span> <b>{fmt(p.racoi?.w41_posts)}건</b></p>
              </div>
              <div className="directory-link">분석 자세히 보기 <Arrow /></div>
            </div>
          </button>
        ))}
      </div>
    </main>
  );
}

export { ProgramList };

// 최신 관련 영상과 세 개씩 넘기는 슬라이드를 표시합니다.
import { useEffect, useMemo, useState } from 'react';
import { videoId, latestDateValue } from '../utils/programData.js';
import { Caption, LockCard } from './Common.jsx';

function VideoCarousel({ videos }) {
  const valid = useMemo(() => videos.filter((v) => videoId(v)).sort((a, b) => latestDateValue(b) - latestDateValue(a)).slice(0, 9), [videos]);
  const [page, setPage] = useState(0);
  // 영상 목록이 바뀌면 기존 동작대로 첫 페이지부터 표시합니다.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(0); }, [videos]);
  if (!valid.length) return <LockCard title="관련 유튜브 영상 준비 중" desc="영상 링크와 메타데이터가 연결되는 프로그램부터 순차적으로 보여줄 예정입니다." />;
  const totalPages = Math.ceil(valid.length / 3);
  const shown = valid.slice(page * 3, page * 3 + 3);
  return (
    <div className="video-slider">
      <div className="video-grid-3">
        {shown.map((current, idx) => (
          <article key={current.video_id || idx} className="video-card-clean">
            <div className="video-frame">
              <iframe
                title={current.title}
                loading="lazy"
                src={`https://www.youtube-nocookie.com/embed/${videoId(current)}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
            <div className="video-mini-meta">
              <span>{current.uploaded_date_kst || '날짜 정보 없음'}</span>
              <a href={current.video_url} target="_blank" rel="noreferrer">유튜브에서 보기 ↗</a>
            </div>
          </article>
        ))}
      </div>
      <div className="video-controls">
        <button onClick={() => setPage((page - 1 + totalPages) % totalPages)} aria-label="이전 3개 영상">←</button>
        <span>{page + 1} / {totalPages}</span>
        <button onClick={() => setPage((page + 1) % totalPages)} aria-label="다음 3개 영상">→</button>
      </div>
    </div>
  );
}

function VideosSection({ videos }) {
  return (
    <div className="video-area">
      <Caption tag="YOUTUBE CONTENT" title="최신 업로드된 관련 유튜브 영상" desc="최신 업로드 영상을 3개씩 넘겨보며 프로그램의 온라인 운영 흐름을 확인할 수 있습니다." />
      <VideoCarousel videos={videos} />
    </div>
  );
}

export { VideoCarousel, VideosSection };

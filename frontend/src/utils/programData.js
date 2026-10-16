// 기존 집계·표시·정렬 기준을 화면과 분리하며 결측 처리와 계산식을 보존합니다.

const WEEK_A = '10월 1주차 (9월 28일~10월 4일)';

const WEEK_B = '10월 2주차 (10월 5일~10월 11일)';

const PERIOD = '2026. 09. 28 — 10. 11';

const BUILD_MARKER = 'MSOS-V9-VERIFIED-20261017';

const WORDING_MARKER = 'MSOS-V9-WORDING-PATCH-20261017';

const KINDS = [
  ['CLIP_CANDIDATE', '클립', '🎬'],
  ['MUSIC_STAGE', '무대', '🎤'],
  ['PROMO_PREVIEW', '예고', '📢'],
  ['FULL_REPLAY_SPECIAL', '다시보기·특집', '📺'],
  ['NEWS_REPORT', '뉴스', '📰'],
];

const GENRES = {
  MBN01: '뉴스·시사',
  MBN02: '자연·휴먼',
  MBN03: '휴먼·관찰',
  MBN04: '여행·로드',
  MBN05: '라이프·메이크오버',
  MBN06: '건강·의학',
  MBN07: '예능·토크',
  MBN08: '토크·가족',
  MBN09: '요리·생활',
  MBN10: '건강·교양',
  MBN11: '경연·예능',
  MBN12: '맛집·여행',
  MBN13: '건강·생활',
  MBN14: '휴먼스토리',
  MBN15: '시사·토크',
  MBN16: '건강·정보',
  MBN17: '휴먼·다큐',
};

const GENRE_ICONS = {
  '뉴스·시사': '🗞️',
  '자연·휴먼': '🌿',
  '휴먼·관찰': '👀',
  '여행·로드': '🧭',
  '라이프·메이크오버': '✨',
  '건강·의학': '🩺',
  '예능·토크': '🎭',
  '토크·가족': '💬',
  '요리·생활': '🍳',
  '건강·교양': '💪',
  '경연·예능': '🏆',
  '맛집·여행': '🍽️',
  '건강·생활': '🌱',
  '휴먼스토리': '📚',
  '시사·토크': '🎙️',
  '건강·정보': '🧬',
  '휴먼·다큐': '🎞️',
};

const fmt = (n) => Number.isFinite(Number(n)) && n !== null && n !== undefined && n !== '' ? Number(n).toLocaleString('ko-KR') : '—';

const delta = (n) => (typeof n === 'number' ? `${n > 0 ? '+' : ''}${n.toFixed(1)}%` : '집계 없음');

const change = (p) => p?.naver?.w40_to_w41_change_pct;

const name = (p) => p?.program_name || '프로그램';

const yt = (p) => p?.youtube?.total_owner_candidates ?? 0;

const genreOf = (p) => GENRES[p?.program_id] || '프로그램';

const genreIcon = (p) => GENRE_ICONS[genreOf(p)] || '📺';

const naverA = (p) => p?.naver?.w40_index_mean ?? 0;

const naverB = (p) => p?.naver?.w41_index_mean ?? 0;

const videoId = (v) => v?.video_id || (v?.video_url || '').match(/[?&]v=([^&]+)/)?.[1];

const latestDateValue = (v) => {
  const raw = v?.uploaded_date_kst || v?.uploaded_date || '';
  const normalized = String(raw).replace(/\./g, '-');
  const t = Date.parse(normalized);
  return Number.isNaN(t) ? 0 : t;
};

const qualityScore = (p) =>
  (p?.youtube?.official_date_crossmatched_count || 0) * 3 +
  (p?.youtube?.total_owner_candidates || 0) +
  (p?.racoi?.w41_posts != null ? 6 : 0) +
  (p?.racoi?.w41_comments != null ? 5 : 0) +
  (typeof change(p) === 'number' ? 5 : 0);

const clean = (s = '') =>
  String(s)
    .replace(/\b(?:naver|youtube|racoi|decision|confidence)\.[a-z][\w.]*\b/gi, '')
    .replace(/\b(?:w40|w41|program_id|source_status|execution_allowed|sample_gate|type_mix|model_candidate|exploratory_only)\b/gi, '')
    .replace(/\b[A-Z][A-Z_]{5,}\b/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

function insightCopy(p) {
  const d = change(p);
  const videosNow = p.youtube?.w41_owner_candidates || 0;
  const videosPrev = p.youtube?.w40_owner_candidates || 0;
  const comments = p.racoi?.w41_comments || 0;
  if (d == null) return '검색지수보다는 온라인 반응과 영상 흐름을 먼저 확인해볼 가치가 있는 프로그램입니다.';
  if (d >= 25 && comments >= 10) return `검색 반응이 크게 올라왔고 온라인 댓글도 함께 붙었습니다. ${name(p)}의 화제가 실제 반응으로 이어지는 흐름입니다.`;
  if (d >= 25) return `${name(p)}는 10월 2주차 검색 반응이 크게 상승했습니다. 관심이 붙은 회차와 장면을 중심으로 후속 노출을 살펴볼 만합니다.`;
  if (d >= 12 && videosNow > videosPrev) return `검색 관심이 살아나는 동시에 관련 영상 공급도 늘었습니다. ${name(p)}를 온라인에서 더 적극적으로 밀고 있는 흐름이 보입니다.`;
  if (d >= 5 && videosNow > 0) return `검색 변화 폭은 크지 않지만 관련 영상이 이어지고 있습니다. ${name(p)}는 온라인 운영 흐름을 함께 봐야 특징이 드러나는 프로그램입니다.`;
  if (videosNow > videosPrev) return `검색 변화는 제한적이지만 영상 공급이 유지되고 있습니다. ${name(p)}는 유튜브 운영 강도를 함께 봐야 해석이 쉬운 프로그램입니다.`;
  return `${name(p)}는 큰 급등보다는 완만한 흐름을 보입니다. 검색 반응보다 포맷 운영과 온라인 반응을 함께 보는 편이 유용합니다.`;
}

function detailSummary(p) {
  const d = change(p);
  const a = p.youtube?.w40_owner_candidates || 0;
  const b = p.youtube?.w41_owner_candidates || 0;
  if (d == null) return '검색지수보다는 온라인 반응과 영상 운영 흐름을 먼저 확인하는 편이 좋은 프로그램입니다.';
  if (d >= 20) return `${name(p)}는 10월 2주차 검색 반응이 10월 1주차보다 ${delta(d)} 높습니다. 관심이 붙은 소재가 비교적 또렷하게 드러나는 편입니다.`;
  if (d >= 5) return `${name(p)}는 10월 2주차 검색 반응이 10월 1주차보다 ${delta(d)} 높습니다. 완만하지만 상승 흐름이 이어지고 있습니다.`;
  if (b > a) return `${name(p)}는 검색 변화보다 영상 공급 흐름이 먼저 눈에 띕니다. 온라인 운영 강도를 함께 봐야 특징이 읽힙니다.`;
  return `${name(p)}는 큰 급등보다는 안정적인 흐름을 보입니다. 검색 변화만보다 온라인 반응과 콘텐츠 구성을 함께 보는 편이 좋습니다.`;
}

function computeTotals(programs) {
  const totalVideos = programs.reduce((s, p) => s + yt(p), 0);
  const confirmedVideos = programs.reduce((s, p) => s + (p.youtube?.official_date_crossmatched_count || 0), 0);
  const totalPosts = programs.reduce((s, p) => s + (p.racoi?.w41_posts || 0), 0);
  const totalComments = programs.reduce((s, p) => s + (p.racoi?.w41_comments || 0), 0);
  return { totalVideos, confirmedVideos, totalPosts, totalComments };
}

export { insightCopy, detailSummary, computeTotals, WEEK_A, WEEK_B, PERIOD, BUILD_MARKER, WORDING_MARKER, KINDS, GENRES, GENRE_ICONS, fmt, delta, change, name, yt, genreOf, genreIcon, naverA, naverB, videoId, latestDateValue, qualityScore, clean };

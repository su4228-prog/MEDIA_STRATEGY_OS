"""원본 지표로 전략 근거를 계산하며 결측·후보 분류 기준을 보존한다."""

import json
import logging
import re

from fastapi import HTTPException

from app.config import DATA_DIR

logger = logging.getLogger("msos.ai")


WEEK_1 = "10월 1주차(9월 28일~10월 4일)"


WEEK_2 = "10월 2주차(10월 5일~10월 11일)"


GENRE_GUIDANCE = {
    "MBN01": "뉴스·시사",
    "MBN02": "자연·휴먼",
    "MBN03": "휴먼·관찰",
    "MBN04": "여행·로드",
    "MBN05": "라이프·메이크오버",
    "MBN06": "건강·의학",
    "MBN07": "예능·토크",
    "MBN08": "토크·가족",
    "MBN09": "요리·생활",
    "MBN10": "건강·교양",
    "MBN11": "음악 경연",
    "MBN12": "맛집·여행",
    "MBN13": "건강·생활",
    "MBN14": "휴먼스토리",
    "MBN15": "시사·토크",
    "MBN16": "건강·정보",
    "MBN17": "휴먼·다큐",
}


TYPE_NAMES = {
    "CLIP_CANDIDATE": "일반 클립",
    "MUSIC_STAGE": "음악 무대",
    "PROMO_PREVIEW": "예고·미리보기",
    "FULL_REPLAY_SPECIAL": "다시보기·특집",
    "NEWS_REPORT": "뉴스",
}


def _read(name: str, collection: str):
    """파일명과 컬렉션명을 받아 원본 JSON 목록을 반환하며 읽기 실패는 503으로 전달한다."""
    try:
        with (DATA_DIR / name).open(encoding="utf-8") as f:
            return json.load(f)[collection]
    except (FileNotFoundError, KeyError, json.JSONDecodeError) as e:
        logger.exception("Local analysis file is unavailable: %s", name)
        raise HTTPException(
            status_code=503, detail=f"Local analysis data unavailable: {name}"
        ) from e


def _program_index():
    """원본 프로그램 목록을 읽어 프로그램 ID별 조회 사전을 반환한다."""
    return {p["program_id"]: p for p in _read("programs_v1.json", "programs")}


def _number(value):
    """입력값을 유한한 실수로 변환하며 결측·불리언·무한대는 None으로 반환한다."""
    # 불리언과 결측을 수치 0으로 해석하면 관측되지 않은 증감률이 생긴다.
    if value is None or isinstance(value, bool):
        return None
    try:
        n = float(value)
    except (TypeError, ValueError):
        return None
    return n if n == n and abs(n) != float("inf") else None


def _fmt(value, decimals=1):
    """관측값과 소수 자릿수를 받아 표시 문자열을 반환하며 결측을 0으로 바꾸지 않는다."""
    n = _number(value)
    if n is None:
        return "확인 불가"
    if decimals == 0 or n.is_integer():
        return f"{n:,.0f}"
    return f"{n:,.{decimals}f}"


def _signed(value):
    """변화율을 받아 부호가 있는 백분율 문자열을 반환한다."""
    n = _number(value)
    if n is None:
        return "확인 불가"
    return f'{"+" if n > 0 else ""}{n:,.1f}%'


def _normalize_title(text):
    """영상 제목의 공백과 길이만 정리한 문자열을 반환한다."""
    # Conservative cleanup only: no source paraphrasing or inferred metadata.
    return re.sub(r"\s+", " ", str(text or "")).strip()[:150]


def _video_candidates(program_id):
    """프로그램 ID로 최신 영상 제목 후보를 중복 없이 최대 다섯 개 반환한다."""
    try:
        raw = _read("videos_v1.json", "videos")
    except HTTPException:
        return []
    rows = [v for v in raw if v.get("program_id_candidate") == program_id]
    rows.sort(
        key=lambda v: (
            str(v.get("uploaded_at_kst") or ""),
            str(v.get("uploaded_date_kst") or ""),
        ),
        reverse=True,
    )
    seen = set()
    samples = []
    for v in rows:
        title = _normalize_title(v.get("title"))
        if not title or title in seen:
            continue
        seen.add(title)
        samples.append(
            {
                "title": title,
                "upload_date": v.get("uploaded_date_kst"),
                "video_type": v.get("video_type_experimental_label") or "분류 미확인",
            }
        )
        if len(samples) == 5:
            break
    return samples


def _comparison_row(label, a, b, unit="", mode="count"):
    """두 주차 관측값과 단위를 받아 기존 계산 기준의 비교 행을 반환한다."""
    first, second = _number(a), _number(b)
    if first is None or second is None:
        return None
    if mode == "index":
        first_label, second_label = _fmt(first, 2), _fmt(second, 2)
        pct = (second - first) / first * 100 if first else None
        diff = f'{"+" if pct > 0 else ""}{pct:.1f}%' if pct is not None else "비교 불가"
    elif mode == "share":
        first_label, second_label = f"{first:.1f}%", f"{second:.1f}%"
        d = second - first
        diff = f'{"+" if d > 0 else ""}{d:.1f}%p'
    elif mode == "count_pct":
        first_label, second_label = f"{_fmt(first, 0)}건", f"{_fmt(second, 0)}건"
        pct = (second - first) / first * 100 if first else None
        diff = (
            f'{"+" if pct > 0 else ""}{pct:.1f}%'
            if pct is not None
            else f"{int(second-first):+d}건"
        )
    else:
        first_label, second_label = (
            f"{_fmt(first, 0)}{unit}",
            f"{_fmt(second, 0)}{unit}",
        )
        d = second - first
        diff = f"{int(d):+d}{unit}" if d else f"0{unit}"
    return {
        "label": label,
        "w40": first,
        "w41": second,
        "w40_text": first_label,
        "w41_text": second_label,
        "change_text": diff,
        "unit": unit,
        "kind": mode,
    }


def build_evidence(program: dict):
    """프로그램 원본 사전을 받아 관측 문장·비교 수치·해석 한계를 반환한다."""
    # 서로 다른 매체의 단위를 섞지 않고 각 지표 안에서만 주차를 비교한다.
    name = program.get("program_name") or "해당 프로그램"
    n = program.get("naver") or {}
    y = program.get("youtube") or {}
    r = program.get("racoi") or {}
    d = program.get("decision") or {}
    a = _number(n.get("w40_index_mean"))
    b = _number(n.get("w41_index_mean"))
    search_change = (
        ((b - a) / a * 100) if a not in (None, 0) and b is not None else None
    )
    y_a = _number(y.get("w40_owner_candidates"))
    y_b = _number(y.get("w41_owner_candidates"))

    rows = []
    add = rows.append
    for row in (
        _comparison_row("네이버 검색 관심지수", a, b, mode="index"),
        _comparison_row("유튜브 관련 영상 후보", y_a, y_b, mode="count_pct"),
    ):
        if row:
            add(row)

    type_mix = y.get("type_mix") or {}
    content_types = []
    for code, label in TYPE_NAMES.items():
        item = type_mix.get(code) or {}
        n_a, n_b = _number(item.get("w40_count")), _number(item.get("w41_count"))
        if n_a is None or n_b is None or (n_a == 0 and n_b == 0):
            continue
        s_a, s_b = _number(item.get("w40_share_pct")), _number(
            item.get("w41_share_pct")
        )
        content_types.append(
            {
                "label": label,
                "w40": int(n_a),
                "w41": int(n_b),
                "w40_share": s_a,
                "w41_share": s_b,
            }
        )
    content_types.sort(key=lambda item: (item["w41"], item["w40"]), reverse=True)
    for entry in content_types[:3]:
        candidate = _comparison_row(
            f'{entry["label"]} 영상 후보', entry["w40"], entry["w41"], unit="건"
        )
        if candidate:
            add(candidate)
        if entry["w40_share"] is not None and entry["w41_share"] is not None:
            candidate = _comparison_row(
                f'{entry["label"]} 비중',
                entry["w40_share"],
                entry["w41_share"],
                mode="share",
            )
            if candidate:
                add(candidate)

    observations = []
    if a is not None and b is not None:
        observations.append(
            f"네이버 검색 관심지수는 {WEEK_1} {_fmt(a, 2)}에서 {WEEK_2} {_fmt(b, 2)}로 "
            f"{_signed(search_change)} 변화했습니다."
        )
        if search_change is not None and abs(search_change) < 5:
            observations.append(
                "검색 관심 변화는 운영 기준인 ±5% 이내로, 큰 변화 없이 비슷한 수준입니다."
            )
    if y_a is not None and y_b is not None:
        y_change = (y_b - y_a) / y_a * 100 if y_a else None
        observations.append(
            f"유튜브 관련 영상 후보는 {WEEK_1} {_fmt(y_a, 0)}건에서 "
            f"{WEEK_2} {_fmt(y_b, 0)}건으로 변했습니다"
            + (
                f"({_signed(y_change)})."
                if y_change is not None
                else f"({int(y_b-y_a):+d}건)."
            )
        )
    for item in content_types[:2]:
        if item["w40_share"] is not None and item["w41_share"] is not None:
            observations.append(
                f'{item["label"]} 후보는 {item["w40"]}건에서 {item["w41"]}건으로, '
                f'구성 비중은 {item["w40_share"]:.1f}%에서 {item["w41_share"]:.1f}%로 변했습니다.'
            )
    comments = _number(r.get("w41_comments"))
    posts = _number(r.get("w41_posts"))
    views_k = _number(r.get("w41_video_views_thousand"))
    display_views = f"{views_k / 10:,.1f}만 회" if views_k is not None else "확인 불가"
    if any(v is not None for v in (posts, comments, views_k)):
        observations.append(
            f"RACOI {WEEK_2} 공개 지표는 게시글 {_fmt(posts, 0)}건, "
            f"댓글 {_fmt(comments, 0)}건, 영상 조회수 {display_views}입니다."
        )

    notes = [
        "네이버 검색지수는 같은 프로그램·같은 검색어의 주차 간 변화이며, 다른 프로그램과 절대 인기를 비교할 수 없습니다.",
        "유튜브 관련 영상은 프로그램명·제목 등으로 찾은 후보입니다. 실제 전체 업로드 수나 개별 영상 성과를 의미하지 않습니다.",
    ]
    if "PRIOR_DERIVED" in str(r.get("w40_posts_status", "")):
        notes.append(
            "RACOI 10월 1주차 게시글은 이전 가공값이어서, 10월 2주차 공개값과의 직접 증감률은 제시하지 않습니다."
        )
    if r.get("w41_household_rating_pct") is None or "INVALID" in str(
        r.get("w41_household_rating_status", "")
    ):
        notes.append("RACOI 시청률은 확인 불가로 표시하고 0%로 계산하지 않습니다.")
    if d.get("execution_allowed") is not True:
        notes.append(
            "전략은 검토안입니다. 실제 운영에 앞서 영상 권한과 측정 조건을 확인해야 합니다."
        )

    return {
        "program_id": program.get("program_id"),
        "program_name": name,
        "genre": GENRE_GUIDANCE.get(program.get("program_id"), "방송 프로그램"),
        "period": f"2026년 9월 28일~10월 11일",
        "week_labels": [WEEK_1, WEEK_2],
        "observations": observations,
        "comparison_rows": rows,
        "content_types": content_types,
        "search_change_pct": search_change,
        "youtube_week_counts": [y_a, y_b],
        "racoi": {
            "week": WEEK_2,
            "posts": posts,
            "comments": comments,
            "video_views_thousand": views_k,
            "video_views_display": display_views,
            "rating": (
                None
                if r.get("w41_household_rating_pct") is None
                or "INVALID" in str(r.get("w41_household_rating_status", ""))
                else _number(r.get("w41_household_rating_pct"))
            ),
        },
        "limitations": notes,
        "video_title_clues": _video_candidates(program.get("program_id"))[:5],
        "execution_allowed": d.get("execution_allowed") is True,
    }

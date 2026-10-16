"""모델 문장 검증과 추가 유료 호출 없는 대체 보고서 생성을 담당한다."""

import re

from app.schemas.strategy import OPPORTUNITY_SCHEMA, STRATEGY_SCHEMA
from app.services.strategy_evidence import _fmt, _signed

_INTERNAL_FIELD = re.compile(
    r"(?:\b(?:naver|youtube|racoi|decision|confidence|episode_date_evidence)\."
    r"[A-Za-z_][\w.]*\b|\b[a-zA-Z][a-zA-Z0-9]*_[a-zA-Z0-9_]+\b)"
)


_LATIN_TERMS = [
    (re.compile(r"\bA\s*/\s*B\b", re.I), "두 가지 방식"),
    (re.compile(r"\bCTR\b", re.I), "노출 클릭률"),
    (re.compile(r"\bKPI\b", re.I), "성과 지표"),
    (re.compile(r"\bSNS\b", re.I), "사회관계망"),
    (re.compile(r"\bYouTube\b", re.I), "유튜브"),
]


def _cleanup_prose(value: str) -> str:
    """모델 문장의 표시 형식만 정리한 문자열을 반환하며 관측 사실은 추가하지 않는다."""
    value = str(value).replace("\r", " ").replace("\n", " ").strip()
    value = re.sub(r"[\*`#]+", "", value)
    for pattern, replacement in _LATIN_TERMS:
        value = pattern.sub(replacement, value)
    return re.sub(r"\s+", " ", value).strip()


def _metric_numbers(text):
    """검증된 관측 문장에서 수치 문자열 집합을 추출해 반환한다."""
    return set(re.findall(r"(?<!\w)\d+(?:,\d{3})*(?:\.\d+)?", text))


def _validate_model_text(payload: dict, program_name="", evidence=None):
    """모델 JSON과 근거를 받아 구조와 수치 주장을 검증한 보고서를 반환한다."""
    expected = set(STRATEGY_SCHEMA["required"])
    if not isinstance(payload, dict) or set(payload) != expected:
        raise ValueError("Unexpected report structure")
    result = {}
    for field in STRATEGY_SCHEMA["required"]:
        if field == "opportunities":
            continue
        value = payload.get(field)
        if not isinstance(value, str) or not (3 <= len(value.strip()) <= 1600):
            raise ValueError(f"Invalid strategy field: {field}")
        result[field] = _cleanup_prose(value)
    opportunities = payload["opportunities"]
    if not isinstance(opportunities, list) or len(opportunities) != 2:
        raise ValueError("Exactly two opportunity items required")
    cleaned = []
    for opportunity in opportunities:
        if not isinstance(opportunity, dict) or set(opportunity) != set(
            OPPORTUNITY_SCHEMA["required"]
        ):
            raise ValueError("Invalid opportunity shape")
        item = {}
        for field in OPPORTUNITY_SCHEMA["required"]:
            value = opportunity[field]
            if not isinstance(value, str) or not (3 <= len(value.strip()) <= 1200):
                raise ValueError("Invalid opportunity text")
            item[field] = _cleanup_prose(value)
        cleaned.append(item)
    result["opportunities"] = cleaned
    all_text = [(key, result[key]) for key in result if key != "opportunities"]
    all_text += [
        (f"opportunity.{key}", val) for op in cleaned for key, val in op.items()
    ]
    for key, value in all_text:
        if _INTERNAL_FIELD.search(value):
            raise ValueError(f"Internal source field present: {key}")
        if "{" in value or "}" in value:
            raise ValueError(f"JSON artifact present in prose: {key}")
    # A proposed 7-day test or a two-way comparison is not an invented *observed* metric.
    # Limit metric checks to lines claiming already-observed quantified outcomes.
    if evidence:
        trusted = " ".join(evidence.get("observations", []))
        trusted_nums = _metric_numbers(trusted)
        for key in ("insight", "conclusion"):
            value = result[key]
            for match in re.finditer(
                r"(?<![\w])(?P<num>\d+(?:,\d{3})*(?:\.\d+)?)(?P<unit>\s*(?:%p?|건|회))",
                value,
            ):
                number = match.group("num")
                if (
                    number not in trusted_nums
                    and number.lstrip("+") not in trusted_nums
                ):
                    raise ValueError(f"Unverified observed number in {key}: {number}")
    return result


def _local_fallback(evidence):
    """검증된 근거로 대체 전략을 반환하여 품질 실패 시 유료 재호출을 피한다."""
    pname = evidence["program_name"]
    genre = evidence["genre"]
    types = evidence.get("content_types") or []
    best = types[0] if types else None
    sa = evidence.get("search_change_pct")
    yw = evidence.get("youtube_week_counts") or [None, None]
    if sa is None:
        search_desc = "검색 변화는 현재 확보한 자료로 판단하기 어렵습니다."
    elif abs(sa) < 5:
        search_desc = f"네이버 검색지수 변화는 {_signed(sa)}로, 기준상 보합 수준입니다."
    else:
        search_desc = f"네이버 검색지수는 {_signed(sa)} 변화했습니다."
    if None not in yw:
        supply_desc = f"관련 유튜브 영상 후보는 {_fmt(yw[0], 0)}건에서 {_fmt(yw[1], 0)}건으로 변했습니다."
    else:
        supply_desc = "유튜브 주차별 비교는 확인 가능한 자료만 사용합니다."
    if best:
        tname = best["label"]
        type_desc = f'{tname} 영상 후보가 {_fmt(best["w40"], 0)}건에서 {_fmt(best["w41"], 0)}건으로 변했습니다.'
        headline = f"{tname} 중심의 콘텐츠 운영 전략"
        basis1 = f"{supply_desc} {type_desc} 이는 어떤 유형이 많이 공급됐는지 보여주지만 실제 조회 성과를 증명하지는 않습니다."
        action1 = f"{pname}의 {tname} 영상에서 출연자·회차·주제별로 재편집 가능한 소재를 정리하고, 시청자가 쉽게 구별할 수 있는 제목 체계를 검토합니다."
    else:
        tname = "관련 영상"
        headline = "검색 반응과 온라인 운영의 연결 전략"
        basis1 = f"{supply_desc} 영상 유형별 성과 자료가 없으므로 특정 포맷이 효과적이라고 단정하지 않습니다."
        action1 = f"{pname}의 기존 영상 제목과 업로드 구성부터 검토하고, {genre} 장르의 핵심 소재를 일관된 기준으로 묶어 소개하는 방식을 제안합니다."
    if "음악" in genre or "경연" in genre:
        action2 = "가수명·곡명·방송 회차를 활용한 탐색형 제목과 무대의 핵심 구간을 강조하는 제목을 서로 다른 무대 영상에 적용해 비교합니다."
    elif "건강" in genre or "의학" in genre:
        action2 = "시청자가 궁금해할 건강 질문을 제목에 제시한 클립과 설명형 제목의 클립을 비교하고, 내용 정확성과 전문가 설명을 함께 점검합니다."
    elif "여행" in genre or "자연" in genre:
        action2 = "방문 장소·인물·여행 주제를 명확히 적은 제목과 장면 중심 제목을 비교해 어떤 방식이 추가 탐색에 유리한지 확인합니다."
    else:
        action2 = "회차 핵심 주제를 드러내는 정보형 제목과 인상적 장면을 강조하는 제목을 유사한 조건의 서로 다른 영상에 적용해 비교합니다."
    return {
        "headline": headline,
        "insight": f"{search_desc} {supply_desc} 두 지표는 측정 기준이 다르므로 단순히 영상 수를 늘리는 대신 어떤 구성과 소개 방식이 실제 시청 반응에 연결되는지 검증하는 편이 좋습니다.",
        "opportunities": [
            {
                "title": f"{tname}의 재가공 방향 구체화",
                "basis": basis1,
                "action": action1,
            },
            {
                "title": "검색 관심으로 이어지는 콘텐츠 패키징",
                "basis": f"{search_desc} 검색 변화만으로 실제 영상 성과를 단정할 수 없습니다.",
                "action": action2,
            },
        ],
        "experiment_title": "영상 소개 방식의 소규모 비교",
        "experiment_plan": f"영상 길이와 게시 조건이 비슷한 {pname}의 서로 다른 영상에 제목 방식 한 가지만 달리 적용합니다. 동일 영상의 중복 게시를 피하고 업로더 권한과 영상 분류 정확도를 먼저 확인합니다.",
        "experiment_metrics": "가능한 경우 게시 후 조회수, 댓글 수, 노출 클릭률을 같은 기간과 기준으로 비교합니다. 이 지표들은 이번 사전 분석에서 확보한 성과 수치가 아니라 향후 실험에서 수집할 지표입니다.",
        "experiment_decision": "어느 한쪽이 지속적으로 우수한 경우 다음 회차에 제한적으로 확대 검토합니다. 표본이 적거나 채널·게시 조건이 다르면 인과효과를 주장하지 않습니다.",
        "conclusion": f"{pname}는 현재 확인된 검색 변화와 관련 영상 공급을 따로 평가하기보다 콘텐츠 구성과 게시 전략의 연결을 점검할 필요가 있습니다. 가장 먼저 기존 영상의 제목 체계와 재가공 가능 소재를 정리하고, 작게 비교 실험한 뒤 운영 확대 여부를 결정할 것을 제안합니다.",
    }


def format_report(evidence: dict, generated: dict):
    """관측 근거와 전략 사전을 받아 기존 호환용 보고서 문자열을 반환한다."""
    lines = [
        f'{evidence["program_name"]} | 방송 콘텐츠 전략 분석',
        "",
        "핵심 분석 결과",
        generated["headline"],
        generated["insight"],
        "",
        "주요 데이터 비교",
    ]
    for row in evidence["comparison_rows"]:
        lines.append(
            f'{row["label"]}: {row["w40_text"]} → {row["w41_text"]} ({row["change_text"]})'
        )
    lines.extend(["", "전략적 기회"])
    for i, op in enumerate(generated["opportunities"], 1):
        lines.extend([f'{i}. {op["title"]}', op["basis"], op["action"]])
    lines.extend(
        [
            "",
            "우선 검토할 콘텐츠 실험",
            generated["experiment_title"],
            generated["experiment_plan"],
            generated["experiment_metrics"],
            generated["experiment_decision"],
            "",
            "최종 전략 제안",
            generated["conclusion"],
            "",
            "데이터 해석 기준",
        ]
    )
    lines.extend(evidence["limitations"])
    return "\n".join(lines)

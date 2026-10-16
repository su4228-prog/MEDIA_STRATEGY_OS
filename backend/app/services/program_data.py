"""서버 시작 시 프로그램·영상·회차 원본을 읽어 조회 인덱스를 구성한다."""

import json

from app.config import DATA_DIR


def load(name: str, collection: str):
    """파일명과 컬렉션명을 받아 원본 목록을 반환한다."""
    with (DATA_DIR / name).open("r", encoding="utf-8") as file:
        return json.load(file)[collection]


programs = load("programs_v1.json", "programs")
videos = load("videos_v1.json", "videos")
episodes = load("episodes_v1.json", "episodes")
program_index = {p["program_id"]: p for p in programs}

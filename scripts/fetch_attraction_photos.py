"""위키백과/위키미디어에서 관광지 대표 사진과 라이선스 정보를 조회한다.

실행: python scripts/fetch_attraction_photos.py
출력: scripts/attraction_photos.json

사진 URL만 쓰는 게 아니라 라이선스·저작자를 함께 받아 저장한다.
위키미디어 이미지는 대부분 CC BY-SA 계열이라 출처 표기 의무가 있기 때문이다.
"""

import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

UA = "HoneyChargePrototype/1.0 (demo project; contact: support@honeycharge.kr)"

# (관광지 id, 위키백과 문서 제목 후보들)
# 첫 후보에서 사진을 못 찾으면 다음 후보로 넘어간다.
TARGETS = [
    ("at-001", ["용두암"]),
    ("at-002", ["이호테우해변", "이호해수욕장"]),
    ("at-003", ["제주동문시장", "동문재래시장"]),
    ("at-004", ["함덕해수욕장", "함덕리"]),
    ("at-005", ["서우봉"]),
    ("at-006", ["삼양해수욕장", "삼양동 (제주시)"]),
    ("at-007", ["애월읍"]),
    ("at-008", ["곽지해수욕장", "곽지리"]),
    ("at-009", ["성산일출봉"]),
    ("at-010", ["섭지코지"]),
    ("at-011", ["만장굴"]),
    ("at-012", ["월정리 (제주시)", "구좌읍"]),
    ("at-013", ["비자림"]),
    ("at-014", ["성읍민속마을", "성읍리"]),
    ("at-015", ["표선해수욕장", "표선면"]),
    ("at-016", ["산굼부리"]),
    ("at-017", ["천지연폭포"]),
    ("at-018", ["정방폭포"]),
    ("at-019", ["중문대포해안 주상절리대", "주상절리"]),
    ("at-020", ["중문색달해수욕장", "중문관광단지"]),
    ("at-021", ["쇠소깍"]),
    ("at-022", ["남원읍"]),
    ("at-023", ["제주민속촌"]),
    ("at-024", ["협재해수욕장"]),
    ("at-025", ["오설록", "서광리"]),
    ("at-026", ["카멜리아힐", "안덕면"]),
    ("at-027", ["산방산"]),
    ("at-028", ["송악산 (제주)", "송악산"]),
    ("at-029", ["수월봉"]),
    ("at-030", ["신창리 (제주시)", "한경면"]),
]


def get_json(url: str):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.loads(resp.read().decode("utf-8"))


def summary(title: str):
    """ko.wikipedia REST summary — thumbnail / originalimage 를 얻는다."""
    url = "https://ko.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title, safe="")
    try:
        return get_json(url)
    except Exception:
        return None


def file_license(file_title: str):
    """Commons에서 해당 파일의 라이선스·저작자를 조회한다."""
    url = (
        "https://commons.wikimedia.org/w/api.php?action=query&format=json"
        "&prop=imageinfo&iiprop=extmetadata|url"
        "&titles=" + urllib.parse.quote(file_title, safe="")
    )
    try:
        data = get_json(url)
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            info = (page.get("imageinfo") or [{}])[0]
            meta = info.get("extmetadata", {})
            return {
                "license": (meta.get("LicenseShortName") or {}).get("value"),
                "artist_html": (meta.get("Artist") or {}).get("value"),
                "descriptionurl": info.get("descriptionurl"),
            }
    except Exception:
        pass
    return None


def page_image_file(title: str):
    """해당 문서의 대표 이미지 파일명(File:...)을 얻는다."""
    url = (
        "https://ko.wikipedia.org/w/api.php?action=query&format=json"
        "&prop=pageimages&piprop=name"
        "&titles=" + urllib.parse.quote(title, safe="")
    )
    try:
        data = get_json(url)
        pages = data.get("query", {}).get("pages", {})
        for page in pages.values():
            name = page.get("pageimage")
            if name:
                return "File:" + name
    except Exception:
        pass
    return None


results = []
for aid, candidates in TARGETS:
    entry = {"id": aid, "tried": candidates, "found": False}
    for title in candidates:
        s = summary(title)
        time.sleep(0.15)
        if not s:
            continue
        thumb = (s.get("thumbnail") or {}).get("source")
        original = (s.get("originalimage") or {}).get("source")
        if not thumb:
            continue

        file_title = page_image_file(title)
        time.sleep(0.15)
        lic = file_license(file_title) if file_title else None
        time.sleep(0.15)

        entry.update(
            {
                "found": True,
                "title": title,
                "thumb": thumb,
                "original": original,
                "file": file_title,
                "license": (lic or {}).get("license"),
                "artist_html": (lic or {}).get("artist_html"),
                "descriptionurl": (lic or {}).get("descriptionurl"),
                "page": (s.get("content_urls", {}).get("desktop", {}) or {}).get("page"),
            }
        )
        break
    results.append(entry)
    mark = "OK " if entry["found"] else "-- "
    print(f'{mark}{aid} {entry.get("title", candidates[0])}  {entry.get("license") or ""}')

out = Path(__file__).parent / "attraction_photos.json"
out.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")

found = sum(1 for r in results if r["found"])
print(f"\n사진 확보: {found}/{len(results)}")
print(f"저장: {out}")

"""관광지 사진 30장을 public/attractions/ 로 내려받고 attractions.ts 경로를 로컬로 바꾼다.

핫링크(upload.wikimedia.org 직접 참조)는 외부 서비스 장애·CSP 누락·오프라인에 취약하므로
발표용으로는 번들에 포함하는 편이 안전하다. 저작자·라이선스 표기(photoCredit/photoSource)는
그대로 유지한다 — 로컬에 복사해도 표기 의무는 사라지지 않는다.
"""

import re
import urllib.request
from pathlib import Path

UA = "HoneyChargePrototype/1.0 (demo project; contact: support@honeycharge.kr)"
ROOT = Path(__file__).parent.parent
TS_PATH = ROOT / "src" / "data" / "attractions.ts"
OUT_DIR = ROOT / "public" / "attractions"
TARGET_WIDTH = 480

OUT_DIR.mkdir(parents=True, exist_ok=True)
source = TS_PATH.read_text(encoding="utf-8")

# id 와 photo URL 을 짝지어 추출
entries = re.findall(
    r"id: '(at-\d+)',.*?photo: '([^']+)',",
    source,
    re.DOTALL,
)
print(f"대상: {len(entries)}건\n")


def resize_url(url: str, width: int) -> str:
    """위키미디어 썸네일 URL의 폭을 조정한다. (.../NNNpx-Name.jpg 패턴)"""
    return re.sub(r"/(\d+)px-", f"/{width}px-", url)


total_bytes = 0
failures = []

for aid, url in entries:
    ext = Path(url.split("?")[0]).suffix.lower() or ".jpg"
    if ext not in (".jpg", ".jpeg", ".png"):
        ext = ".jpg"
    dest = OUT_DIR / f"{aid}{ext}"

    for candidate in (resize_url(url, TARGET_WIDTH), url):
        try:
            req = urllib.request.Request(candidate, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
            if len(data) < 1000:  # 너무 작으면 오류 페이지일 가능성
                continue
            dest.write_bytes(data)
            total_bytes += len(data)
            print(f"OK {aid}{ext}  {len(data) / 1024:6.0f}KB")
            break
        except Exception as exc:  # noqa: BLE001
            last = exc
    else:
        failures.append((aid, str(last)))
        print(f"-- {aid} 실패: {last}")
        continue

    # attractions.ts 의 photo 경로를 로컬로 교체
    source = re.sub(
        r"(id: '" + re.escape(aid) + r"',.*?photo: ')[^']+(')",
        lambda m: m.group(1) + f"/attractions/{aid}{ext}" + m.group(2),
        source,
        count=1,
        flags=re.DOTALL,
    )

TS_PATH.write_text(source, encoding="utf-8")

print(f"\n총 용량: {total_bytes / 1024 / 1024:.2f}MB")
print("실패:", failures or "없음 ✅")
remaining = re.findall(r"photo: '(https://[^']+)'", source)
print("남은 외부 URL:", remaining or "없음 ✅")

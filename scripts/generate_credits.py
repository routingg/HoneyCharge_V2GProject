"""attractions.ts에서 사진 출처를 뽑아 README에 붙일 표를 만든다."""

import re
from pathlib import Path

TS = (Path(__file__).parent.parent / "src" / "data" / "attractions.ts").read_text("utf-8")

rows = []
for m in re.finditer(
    r"name: '([^']+)',.*?photo: '([^']*)',\s*\n\s*photoCredit: '([^']*)',\s*\n\s*photoSource: '([^']*)',",
    TS,
    re.DOTALL,
):
    name, _photo, credit, source = m.groups()
    file_name = source.rsplit("/", 1)[-1].replace("File:", "").replace("_", " ")
    rows.append((name, credit, file_name))

licenses = {}
for _, credit, _ in rows:
    lic = credit.split(" / ")[-1]
    licenses[lic] = licenses.get(lic, 0) + 1

print(f"| 관광지 | 저작자 / 라이선스 |")
print(f"|---|---|")
for name, credit, _ in rows:
    print(f"| {name} | {credit} |")
print(f"\n총 {len(rows)}건")
print("라이선스 분포:", dict(sorted(licenses.items(), key=lambda x: -x[1])))

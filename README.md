# 파일명 규칙 미리보기

W007의 독립적인 buildless 로컬 파일 도구입니다. `dist/` 전체를 정적 호스팅하며 시작점은 `dist/index.html`입니다. ES module을 사용하므로 HTTPS 또는 localhost HTTP로 실행합니다. 외부 의존성, 광고, 분석, 네트워크 요청은 없습니다. 입력은 메모리에만 유지됩니다.

## 기능

한국어 루트 및 `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/` 6언어 경로를 제공합니다. 각 페이지의 수동 언어 메뉴, 라벨, 오류, 상태, 도움말, 내보내기 헤더를 정적 카탈로그로 현지화했습니다. 파일명과 사용자 데이터는 번역하지 않습니다. `generate.mjs`는 수정 시 경로 HTML을 재생성하는 개발 도구이며 배포에 빌드는 필요 없습니다.

- 파일 선택 또는 한 줄당 하나의 파일명 목록. 바로 실행할 수 있는 원본 예제 파일 3개.
- 문자열 전체 치환, 접두사·접미사, 명시적 날짜, 시작 번호와 자리수, 확장자 유지.
- Windows 금지 문자·예약 이름·끝 공백/점, UTF-8 255바이트 상한, 대소문자 및 NFC 정규화 충돌 검사.
- 실제 파일의 내용은 그대로 유지하는 UTF-8 파일명 ZIP(STORE, 무압축)과 매핑 CSV. 원본 파일 변경 없음.
- CSV 인용부호 이스케이프, UTF-8 BOM, 수식 시작 문자 앞 작은따옴표 보호.

## 범위

최대 300개, 개별 50 MiB, 전체 100 MiB. 이름 목록 입력은 CSV만 저장합니다. 폴더 계층 및 파일 시간·권한 등 메타데이터 보존은 지원하지 않습니다. ZIP은 최상위 파일만 포함합니다. 숨김 파일은 브라우저가 선택한 범위에 따릅니다. 파일명 규칙은 보수적인 호환성 검사이며 모든 운영체제의 전체 경로 제한을 보장하지 않습니다. 브라우저 실물 QA는 소유자가 담당하며 여기서는 수행하지 않았습니다.

## 검증

아래 명령은 프로젝트 루트 기준입니다. 이 작업에서는 제공된 RTK 실행 파일의 `proxy`와 제공된 Node/Python 런타임으로 같은 인수를 실행했습니다.

```sh
rtk proxy node --check dist/core.js
rtk proxy node --check dist/app.js
rtk proxy node tests.mjs
rtk proxy python -X utf8 check_zip.py
```

실제 결과: 두 문법 검사 exit 0. Node fixture 8개 PASS. 독립적인 Python `zipfile`로 UTF-8 이름 3개, 텍스트/바이너리/빈 파일의 정확한 내용, CRC와 헤더를 검증해 PASS. 테스트 ZIP은 무시되는 `artifacts/`에 생성합니다.

## 참고

- Microsoft: https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
- PKWARE ZIP format specification: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT

규격은 참조 링크로만 제공하며 제3자 본문·코드·이미지·폰트를 복제하지 않았습니다. UI·CSS·ZIP 구현·예제 자료는 이 프로젝트의 원본 작업입니다.

## Public GitHub Pages release

Launch: https://nanalab.kr/filename-studio/

Korean is at the root. English, Spanish, Chinese, Japanese and German use `/en/`, `/es/`, `/zh/`, `/ja/`, `/de/`.
GitHub Pages serves `main` → `/docs` using the branch build. No project CNAME is used.

Build: `node scripts/build-public.mjs`. The `dist/` snapshot and its original generators/tests are preserved as the application source. The public build adds metadata, six-locale sitemaps, original JPEG cards, More Apps styling and the existing NaNa publisher integrations. It does not upload selected user files.

Publisher integrations: AdSense, Google Tag Manager, Google Analytics and Cloudflare Web Analytics, with the same publisher settings as the NaNa Lab homepage. These scripts can make network requests independently of local file processing.

Original JPEG cards are rendered from original text and geometry using an installed system font; no font files are redistributed. Existing source references and third-party notices remain applicable.

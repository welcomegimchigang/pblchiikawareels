# 치이가 할 말이 있대 💗

친구한테 링크로 보내는 장난 메시지 웹앱.
받은 사람이 버튼을 꾹 누르고 있으면 "용기" 게이지가 차고, 100%가 되면 캐릭터가 변신하면서 진짜 메시지가 터집니다.
서버/DB 없이 메시지 내용은 전부 URL에 압축해서 담깁니다.

- `/` → 만들기 페이지 (문구 입력 → 링크 생성)
- `/?v=<인코딩값>` → 받는 사람 페이지

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:5173 을 열면 됩니다.

## 폰에서 테스트하기

PC와 폰이 **같은 와이파이**에 있어야 합니다.

```bash
npm run dev -- --host
```

터미널에 `Network: http://192.168.x.x:5173/` 같은 주소가 뜨는데, 그걸 폰 브라우저에 입력하세요.
(Windows 방화벽이 막으면 "Node.js" 허용을 눌러주세요.)

## 이미지 넣는 위치

모두 `public/assets/` 안에, **투명 배경 PNG**로 넣으면 됩니다. 파일이 없으면 자리표시용 원형 SVG가 대신 나옵니다.

| 파일 | 언제 보이나 | 권장 크기 |
|---|---|---|
| `chiikawa_idle.png` | 처음 대기 상태 (게이지 0~49%) | 정사각형, 800px 이상 |
| `chiikawa_nervous.png` | 게이지 50% 이상, 긴장한 얼굴 | 정사각형, 800px 이상 |
| `usagi_final.png` | 100% 변신 후 | 정사각형이면 가장 깔끔 |
| `og.png` | 카톡/SNS 링크 미리보기 | **1200×630** (투명 X, 불투명 배경) |
| `pop.mp3` (선택) | 변신 순간 효과음 | 1초 내외 짧은 소리 |

`og.png`는 현재 스크립트로 자동 생성한 기본 이미지가 들어 있으니 마음에 드는 걸로 교체하면 됩니다.

## 사운드

오른쪽 위 🔇 버튼으로 켤 수 있고 기본은 꺼짐입니다 (브라우저 자동재생 정책 때문).
`public/assets/pop.mp3`가 있으면 변신할 때 재생되고, 없으면 그냥 무시됩니다.

## 빌드 확인

```bash
npm run build     # dist/ 생성 (타입 체크 포함)
npm run preview   # 빌드 결과를 로컬에서 확인
```

## Vercel 배포

### 방법 A. GitHub 연결 (추천)

1. 이 폴더를 GitHub 저장소에 올립니다.
   ```bash
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/<아이디>/<저장소>.git
   git push -u origin main
   ```
2. https://vercel.com 에 GitHub로 로그인 → **Add New → Project** → 저장소 선택.
3. Framework는 **Vite**로 자동 인식됩니다. 그대로 **Deploy**.
4. 이후엔 `git push`만 하면 자동으로 다시 배포됩니다.

### 방법 B. CLI로 바로 올리기

```bash
npm i -g vercel
vercel          # 첫 배포 (질문 나오면 전부 Enter)
vercel --prod   # 실제 주소로 배포
```

### 배포 후 꼭 할 것: OG 이미지 절대 URL

카카오톡은 상대 경로 이미지를 못 읽습니다. 배포 주소가 정해지면 `index.html`에서

```html
<meta property="og:image" content="/assets/og.png" />
```

를 실제 주소로 바꾸고 다시 배포하세요.

```html
<meta property="og:image" content="https://your-project.vercel.app/assets/og.png" />
```

카톡에 이미 한 번 보낸 링크는 미리보기가 캐시되어 있을 수 있습니다.
https://developers.kakao.com/tool/debugger/sharing 에서 캐시를 초기화할 수 있습니다.

## 폴더 구조

```
index.html                     OG 메타 태그, Google Fonts(Gaegu)
public/assets/                 캐릭터 이미지, og.png, pop.mp3
src/
  App.tsx                      ?v= 유무로 페이지 분기
  lib/payload.ts               데이터 타입, 길이 검증, lz-string 인코딩/디코딩
  hooks/useHoldGauge.ts        requestAnimationFrame 기반 게이지 (누르면 ↑, 떼면 ↓)
  components/CharacterImage.tsx  이미지 없을 때 SVG 대체
  pages/ReceiverPage.tsx       받는 사람 페이지 (핵심 연출)
  pages/CreatePage.tsx         만들기 페이지 + 축소 미리보기
```

## URL 데이터 구조

```json
{
  "t": "치이가 할 말이 있대...",
  "s": ["으...", "응...", "으..으..", "우..", "와..!"],
  "m": "이따 마라탕 고?",
  "f": "우라~!!"
}
```

제목 30자, 말풍선 각 10자 최대 6개, 최종 메시지 40자, 외침 10자.
JSON → `lz-string`의 `compressToEncodedURIComponent`로 압축해서 `?v=`에 담습니다. 디코딩에 실패하면 위 기본 메시지가 나옵니다.

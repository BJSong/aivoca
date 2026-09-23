# AI Smart Vocab 웹 서비스 배포 가이드 (Deployment Guide)

AI Smart Vocab은 **Next.js 14 (App Router)** 기반으로 구축되어 있어, **Vercel** 플랫폼에 가장 빠르고 안정적으로 배포할 수 있습니다. 상황에 맞는 배포 방법을 선택해 진행해 보세요.

---

## ⚡ 방법 1. Vercel CLI로 1분 만에 배포하기 (가장 추천)

별도의 복잡한 GitHub 저장소 설정 없이 터미널에서 즉시 Vercel로 배포하는 방법입니다.

### 1단계: Vercel 로그인 및 배포 시작
터미널에서 프로젝트 루트 디렉토리(`/Users/song/project/aivoca`)로 이동 후 다음 명령어를 실행합니다:

```bash
npx vercel
```

터미널에 나타나는 질문에 다음과 같이 응답합니다:
1. **Set up and deploy?**: `y` (Yes)
2. **Which scope do you want to deploy to?**: 본인의 Vercel 계정 선택 (Enter)
3. **Link to existing project?**: `n` (No)
4. **What's your project's name?**: `aivoca` (또는 원하는 이름 입력)
5. **In which directory is your code located?**: `./` (기본값 엔터)
6. **Want to modify these settings?**: `n` (Next.js가 자동 감지됨)

> 💡 처음 실행 시 브라우저가 열리며 Vercel 계정(GitHub 또는 이메일) 로그인 인증 창이 나타납니다. 확인을 누르면 배포가 진행됩니다.

### 2단계: 환경 변수 등록 (Google Gemini Vision AI)
교재 사진 OCR 분석을 위한 Gemini API 키를 등록합니다 (없으셔도 데모/샘플 모드로 작동 가능):

```bash
npx vercel env add GEMINI_API_KEY
```
* **Value**: Google AI Studio에서 발급받은 API 키 입력
* **Environments**: `Production`, `Preview`, `Development` 모두 선택 (a 누른 후 Enter)

*(선택사항) Supabase를 사용하시는 경우 동일하게 추가:*
```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 3단계: 프로덕션 도메인으로 최종 배포
```bash
npx vercel --prod
```
배포가 완료되면 `https://aivoca-xxxx.vercel.app` 과 같은 고유 접속 URL이 발급됩니다! 🎉

---

## 🐙 방법 2. GitHub + Vercel 대시보드 연동 (자동 CI/CD)

코드를 GitHub에 올려두고, 수정할 때마다 자동으로 배포되도록 구성하는 정석적인 방법입니다.

### 1단계: Git 저장소 초기화 및 커밋
터미널에서 아래 명령어를 차례로 실행합니다:

```bash
# 1. Git 초기화
git init

# 2. 파일 추가 (.gitignore에 의해 node_modules 및 환경변수는 안전하게 제외됨)
git add .

# 3. 첫 커밋 작성
git commit -m "feat: AI Smart Vocab initial release"

# 4. 기본 브랜치 이름을 main으로 설정
git branch -M main
```

### 2단계: GitHub에 새 저장소 생성 및 푸시
1. [GitHub (github.com)](https://github.com/new)에 접속하여 새 Repository를 생성합니다 (예: `aivoca`, Public 또는 Private).
2. 생성된 저장소 주소를 복사하여 로컬 터미널에 연결하고 푸시합니다:

```bash
git remote add origin https://github.com/<본인아이디>/aivoca.git
git push -u origin main
```

### 3단계: Vercel 대시보드에서 불러오기
1. [Vercel 대시보드 (vercel.com)](https://vercel.com/dashboard)에 로그인합니다.
2. 우측 상단 **[Add New...]** ➜ **[Project]** 클릭.
3. 방금 올린 `aivoca` GitHub 저장소를 찾아 **[Import]** 클릭.
4. **Environment Variables** 펼치기:
   * `GEMINI_API_KEY`: Google AI Studio 키 입력
   * *(선택)* `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **[Deploy]** 버튼 클릭! 🚀 (약 1분 뒤 배포 완료)

---

## 📱 방법 3. 지금 당장 스마트폰/태블릿에서 테스트하기 (임시 터널)

배포 계정 생성 없이, 지금 바로 아이의 스마트폰이나 태블릿 카메라로 테스트해보고 싶다면 로컬 터널을 이용할 수 있습니다.

### 1단계: 로컬 서버 실행
```bash
npm run dev
```

### 2단계: 새 터미널 창에서 임시 외부 접속 링크 열기
```bash
npx localtunnel --port 3000
```
또는
```bash
npx cloudflared tunnel --url http://localhost:3000
```

발급되는 임시 `https://*.loca.lt` URL을 태블릿/스마트폰 브라우저에 입력하면 즉시 접속하여 카메라 촬영 및 터치 학습을 테스트할 수 있습니다!

---

## 🔑 환경 변수 발급처 안내

1. **Google Gemini API Key (무료)**:
   * [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 ➜ **Create API Key** 클릭 후 복사.
2. **Supabase (선택 사항)**:
   * [Supabase](https://supabase.com) 프로젝트 생성 ➜ Project Settings ➜ API ➜ `Project URL`과 `anon public key` 복사.
   * *※ Supabase 미설정 시에도 브라우저 내장 LocalStorage로 모든 학습, 단어장 생성, SRS 간격 반복이 완전하게 작동합니다.*

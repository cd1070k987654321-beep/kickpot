# KickPot

축구 팀 운영을 가장 빠르게 하는 모바일 전용 MVP 프로젝트.

## 실행

```bash
npm install
npm run dev
```

## 환경 변수

루트에 `.env.local` 파일을 만들고 아래 값을 넣어줘.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Supabase 스키마 적용

1. Supabase Dashboard → SQL Editor 이동
2. `supabase/schema.sql` 파일 내용을 복사
3. 실행

## Supabase Storage 준비

이미지 업로드를 위해 Storage 버킷 2개를 만들어야 해요.

1. Supabase Dashboard → Storage 이동
2. 새 버킷 생성
3. 버킷 이름: `team-media`
4. Public bucket 으로 생성
5. 한 번 더 생성
6. 버킷 이름: `profile-media`
7. Public bucket 으로 생성

## 현재 구현된 것

- 모바일 전용 UI 구조
- 로그인 / 회원가입
- 로그인 후 `/home` 이동
- 팀 생성 / 팀 가입 UI
- 팀 생성 / 팀 가입 Supabase 연결
- 내 팀 목록 조회

## 다음 작업

- 팀 상세 실데이터 연결
- 매치 생성 / 매치 요청 / 매치 상세
- 프로필 / 로그아웃 / 세션 유지
- 투표 / 기록 / 라인업

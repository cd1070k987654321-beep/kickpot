# KickPot Supabase 연결 메모

## 1. Supabase 프로젝트 생성
- Supabase 대시보드에서 새 프로젝트 생성
- 지역, DB 비밀번호 설정

## 2. 프로젝트 키 확인
- Project Settings → API 이동
- 아래 두 값을 복사
  - `Project URL`
  - `anon public key`

## 3. 로컬 환경 변수 설정
루트에 `.env.local` 파일 생성:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Auth Provider
기본은 Email/Password 활성화로 시작

## 5. 현재 코드 연결 위치
- 브라우저 클라이언트: `src/lib/supabase.ts`
- 로그인 폼: `src/features/auth/login-form.tsx`
- 회원가입 폼: `src/features/auth/signup-form.tsx`

## 6. Storage 준비
- Storage에서 `team-media` 버킷 생성
- Public bucket으로 설정
- 팀 로고 / 커버 이미지를 여기 올리게 됨
- Storage에서 `profile-media` 버킷 생성
- Public bucket으로 설정
- 프로필 사진 이미지를 여기 올리게 됨

## 7. 다음 단계
- 회원가입 후 profile row 자동 생성 정책 설계
- 로그인 성공 후 리다이렉트 연결
- 로그아웃 버튼 추가
- 보호 라우트 추가

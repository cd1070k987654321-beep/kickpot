# ⚽ KickPot API 명세서 v1.1

Base URL: /api

---

## 🔐 1. Auth

### POST /auth/signup
- 회원가입

#### Request
```json
{
  "email": "string",
  "password": "string",
  "nickname": "string"
}
```

#### Response
```json
{
  "user": { ... },
  "token": "jwt"
}
```

---

### POST /auth/login
- 로그인

#### Request
```json
{
  "email": "string",
  "password": "string"
}
```

#### Response
```json
{
  "user": { ... },
  "token": "jwt"
}
```

---

### POST /auth/logout
- 로그아웃

---

## 👤 2. User

### GET /users/me
- 내 정보 조회

### PATCH /users/me
- 프로필 수정

#### Request
```json
{
  "nickname": "string",
  "bio": "string",
  "main_position": "MF",
  "preferred_positions": ["MF", "FW"],
  "profile_image_url": "string"
}
```

---

## 🧑‍🤝‍🧑 3. Team

### POST /teams
- 팀 생성

#### Request
```json
{
  "name": "string",
  "description": "string"
}
```

---

### GET /teams
- 내 팀 목록 조회

---

### GET /teams/:teamId
- 팀 상세 조회

---

### PATCH /teams/:teamId
- 팀 정보 수정

#### Request
```json
{
  "name": "string",
  "description": "string",
  "logo_url": "string",
  "cover_image_url": "string"
}
```

---

### DELETE /teams/:teamId
- 팀 삭제

---

### POST /teams/:teamId/invite
- 초대 코드 생성

---

### POST /teams/join
- 팀 참여

#### Request
```json
{
  "invite_code": "string"
}
```

---

### POST /teams/:teamId/leave
- 팀 탈퇴

---

### DELETE /teams/:teamId/members/:userId
- 팀원 강퇴

---

## 📝 4. Team Feed

### POST /teams/:teamId/posts
- 게시글 생성

#### Request
```json
{
  "title": "string",
  "content": "string",
  "is_notice": false
}
```

---

### GET /teams/:teamId/posts
- 게시글 목록 조회

---

### PATCH /posts/:postId
- 게시글 수정

---

### DELETE /posts/:postId
- 게시글 삭제

---

### POST /posts/:postId/comments
- 댓글 작성

#### Request
```json
{
  "content": "string"
}
```

---

### DELETE /comments/:commentId
- 댓글 삭제

---

## 🗳️ 5. Vote

### POST /teams/:teamId/votes
- 투표 생성

#### Request
```json
{
  "type": "date | participant",
  "title": "string",
  "options": ["옵션1", "옵션2"],
  "match_id": 1
}
```

---

### POST /votes/:voteId/respond
- 투표 참여

#### Request
```json
{
  "option_ids": [1, 2]
}
```

---

### POST /votes/:voteId/close
- 투표 종료

---

### GET /votes/:voteId
- 투표 결과 조회

---

## ⚽ 6. Match

### POST /matches
- 매칭 생성

#### Request
```json
{
  "team_id": 1,
  "date": "2026-01-01T10:00:00+09:00",
  "location": "서울",
  "description": "친선전"
}
```

---

### POST /matches/:matchId/request
- 상대팀 매칭 요청

#### Request
```json
{
  "target_team_id": 2
}
```

---

### POST /matches/:matchId/accept
- 매칭 수락

---

### POST /matches/:matchId/reject
- 매칭 거절

---

### POST /matches/:matchId/complete
- 경기 완료 처리

---

### GET /matches/:matchId
- 매칭 상세 조회

---

## 👥 7. Participant

### GET /matches/:matchId/participants
- 참여자 목록 조회

---

### POST /matches/:matchId/participants/confirm
- 참여자 확정

#### Request
```json
{
  "user_ids": [1, 2, 3]
}
```

---

## 🧠 8. Lineup

### POST /matches/:matchId/lineup
- 라인업 저장

#### Request
```json
[
  { "user_id": 1, "position": "GK" },
  { "user_id": 2, "position": "FW" }
]
```

---

### PATCH /matches/:matchId/lineup
- 라인업 수정

---

### GET /matches/:matchId/lineup
- 라인업 조회

---

## 📊 9. Record

### POST /matches/:matchId/record
- 경기 기록 생성/수정

#### Request
```json
{
  "score_a": 3,
  "score_b": 2,
  "events": [
    { "user_id": 1, "type": "goal" },
    { "user_id": 2, "type": "assist" }
  ]
}
```

---

### POST /records/:recordId/request-review
- 상대팀 확인 요청

---

### POST /records/:recordId/approve
- 기록 승인

---

### POST /records/:recordId/reject
- 기록 거절

#### Request
```json
{
  "reason": "스코어가 다릅니다"
}
```

---

### GET /matches/:matchId/record
- 경기 기록 조회

---

## 🔔 10. Notification

### GET /notifications
- 알림 목록 조회

---

## 🔐 인증 방식

- Authorization: Bearer {token}

---

## 👮 권한 기준 요약

- 팀 생성자 = Owner
- Owner: 팀/매칭/투표/참여자 확정/라인업/기록 작성 권한
- Member: 조회 + 게시글/댓글 작성 + 투표 참여 권한
- Opponent: 매칭 응답 + 기록 검토/승인/거절 권한

---

## 📌 상태 코드

- 200 OK
- 201 Created
- 400 Bad Request
- 401 Unauthorized
- 403 Forbidden
- 404 Not Found

---

## 🔥 핵심 흐름 요약

1. 로그인
2. 팀 생성 / 가입
3. 매칭 생성
4. 상대팀 매칭 요청
5. 상대팀 수락
6. 참여자 투표
7. 참여자 확정
8. 라인업 설정
9. 경기 완료 처리
10. 기록 작성
11. 상대팀 승인 → 확정

---

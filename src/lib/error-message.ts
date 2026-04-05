export function toKoreanErrorMessage(errorMessage?: string | null) {
  if (!errorMessage) {
    return "문제가 생겼어요. 잠깐 뒤에 다시 시도해 주세요.";
  }

  const normalized = errorMessage.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "이메일이나 비밀번호가 올바르지 않아요.";
  }

  if (normalized.includes("email not confirmed")) {
    return "이메일 인증을 먼저 해주세요. 메일함에서 인증 링크를 눌러야 로그인할 수 있어요.";
  }

  if (normalized.includes("user already registered")) {
    return "이미 가입된 이메일이에요. 로그인해 주세요.";
  }

  if (normalized.includes("duplicate") || normalized.includes("unique")) {
    return "이미 등록된 정보예요.";
  }

  if (normalized.includes("violates row-level security policy")) {
    return "권한이 없어서 처리할 수 없어요. 다시 로그인해 주세요.";
  }

  if (normalized.includes("jwt") || normalized.includes("auth")) {
    return "로그인 상태를 다시 확인해 주세요. 다시 로그인해 보세요.";
  }

  if (normalized.includes("network")) {
    return "인터넷 연결이 불안정한 것 같아요. 다시 시도해 주세요.";
  }

  if (normalized.includes("profiles")) {
    return "프로필 정보가 아직 준비되지 않았어요. 잠깐 뒤에 다시 시도해 주세요.";
  }

  if (normalized.includes("teams")) {
    return "팀 정보를 처리하는 중에 문제가 생겼어요.";
  }

  return "문제가 생겼어요. 다시 시도해 주세요.";
}

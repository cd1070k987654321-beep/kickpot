"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { toKoreanErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type SignupFormState = {
  email: string;
  password: string;
  nickname: string;
};

const initialState: SignupFormState = {
  email: "",
  password: "",
  nickname: "",
};

export function SignupForm() {
  const [form, setForm] = useState<SignupFormState>(initialState);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(() => {
    return (
      !form.email.trim() ||
      !form.password.trim() ||
      !form.nickname.trim() ||
      isSubmitting
    );
  }, [form.email, form.password, form.nickname, isSubmitting]);

  const handleChange = (key: keyof SignupFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            nickname: form.nickname,
          },
        },
      });

      if (signUpError) {
        setError(toKoreanErrorMessage(signUpError.message));
        return;
      }

      setMessage("회원가입 요청이 접수되었어요. 메일함에서 인증 링크를 눌러야 로그인할 수 있어요.");
      setForm(initialState);
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? toKoreanErrorMessage(caughtError.message)
          : "회원가입 중 문제가 생겼어요. 다시 시도해 주세요.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="회원가입"
      description="계정을 만들고 팀과 매치를 시작해 보세요."
      footer={<span>가입 후 메일 인증을 완료하면 바로 로그인할 수 있어요.</span>}
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">닉네임</label>
          <Input
            type="text"
            placeholder="닉네임을 입력해줘"
            value={form.nickname}
            onChange={(event) => handleChange("nickname", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">이메일</label>
          <Input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(event) => handleChange("email", event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">비밀번호</label>
          <Input
            type="password"
            placeholder="비밀번호를 입력해줘"
            value={form.password}
            onChange={(event) => handleChange("password", event.target.value)}
          />
        </div>

        {message ? <FeedbackMessage type="success" message={message} /> : null}

        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <Button type="submit" fullWidth disabled={isDisabled}>
          {isSubmitting ? "가입 중..." : "회원가입"}
        </Button>
      </form>
    </AuthCard>
  );
}

"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthCard } from "@/components/ui/auth-card";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { toKoreanErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase";

type LoginFormState = {
  email: string;
  password: string;
};

const initialState: LoginFormState = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginFormState>(initialState);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(() => {
    return !form.email.trim() || !form.password.trim() || isSubmitting;
  }, [form.email, form.password, isSubmitting]);

  const handleChange = (key: keyof LoginFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) {
        setError(toKoreanErrorMessage(signInError.message));
        return;
      }

      setMessage("로그인되었어요. 홈으로 이동할게요.");
      setForm(initialState);
      router.replace("/home");
      router.refresh();
    } catch (caughtError) {
      const nextError =
        caughtError instanceof Error
          ? toKoreanErrorMessage(caughtError.message)
          : "로그인 중 문제가 생겼어요. 다시 시도해 주세요.";
      setError(nextError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthCard
      title="로그인"
      description="로그인하고 바로 매칭을 찾아보세요."
      footer={
        <span>
          아직 계정이 없으면 <Link className="font-semibold text-[var(--color-primary)]" href="/signup">회원가입</Link>해 주세요.
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
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
          {isSubmitting ? "로그인 중..." : "로그인"}
        </Button>
      </form>
    </AuthCard>
  );
}

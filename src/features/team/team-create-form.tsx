"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { TopBar } from "@/components/layout/top-bar";
import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { toKoreanErrorMessage } from "@/lib/error-message";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import type { TeamFormValues } from "@/types/team";

const initialState: TeamFormValues = {
  name: "",
  description: "",
};

export function TeamCreateForm() {
  const router = useRouter();
  const [form, setForm] = useState<TeamFormValues>(initialState);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDisabled = useMemo(() => !form.name.trim() || isSubmitting, [form.name, isSubmitting]);

  const handleChange = (key: keyof TeamFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setError("");
    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError("로그인이 필요해요.");
        return;
      }

      const { data: team, error: teamError } = await supabase
        .from("teams")
        .insert({
          owner_id: user.id,
          name: form.name.trim(),
          description: form.description.trim(),
        })
        .select("id, name")
        .single();

      if (teamError || !team) {
        setError(toKoreanErrorMessage(teamError?.message) || "팀 생성에 실패했어요.");
        return;
      }

      const { error: memberError } = await supabase.from("team_members").insert({
        team_id: team.id,
        user_id: user.id,
        role: "owner",
      });

      if (memberError) {
        setError(toKoreanErrorMessage(memberError.message));
        return;
      }

      setMessage("팀이 생성되었어요. 팀 화면으로 이동할게요.");
      setForm(initialState);
      router.replace("/team");
      router.refresh();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 생성 중 문제가 생겼어요. 다시 시도해 주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <TopBar title="팀 생성" description="팀 이름과 소개를 입력하면 바로 만들 수 있어요." />

      <form className="space-y-4 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium">팀 이름</label>
          <Input placeholder="예: KickPot FC" value={form.name} onChange={(event) => handleChange("name", event.target.value)} />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">팀 소개</label>
          <Input placeholder="팀 소개를 짧게 적어줘" value={form.description} onChange={(event) => handleChange("description", event.target.value)} />
        </div>

        {message ? <FeedbackMessage type="success" message={message} /> : null}
        {error ? <FeedbackMessage type="error" message={error} /> : null}

        <Button type="submit" fullWidth disabled={isDisabled}>
          {isSubmitting ? "팀 만드는 중..." : "팀 만들기"}
        </Button>
      </form>
    </section>
  );
}

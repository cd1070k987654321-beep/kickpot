"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toKoreanErrorMessage } from "@/lib/error-message";

type PositionValue = "GK" | "DF" | "MF" | "FW" | "ALL";

type ProfileRow = {
  id: string;
  email: string | null;
  name: string;
  nickname: string;
  bio: string;
  profile_image_url: string | null;
  cover_image_url: string | null;
  main_position: PositionValue | null;
};

type TeamSummary = {
  role: "owner" | "member";
  teams: {
    id: string;
    name: string;
    description: string;
    logo_url: string | null;
  } | null;
};

const positions = ["GK", "DF", "MF", "FW", "ALL"] as const;

export function ProfileView() {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [team, setTeam] = useState<TeamSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTeamOpen, setIsTeamOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");
  const [form, setForm] = useState({
    name: "",
    nickname: "",
    bio: "",
    mainPosition: "" as "" | PositionValue,
  });

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError("로그인이 필요해요.");
          setIsLoading(false);
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, name, nickname, bio, profile_image_url, cover_image_url, main_position")
          .eq("id", user.id)
          .single();

        if (profileError || !profileData) {
          setError(profileError ? toKoreanErrorMessage(profileError.message) : "프로필 정보를 찾지 못했어요.");
          setIsLoading(false);
          return;
        }

        const { data: teamData } = await supabase
          .from("team_members")
          .select("role, teams(id, name, description, logo_url)")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        setProfile(profileData as ProfileRow);
        setPreviewImageUrl(profileData.profile_image_url ?? "");
        setPreviewCoverUrl(profileData.cover_image_url ?? "");
        setForm({
          name: profileData.name ?? "",
          nickname: profileData.nickname ?? "",
          bio: profileData.bio ?? "",
          mainPosition: (profileData.main_position as PositionValue | null) ?? "",
        });
        setTeam((teamData as TeamSummary | null) ?? null);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "프로필 정보를 불러오지 못했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const profileInitial = useMemo(() => {
    return profile?.nickname?.slice(0, 1) || "P";
  }, [profile?.nickname]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>, kind: "avatar" | "cover") => {
    const file = event.target.files?.[0];

    if (!file || !profile) {
      return;
    }

    setMessage("");
    setError("");

    if (kind === "avatar") {
      setIsUploadingImage(true);
    } else {
      setIsUploadingCover(true);
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const fileExt = file.name.split(".").pop() || "jpg";
      const filePath = `profiles/${profile.id}/${kind}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-media")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        setError(toKoreanErrorMessage(uploadError.message));
        return;
      }

      const { data } = supabase.storage.from("profile-media").getPublicUrl(filePath);

      if (kind === "avatar") {
        setPreviewImageUrl(data.publicUrl);
        setMessage("프로필 사진 미리보기가 준비되었어요. 저장하면 반영돼요.");
      } else {
        setPreviewCoverUrl(data.publicUrl);
        setMessage("배경 이미지 미리보기가 준비되었어요. 저장하면 반영돼요.");
      }
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "이미지를 올리는 중 문제가 생겼어요.");
    } finally {
      if (kind === "avatar") {
        setIsUploadingImage(false);
      } else {
        setIsUploadingCover(false);
      }
      event.target.value = "";
    }
  };

  const handleLogout = async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      window.location.href = "/login";
    } catch {
      setError("로그아웃 중 문제가 생겼어요.");
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!profile) {
      return;
    }

    setMessage("");
    setError("");
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: updateError } = await supabase
        .from("profiles")
        .update({
          name: form.name.trim(),
          nickname: form.nickname.trim(),
          bio: form.bio.trim(),
          main_position: form.mainPosition || null,
          profile_image_url: previewImageUrl || null,
          cover_image_url: previewCoverUrl || null,
        })
        .eq("id", profile.id)
        .select("id, email, name, nickname, bio, profile_image_url, cover_image_url, main_position")
        .single();

      if (updateError || !data) {
        setError(updateError ? toKoreanErrorMessage(updateError.message) : "프로필을 저장하지 못했어요.");
        return;
      }

      setProfile(data as ProfileRow);
      setPreviewImageUrl(data.profile_image_url ?? "");
      setPreviewCoverUrl(data.cover_image_url ?? "");
      setMessage("프로필이 저장되었어요.");
      setIsEditing(false);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "프로필 저장 중 문제가 생겼어요.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">프로필을 불러오는 중이에요...</p>;
  }

  if (error && !profile) {
    return <FeedbackMessage type="error" message={error} />;
  }

  if (!profile) {
    return <FeedbackMessage type="error" message="프로필 정보를 찾지 못했어요." />;
  }

  return (
    <section className="space-y-6">
      <section className="-mx-4 sm:-mx-5">
        <div
          className="h-44 w-full bg-cover bg-center"
          style={{
            backgroundImage: previewCoverUrl || profile.cover_image_url
              ? `linear-gradient(rgba(11,15,20,0.12), rgba(11,15,20,0.55)), url(${previewCoverUrl || profile.cover_image_url})`
              : "linear-gradient(135deg, rgba(163,255,18,0.24), rgba(30,215,96,0.08) 45%, rgba(15,23,42,1) 100%)",
          }}
        />

        <div className="px-4 sm:px-5">
          <div className="-mt-14 flex items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-[var(--background)] bg-[var(--color-surface-muted)]">
                {previewImageUrl || profile.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewImageUrl || profile.profile_image_url || undefined} alt="프로필 이미지" className="h-28 w-28 rounded-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-[var(--color-primary)]">{profileInitial}</span>
                )}
              </div>

              <div className="pb-2">
                <h1 className="text-[28px] font-bold leading-tight">{profile.nickname}</h1>
                <p className="mt-1 text-sm font-medium text-[var(--foreground)]/80">{profile.name || "이름을 추가해 주세요"}</p>
              </div>
            </div>

            <div className="relative mb-2">
              <button
                type="button"
                onClick={() => setIsActionMenuOpen((prev) => !prev)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]"
                aria-label="프로필 메뉴 열기"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 19.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                </svg>
              </button>

              {isActionMenuOpen ? (
                <>
                  <button
                    type="button"
                    aria-label="프로필 메뉴 닫기"
                    onClick={() => setIsActionMenuOpen(false)}
                    className="fixed inset-0 z-10"
                  />
                  <div className="absolute right-0 top-12 z-20 min-w-[140px] origin-top-right rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] animate-[fadeIn_0.16s_ease-out]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        setIsEditing(true);
                      }}
                      className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]"
                    >
                      프로필 수정
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsActionMenuOpen(false);
                        const shouldLogout = window.confirm("로그아웃하시겠어요?");
                        if (shouldLogout) {
                          void handleLogout();
                        }
                      }}
                      className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--color-error)]"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <p className="text-sm text-[var(--color-text-muted)]">{profile.email || "이메일 정보 없음"}</p>
            <p className="text-sm leading-6 text-[var(--foreground)]/85">
              {profile.bio || "아직 소개가 없어요. 내 플레이 스타일이나 팀에서 맡는 역할을 적어 보세요."}
            </p>

            <div className="flex flex-wrap gap-2">
              {profile.main_position ? (
                <span className="rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">
                  포지션 {profile.main_position}
                </span>
              ) : null}
            </div>

            {team?.teams ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsTeamOpen((prev) => !prev)}
                  className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)]"
                >
                  <span>소속팀</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`h-4 w-4 transition ${isTeamOpen ? "rotate-180" : "rotate-0"}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {isTeamOpen ? (
                  <Link href={`/team/${team.teams.id}`} className="mt-3 flex items-center justify-between gap-3 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                        {team.teams.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={team.teams.logo_url} alt={`${team.teams.name} 로고`} className="h-12 w-12 rounded-full object-contain" />
                        ) : (
                          <span className="text-base font-bold text-[var(--color-primary)]">{team.teams.name.slice(0, 1)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{team.teams.name}</p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{team.role === "owner" ? "팀장" : "팀원"}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--color-primary)]">이동</span>
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid grid-cols-3 gap-4 border-t border-[var(--color-border)] pt-4 text-center">
            <div>
              <p className="text-lg font-bold">0</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">경기</p>
            </div>
            <div>
              <p className="text-lg font-bold">0</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">골</p>
            </div>
            <div>
              <p className="text-lg font-bold">0</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">어시스트</p>
            </div>
          </div>
        </div>
      </section>

      {isEditing ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button
            type="button"
            aria-label="프로필 수정 닫기"
            onClick={() => setIsEditing(false)}
            className="absolute inset-0 bg-black/55"
          />

          <div className="relative flex max-h-[85dvh] flex-col rounded-t-[32px] border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-18px_40px_rgba(0,0,0,0.35)] animate-[sheetUp_0.2s_ease-out]">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--color-border)]" />

              <div className="mb-4">
                <h2 className="text-lg font-semibold">프로필 수정</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">사진, 배경, 이름, 소개, 포지션을 바꿀 수 있어요.</p>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-scroll px-5 pb-[calc(env(safe-area-inset-bottom)+32px)] [webkit-overflow-scrolling:touch] overscroll-contain">
              <form className="space-y-4 pb-8" onSubmit={handleSave}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">프로필 사진</label>
                  <label className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm font-medium text-[var(--foreground)]">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, "avatar")} />
                    {isUploadingImage ? "사진 업로드 중이에요..." : "사진 앱에서 프로필 사진 선택"}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">배경 이미지</label>
                  <label className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm font-medium text-[var(--foreground)]">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageUpload(event, "cover")} />
                    {isUploadingCover ? "배경 업로드 중이에요..." : "사진 앱에서 배경 이미지 선택"}
                  </label>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">닉네임</label>
                  <Input value={form.nickname} onChange={(event) => setForm((prev) => ({ ...prev, nickname: event.target.value }))} placeholder="닉네임을 입력해 주세요" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">이름</label>
                  <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="이름을 입력해 주세요" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">소개</label>
                  <Input value={form.bio} onChange={(event) => setForm((prev) => ({ ...prev, bio: event.target.value }))} placeholder="나를 소개해 주세요" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">포지션</label>
                  <div className="grid grid-cols-5 gap-2">
                    {positions.map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, mainPosition: position }))}
                        className={form.mainPosition === position ? "rounded-2xl bg-[var(--color-primary)] px-3 py-3 text-sm font-bold text-[#0b0f14]" : "rounded-2xl border border-[var(--color-border)] px-3 py-3 text-sm font-medium text-[var(--color-text-muted)]"}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                </div>

                {message ? <FeedbackMessage type="success" message={message} /> : null}
                {error ? <FeedbackMessage type="error" message={error} /> : null}

                <Button type="submit" fullWidth disabled={isSaving || isUploadingImage || isUploadingCover}>
                  {isSaving ? "저장 중이에요..." : "프로필 저장"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { Input } from "@/components/ui/input";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toKoreanErrorMessage } from "@/lib/error-message";

type TeamDetailViewProps = {
  teamId: string;
};

type TeamRow = {
  id: string;
  name: string;
  description: string;
  invite_code: string | null;
  owner_id: string;
  logo_url?: string | null;
  cover_image_url?: string | null;
};

type TeamMemberRow = {
  id: string;
  role: "owner" | "member";
  number?: number | null;
  profiles: {
    id: string;
    nickname: string;
    name?: string | null;
    bio?: string | null;
    profile_image_url?: string | null;
    email: string | null;
    main_position: "GK" | "DF" | "MF" | "FW" | "ALL" | null;
  } | null;
};

export function TeamDetailView({ teamId }: TeamDetailViewProps) {
  const [team, setTeam] = useState<TeamRow | null>(null);
  const [members, setMembers] = useState<TeamMemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const [activeMemberMenuId, setActiveMemberMenuId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMemberRow | null>(null);
  const [isNumberSheetOpen, setIsNumberSheetOpen] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");

  const [activeTab, setActiveTab] = useState<"posts" | "history" | "members">("members");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });
  const [previewLogoUrl, setPreviewLogoUrl] = useState("");
  const [previewCoverUrl, setPreviewCoverUrl] = useState("");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [isJoining, setIsJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState("");
  const [joinError, setJoinError] = useState("");

  const [leaveError, setLeaveError] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);

  const [memberActionError, setMemberActionError] = useState("");
  const [isMemberActionLoading, setIsMemberActionLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        setCurrentUserId(user?.id ?? null);

        const { data: teamData, error: teamError } = await supabase
          .from("teams")
          .select("id, name, description, invite_code, owner_id, logo_url, cover_image_url")
          .eq("id", teamId)
          .single();

        if (teamError || !teamData) {
          setError(teamError ? toKoreanErrorMessage(teamError.message) : "팀 정보를 찾지 못했어요.");
          return;
        }

        const { data: memberData, error: memberError } = await supabase
          .from("team_members")
          .select("id, role, number, profiles(id, nickname, name, bio, profile_image_url, email, main_position)")
          .eq("team_id", teamId);

        if (memberError) {
          setError(toKoreanErrorMessage(memberError.message));
          return;
        }

        setTeam(teamData as TeamRow);
        setForm({
          name: teamData.name ?? "",
          description: teamData.description ?? "",
        });
        setPreviewLogoUrl(teamData.logo_url ?? "");
        setPreviewCoverUrl(teamData.cover_image_url ?? "");
        setMembers((memberData ?? []) as TeamMemberRow[]);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 상세 정보를 불러오지 못했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [teamId]);

  const isOwner = useMemo(() => {
    if (!team || !currentUserId) {
      return false;
    }
    return team.owner_id === currentUserId;
  }, [team, currentUserId]);

  const isMember = useMemo(() => {
    if (!currentUserId) {
      return false;
    }
    return members.some((member) => member.profiles?.id === currentUserId);
  }, [members, currentUserId]);

  const refreshMembers = async () => {
    const supabase = getSupabaseBrowserClient();
    const { data } = await supabase
      .from("team_members")
      .select("id, role, number, profiles(id, nickname, name, bio, profile_image_url, email, main_position)")
      .eq("team_id", teamId);

    setMembers((data ?? []) as TeamMemberRow[]);
  };

  const uploadTeamImage = async (file: File, kind: "logo" | "cover") => {
    const supabase = getSupabaseBrowserClient();
    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `teams/${teamId}/${kind}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from("team-media").upload(filePath, file, {
      cacheControl: "3600",
      upsert: true,
    });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("team-media").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleImageChange = async (event: ChangeEvent<HTMLInputElement>, kind: "logo" | "cover") => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFormMessage("");
    setFormError("");

    try {
      if (kind === "logo") setIsUploadingLogo(true);
      else setIsUploadingCover(true);

      const publicUrl = await uploadTeamImage(file, kind);
      if (kind === "logo") setPreviewLogoUrl(publicUrl);
      else setPreviewCoverUrl(publicUrl);

      setFormMessage(kind === "logo" ? "로고 미리보기가 준비되었어요. 저장하면 반영돼요." : "커버 미리보기가 준비되었어요. 저장하면 반영돼요.");
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "이미지 업로드 중 문제가 생겼어요.");
    } finally {
      if (kind === "logo") setIsUploadingLogo(false);
      else setIsUploadingCover(false);
      event.target.value = "";
    }
  };

  const handleJoinRequest = async () => {
    if (!currentUserId || !team) {
      setJoinError("로그인이 필요해요.");
      return;
    }

    setJoinMessage("");
    setJoinError("");
    setIsJoining(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: requestError } = await supabase.from("team_join_requests").upsert({
        team_id: team.id,
        user_id: currentUserId,
        status: "pending",
      });

      if (requestError) {
        if (requestError.message.toLowerCase().includes("duplicate") || requestError.message.includes("unique")) {
          setJoinError("이미 가입 요청을 보냈어요.");
          return;
        }
        setJoinError(toKoreanErrorMessage(requestError.message));
        return;
      }

      setJoinMessage("가입 요청을 보냈어요. 팀장이 확인하면 가입돼요.");

      if (team.owner_id !== currentUserId) {
        await supabase.from("notifications").insert({
          user_id: team.owner_id,
          type: "team_join_request",
          title: "새 가입 요청이 도착했어요",
          body: `${team.name} 팀에 새로운 가입 요청이 왔어요.`,
          link: "/notifications",
        });
      }
    } catch (caughtError) {
      setJoinError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "가입 요청 중 문제가 생겼어요.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentUserId || !isMember || isOwner) return;

    const shouldLeave = window.confirm("정말 탈퇴하시겠습니까?");
    if (!shouldLeave) return;

    setLeaveError("");
    setIsLeaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", currentUserId);

      if (deleteError) {
        setLeaveError(toKoreanErrorMessage(deleteError.message));
        return;
      }

      await supabase.from("notifications").insert({
        user_id: currentUserId,
        type: "team_removed",
        title: "팀에서 탈퇴했어요",
        body: `${team?.name || "팀"}에서 나왔어요.`,
        link: "/team",
      });

      window.location.href = "/team";
    } catch (caughtError) {
      setLeaveError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 탈퇴 중 문제가 생겼어요.");
    } finally {
      setIsLeaving(false);
    }
  };

  const handleKickMember = async (member: TeamMemberRow) => {
    if (!isOwner || !member.profiles?.id || member.profiles.id === currentUserId) return;

    const shouldKick = window.confirm(`${member.profiles.nickname || "이 멤버"}님을 팀에서 내보내시겠어요?`);
    if (!shouldKick) return;

    setMemberActionError("");
    setIsMemberActionLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from("team_members").delete().eq("id", member.id);

      if (deleteError) {
        setMemberActionError(toKoreanErrorMessage(deleteError.message));
        return;
      }

      setMembers((prev) => prev.filter((item) => item.id !== member.id));

      if (member.profiles?.id) {
        await supabase.from("notifications").insert({
          user_id: member.profiles.id,
          type: "team_removed",
          title: "팀에서 제외되었어요",
          body: `${team?.name || "팀"}에서 제외되었어요.`,
          link: "/team",
        });
      }
    } catch (caughtError) {
      setMemberActionError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀원을 내보내는 중 문제가 생겼어요.");
    } finally {
      setActiveMemberMenuId(null);
      setIsMemberActionLoading(false);
    }
  };

  const handleTransferOwner = async (member: TeamMemberRow) => {
    if (!team || !member.profiles?.id || !isOwner || member.profiles.id === currentUserId) return;

    const shouldTransfer = window.confirm(`${member.profiles.nickname || "이 멤버"}님에게 팀장을 위임하시겠어요?`);
    if (!shouldTransfer) return;

    setMemberActionError("");
    setIsMemberActionLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const currentOwnerMember = members.find((item) => item.profiles?.id === currentUserId);
      if (!currentOwnerMember) {
        setMemberActionError("현재 팀장 정보를 찾지 못했어요.");
        return;
      }

      const { error: teamUpdateError } = await supabase.from("teams").update({ owner_id: member.profiles.id }).eq("id", team.id);
      if (teamUpdateError) {
        setMemberActionError(toKoreanErrorMessage(teamUpdateError.message));
        return;
      }

      const { error: nextOwnerError } = await supabase.from("team_members").update({ role: "owner" }).eq("id", member.id);
      if (nextOwnerError) {
        setMemberActionError(toKoreanErrorMessage(nextOwnerError.message));
        return;
      }

      const { error: prevOwnerError } = await supabase.from("team_members").update({ role: "member" }).eq("id", currentOwnerMember.id);
      if (prevOwnerError) {
        setMemberActionError(toKoreanErrorMessage(prevOwnerError.message));
        return;
      }

      setTeam((prev) => (prev ? { ...prev, owner_id: member.profiles!.id } : prev));
      await refreshMembers();

      await supabase.from("notifications").insert([
        {
          user_id: member.profiles.id,
          type: "team_owner_transferred",
          title: "팀장이 되었어요",
          body: `${team.name}의 팀장으로 위임되었어요.`,
          link: `/team/${team.id}`,
        },
        {
          user_id: currentUserId,
          type: "team_owner_transferred",
          title: "팀장 권한을 넘겼어요",
          body: `${member.profiles.nickname}님에게 팀장을 위임했어요.`,
          link: `/team/${team.id}`,
        },
      ]);
    } catch (caughtError) {
      setMemberActionError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀장 위임 중 문제가 생겼어요.");
    } finally {
      setActiveMemberMenuId(null);
      setIsMemberActionLoading(false);
    }
  };

  const handleOpenNumberSheet = (member: TeamMemberRow) => {
    setSelectedMember(member);
    setMemberNumber(member.number ? String(member.number) : "");
    setActiveMemberMenuId(null);
    setMemberActionError("");
    setIsNumberSheetOpen(true);
  };

  const handleSaveNumber = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedMember) return;

    setMemberActionError("");
    setIsMemberActionLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const nextNumber = memberNumber.trim() ? Number(memberNumber.trim()) : null;

      if (nextNumber !== null && Number.isNaN(nextNumber)) {
        setMemberActionError("번호는 숫자로 입력해 주세요.");
        return;
      }

      const { error: updateError } = await supabase.from("team_members").update({ number: nextNumber }).eq("id", selectedMember.id);
      if (updateError) {
        setMemberActionError(toKoreanErrorMessage(updateError.message));
        return;
      }

      setMembers((prev) => prev.map((item) => (item.id === selectedMember.id ? { ...item, number: nextNumber } : item)));
      setIsNumberSheetOpen(false);
      setSelectedMember(null);
      setMemberNumber("");
    } catch (caughtError) {
      setMemberActionError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "번호를 저장하는 중 문제가 생겼어요.");
    } finally {
      setIsMemberActionLoading(false);
    }
  };

  const handleUpdateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage("");
    setFormError("");
    setIsSaving(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error: updateError } = await supabase
        .from("teams")
        .update({
          name: form.name.trim(),
          description: form.description.trim(),
          logo_url: previewLogoUrl.trim() || null,
          cover_image_url: previewCoverUrl.trim() || null,
        })
        .eq("id", teamId)
        .select("id, name, description, invite_code, owner_id, logo_url, cover_image_url")
        .single();

      if (updateError || !data) {
        setFormError(updateError ? toKoreanErrorMessage(updateError.message) : "팀 정보를 수정하지 못했어요.");
        return;
      }

      setTeam(data as TeamRow);
      setForm({ name: data.name ?? "", description: data.description ?? "" });
      setPreviewLogoUrl(data.logo_url ?? "");
      setPreviewCoverUrl(data.cover_image_url ?? "");
      setFormMessage("팀 정보가 변경되었어요.");
    } catch (caughtError) {
      setFormError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "팀 정보를 수정하는 중 문제가 생겼어요.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <p className="px-4 text-sm text-[var(--color-text-muted)]">팀 정보를 불러오는 중이에요...</p>;
  if (error) return <FeedbackMessage type="error" message={error} />;
  if (!team) return <FeedbackMessage type="error" message="팀 정보를 찾지 못했어요." />;

  return (
    <section className="space-y-6">
      <section className="-mx-4 sm:-mx-5">
        <div className="relative">
          <div
            className="relative h-52 w-full bg-cover bg-center"
            style={{
              backgroundImage: previewCoverUrl || team.cover_image_url
                ? `linear-gradient(rgba(11,15,20,0.18), rgba(11,15,20,0.66)), url(${previewCoverUrl || team.cover_image_url})`
                : "linear-gradient(135deg, rgba(163,255,18,0.24), rgba(30,215,96,0.08) 45%, rgba(15,23,42,1) 100%)",
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_28%)]" />

            {(isOwner || isMember) ? (
              <div className="absolute right-4 top-4 z-10">
                <button
                  type="button"
                  onClick={() => setIsActionMenuOpen((prev) => !prev)}
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:rgba(255,255,255,0.18)] bg-[color:rgba(11,15,20,0.42)] text-white backdrop-blur"
                  aria-label="팀 메뉴 열기"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M12 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 19.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                  </svg>
                </button>

                {isActionMenuOpen ? (
                  <>
                    <button type="button" aria-label="팀 메뉴 닫기" onClick={() => setIsActionMenuOpen(false)} className="fixed inset-0 z-10" />
                    <div className="absolute right-0 top-12 z-20 min-w-[148px] origin-top-right rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] animate-[fadeIn_0.16s_ease-out]">
                      {isOwner ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionMenuOpen(false);
                            setIsSettingsOpen(true);
                          }}
                          className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]"
                        >
                          팀 수정
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionMenuOpen(false);
                          window.location.href = "/team";
                        }}
                        className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]"
                      >
                        팀페이지 가기
                      </button>
                      {!isOwner ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsActionMenuOpen(false);
                            void handleLeaveTeam();
                          }}
                          className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--color-error)]"
                        >
                          {isLeaving ? "처리 중이에요..." : "팀 탈퇴하기"}
                        </button>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="relative z-20 -mt-16 flex justify-center px-4 sm:px-5">
            <div className="flex h-32 w-32 items-center justify-center rounded-full">
              {previewLogoUrl || team.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewLogoUrl || team.logo_url || undefined} alt={`${team.name} 로고`} className="h-32 w-32 rounded-full object-contain" />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-[var(--color-surface-muted)]">
                  <span className="text-3xl font-bold text-[var(--color-primary)]">{team.name.slice(0, 1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-4 pt-4 sm:px-5">
          {leaveError ? <div className="mb-3"><FeedbackMessage type="error" message={leaveError} /></div> : null}
          <div className="px-2 text-center">
            <h1 className="text-[28px] font-bold leading-tight">{team.name}</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{team.description || "팀 소개가 아직 없어요."}</p>

            {!isMember ? (
              <div className="mt-4 space-y-3">
                {joinMessage ? <FeedbackMessage type="success" message={joinMessage} /> : null}
                {joinError ? <FeedbackMessage type="error" message={joinError} /> : null}
                <button
                  type="button"
                  onClick={() => void handleJoinRequest()}
                  disabled={isJoining}
                  className="inline-flex h-12 items-center justify-center rounded-[16px] bg-[var(--color-primary)] px-5 text-sm font-bold text-[#0b0f14] disabled:opacity-60"
                >
                  {isJoining ? "요청 중이에요..." : "가입 요청하기"}
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {isOwner && isSettingsOpen ? (
        <>
          <button type="button" aria-label="팀 설정 닫기" onClick={() => setIsSettingsOpen(false)} className="fixed inset-0 z-40 bg-black/55" />
          <div className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-[32px] border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-18px_40px_rgba(0,0,0,0.35)]">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--color-border)]" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">팀 설정</h2>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">팀장만 팀 정보와 이미지를 변경할 수 있어요.</p>
                </div>
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-muted)]">닫기</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+32px)] overscroll-contain">
              <form className="space-y-4 pb-8" onSubmit={handleUpdateTeam}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">팀 이름</label>
                  <Input value={form.name} onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))} placeholder="팀 이름을 입력해 주세요" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">팀 소개</label>
                  <Input value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="팀 소개를 입력해 주세요" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">팀 로고</label>
                  <label className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm font-medium text-[var(--foreground)]">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageChange(event, "logo")} />
                    {isUploadingLogo ? "로고 업로드 중이에요..." : "사진 앱에서 로고 선택"}
                  </label>
                  {previewLogoUrl ? <div className="flex justify-center rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={previewLogoUrl} alt="팀 로고 미리보기" className="h-24 w-24 rounded-full object-contain" /></div> : null}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">커버 이미지</label>
                  <label className="flex min-h-[52px] cursor-pointer items-center justify-center rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 text-sm font-medium text-[var(--foreground)]">
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => void handleImageChange(event, "cover")} />
                    {isUploadingCover ? "커버 업로드 중이에요..." : "사진 앱에서 커버 선택"}
                  </label>
                  {previewCoverUrl ? <div className="overflow-hidden rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-muted)]">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={previewCoverUrl} alt="팀 커버 미리보기" className="h-32 w-full object-cover" /></div> : null}
                </div>
                {formMessage ? <FeedbackMessage type="success" message={formMessage} /> : null}
                {formError ? <FeedbackMessage type="error" message={formError} /> : null}
                <Button type="submit" fullWidth disabled={isSaving || isUploadingLogo || isUploadingCover}>{isSaving ? "저장 중이에요..." : "팀 정보 저장"}</Button>
              </form>
            </div>
          </div>
        </>
      ) : null}

      {isNumberSheetOpen && selectedMember ? (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <button type="button" aria-label="번호 지정 닫기" onClick={() => setIsNumberSheetOpen(false)} className="absolute inset-0 bg-black/55" />
          <div className="relative flex max-h-[70dvh] flex-col rounded-t-[32px] border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_-18px_40px_rgba(0,0,0,0.35)]">
            <div className="shrink-0 px-5 pt-4">
              <div className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-[var(--color-border)]" />
              <div className="mb-4">
                <h2 className="text-lg font-semibold">번호 지정</h2>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{selectedMember.profiles?.nickname || "이 멤버"}님의 팀 내 번호를 지정할 수 있어요.</p>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+32px)]">
              <form className="space-y-4 pb-8" onSubmit={handleSaveNumber}>
                <div className="space-y-2">
                  <label className="text-sm font-medium">등번호</label>
                  <Input type="number" inputMode="numeric" value={memberNumber} onChange={(event) => setMemberNumber(event.target.value)} placeholder="예: 7" />
                </div>
                {memberActionError ? <FeedbackMessage type="error" message={memberActionError} /> : null}
                <Button type="submit" fullWidth disabled={isMemberActionLoading}>{isMemberActionLoading ? "저장 중이에요..." : "번호 저장"}</Button>
              </form>
            </div>
          </div>
        </div>
      ) : null}

      <section className="space-y-4">
        <div className="rounded-[26px] border border-[var(--color-border)] bg-[color:rgba(17,24,39,0.92)] p-2 shadow-[var(--shadow-card)] backdrop-blur">
          <div className="grid grid-cols-3 gap-2">
            <button type="button" onClick={() => setActiveTab("posts")} className={activeTab === "posts" ? "rounded-[18px] bg-[var(--color-primary)] px-3 py-3 text-sm font-bold text-[#0b0f14] shadow-[0_8px_20px_rgba(163,255,18,0.22)]" : "rounded-[18px] bg-transparent px-3 py-3 text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--foreground)]"}>게시물</button>
            <button type="button" onClick={() => setActiveTab("history")} className={activeTab === "history" ? "rounded-[18px] bg-[var(--color-primary)] px-3 py-3 text-sm font-bold text-[#0b0f14] shadow-[0_8px_20px_rgba(163,255,18,0.22)]" : "rounded-[18px] bg-transparent px-3 py-3 text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--foreground)]"}>히스토리</button>
            <button type="button" onClick={() => setActiveTab("members")} className={activeTab === "members" ? "rounded-[18px] bg-[var(--color-primary)] px-3 py-3 text-sm font-bold text-[#0b0f14] shadow-[0_8px_20px_rgba(163,255,18,0.22)]" : "rounded-[18px] bg-transparent px-3 py-3 text-sm font-semibold text-[var(--color-text-muted)] transition hover:text-[var(--foreground)]"}>팀멤버</button>
          </div>
        </div>

        {activeTab === "posts" ? (
          <section className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">게시물</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">팀 공지, 모집글, 경기 전후 이야기가 여기에 들어올 예정이에요.</p>
          </section>
        ) : null}

        {activeTab === "history" ? (
          <section className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
            <h2 className="text-lg font-semibold">팀 히스토리</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">생성일, 최근 매치, 팀 활동 기록이 여기에 쌓이게 만들 거예요.</p>
          </section>
        ) : null}

        {activeTab === "members" ? (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">팀 멤버</h2>
              <span className="text-sm text-[var(--color-text-muted)]">{members.length}명</span>
            </div>
            {memberActionError ? <FeedbackMessage type="error" message={memberActionError} /> : null}

            {members.map((member) => {
              const canManageOthers = isOwner && member.profiles?.id && member.profiles.id !== currentUserId;
              const canOpenMenu = isOwner;

              return (
                <article key={member.id} className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex min-h-14 min-w-[34px] items-center justify-center pt-1 text-[22px] font-semibold tracking-tight text-[rgba(255,255,255,0.78)]">
                        {member.number ? String(member.number).padStart(2, "0") : "--"}
                      </div>

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                        {member.profiles?.profile_image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={member.profiles.profile_image_url} alt={`${member.profiles.nickname} 프로필`} className="h-14 w-14 rounded-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-[var(--color-primary)]">{member.profiles?.nickname?.slice(0, 1) || "?"}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-end gap-x-2 gap-y-1">
                          <p className="text-[15px] font-semibold leading-none">{member.profiles?.nickname || "이름 없음"}</p>
                          <span className="text-[13px] leading-none text-[var(--color-text-muted)]">{member.profiles?.name || "이름 없음"}</span>
                        </div>
                        <p className="mt-2 line-clamp-2 text-[13px] leading-5 text-[var(--color-text-muted)]">{member.profiles?.bio || "자기소개가 아직 없어요."}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="text-right">
                        <span className="inline-flex rounded-full border border-[var(--color-border-strong)] px-3 py-1 text-xs font-semibold text-[var(--color-primary)]">{member.role === "owner" ? "팀장" : "팀원"}</span>
                        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{member.profiles?.main_position || "포지션 미설정"}</p>
                      </div>

                      {canOpenMenu ? (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMemberMenuId((prev) => (prev === member.id ? null : member.id))}
                            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-text-muted)]"
                            aria-label="멤버 액션 열기"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M12 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 19.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                            </svg>
                          </button>

                          {activeMemberMenuId === member.id ? (
                            <>
                              <button type="button" aria-label="멤버 메뉴 닫기" onClick={() => setActiveMemberMenuId(null)} className="fixed inset-0 z-10" />
                              <div className="absolute right-0 top-10 z-20 min-w-[140px] rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] animate-[fadeIn_0.16s_ease-out]">
                                <button type="button" onClick={() => handleOpenNumberSheet(member)} className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]">번호 지정</button>
                                {canManageOthers ? (
                                  <>
                                    <button type="button" onClick={() => void handleKickMember(member)} className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--color-error)]">강퇴</button>
                                    <button type="button" onClick={() => void handleTransferOwner(member)} className="flex w-full items-center rounded-[14px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]">팀장 위임</button>
                                  </>
                                ) : null}
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        ) : null}
      </section>
    </section>
  );
}

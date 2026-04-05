"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { FeedbackMessage } from "@/components/ui/feedback-message";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { toKoreanErrorMessage } from "@/lib/error-message";

type NotificationRow = {
  id: string;
  type: "team_joined" | "team_removed" | "team_owner_transferred" | "team_join_request";
  title: string;
  body: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

type JoinRequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  team_id: string;
  user_id: string;
  teams: {
    id: string;
    name: string;
  } | null;
  profiles: {
    id: string;
    nickname: string;
  } | null;
};

export function NotificationsView() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [requests, setRequests] = useState<JoinRequestRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [markingNotificationId, setMarkingNotificationId] = useState<string | null>(null);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [notifications]);

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

        const { data, error: queryError } = await supabase
          .from("notifications")
          .select("id, type, title, body, link, is_read, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (queryError) {
          setError(toKoreanErrorMessage(queryError.message));
          setIsLoading(false);
          return;
        }

        const { data: ownedTeams } = await supabase.from("teams").select("id").eq("owner_id", user.id);
        const ownedTeamIds = (ownedTeams ?? []).map((item) => item.id);

        let requestRows: JoinRequestRow[] = [];
        if (ownedTeamIds.length) {
          const { data: requestData } = await supabase
            .from("team_join_requests")
            .select("id, status, team_id, user_id, teams(id, name), profiles(id, nickname)")
            .eq("status", "pending")
            .in("team_id", ownedTeamIds);

          requestRows = (requestData ?? []) as JoinRequestRow[];
        }

        setNotifications((data ?? []) as NotificationRow[]);
        setRequests(requestRows);
      } catch (caughtError) {
        setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "알림을 불러오지 못했어요.");
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, []);

  const handleRequest = async (request: JoinRequestRow, nextStatus: "approved" | "rejected") => {
    setActingRequestId(request.id);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase
        .from("team_join_requests")
        .update({ status: nextStatus })
        .eq("id", request.id);

      if (updateError) {
        setError(toKoreanErrorMessage(updateError.message));
        return;
      }

      if (nextStatus === "approved") {
        const { error: memberError } = await supabase.from("team_members").insert({
          team_id: request.team_id,
          user_id: request.user_id,
          role: "member",
        });

        if (memberError) {
          setError(toKoreanErrorMessage(memberError.message));
          return;
        }

        await supabase.from("notifications").insert({
          user_id: request.user_id,
          type: "team_joined",
          title: "가입 요청이 수락되었어요",
          body: `${request.teams?.name || "팀"} 가입이 승인되었어요.`,
          link: `/team/${request.team_id}`,
        });
      }

      if (nextStatus === "rejected") {
        await supabase.from("notifications").insert({
          user_id: request.user_id,
          type: "team_removed",
          title: "가입 요청이 거절되었어요",
          body: `${request.teams?.name || "팀"} 가입 요청이 거절되었어요.`,
          link: "/team",
        });
      }

      setRequests((prev) => prev.filter((item) => item.id !== request.id));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "요청 처리 중 문제가 생겼어요.");
    } finally {
      setActingRequestId(null);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingNotificationId(notificationId);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.from("notifications").update({ is_read: true }).eq("id", notificationId);

      if (updateError) {
        setError(toKoreanErrorMessage(updateError.message));
        return;
      }

      setNotifications((prev) => prev.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item)));
      setActiveMenuId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "읽음 처리 중 문제가 생겼어요.");
    } finally {
      setMarkingNotificationId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications.some((notification) => !notification.is_read)) {
      return;
    }

    setIsMarkingAll(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const targetIds = notifications.filter((notification) => !notification.is_read).map((notification) => notification.id);
      const { error: updateError } = await supabase.from("notifications").update({ is_read: true }).in("id", targetIds);

      if (updateError) {
        setError(toKoreanErrorMessage(updateError.message));
        return;
      }

      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "전체 읽음 처리 중 문제가 생겼어요.");
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    const shouldDelete = window.confirm("이 알림을 삭제하시겠어요?");
    if (!shouldDelete) {
      return;
    }

    setDeletingNotificationId(notificationId);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase.from("notifications").delete().eq("id", notificationId);

      if (deleteError) {
        setError(toKoreanErrorMessage(deleteError.message));
        return;
      }

      setNotifications((prev) => prev.filter((item) => item.id !== notificationId));
      setActiveMenuId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "알림 삭제 중 문제가 생겼어요.");
    } finally {
      setDeletingNotificationId(null);
    }
  };

  const handleDeleteAllNotifications = async () => {
    if (!notifications.length) {
      return;
    }

    const shouldDelete = window.confirm("알림을 전부 삭제하시겠어요?");
    if (!shouldDelete) {
      return;
    }

    setIsDeletingAll(true);
    setError("");

    try {
      const supabase = getSupabaseBrowserClient();
      const targetIds = notifications.map((notification) => notification.id);
      const { error: deleteError } = await supabase.from("notifications").delete().in("id", targetIds);

      if (deleteError) {
        setError(toKoreanErrorMessage(deleteError.message));
        return;
      }

      setNotifications([]);
      setActiveMenuId(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? toKoreanErrorMessage(caughtError.message) : "전체 알림 삭제 중 문제가 생겼어요.");
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-[var(--color-text-muted)]">알림을 불러오는 중이에요...</p>;
  }

  return (
    <section className="space-y-4">
      {error ? <FeedbackMessage type="error" message={error} /> : null}

      <div className="flex items-center justify-between gap-3 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-card)]">
        <div>
          <p className="text-sm font-semibold">읽지 않은 알림 {unreadCount}개</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">알림을 정리하거나 한 번에 읽음 처리할 수 있어요.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => void handleMarkAllAsRead()}
            disabled={isMarkingAll || unreadCount === 0}
            className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--foreground)] disabled:opacity-50"
          >
            {isMarkingAll ? "처리 중..." : "전부 읽기"}
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteAllNotifications()}
            disabled={isDeletingAll || notifications.length === 0}
            className="rounded-full border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-error)] disabled:opacity-50"
          >
            {isDeletingAll ? "삭제 중..." : "전부 삭제"}
          </button>
        </div>
      </div>

      {requests.length ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)]">가입 요청</h2>
          {requests.map((request) => (
            <article key={request.id} className="rounded-[24px] border border-[var(--color-border-strong)] bg-[color:rgba(163,255,18,0.08)] p-5 shadow-[var(--shadow-card)]">
              <h3 className="text-base font-semibold">{request.profiles?.nickname || "누군가"}님이 가입을 요청했어요</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">{request.teams?.name || "팀"}에 가입 요청이 들어왔어요.</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button type="button" variant="secondary" onClick={() => void handleRequest(request, "rejected")} disabled={actingRequestId === request.id}>
                  거절
                </Button>
                <Button type="button" onClick={() => void handleRequest(request, "approved")} disabled={actingRequestId === request.id}>
                  수락
                </Button>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {notifications.length ? (
        <section className="space-y-3">
          {notifications.map((notification) => {
            const article = (
              <article className={`rounded-[24px] border p-5 shadow-[var(--shadow-card)] ${notification.is_read ? "border-[var(--color-border)] bg-[var(--color-surface)]" : "border-[var(--color-border-strong)] bg-[color:rgba(163,255,18,0.08)]"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-semibold">{notification.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{notification.body}</p>
                  </div>
                  <div className="relative flex items-start gap-3">
                    {!notification.is_read ? <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" /> : null}
                    <button
                      type="button"
                      aria-label="알림 메뉴 열기"
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setActiveMenuId((prev) => (prev === notification.id ? null : notification.id));
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-text-muted)]"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M12 6.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 13.25a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5ZM12 19.75a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5Z" />
                      </svg>
                    </button>

                    {activeMenuId === notification.id ? (
                      <>
                        <button
                          type="button"
                          aria-label="알림 메뉴 닫기"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            setActiveMenuId(null);
                          }}
                          className="fixed inset-0 z-10"
                        />
                        <div className="absolute right-0 top-8 z-20 min-w-[132px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-[var(--shadow-card)] animate-[fadeIn_0.16s_ease-out]">
                          {!notification.is_read ? (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                void handleMarkAsRead(notification.id);
                              }}
                              className="flex w-full items-center rounded-[12px] px-3 py-3 text-left text-sm font-medium text-[var(--foreground)]"
                            >
                              {markingNotificationId === notification.id ? "처리 중..." : "읽음 처리"}
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              void handleDeleteNotification(notification.id);
                            }}
                            className="flex w-full items-center rounded-[12px] px-3 py-3 text-left text-sm font-medium text-[var(--color-error)]"
                          >
                            {deletingNotificationId === notification.id ? "삭제 중..." : "삭제"}
                          </button>
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              </article>
            );

            if (notification.link) {
              return (
                <div key={notification.id} className="relative">
                  <Link href={notification.link}>{article}</Link>
                </div>
              );
            }

            return <div key={notification.id}>{article}</div>;
          })}
        </section>
      ) : null}

      {!requests.length && !notifications.length ? (
        <div className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-[var(--shadow-card)]">
          <p className="text-sm text-[var(--color-text-muted)]">아직 알림이 없어요.</p>
        </div>
      ) : null}
    </section>
  );
}

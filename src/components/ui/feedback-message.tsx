type FeedbackMessageProps = {
  type: "success" | "error";
  message: string;
};

export function FeedbackMessage({ type, message }: FeedbackMessageProps) {
  return (
    <p
      className={
        type === "success"
          ? "rounded-2xl border border-[color:rgba(34,197,94,0.3)] bg-[color:rgba(34,197,94,0.08)] px-4 py-3 text-sm text-[var(--color-success)]"
          : "rounded-2xl border border-[color:rgba(239,68,68,0.3)] bg-[color:rgba(239,68,68,0.08)] px-4 py-3 text-sm text-[var(--color-error)]"
      }
    >
      {message}
    </p>
  );
}

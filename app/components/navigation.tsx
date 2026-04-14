import { BookIconFilled, ChartIcon, SessionsIcon } from "./icons";

export function BottomNav({
  active,
  onChange,
}: {
  active: "sessions" | "techniques" | "you";
  onChange: (next: "sessions" | "techniques" | "you") => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-8 py-3 text-xs text-zinc-500">
        <button
          type="button"
          onClick={() => onChange("sessions")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "sessions" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <SessionsIcon />
          Sessions
        </button>
        <button
          type="button"
          onClick={() => onChange("techniques")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "techniques" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <BookIconFilled />
          Techniques
        </button>
        <button
          type="button"
          onClick={() => onChange("you")}
          className={`flex flex-col items-center gap-1 transition ${
            active === "you" ? "text-blue-400" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          <ChartIcon />
          You
        </button>
      </div>
    </div>
  );
}

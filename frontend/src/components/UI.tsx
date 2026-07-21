import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Full-height centered iOS screen wrapper with a soft gradient backdrop. */
export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-full w-full bg-gradient-to-b from-[#1c1c1e] via-black to-black">
      <div className="ios-screen">{children}</div>
    </div>
  );
}

export function Title({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="mb-6 mt-2">
      <h1 className="text-4xl font-bold tracking-tight">{children}</h1>
      {sub && <p className="mt-1 text-white/50">{sub}</p>}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: boolean;
  full?: boolean;
};

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  full = true,
}: ButtonProps) {
  const styles: Record<string, string> = {
    primary: "bg-ios-blue text-white",
    secondary: "bg-white/10 text-white",
    danger: "bg-ios-red text-white",
    success: "bg-ios-green text-black",
  };
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={onClick}
      disabled={disabled}
      className={`${styles[variant]} ${full ? "w-full" : ""} rounded-2xl px-6 py-4
        text-lg font-semibold shadow-card transition-opacity
        disabled:opacity-40`}
    >
      {children}
    </motion.button>
  );
}

/** iOS-style toggle switch. */
export function Toggle({
  value,
  onChange,
  label,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span className="text-[17px]">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative h-8 w-[52px] rounded-full transition-colors ${
          value ? "bg-ios-green" : "bg-white/20"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 h-6 w-6 rounded-full bg-white shadow"
          style={{ left: value ? 24 : 4 }}
        />
      </button>
    </div>
  );
}

/** Row with a - / + stepper, used for role counts. */
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 30,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}) {
  const set = (v: number) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-[17px]">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => set(value - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xl leading-none active:bg-white/20"
        >
          −
        </button>
        <span className="w-6 text-center text-lg font-semibold tabular-nums">{value}</span>
        <button
          onClick={() => set(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xl leading-none active:bg-white/20"
        >
          +
        </button>
      </div>
    </div>
  );
}

export function Divider() {
  return <div className="mx-4 h-px bg-white/10" />;
}

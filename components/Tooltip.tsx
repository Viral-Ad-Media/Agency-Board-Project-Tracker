import type { ReactNode } from "react";

type TooltipProps = {
  label: string;
  placement?: "top" | "bottom";
  children: ReactNode;
};

export function Tooltip({ label, placement = "top", children }: TooltipProps) {
  return (
    <span className={`tooltip-wrap tooltip-${placement}`} data-tooltip={label}>
      {children}
    </span>
  );
}

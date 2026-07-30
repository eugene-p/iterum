import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { sidebarListStyles } from "./sidebarList.styles";

type SidebarListButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
  children: ReactNode;
};

/** Shared hit area and selection treatment for sidebar list actions. */
export const SidebarListButton = ({
  selected = false,
  className,
  children,
  type = "button",
  ...props
}: SidebarListButtonProps) => (
  <button
    type={type}
    className={cn(sidebarListStyles.itemButton, className, selected && sidebarListStyles.selectedItem)}
    aria-current={selected ? "true" : undefined}
    {...props}
  >
    {children}
  </button>
);

import { cn } from "../../lib/cn";

type SidebarIconProps = {
  className?: string;
};

const iconClass = (className?: string, defaultSize = "size-5") =>
  cn(defaultSize, "shrink-0", className);

export const SegmentsIcon = ({ className }: SidebarIconProps) => (
  <svg
    className={iconClass(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M12 21s-6-4.35-6-10a6 6 0 1 1 12 0c0 5.65-6 10-6 10z" />
    <circle cx="12" cy="11" r="2.25" />
  </svg>
);

export const ActivitiesIcon = ({ className }: SidebarIconProps) => (
  <svg
    className={iconClass(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M4 12h3.5l2-4 3.5 8 2.5-5H20" />
  </svg>
);

export const PanelLeftOpenIcon = ({ className }: SidebarIconProps) => (
  <svg
    className={iconClass(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="m14 9 3 3-3 3" />
  </svg>
);

export const UserIcon = ({ className }: SidebarIconProps) => (
  <svg
    className={iconClass(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="8" r="3.25" />
    <path d="M5.5 19.5c.9-3.2 3.4-5 6.5-5s5.6 1.8 6.5 5" />
  </svg>
);

export const PanelLeftCloseIcon = ({ className }: SidebarIconProps) => (
  <svg
    className={iconClass(className)}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M9 3v18" />
    <path d="m11 9-3 3 3 3" />
  </svg>
);
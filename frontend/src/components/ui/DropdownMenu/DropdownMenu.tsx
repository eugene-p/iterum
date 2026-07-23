import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "../../../lib/cn";
import { Button, type ButtonSize, type ButtonVariant } from "../Button";
import { dropdownMenuStyles } from "./DropdownMenu.styles";

export type DropdownMenuItem = {
  id: string;
  label: string;
  onSelect: () => void;
  disabled?: boolean;
  variant?: "default" | "danger";
};

export type DropdownMenuGroup = {
  label?: string;
  items: DropdownMenuItem[];
};

type DropdownMenuProps = {
  triggerLabel: string;
  groups: DropdownMenuGroup[];
  disabled?: boolean;
  triggerVariant?: ButtonVariant;
  triggerSize?: ButtonSize;
  align?: "start" | "end";
  menuMinWidth?: number;
};

const MENU_OFFSET_PX = 4;

const computeMenuPlacement = (
  anchorRect: DOMRect,
  menuWidth: number,
  menuHeight: number,
  align: "start" | "end",
) => {
  let left = align === "end" ? anchorRect.right - menuWidth : anchorRect.left;
  left = Math.max(12, Math.min(left, window.innerWidth - menuWidth - 12));

  let top = anchorRect.bottom + MENU_OFFSET_PX;
  if (top + menuHeight > window.innerHeight - 12) {
    top = Math.max(12, anchorRect.top - menuHeight - MENU_OFFSET_PX);
  }

  return { top, left };
};

export const DropdownMenu = ({
  triggerLabel,
  groups,
  disabled = false,
  triggerVariant = "default",
  triggerSize = "sm",
  align = "end",
  menuMinWidth = 160,
}: DropdownMenuProps) => {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const close = () => {
    setOpen(false);
    setPlacement(null);
  };

  useLayoutEffect(() => {
    if (!open) return;

    const anchor = triggerRef.current;
    const menu = menuRef.current;
    if (!anchor) return;

    const anchorRect = anchor.getBoundingClientRect();
    const menuWidth = Math.max(menuMinWidth, menu?.offsetWidth ?? menuMinWidth);
    const menuHeight = menu?.offsetHeight ?? 0;
    setPlacement(computeMenuPlacement(anchorRect, menuWidth, menuHeight, align));
  }, [align, menuMinWidth, open, groups]);

  useEffect(() => {
    if (!open) return;

    const syncPlacement = () => {
      const anchor = triggerRef.current;
      const menu = menuRef.current;
      if (!anchor) return;

      const anchorRect = anchor.getBoundingClientRect();
      const menuWidth = Math.max(menuMinWidth, menu?.offsetWidth ?? menuMinWidth);
      const menuHeight = menu?.offsetHeight ?? 0;
      setPlacement(computeMenuPlacement(anchorRect, menuWidth, menuHeight, align));
    };

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      close();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", syncPlacement);
    window.addEventListener("scroll", syncPlacement, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", syncPlacement);
      window.removeEventListener("scroll", syncPlacement, true);
    };
  }, [align, menuMinWidth, open]);

  const handleSelect = (item: DropdownMenuItem) => {
    if (item.disabled) return;
    close();
    item.onSelect();
  };

  const hasItems = groups.some((group) => group.items.length > 0);
  if (!hasItems) return null;

  return (
    <>
      <Button
        ref={triggerRef}
        variant={triggerVariant}
        size={triggerSize}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={dropdownMenuStyles.triggerContent}>
          {triggerLabel}
          <span className={dropdownMenuStyles.chevron} aria-hidden="true">
            ▾
          </span>
        </span>
      </Button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={menuId}
            role="menu"
            aria-label={triggerLabel}
            className={dropdownMenuStyles.menu}
            style={{
              top: placement?.top ?? -9999,
              left: placement?.left ?? -9999,
              minWidth: menuMinWidth,
              visibility: placement ? "visible" : "hidden",
            }}
          >
            {groups.map((group, groupIndex) => (
              <div key={group.label ?? `group-${groupIndex}`} role="none">
                {groupIndex > 0 && <div className={dropdownMenuStyles.divider} role="separator" />}
                {group.label && (
                  <div className={dropdownMenuStyles.groupLabel} role="presentation">
                    {group.label}
                  </div>
                )}
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    className={cn(
                      dropdownMenuStyles.item,
                      item.variant === "danger" && dropdownMenuStyles.itemDanger,
                    )}
                    onClick={() => handleSelect(item)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
};
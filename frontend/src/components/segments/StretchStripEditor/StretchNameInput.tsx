import { useEffect, useState } from "react";
import { stretchStripEditorStyles as styles } from "./StretchStripEditor.styles";

type StretchNameInputProps = {
  /** Array position of the stretch (stable rename target). */
  arrayIndex: number;
  /** Current committed name from draft/baseline. */
  name: string | null | undefined;
  placeholder: string;
  ariaLabel: string;
  onRename: (arrayIndex: number, name: string) => void;
  onActivate?: () => void;
};

/**
 * Controlled name field with local draft so keystrokes stay on this row
 * even when parent re-renders / selection changes mid-edit.
 */
export const StretchNameInput = ({
  arrayIndex,
  name,
  placeholder,
  ariaLabel,
  onRename,
  onActivate,
}: StretchNameInputProps) => {
  const [focused, setFocused] = useState(false);
  const [local, setLocal] = useState(name ?? "");

  // Sync from parent only when not actively typing.
  useEffect(() => {
    if (!focused) setLocal(name ?? "");
  }, [name, focused]);

  return (
    <input
      className={styles.workspaceListNameInput}
      value={local}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onClick={(event) => event.stopPropagation()}
      onFocus={() => {
        setFocused(true);
        setLocal(name ?? "");
        onActivate?.();
      }}
      onChange={(event) => {
        const next = event.target.value;
        setLocal(next);
        onRename(arrayIndex, next);
      }}
      onBlur={() => {
        setFocused(false);
        const trimmed = local.trim();
        setLocal(trimmed);
        onRename(arrayIndex, trimmed);
      }}
    />
  );
};

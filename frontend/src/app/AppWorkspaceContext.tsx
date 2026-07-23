import type { ReactNode } from "react";
import { AppWorkspaceContext } from "./appWorkspaceContextStore";
import { useAppShell } from "./useAppShell";

export const AppWorkspaceProvider = ({ children }: { children: ReactNode }) => {
  const value = useAppShell();
  return <AppWorkspaceContext.Provider value={value}>{children}</AppWorkspaceContext.Provider>;
};


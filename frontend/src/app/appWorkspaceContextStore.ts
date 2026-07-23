import { createContext } from "react";
import type { AppWorkspaceValue } from "./appWorkspaceContextValue";

export const AppWorkspaceContext = createContext<AppWorkspaceValue | null>(null);
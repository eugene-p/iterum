import { useContext } from "react";
import { AppWorkspaceContext } from "./appWorkspaceContextStore";

export const useAppWorkspace = () => {
  const context = useContext(AppWorkspaceContext);
  if (!context) {
    throw new Error("useAppWorkspace must be used within AppWorkspaceProvider");
  }
  return context;
};
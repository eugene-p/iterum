import type { ReactNode } from "react";
import { cn } from "../../../lib/cn";
import { Spinner } from "../Spinner";
import { loadingStateStyles } from "./LoadingState.styles";

type LoadingStateProps = {
  message: ReactNode;
  className?: string;
};

export const LoadingState = ({ message, className }: LoadingStateProps) => (
  <div className={cn(loadingStateStyles.root, className)}>
    <Spinner />
    <span>{message}</span>
  </div>
);
import {
  createContext,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "../../../lib/cn";
import { tabsStyles } from "./Tabs.styles";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
  ariaLabel: string;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs compound components must be used within <Tabs>");
  return context;
};

export type TabsProps<T extends string = string> = {
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  "aria-label": string;
  children: ReactNode;
  className?: string;
};

export const Tabs = <T extends string = string>({
  value: valueProp,
  defaultValue,
  onValueChange,
  "aria-label": ariaLabel,
  children,
  className,
}: TabsProps<T>) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? ("" as T));
  const isControlled = valueProp !== undefined;
  const value = (isControlled ? valueProp : uncontrolledValue) as string;
  const baseId = useId();

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setUncontrolledValue(next as T);
      onValueChange?.(next as T);
    },
    [isControlled, onValueChange],
  );

  const context = useMemo(
    () => ({ value, setValue, ariaLabel, baseId }),
    [value, setValue, ariaLabel, baseId],
  );

  return (
    <TabsContext.Provider value={context}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
};

type TabsListProps = {
  children: ReactNode;
  className?: string;
};

const TabsList = ({ children, className }: TabsListProps) => {
  const { ariaLabel } = useTabsContext();
  return (
    <div className={cn(tabsStyles.list, className)} role="tablist" aria-label={ariaLabel}>
      {children}
    </div>
  );
};

type TabsTriggerProps<T extends string = string> = {
  value: T;
  children: ReactNode;
  className?: string;
};

const TabsTrigger = <T extends string = string>({
  value,
  children,
  className,
}: TabsTriggerProps<T>) => {
  const { value: activeValue, setValue, baseId } = useTabsContext();
  const active = value === activeValue;
  const panelId = `${baseId}-panel-${value}`;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={active}
      aria-controls={panelId}
      className={cn(tabsStyles.tab(active), className)}
      onClick={() => setValue(value)}
    >
      {children}
    </button>
  );
};

type TabsPanelProps<T extends string = string> = {
  value: T;
  children: ReactNode;
  className?: string;
};

const TabsPanel = <T extends string = string>({ value, children, className }: TabsPanelProps<T>) => {
  const { value: activeValue, baseId } = useTabsContext();
  if (value !== activeValue) return null;

  const panelId = `${baseId}-panel-${value}`;
  const triggerId = `${baseId}-trigger-${value}`;

  return (
    <div
      role="tabpanel"
      id={panelId}
      aria-labelledby={triggerId}
      className={cn(tabsStyles.panel, className)}
    >
      {children}
    </div>
  );
};

Tabs.List = TabsList;
Tabs.Trigger = TabsTrigger;
Tabs.Panel = TabsPanel;
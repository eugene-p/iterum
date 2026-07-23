import { Input } from "../ui";
import { sidebarListStyles } from "./sidebarList.styles";
import { formatSidebarListCount } from "./sidebarListUtils";

type SidebarListToolbarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  visibleCount: number;
  totalCount: number;
  itemNoun: string;
};

export const SidebarListToolbar = ({
  value,
  onChange,
  placeholder,
  visibleCount,
  totalCount,
  itemNoun,
}: SidebarListToolbarProps) => (
  <div className={sidebarListStyles.toolbar}>
    <Input
      className={sidebarListStyles.search}
      type="search"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    <span className={sidebarListStyles.listCount}>
      {formatSidebarListCount(visibleCount, totalCount, itemNoun)}
    </span>
  </div>
);
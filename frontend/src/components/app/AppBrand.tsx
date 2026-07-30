import { APP_NAME, APP_TAGLINE } from "../../lib/brandingConstants";
import { appBrandStyles } from "./AppBrand.styles";

type AppBrandProps = {
  compact?: boolean;
};

export const AppBrand = ({ compact = false }: AppBrandProps) => (
  <div className={appBrandStyles.root(compact)}>
    {compact ? (
      <span className={appBrandStyles.name(compact)}>{APP_NAME}</span>
    ) : (
      <h1 className={appBrandStyles.name(compact)}>{APP_NAME}</h1>
    )}
    <p className={appBrandStyles.tagline(compact)}>{APP_TAGLINE}</p>
  </div>
);

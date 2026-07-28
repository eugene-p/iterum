import { APP_NAME, APP_TAGLINE } from "../../lib/brandingConstants";
import { appBrandStyles } from "./AppBrand.styles";

export const AppBrand = () => (
  <div className={appBrandStyles.root}>
    <h1 className={appBrandStyles.name}>{APP_NAME}</h1>
    <p className={appBrandStyles.tagline}>{APP_TAGLINE}</p>
  </div>
);

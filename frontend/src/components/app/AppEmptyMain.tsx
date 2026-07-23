import { appStyles } from "../../App.styles";
import { EmptySurface, MutedText } from "../ui";

export const AppEmptyMain = () => (
  <EmptySurface className={appStyles.emptyMain}>
    <h2>Select a segment or activity</h2>
    <MutedText>
      Choose a segment or activity from the sidebar, or upload a route in the Activities tab.
    </MutedText>
  </EmptySurface>
);
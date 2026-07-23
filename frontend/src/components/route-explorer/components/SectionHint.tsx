import { HintButton } from "../../ui";

type SectionHintProps = {
  text: string;
};

export const SectionHint = ({ text }: SectionHintProps) => <HintButton text={text} />;
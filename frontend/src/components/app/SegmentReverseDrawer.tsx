import { useEffect, useState } from "react";
import type { Segment } from "../../types";
import { Button, Drawer, ErrorText, Field, Input } from "../ui";
import { entityEditDrawerStyles } from "./entityEditDrawerStyles";

const SEGMENT_REVERSE_FORM_ID = "segment-reverse-form";

type SegmentReverseDrawerProps = {
  open: boolean;
  segment: Segment;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (segmentId: number, name: string) => void;
};

export const SegmentReverseDrawer = ({
  open,
  segment,
  loading,
  error,
  onClose,
  onCreate,
}: SegmentReverseDrawerProps) => {
  const [nameDraft, setNameDraft] = useState(`${segment.name} (reversed)`);

  useEffect(() => {
    if (!open) return;
    setNameDraft(`${segment.name} (reversed)`);
  }, [open, segment.name]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Reverse"
      footer={
        <div className={entityEditDrawerStyles.footerActions}>
          <Button type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            form={SEGMENT_REVERSE_FORM_ID}
            variant="primary"
            disabled={loading || !nameDraft.trim()}
          >
            Create
          </Button>
        </div>
      }
    >
      <form
        id={SEGMENT_REVERSE_FORM_ID}
        className={entityEditDrawerStyles.scrollForm}
        onSubmit={(e) => {
          e.preventDefault();
          if (!nameDraft.trim()) return;
          onCreate(segment.id, nameDraft.trim());
        }}
      >
        <Field label="Name">
          <Input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            placeholder="Reversed segment name"
            autoFocus
          />
        </Field>
        {error && <ErrorText>{error}</ErrorText>}
      </form>
    </Drawer>
  );
};

import { useEffect, useState } from "react";
import { useCreateProfileMutation } from "../../queries/profiles";
import { Button, ErrorText, Field, Input, Modal, ModalHeader, Stack } from "../ui";
import { profileModalStyles } from "./profileModalStyles";

type CreateProfileModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated?: (profileId: number) => void;
};

export const CreateProfileModal = ({ open, onClose, onCreated }: CreateProfileModalProps) => {
  const createMutation = useCreateProfileMutation();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setError(null);
  }, [open]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setError(null);
    try {
      const profile = await createMutation.mutateAsync(trimmed);
      onCreated?.(profile.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Modal open={open} onClose={onClose} panelClassName={profileModalStyles.panel}>
      <ModalHeader title="New profile" onClose={onClose} />
      <div className={profileModalStyles.body}>
        <Stack>
          <p className="text-sm text-muted">
            Activities belong to a profile. Segments are shared across profiles.
          </p>
          {error && <ErrorText>{error}</ErrorText>}
          <Field label="Profile name" className="gap-1 text-sm">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Road cycling"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreate();
              }}
            />
          </Field>
          <div className={profileModalStyles.footer}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => void handleCreate()}
              disabled={createMutation.isPending || !name.trim()}
            >
              Create profile
            </Button>
          </div>
        </Stack>
      </div>
    </Modal>
  );
};

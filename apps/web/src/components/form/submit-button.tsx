import { useSelector } from "@tanstack/react-store";
import type { ButtonProps } from "../ui/button";
import { Button } from "../ui/button";
import { Spinner } from "../ui/spinner";
import { useFormContext } from ".";

export function SubmitButton(props: ButtonProps) {
  const form = useFormContext();
  const [isSubmitting, canSubmit] = useSelector(form.store, (state) => [
    state.isSubmitting,
    state.canSubmit,
  ]);

  return (
    <Button type="submit" {...props} disabled={!canSubmit || isSubmitting || props.disabled}>
      {props.children}
      {isSubmitting && <Spinner data-icon="inline-start" />}
    </Button>
  );
}

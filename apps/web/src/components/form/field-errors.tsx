import type { AnyFieldMeta } from "@tanstack/react-form";
import type { ZodError } from "zod";

interface FieldErrorsProps {
  meta: AnyFieldMeta;
}
export function FieldErrors(props: FieldErrorsProps) {
  if (!props.meta.isTouched) return null;

  return props.meta.errors.map(({ message }: ZodError, index) => (
    <p key={index} className="font-medium text-destructive text-sm">
      {message}
    </p>
  ));
}

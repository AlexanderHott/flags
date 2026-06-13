import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import type { InputProps } from "../ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";
import { useFieldContext } from ".";

interface TextFieldProps extends InputProps {
  label: string;
  description?: string;
  startAddon?: ReactNode;
  endAddon?: ReactNode;
}

export function TextField(props: TextFieldProps) {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { label, description, startAddon, endAddon, ...rest } = props;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <InputGroup>
        {startAddon && <InputGroupAddon>{startAddon}</InputGroupAddon>}
        <InputGroupInput
          id={field.name}
          name={field.name}
          value={field.state.value ?? ""}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          aria-invalid={isInvalid}
          autoComplete="off"
          {...rest}
        />
        {endAddon && <InputGroupAddon align="inline-end">{endAddon}</InputGroupAddon>}
      </InputGroup>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

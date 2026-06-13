import { Field, FieldDescription, FieldError, FieldLabel } from "../ui/field";
import { useFieldContext } from ".";
import { Switch, type SwitchProps } from "../ui/switch";

interface SwitchFieldProps extends SwitchProps {
  label: string;
  description?: string;
}

export function SwitchField(props: SwitchFieldProps) {
  const field = useFieldContext<boolean>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  const { label, description, ...rest } = props;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        onBlur={field.handleBlur}
        aria-invalid={isInvalid}
        {...rest}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
}

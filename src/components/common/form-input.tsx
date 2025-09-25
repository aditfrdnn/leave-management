import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export default function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  disabled,
  readonly,
  type = "text",
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  type?: string;
}) {
  return (
    <FormField
      name={name}
      control={form.control}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                {...field}
                disabled={disabled || false}
                className="resize-none rounded-lg"
                autoComplete="off"
                readOnly={readonly}
                placeholder={placeholder}
              />
            ) : (
              <Input
                type={type}
                {...field}
                disabled={disabled || false}
                autoFocus={false}
                readOnly={readonly}
                autoComplete="off"
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage className="text-xs italic" />
        </FormItem>
      )}
    />
  );
}

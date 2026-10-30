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
  readOnly,
  isRequired,
  type = "text",
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  type?: string;
  isRequired?: boolean;
}) {
  return (
    <FormField
      name={name}
      control={form.control}
      disabled={disabled}
      render={({ field: { ...rest } }) => (
        <FormItem className="gap-1.5">
          {label && <FormLabel>{label}{isRequired && <span className="text-destructive -ml-1">*</span>}</FormLabel>}
          <FormControl>
            {type === "textarea" ? (
              <Textarea
                {...rest}
                className="resize-none min-h-26 rounded-lg"
                rows={10}
                autoComplete="off"
                readOnly={readOnly}
                placeholder={placeholder}
              />
            ) : (
              <Input
                type={type}
                {...rest}
                autoFocus={false}
                readOnly={readOnly}
                autoComplete="off"
                className="rounded-lg"
                placeholder={placeholder}
              />
            )}
          </FormControl>
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

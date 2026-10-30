import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import { MultiSelect } from "../ui/multi-select";

export default function FormMultiSelect<T extends FieldValues>({
  form,
  name,
  label,
  placeholder,
  disabled,
  variant,
  options,
  onValueChange,
  hideSelectAll,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  variant?:
  | "default"
  | "destructive"
  | "secondary"
  | "inverted"
  | null
  | undefined;
  options: { value: string; label: string; hint?: string }[];
  onValueChange: (value: string[]) => void;
  hideSelectAll?: boolean;
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MultiSelect
              {...field}
              disabled={disabled}
              options={options}
              defaultValue={field.value}
              onValueChange={onValueChange}
              placeholder={placeholder}
              variant={variant || "default"}
              animation={2}
              maxCount={100}
              modalPopover
              hideSelectAll={hideSelectAll}
            />
          </FormControl>
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

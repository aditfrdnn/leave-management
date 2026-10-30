import { FieldValues, Path, UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Switch } from "../ui/switch";

export default function FormSwitch<T extends FieldValues>({
  form,
  name,
  label,
  disabled,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      name={name}
      control={form.control}
      disabled={disabled}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border px-3 py-2">
          <FormLabel className="text-sm font-normal">{label}</FormLabel>
          <FormControl>
            <Switch
              checked={!!field.value}
              disabled={disabled}
              onCheckedChange={field.onChange}
            />
          </FormControl>
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

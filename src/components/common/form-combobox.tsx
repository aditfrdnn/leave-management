import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { ReactNode } from "react";
import ComboBox from "../ui/combobox";

export default function FormComboBox<T extends FieldValues>({
  form,
  name,
  label,
  disabled,
  isError,
  emptyLabel,
  hint,
  items,
  onSelect,
  open,
  onOpenChange,
  searchLabel,
  isRequired,
  value,
}: {
  form: UseFormReturn<T>;
  name: Path<T>;
  label: string;
  disabled: boolean;
  isError?: boolean;
  emptyLabel: string;
  hint: string;
  items: { value: string; label: string | ReactNode }[];
  onSelect: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchLabel: string;
  value?: string;
  isRequired?: boolean;
}) {
  return (
    <FormField
      name={name}
      control={form.control}
      disabled={disabled}
      render={({ field }) => (
        <FormItem className="gap-1.5">
          {label && <FormLabel>{label}{isRequired && <span className="text-destructive -ml-1">*</span>}</FormLabel>}
          <FormControl>
            <ComboBox
              {...field}
              isError={isError}
              disabled={disabled}
              emptyLabel={emptyLabel}
              hint={hint}
              items={items}
              onSelect={onSelect}
              open={open}
              onOpenChange={onOpenChange}
              searchLabel={searchLabel}
              value={value}
            />
          </FormControl>
          <FormMessage className="-mt-1 text-xs italic" />
        </FormItem>
      )}
    />
  );
}

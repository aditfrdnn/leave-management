import { FieldValues, Path, PathValue, UseFormReturn } from "react-hook-form";
import { useTranslations } from "next-intl";

import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../ui/select";

export default function FormSelect<T extends FieldValues>({
    form,
    name,
    label,
    placeholder,
    items,
    disabled,
    isRequired,
    isClearable,
}: {
    form: UseFormReturn<T>;
    name: Path<T>;
    label?: string;
    placeholder?: string;
    items: { value: string; label: string }[];
    disabled?: boolean;
    isRequired?: boolean;
    /** Shows a "Clear" action once a value is picked — for optional selects. */
    isClearable?: boolean;
}) {
    const t = useTranslations("common");

    return (
        <FormField
            name={name}
            control={form.control}
            disabled={disabled}
            render={({ field }) => (
                <FormItem className="gap-1.5">
                    {(label || isClearable) && (
                        <div className="flex items-center justify-between gap-2">
                            {label && (
                                <FormLabel>
                                    {label}
                                    {isRequired && (
                                        <span className="-ml-1 text-destructive">*</span>
                                    )}
                                </FormLabel>
                            )}
                            {isClearable && field.value && !disabled && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        form.setValue(name, "" as PathValue<T, Path<T>>, {
                                            shouldDirty: true,
                                            shouldValidate: true,
                                        })
                                    }
                                    className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                                    aria-label={label ? t("formSelect.clearLabel", { label }) : t("formSelect.clearSelection")}
                                >
                                    {t("actions.clear")}
                                </button>
                            )}
                        </div>
                    )}
                    <Select
                        value={field.value ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        disabled={disabled}
                    >
                        <FormControl>
                            <SelectTrigger className="w-full rounded-lg">
                                <SelectValue placeholder={placeholder} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage className="-mt-1 text-xs italic" />
                </FormItem>
            )}
        />
    );
}

import { FieldValues, Path, UseFormReturn } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "../ui/form";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { useTranslations } from "next-intl";
import { useDateLocale } from "@/hooks/use-date-locale";
import { Calendar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

export default function FormCalendar<T extends FieldValues>({
    form,
    name,
    label,
    disabled,
    isRequired,
    onSelect,
    open,
    onOpenChange,
}: {
    form: UseFormReturn<T>;
    name: Path<T>;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    isRequired?: boolean;
    onSelect: (value: Date | undefined) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const t = useTranslations("common.formCalendar");
    const dateLocale = useDateLocale();

    return (
        <FormField
            name={name}
            control={form.control}
            disabled={disabled}
            render={({ field: { ...rest } }) => (
                <FormItem className="gap-1.5 w-full">
                    {label && <FormLabel>{label}{isRequired && <span className="text-destructive -ml-1">*</span>}</FormLabel>}
                    <FormControl>
                        <Popover open={open} onOpenChange={onOpenChange}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    data-empty={!rest.value}
                                    className="w-full rounded-lg justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
                                >
                                    <HugeiconsIcon icon={Calendar01Icon} />
                                    {rest.value ? format(new Date(rest.value), "dd MMMM yyyy", { locale: dateLocale }) : <span>{t("placeholder")}</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={rest.value ? new Date(rest.value) : undefined}
                                    onSelect={onSelect}
                                    captionLayout="dropdown"
                                />
                            </PopoverContent>
                        </Popover>
                    </FormControl>
                    <FormMessage className="-mt-1 text-xs italic" />
                </FormItem>
            )}
        />
    );
}

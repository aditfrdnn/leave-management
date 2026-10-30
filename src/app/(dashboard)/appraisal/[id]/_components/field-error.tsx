import { useTranslateMessage } from "@/hooks/use-translate-message";
import { cn } from "@/lib/utils/utils";

/** An inline answer error; `data-appraisal-error` lets the form scroll to the first one. */
export default function FieldError({ id, message, className }: { id?: string; message?: string; className?: string }) {
  const translateMessage = useTranslateMessage();

  if (!message) return null;

  return (
    <p id={id} data-appraisal-error className={cn("text-xs text-destructive italic", className)}>
      {translateMessage(message)}
    </p>
  );
}

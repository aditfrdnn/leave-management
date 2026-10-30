import { useTranslations } from "next-intl";
import { Loading03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@/components/ui/hugeicons-icon";

export default function LoadingButton() {
  const t = useTranslations("common.states");

  return (
    <div className="flex items-center gap-2">
      <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
      {t("loading")}
    </div>
  );
}

import { Loading03Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@/components/ui/hugeicons-icon'
import { useTranslations } from 'next-intl'

export default function SpinnerLoading({ label, className, color, fontSize }: {
    label?: string,
    className?: string,
    color?: string,
    fontSize?: string
}) {
    const t = useTranslations('common.spinner')

    return (
        <div className={`w-full h-full flex items-center justify-center gap-1 ${className || ''} ${color || ''}`}>
            <HugeiconsIcon icon={Loading03Icon} className="animate-spin" />
            <p className={`text-muted-foreground ${color || ''} ${fontSize || 'text-sm'}`}>
                {label || t('loadingCharts')}
            </p>
        </div>
    )
}

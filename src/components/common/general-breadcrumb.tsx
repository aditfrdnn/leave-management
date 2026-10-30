"use client"

import Link from "next/link"
import { Fragment, Suspense } from "react"
import { useParams, usePathname } from "next/navigation"
import { useTranslations } from "next-intl"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { getActiveModule } from "@/constants/app-module-constant"
import { cn } from "@/lib/utils/utils"

type GeneralBreadcrumbProps = {
    className?: string;
    labelMap?: Record<string, string>;
}

function toTitleCase(value: string) {
    return value
        .split("-")
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
}

function getDynamicSegmentValues(params: ReturnType<typeof useParams>) {
    return new Set(
        Object.values(params).flatMap((value) =>
            Array.isArray(value) ? value.map(String) : [String(value)]
        )
    )
}

function GeneralBreadcrumbContent({
    className,
    labelMap = {},
}: GeneralBreadcrumbProps) {
    const pathname = usePathname()
    const params = useParams()
    const dynamicSegmentValues = getDynamicSegmentValues(params)
    const t = useTranslations("nav")
    const activeModule = getActiveModule(pathname)
    const segments = pathname
        .split("/")
        .filter(Boolean)
        .map((segment) => decodeURIComponent(segment))
    // The module crumb already names a module root that has no page of its own ("document-builder").
    const rootPath = `/${segments[0] ?? ""}`
    const firstVisible = activeModule.basePaths.includes(rootPath)
        && !activeModule.menus.some((menu) => menu.href === rootPath) ? 1 : 0
    const segmentLabel = (segment: string) => {
        const key = `segments.${segment}` as Parameters<typeof t>[0]
        return t.has(key) ? t(key) : toTitleCase(segment)
    }

    if (segments.length === 0) {
        return null
    }

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild className="text-sm font-semibold hover:text-primary/85 transition-colors duration-200 text-primary">
                        <Link href={activeModule.href}>{t(`modules.${activeModule.titleKey}`)}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {segments.length > firstVisible && <BreadcrumbSeparator />}
                {segments.map((segment, index) => {
                    if (index < firstVisible) return null

                    const href = `/${segments
                        .slice(0, index + 1)
                        .map((value) => encodeURIComponent(value))
                        .join("/")}`
                    const isLast = index === segments.length - 1
                    const isDynamic = dynamicSegmentValues.has(segment)
                    const label = labelMap[segment] || (isDynamic ? segment : segmentLabel(segment))

                    return (
                        <Fragment key={`${href}-${segment}`}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className={cn("text-sm text-muted-foreground", {
                                        "uppercase": label.includes("-"),
                                    })}>{label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild className={cn("text-sm font-medium hover:text-primary/85 transition-colors duration-200 text-primary", !isDynamic && "capitalize")}>
                                        <Link href={href}>{label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    )
                })}
            </BreadcrumbList>
        </Breadcrumb>
    )
}

export default function GeneralBreadcrumb(props: GeneralBreadcrumbProps) {
    return (
        <Suspense fallback={<div className="h-5 w-40 rounded bg-muted" />}>
            <GeneralBreadcrumbContent {...props} />
        </Suspense>
    )
}

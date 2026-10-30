import { ReactNode } from "react";

// Health Variant
export type TBadgeVariant = "destructive" | "warning" | "link" | "default" | "outline" | "secondary" | "ghost" | null | undefined

export function getHealthVariant(value: number) {
    if (value < 65) {
        return {
            label: "Poor",
            badgeVariant: "destructive" as TBadgeVariant,
            iconClassName: "text-destructive bg-destructive/10 text-destructive",
            textClassName: "text-destructive",
            progressClassName: "bg-destructive/5",
            progressIndicatorClassName: "bg-destructive"
        };
    } else if (value > 65 && value < 75) {
        return {
            label: "Bad",
            badgeVariant: "warning" as TBadgeVariant,
            iconClassName: "text-yellow-strong bg-yellow/10",
            textClassName: "text-yellow-strong",
            progressClassName: "bg-yellow/5",
            progressIndicatorClassName: "bg-yellow"
        }
    } else {
        return {
            label: "Good",
            badgeVariant: "success" as TBadgeVariant,
            iconClassName: "text-green-strong bg-green/10",
            textClassName: "text-green-strong",
            progressClassName: "bg-green/5",
            progressIndicatorClassName: "bg-green"
        }
    }
}

// Risk Level Variant
export function getRiskLevelVariant(value: string | undefined) {
    switch (value?.toLowerCase()) {
        case "low":
            return {
                textColor: "text-green-strong",
                backgroundColor: "bg-green"
            }
        case "medium":
            return {
                textColor: "text-yellow-strong",
                backgroundColor: "bg-yellow"
            }
        case "high":
            return {
                textColor: "text-destructive",
                backgroundColor: "bg-destructive"
            }
        case "critical":
            return {
                textColor: "text-destructive",
                backgroundColor: "bg-destructive"
            }
        default:
            return {
                textColor: "",
                backgroundColor: ""
            }
    }
}

// Confidence Score Variant
export function getConfidenceScoreVariant(value: number | undefined) {
    if (value && value < 65) {
        return {
            textColor: "text-destructive",
            backgroundColor: "bg-destructive/10"
        }
    } else if (value && value > 65 && value < 75) {
        return {
            textColor: "text-yellow-strong",
            backgroundColor: "bg-yellow/10"
        }
    } else {
        return {
            textColor: "text-green-strong",
            backgroundColor: "bg-green/10"
        }
    }
}

export type ModuleTone = "blue" | "green" | "purple" | "orange" | "yellow" | "red";

export type ModuleItem = {
    title: string;
    description: string;
    status: string;
    icon: ReactNode;
    tone: ModuleTone;
    href: string;
};

export const toneStyles: Record<
    ModuleTone,
    {
        icon: string;
        chip: string;
        action: string;
    }
> = {
    blue: {
        icon: "bg-blue-100 text-primary dark:bg-blue-500/15",
        chip: "bg-blue-100 text-primary dark:bg-blue-500/15",
        action: "bg-blue-100 text-primary dark:bg-blue-500/15",
    },
    green: {
        icon: "bg-green/10 text-green-strong dark:bg-green/15",
        chip: "bg-green/10 text-green-strong dark:bg-green/15",
        action:
            "bg-green/5 text-green-strong dark:bg-green/15",
    },
    purple: {
        icon: "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
        chip: "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
        action:
            "bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
    },
    orange: {
        icon: "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
        chip: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
        action:
            "bg-orange-100 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
    },
    yellow: {
        icon: "bg-yellow/12 text-yellow-strong dark:bg-yellow/15",
        chip: "bg-yellow/12 text-yellow-strong dark:bg-yellow/15",
        action:
            "bg-yellow/12 text-yellow-strong dark:bg-yellow/15",
    },
    red: {
        icon: "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
        chip: "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
        action:
            "bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive",
    },
};
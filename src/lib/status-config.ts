import {
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  Edit02Icon,
  File02Icon,
  ViewIcon,
} from "@hugeicons/core-free-icons";
import { type IconSvgElement } from "@hugeicons/react";

import { LEAVE_STATUS } from "@/constants/leave-constant";

export type StatusConfig = {
  className: string;
  icon: IconSvgElement;
  /** Full message key for the label, translated where it renders: `t(config.labelKey)`. */
  labelKey:
    | "leave.status.draft"
    | "leave.status.cancelled"
    | "leave.status.pending"
    | "leave.status.approved"
    | "leave.status.rejected"
    | "leave.status.revised"
    | "leave.status.reviewed";
};

/** One tone per leave status, built from the app tokens only. */
export const getLeaveStatusConfig = (status: number): StatusConfig => {
  switch (status) {
    case LEAVE_STATUS.APPROVED:
      return { className: "border-none bg-green/10 text-green-strong", icon: CheckmarkCircle02Icon, labelKey: "leave.status.approved" };
    case LEAVE_STATUS.REJECTED:
      return { className: "border-none bg-destructive/10 text-destructive", icon: Cancel01Icon, labelKey: "leave.status.rejected" };
    case LEAVE_STATUS.CANCELLED:
      return { className: "border-none bg-muted text-muted-foreground", icon: Cancel01Icon, labelKey: "leave.status.cancelled" };
    case LEAVE_STATUS.DRAFT:
      return { className: "border-none bg-muted text-muted-foreground", icon: File02Icon, labelKey: "leave.status.draft" };
    case LEAVE_STATUS.REVISED:
      return { className: "border-none bg-yellow/12 text-yellow-strong", icon: Edit02Icon, labelKey: "leave.status.revised" };
    case LEAVE_STATUS.REVIEWED:
      return { className: "border-none bg-primary/10 text-primary", icon: ViewIcon, labelKey: "leave.status.reviewed" };
    case LEAVE_STATUS.PENDING:
    default:
      return { className: "border-none bg-yellow/12 text-yellow-strong", icon: Clock01Icon, labelKey: "leave.status.pending" };
  }
};

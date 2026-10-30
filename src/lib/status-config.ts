import { CheckmarkCircle02Icon, Clock01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { type IconSvgElement } from "@hugeicons/react";

import { LEAVE_STATUS } from "@/constants/leave-constant";

export type StatusConfig = {
  className: string;
  icon: IconSvgElement;
  /** Full message key for the label, translated where it renders: `t(config.labelKey)`. */
  labelKey: "leave.status.pending" | "leave.status.approved" | "leave.status.rejected";
};

/** One tone per leave status, built from the app tokens only. */
export const getLeaveStatusConfig = (status: number): StatusConfig => {
  switch (status) {
    case LEAVE_STATUS.APPROVED:
      return { className: "border-none bg-green/10 text-green-strong", icon: CheckmarkCircle02Icon, labelKey: "leave.status.approved" };
    case LEAVE_STATUS.REJECTED:
      return { className: "border-none bg-destructive/10 text-destructive", icon: Cancel01Icon, labelKey: "leave.status.rejected" };
    case LEAVE_STATUS.PENDING:
    default:
      return { className: "border-none bg-yellow/12 text-yellow-strong", icon: Clock01Icon, labelKey: "leave.status.pending" };
  }
};

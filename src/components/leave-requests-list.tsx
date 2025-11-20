"use client";

import { format } from "date-fns";
import {
  CalendarPlus,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Hourglass,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeaveRequest } from "@/lib/types";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface PropTypes {
  data: LeaveRequest[];
  isLoading: boolean;
}

export function LeaveRequestsList(props: PropTypes) {
  const { isLoading, data } = props;

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border rounded-md">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-6 w-1/4 hidden md:block" />
              <Skeleton className="h-6 w-1/4" />
            </div>
          ))}
        </div>
      );
    }

    if (data && data.length === 0) {
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold font-headline">
            No Leave Requests Yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Submit a leave request to see your history here.
          </p>
        </div>
      );
    }

    const getStatusConfig = (statusCode: number) => {
      const statusMap: Record<
        number,
        {
          label: string;
          variant: "default" | "secondary" | "destructive" | "outline";
        }
      > = {
        0: {
          label: "Pending",
          variant: "secondary",
        },
        1: {
          label: "Approved",
          variant: "default",
        },
        2: {
          label: "Rejected",
          variant: "destructive",
        },
      };
      return statusMap[statusCode] || statusMap[0];
    };

    return (
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>LVR No.</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead className="text-right">Actions</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.map((request: LeaveRequest) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">{request.subject}</TableCell>
                <TableCell className="font-medium">
                  {format(request?.start_date, "dd-MM-yyyy")} -{" "}
                  {format(request?.end_date, "dd-MM-yyyy")}
                </TableCell>
                <TableCell
                  className="hidden max-w-[250px] truncate md:table-cell"
                  title={request.reason}
                >
                  {request.reason}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      getStatusConfig(request.status)?.variant || "default"
                    }
                    className="w-fit"
                  >
                    <span>{getStatusConfig(request.status)?.label}</span>
                  </Badge>
                </TableCell>
                {/* <TableCell className="text-right">
                  {request.status === 1 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadIcsFile(request)}
                        >
                          <CalendarPlus className="h-4 w-4" />
                          <span className="sr-only">Add to Calendar</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add to Calendar</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    );
  };

  return (
    <Card
      className={cn("shadow-lg overflow-y-auto", {
        "max-h-[400px] w-full": data?.length > 0,
      })}
    >
      <CardHeader>
        <CardTitle className="font-headline text-2xl">
          My Leave History
        </CardTitle>
      </CardHeader>
      <CardContent>{renderContent()}</CardContent>
    </Card>
  );
}

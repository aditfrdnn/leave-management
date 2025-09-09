"use client"

import { format } from "date-fns"
import { CalendarPlus, ClipboardList, CheckCircle2, XCircle, Hourglass, Loader2, Ban } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type LeaveRequest, type LeaveRequestStatus } from "@/lib/types"
import { downloadIcsFile } from "@/lib/calendar"
import { Skeleton } from "./ui/skeleton"

type LeaveRequestsListProps = {
  requests: LeaveRequest[];
  isLoading: boolean;
};

export function LeaveRequestsList({ requests, isLoading }: LeaveRequestsListProps) {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          ))}
        </div>
      );
    }
  
    if (requests.length === 0) {
      return (
        <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-card p-12 text-center">
          <ClipboardList className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold font-headline">No Leave Requests Yet</h3>
          <p className="mt-2 text-sm text-muted-foreground">Submit a leave request to see your history here.</p>
        </div>
      );
    }

    const statusConfig: Record<LeaveRequestStatus, { icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      'Approved': {
        icon: <CheckCircle2 className="mr-2" />,
        variant: "outline",
      },
      'Issues Found': {
        icon: <XCircle className="mr-2" />,
        variant: "destructive",
      },
      'Pending Review': {
        icon: <Hourglass className="mr-2" />,
        variant: "secondary",
      },
      'Rejected': {
        icon: <Ban className="mr-2" />,
        variant: "destructive",
      }
    };

    return (
      <TooltipProvider>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Dates</TableHead>
              <TableHead className="hidden md:table-cell">Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {format(request.startDate, "MMM d")} - {format(request.endDate, "MMM d, yyyy")}
                </TableCell>
                <TableCell className="hidden max-w-[250px] truncate md:table-cell" title={request.reason}>
                  {request.reason}
                </TableCell>
                <TableCell>
                  <Badge variant={statusConfig[request.status]?.variant || 'default'} className="w-fit items-center">
                     {statusConfig[request.status]?.icon}
                    <span>{request.status}</span>
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {request.status === 'Approved' && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <Button variant="ghost" size="icon" onClick={() => downloadIcsFile(request)}>
                           <CalendarPlus className="h-4 w-4" />
                           <span className="sr-only">Add to Calendar</span>
                         </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add to Calendar</p>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TooltipProvider>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">My Leave History</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}

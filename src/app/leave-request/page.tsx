"use client";

import { useTransition } from "react";
import { Leaf, Bell, LogOut } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave-request-form";
import { LeaveRequestsList } from "@/components/leave-requests-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { LeaveRequest } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { leaveRequest } from "@/constants/endpoint-constant";
import instance from "@/lib/axios";
import { toast } from "sonner";
import { logout } from "../(logout)/action";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();

  const [_, startTransition] = useTransition();

  const handleLogout = () => {
    const toastId = toast.loading("Logging out...");

    startTransition(() => {
      logout()
        .then(() => {
          toast.success("Logout successful", { id: toastId });
          setTimeout(() => router.replace("/login", { scroll: false }), 250);
        })
        .catch(() => {
          toast.error("Logout failed", { id: toastId });
        });
    });
  };

  // Get Leaves
  const {
    data: leaveList,
    isLoading: isLoadingLeaveList,
    isRefetching: isRefetchingLeaveList,
    refetch: refetchLeaveList,
  } = useQuery({
    queryKey: ["leave-list"],
    queryFn: async () => {
      const endpoint = leaveRequest;
      const response = await instance.get(endpoint);
      return response.data.data;
    },
  });
  // Get Leaves

  const notifications = [
    {
      id: 1,
      message: "Your leave on June 24-28 has been approved.",
      read: false,
    },
    {
      id: 2,
      message: "Your leave request for July 1-2 needs revision.",
      read: false,
    },
    {
      id: 3,
      message: "Congratulations! Your annual leave has been reset.",
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Leaf className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight text-primary font-headline">
              Leave
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      You have {unreadCount} unread messages.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="mb-2 grid grid-cols-[25px_1fr] items-start pb-2 last:mb-0 last:pb-0"
                      >
                        <span
                          className={`flex h-2 w-2 translate-y-1 rounded-full ${
                            !notification.read ? "bg-sky-6  00" : ""
                          }`}
                        />
                        <div className="grid gap-1">
                          <p className="text-sm font-medium">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar>
                    <AvatarFallback>
                      {" "}
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="font-semibold leading-none">{user?.name}</p>
                    <p className="text-sm font-medium leading-none">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 lg:gap-4 items-start">
          <div className="lg:col-span-3">
            <Card className=" shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">
                  New Leave Request
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LeaveRequestForm refetch={refetchLeaveList} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <LeaveRequestsList
              data={leaveList}
              isLoading={isLoadingLeaveList}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

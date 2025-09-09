"use client"

import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { Leaf, Bell, LogOut } from "lucide-react";
import { LeaveRequestForm } from "@/components/leave-request-form";
import { LeaveRequestsList } from "@/components/leave-requests-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import type { LeaveRequest } from "@/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context";


export default function Home() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { user } = useAuth();


  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const requestsRef = ref(db, "leaveRequests");
    const userRequestsQuery = query(
      requestsRef, 
      orderByChild("userId"),
      equalTo(user.uid)
    );

    const unsubscribe = onValue(userRequestsQuery, (snapshot) => {
      const userRequests: LeaveRequest[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          const request = data[key];
          userRequests.push({
            id: key,
            startDate: new Date(request.startDate),
            endDate: new Date(request.endDate),
            reason: request.reason,
            status: request.status,
            aiResponse: request.aiResponse,
            approver: request.approver,
            location: request.location,
            ongoingTasks: request.ongoingTasks,
            replacementPerson: request.replacementPerson,
            phoneNumber: request.phoneNumber,
            returnDate: new Date(request.returnDate),
            userId: request.userId,
          });
        });
      }
      // Sort requests by creation date, newest first
      userRequests.sort((a, b) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime());
      setRequests(userRequests);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);


  const notifications = [
    { id: 1, message: "Your leave on June 24-28 has been approved.", read: false },
    { id: 2, message: "Your leave request for July 1-2 needs revision.", read: false },
    { id: 3, message: "Congratulations! Your annual leave has been reset.", read: true },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

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
                          <span className={`flex h-2 w-2 translate-y-1 rounded-full ${!notification.read ? 'bg-sky-600' : ''}`} />
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
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                       {user?.email?.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.email}</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-2">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="font-headline text-2xl">New Leave Request</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaveRequestForm />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
             <LeaveRequestsList requests={requests} isLoading={loading} />
          </div>
        </div>
      </main>
    </div>
  );
}

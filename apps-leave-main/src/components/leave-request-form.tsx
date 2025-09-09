"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format, addDays } from "date-fns"
import { CalendarIcon, FileText, Loader2, Send, MapPin, Briefcase, User, Phone, Users, Plus, Trash2 } from "lucide-react"
import { ref, onValue, push, remove, query, orderByChild, equalTo } from 'firebase/database'
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { submitLeaveRequestAction } from "@/app/actions"
import type { Approver } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  dateRange: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(200, { message: "Reason must not exceed 200 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  ongoingTasks: z.string().min(10, { message: "Please list your ongoing tasks." }),
  replacementPerson: z.string().min(2, { message: "Please name a replacement." }),
  phoneNumber: z.string().min(10, { message: "Please provide a valid phone number." }),
  approver: z.string({ required_error: "Please select an approver." }),
});

export function LeaveRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [newApproverName, setNewApproverName] = useState("");
  const [newApproverEmail, setNewApproverEmail] = useState("");
  const [isManageOpen, setIsManageOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;
    const approversRef = ref(db, 'approvers');
    const userApproversQuery = query(approversRef, orderByChild('userId'), equalTo(user.uid));

    const unsubscribe = onValue(userApproversQuery, (snapshot) => {
      const approversData: Approver[] = [];
      if (snapshot.exists()) {
        const data = snapshot.val();
        Object.keys(data).forEach((key) => {
          approversData.push({ id: key, ...data[key] } as Approver);
        });
      }
      setApprovers(approversData);
    });
    return () => unsubscribe();
  }, [user]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: "",
      location: "",
      ongoingTasks: "",
      replacementPerson: "",
      phoneNumber: "",
    },
  });

  const dateRange = form.watch("dateRange");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit a request.",
      });
      return;
    }
    setIsLoading(true);

    const returnDate = values.dateRange.to ? addDays(values.dateRange.to, 1) : new Date();

    const input = {
      employeeId: user.uid,
      startDate: format(values.dateRange.from, "yyyy-MM-dd"),
      endDate: format(values.dateRange.to, "yyyy-MM-dd"),
      reason: values.reason,
      location: values.location,
      returnDate: format(returnDate, "yyyy-MM-dd"),
      ongoingTasks: values.ongoingTasks,
      replacementPerson: values.replacementPerson,
      phoneNumber: values.phoneNumber,
      approver: values.approver,
    };

    const result = await submitLeaveRequestAction(input, user.uid);

    if (result.success) {
      toast({
        title: "Request Submitted",
        description: "Your leave request has been sent for approval.",
      });
      form.reset({ reason: '', location: '', ongoingTasks: '', replacementPerson: '', phoneNumber: '' });
    } else {
       toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.error || "An unknown error occurred.",
      });
    }

    setIsLoading(false);
  }

  const handleAddApprover = async () => {
    if (user && newApproverName && newApproverEmail) {
      const approversRef = ref(db, 'approvers');
      await push(approversRef, {
        name: newApproverName,
        email: newApproverEmail,
        userId: user.uid,
      });
      setNewApproverName("");
      setNewApproverEmail("");
    }
  };

  const handleRemoveApprover = async (approverId: string) => {
    const approverRef = ref(db, `approvers/${approverId}`);
    await remove(approverRef);
  };


  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="dateRange"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Leave Dates</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          field.value.to ? (
                            <>
                              {format(field.value.from, "LLL dd, y")} -{" "}
                              {format(field.value.to, "LLL dd, y")}
                            </>
                          ) : (
                            format(field.value.from, "LLL dd, y")
                          )
                        ) : (
                          <span>Select a date range</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={field.value?.from}
                      selected={field.value}
                      onSelect={field.onChange}
                      numberOfMonths={1}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {dateRange?.to && (
            <div className="space-y-2 rounded-md border p-3">
              <FormLabel>Return to Office Date</FormLabel>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>{format(addDays(dateRange.to, 1), "EEEE, LLL dd, yyyy")}</span>
              </div>
            </div>
          )}

           <FormField
            control={form.control}
            name="approver"
            render={({ field }) => (
              <FormItem>
                <div className="flex justify-between items-center">
                   <FormLabel className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Send to
                    </FormLabel>
                   <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
                      <DialogTrigger asChild>
                         <Button variant="ghost" size="sm">Manage</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Manage Approvers</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            <div className="flex flex-col space-y-2">
                                <div className="space-y-1">
                                    <Label htmlFor="new-approver-name">Name</Label>
                                    <Input 
                                    id="new-approver-name"
                                    value={newApproverName} 
                                    onChange={(e) => setNewApproverName(e.target.value)} 
                                    placeholder="Approver name"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="new-approver-email">Email</Label>
                                    <Input
                                    id="new-approver-email"
                                    type="email" 
                                    value={newApproverEmail} 
                                    onChange={(e) => setNewApproverEmail(e.target.value)} 
                                    placeholder="approver@example.com"
                                    />
                                </div>
                                <Button onClick={handleAddApprover} className="mt-2"><Plus className="h-4 w-4 mr-2"/> Add Approver</Button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {approvers.map(approver => (
                                    <div key={approver.id} className="flex items-center justify-between p-2 border rounded-md">
                                        <div>
                                            <p className="font-medium">{approver.name}</p>
                                            <p className="text-sm text-muted-foreground">{approver.email}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveApprover(approver.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <DialogFooter>
                            <Button onClick={() => setIsManageOpen(false)}>Done</Button>
                         </DialogFooter>
                      </DialogContent>
                    </Dialog>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvers.map(approver => (
                        <SelectItem key={approver.id} value={`${approver.name} <${approver.email}>`}>
                          <div>
                            <p>{approver.name}</p>
                            <p className="text-xs text-muted-foreground">{approver.email}</p>
                          </div>
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Reason for Leave
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="e.g., Family vacation to Bali"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <MapPin className="mr-2 h-4 w-4" />
                  Location During Leave
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Bali, Indonesia" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="ongoingTasks"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Briefcase className="mr-2 h-4 w-4" />
                  Ongoing Tasks
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="- Task 1
- Task 2"
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="replacementPerson"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  Temporary Replacement
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Budi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Phone className="mr-2 h-4 w-4" />
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="e.g., +62 812 3456 7890" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Submit Request
          </Button>
        </form>
      </Form>
    </div>
  );
}

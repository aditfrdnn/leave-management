"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import {
  CalendarIcon,
  FileText,
  Loader2,
  Send,
  MapPin,
  Briefcase,
  User,
  Phone,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  createLeaveRequest,
  getUsers,
  getLeaveTypes,
} from "@/services/leaveServices";

function getNextWorkday(date: Date): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  if (next.getDay() === 6) {
    next.setDate(next.getDate() + 2);
  }
  if (next.getDay() === 0) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

const formSchema = z.object({
  dates: z.array(z.date()).min(1, { message: "Please select at least one date." }),
  reason: z
    .string()
    .min(10, { message: "Reason must be at least 10 characters." })
    .max(200, { message: "Reason must not exceed 200 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  ongoingTasks: z.string().min(10, { message: "Please list your ongoing tasks." }),
  replacementPerson: z.string().min(2, { message: "Please name a replacement." }),
  phoneNumber: z.string().min(10, { message: "Please provide a valid phone number." }),
  approver: z.string({ required_error: "Please select an approver." }),
  leaveType: z.string({ required_error: "Please select a leave type." }),
});

export function LeaveRequestForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [approvers, setApprovers] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dates: [],
      reason: "",
      location: "",
      ongoingTasks: "",
      replacementPerson: "",
      phoneNumber: "",
      approver: "",
      leaveType: "",
    },
  });

  // Fetch dropdowns
  useEffect(() => {
    getUsers()
      .then((res) => setApprovers(res.data || []))
      .catch((err) => console.error("Error fetching users:", err));

    getLeaveTypes()
      .then((res) => setLeaveTypes(res.data || []))
      .catch((err) => console.error("Error fetching leave types:", err));
  }, []);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const sortedDates = [...values.dates].sort((a, b) => a.getTime() - b.getTime());
      const leaveDates = sortedDates.map((d) => format(d, "yyyy-MM-dd"));
      const returnDate = format(
        getNextWorkday(sortedDates[sortedDates.length - 1]),
        "yyyy-MM-dd"
      );

      const payload = {
        leave_type: values.leaveType,
        subject: "AUTO-GENERATE", // sementara, bisa backend yg generate
        leave_date: leaveDates,
        approval_user: values.approver,
        reason: values.reason,
        location_during_leave: values.location,
        return_to_office: returnDate,
        ongoing_task: values.ongoingTasks,
        temporary_replacement: values.replacementPerson,
        phone_number: values.phoneNumber,
      };

      await createLeaveRequest(payload);

      toast({
        title: "Request Submitted",
        description: "Your leave request has been sent for approval.",
      });
      form.reset();
      setSelectedDates([]);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: error.message || "An error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Multiple Dates */}
          <FormField
            control={form.control}
            name="dates"
            render={() => (
              <FormItem className="flex flex-col">
                <FormLabel>Leave Dates</FormLabel>
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          selectedDates.length === 0 && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDates.length > 0 ? (
                          <>
                            {format(selectedDates[0], "LLL dd, y")}
                            {selectedDates.length > 1 &&
                              ` - ${format(
                                selectedDates[selectedDates.length - 1],
                                "LLL dd, y"
                              )}`}
                          </>
                        ) : (
                          <span>Select leave dates</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="multiple"
                      selected={selectedDates}
                      onSelect={(dates) => {
                        setSelectedDates(dates ?? []);
                        form.setValue("dates", dates ?? []);
                        if (dates && dates.length > 0) setErrorMessage("");
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || date.getDay() === 0 || date.getDay() === 6;
                      }}
                    />
                    {errorMessage && (
                      <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                    )}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Leave Type */}
          <FormField
            control={form.control}
            name="leaveType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leaveTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Approver */}
          <FormField
            control={form.control}
            name="approver"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Send to
                </FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approver" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {approvers.map((approver: any) => (
                      <SelectItem key={approver.id} value={String(approver.id)}>
                        {approver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Reason */}
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
                  <Textarea placeholder="e.g., Family vacation to Bali" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
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

          {/* Ongoing Tasks */}
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
                  <Textarea placeholder="- Task 1&#10;- Task 2" className="resize-none" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Replacement Person */}
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

          {/* Phone Number */}
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

          {/* Submit */}
          <Button type="submit" disabled={isLoading} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Submit Request
          </Button>
        </form>
      </Form>
    </div>
  );
}

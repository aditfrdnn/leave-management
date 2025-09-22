"use client";

import { useState, useEffect, useActionState, startTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  leaveRequestSchema,
  LeaveRequestSchemaType,
} from "@/validations/leave-validations";
import {
  INITIAL_LEAVE_REQUEST_FORM,
  INITIAL_LEAVE_REQUEST_STATE,
} from "@/constants/leave-constant";
import { CreateLeaveRequest } from "@/app/leave-request/_components/action";
import { toast } from "sonner";
import instance from "@/lib/axios";
import { TLeaveType } from "@/types/leave";
import { getApprovers, getLeaveTypes } from "@/constants/endpoint-constant";
import { TUser } from "@/types/user";
import FormInput from "./common/form-input";

interface PropTypes {
  refetch: () => void;
}

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

export function LeaveRequestForm(props: PropTypes) {
  const { refetch } = props;
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<TLeaveType[]>([]);
  const [approvers, setApprovers] = useState<TUser[]>([]);
  const [open, setOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Get Leave Types
  const leaveTypesHandling = async () => {
    try {
      const endpoint = getLeaveTypes; // ganti sesuai endpoint aslinya

      const result = await instance.get(endpoint);

      setLeaveTypes(result.data.data);
      return result.data.data;
    } catch (error) {
      throw error;
    }
  };
  // Get Leave Types

  // Get Approvers
  const approversHandling = async () => {
    try {
      const endpoint = getApprovers; // ganti sesuai endpoint aslinya

      const result = await instance.get(endpoint);

      setApprovers(result.data.data);
      return result.data.data;
    } catch (error) {
      throw error;
    }
  };
  // Get Approvers

  useEffect(() => {
    leaveTypesHandling();
    approversHandling();
  }, []);

  useEffect(() => {
    if (selectedDates.length > 0) {
      const sortedDates = selectedDates.sort(
        (a, b) => a.getTime() - b.getTime()
      );

      getNextWorkday(sortedDates![sortedDates!.length - 1]);
      form.setValue(
        "return_to_office",
        format(
          getNextWorkday(sortedDates![sortedDates!.length - 1]),
          "dd-MM-yyyy"
        )
      );
    } else {
      form.setValue("return_to_office", "");
    }
  }, [selectedDates]);

  // Form Handling
  const form = useForm<LeaveRequestSchemaType>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: INITIAL_LEAVE_REQUEST_FORM,
  });

  const [createState, createAction, isPending] = useActionState(
    CreateLeaveRequest,
    INITIAL_LEAVE_REQUEST_STATE
  );

  const onSubmit = form.handleSubmit(async (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => formData.append(key, v));
      } else {
        formData.append(key, String(value));
      }
    });

    startTransition(() => {
      createAction(formData);
    });
  });

  useEffect(() => {
    if (createState?.status === "error") {
      toast.error(createState?.message || "Failed to create leave request", {
        description: createState.errors?._form?.[0],
      });
    }

    if (createState?.status === "success") {
      toast.success(
        createState?.message || "Leave request created successfully"
      );
      refetch();
    }
  }, [createState]);
  // Form Handling

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={onSubmit} className="space-y-6">
          <FormInput
            name="subject"
            label="LVR No."
            disabled={isPending}
            placeholder="Enter LVR No."
            form={form}
          />
          {/* Multiple Dates */}
          <FormField
            control={form.control}
            name="leave_date"
            disabled={isPending}
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
                            {format(selectedDates[0], "dd-MM-yyyy")}
                            {selectedDates.length > 1 &&
                              ` - ${format(
                                selectedDates[selectedDates.length - 1],
                                "dd-MM-yyyy"
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

                        // convert Date[] to string[] to setValue
                        form.setValue(
                          "leave_date",
                          dates?.map((date) => format(date, "dd-MM-yyyy")) ?? []
                        );

                        if (dates && dates.length > 0) setErrorMessage("");
                      }}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return (
                          date < today ||
                          date.getDay() === 0 ||
                          date.getDay() === 6
                        );
                      }}
                    />
                    {errorMessage && (
                      <p className="text-red-500 text-sm mt-2">
                        {errorMessage}
                      </p>
                    )}
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* Return to Office */}
          <FormInput
            name="return_to_office"
            placeholder="Date automatically set"
            form={form}
            label="Return to Office"
            type="text"
            disabled
          />

          {/* Leave Type */}
          <FormField
            control={form.control}
            name="leave_type"
            disabled={isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Leave Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {leaveTypes.map((type: any) => (
                      <SelectItem key={type.id} value={String(type.id)}>
                        {type.text}
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
            name="approval_user"
            disabled={isPending}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center">Send to</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
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
          <FormInput
            name="reason"
            label="Reason for Leave"
            placeholder="e.g., Family vacation to Bali"
            type="textarea"
            form={form}
            disabled={isPending}
          />

          {/* Location */}
          <FormInput
            name="location_during_leave"
            label="Location During Leave"
            placeholder="e.g., Bali, Indonesia"
            type="text"
            form={form}
            disabled={isPending}
          />

          {/* Ongoing Tasks */}
          <FormInput
            name="ongoing_task"
            label="Ongoing Tasks"
            placeholder="e.g., Develop a software"
            type="text"
            form={form}
            disabled={isPending}
          />

          {/* Replacement Person */}
          <FormInput
            name="temporary_replacement"
            label=" Temporary Replacement"
            placeholder="e.g., Budi"
            type="text"
            form={form}
            disabled={isPending}
          />

          {/* Phone Number */}
          <FormInput
            name="phone_number"
            label=" Phone Number"
            placeholder="e.g., +62 812 3456 7890"
            type="text"
            form={form}
            disabled={isPending}
          />

          {/* Submit */}
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {isPending ? (
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

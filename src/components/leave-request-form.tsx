"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { format } from "date-fns"
import { CalendarIcon, FileText, Loader2, Send, MapPin, Briefcase, User, Phone, Users, Plus, Trash2 } from "lucide-react"
import { ref, onValue, push, remove, query, orderByChild, equalTo } from "firebase/database"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"


import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
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

function getNextWorkday(date: Date): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + 1)

  // if Saturday, skip to Monday
  if (next.getDay() === 6) {
    next.setDate(next.getDate() + 2)
  }

  // if Sunday, skip to Monday
  if (next.getDay() === 0) {
    next.setDate(next.getDate() + 1)
  }

  return next
}

const formSchema = z.object({
  dates: z.array(z.date()).min(1, { message: "Please select at least one date." }),
  reason: z.string().min(10, { message: "Reason must be at least 10 characters." }).max(200, { message: "Reason must not exceed 200 characters." }),
  location: z.string().min(2, { message: "Location must be at least 2 characters." }),
  ongoingTasks: z.string().min(10, { message: "Please list your ongoing tasks." }),
  replacementPerson: z.string().min(2, { message: "Please name a replacement." }),
  phoneNumber: z.string().min(10, { message: "Please provide a valid phone number." }),
  approver: z.string({ required_error: "Please select an approver." }),
})

export function LeaveRequestForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [approvers, setApprovers] = useState<Approver[]>([])
  const [newApproverName, setNewApproverName] = useState("")
  const [newApproverEmail, setNewApproverEmail] = useState("")
  const [isManageOpen, setIsManageOpen] = useState(false)
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [open, setOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  useEffect(() => {
    if (!user) return
    const approversRef = ref(db, "approvers")
    const userApproversQuery = query(approversRef, orderByChild("userId"), equalTo(user.uid))

    const unsubscribe = onValue(userApproversQuery, (snapshot) => {
      const approversData: Approver[] = []
      if (snapshot.exists()) {
        const data = snapshot.val()
        Object.keys(data).forEach((key) => {
          approversData.push({ id: key, ...data[key] } as Approver)
        })
      }
      setApprovers(approversData)
    })
    return () => unsubscribe()
  }, [user])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      dates: [],
      reason: "",
      location: "",
      ongoingTasks: "",
      replacementPerson: "",
      phoneNumber: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to submit a request.",
      })
      return
    }
    setIsLoading(true)

    const sortedDates = [...values.dates].sort((a, b) => a.getTime() - b.getTime())
    const startDate = sortedDates[0]
    const endDate = sortedDates[sortedDates.length - 1]
    const returnDate = getNextWorkday(endDate)

    const input = {
      employeeId: user.uid,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      reason: values.reason,
      location: values.location,
      returnDate: format(returnDate, "yyyy-MM-dd"),
      ongoingTasks: values.ongoingTasks,
      replacementPerson: values.replacementPerson,
      phoneNumber: values.phoneNumber,
      approver: values.approver,
    }

    const result = await submitLeaveRequestAction(input, user.uid)

    if (result.success) {
      toast({
        title: "Request Submitted",
        description: "Your leave request has been sent for approval.",
      })
      form.reset({ dates: [], reason: "", location: "", ongoingTasks: "", replacementPerson: "", phoneNumber: "" })
      setSelectedDates([])
    } else {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: result.error || "An unknown error occurred.",
      })
    }

    setIsLoading(false)
  }

  const handleAddApprover = async () => {
    if (user && newApproverName && newApproverEmail) {
      const approversRef = ref(db, "approvers")
      await push(approversRef, {
        name: newApproverName,
        email: newApproverEmail,
        userId: user.uid,
      })
      setNewApproverName("")
      setNewApproverEmail("")
    }
  }

  const handleRemoveApprover = async (approverId: string) => {
    const approverRef = ref(db, `approvers/${approverId}`)
    await remove(approverRef)
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
                            ` - ${format(selectedDates[selectedDates.length - 1], "LLL dd, y")}`}
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
                      setSelectedDates(dates ?? [])
                      form.setValue("dates", dates ?? [])
                      if (dates && dates.length > 0) setErrorMessage("")
                    }}
                    disabled={(date) => {
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)

                      const isPast = date < today
                      const isWeekend = date.getDay() === 0 || date.getDay() === 6

                      return isPast || isWeekend
                    }}
                  />

                  {/* Error text */}
                  {errorMessage && (
                    <p className="text-red-500 text-sm mt-2">{errorMessage}</p>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-end gap-2 mt-3">
                    <button
                      type="button"
                      className="px-3 py-1 text-sm rounded-md border hover:bg-muted"
                      onClick={() => {
                        setSelectedDates([])
                        form.setValue("dates", [])
                        setErrorMessage("")
                      }}
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                      onClick={() => {
                        if (selectedDates.length === 0) {
                          setErrorMessage("Choose at least one date")
                          return
                        }
                        console.log("Confirmed dates:", selectedDates)
                        setErrorMessage("")
                        setOpen(false) // close popover
                      }}
                    >
                      Confirm
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

                <FormMessage />
              </FormItem>
            )}
          />

          {/* Return to Office Date */}
          {selectedDates.length > 0 && (
            <div className="space-y-2 rounded-md border p-3">
              <FormLabel>Return to Office Date</FormLabel>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span>
                  {format(
                    getNextWorkday(selectedDates[selectedDates.length - 1]),
                    "EEEE, LLL dd, yyyy"
                  )}
                </span>
              </div>
            </div>
          )}

          {/* Approver */}
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
                            <Input id="new-approver-name" value={newApproverName} onChange={(e) => setNewApproverName(e.target.value)} placeholder="Approver name" />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="new-approver-email">Email</Label>
                            <Input id="new-approver-email" type="email" value={newApproverEmail} onChange={(e) => setNewApproverEmail(e.target.value)} placeholder="approver@example.com" />
                          </div>
                          <Button onClick={handleAddApprover} className="mt-2">
                            <Plus className="h-4 w-4 mr-2" /> Add Approver
                          </Button>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {approvers.map((approver) => (
                            <div key={approver.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div>
                                <p className="font-medium">{approver.name}</p>
                                <p className="text-sm text-muted-foreground">{approver.email}</p>
                              </div>
                              <Button variant="ghost" size="icon" onClick={() => handleRemoveApprover(approver.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
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
                    {approvers.map((approver) => (
                      <SelectItem key={approver.id} value={`${approver.name} <${approver.email}>`}>
                        <div>
                          <p>{approver.name}</p>
                          <p className="text-xs text-white-foreground">{approver.email}</p>
                        </div>
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
  )
}

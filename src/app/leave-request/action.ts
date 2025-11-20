import { leaveRequest } from "@/constants/endpoint-constant";
import instance from "@/lib/axios";
import { LeaveFormState } from "@/types/leave";
import { leaveRequestSchema } from "@/validations/leave-validations";

export async function CreateLeaveRequest(
  prevState: LeaveFormState,
  formData: FormData | null
): Promise<LeaveFormState> {
  const parsed = leaveRequestSchema.safeParse({
    leave_type: formData?.get("leave_type") as string,
    subject: formData?.get("subject") as string,
    leave_date: formData?.getAll("leave_date") as string[],
    approval_user: formData?.get("approval_user") as string,
    reason: formData?.get("reason") as string,
    location_during_leave: formData?.get("location_during_leave") as string,
    return_to_office: formData?.get("return_to_office") as string,
    ongoing_task: formData?.get("ongoing_task") as string,
    temporary_replacement: formData?.get("temporary_replacement") as string,
    phone_number: formData?.get("phone_number") as string,
  });

  if (parsed.error) {
    console.log("Parsed Error", parsed.error);
    return {
      status: "error",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await instance.post(leaveRequest, parsed.data);
    if (result.status !== 200) {
      return {
        status: "error",
        errors: {
          ...prevState.errors,
          _form: [result.data.message],
        },
      };
    }

    return {
      status: "success",
      message: "Leave request created successfully.",
    };
  } catch (error) {
    console.log("Catch Error", error);
    return {
      status: "error",
      errors: {
        ...prevState.errors,
        _form: ["Failed to process the leave request. Please try again later."],
      },
    };
  }
}

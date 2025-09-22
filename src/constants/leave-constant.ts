export const INITIAL_LEAVE_REQUEST_FORM = {
  leave_type: "",
  subject: "",
  leave_date: [],
  approval_user: "",
  reason: "",
  location_during_leave: "",
  return_to_office: "",
  ongoing_task: "",
  temporary_replacement: "",
  phone_number: "",
};

export const INITIAL_LEAVE_REQUEST_STATE = {
  status: "idle",
  errors: {
    subject: [],
    leave_date: [],
    approval_user: [],
    reason: [],
    location_during_leave: [],
    return_to_office: [],
    ongoing_task: [],
    temporary_replacement: [],
    phone_number: [],
    _form: [],
  },
};

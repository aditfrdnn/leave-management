export type LeaveFormState = {
  status?: string;
  message?: string;
  errors?: {
    leave_type?: string[];
    subject?: string[];
    leave_date?: string[];
    approval_user?: string[];
    reason?: string[];
    location_during_leave?: string[];
    return_to_office?: string[];
    ongoing_task?: string[];
    temporary_replacement?: string[];
    phone_number?: string[];
    _form?: string[];
  };
};

export type TLeave = {
  id: number;
  subject: string;
  start_date: string;
  end_date: string;
  reason: string;
  location_during_leave: string;
  duration: string;
  return_to_office: string;
  ongoing_task: string;
  temporary_replacement: string;
  phone_number: string;
  status: number;
  submitted_at: string;
  approved_at?: string;
  rejected_at?: string;
  created_at: string;
  updated_at?: string;
  status_name: string;
  user: {
    id: number;
    name: string;
    department_id: number;
    department: {
      id: number;
      name: string;
      alias: string;
    };
  };
  leave_type: {
    id: number;
    code: string;
    name: string;
  };
  leave_request_days: {
    id: number;
    leave_request_id: number;
    date: string;
    portion: string;
    is_counted: number;
  }[];
};

export type TLeaveType = {
  id: number;
  text: string;
};

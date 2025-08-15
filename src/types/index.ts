export interface Student {
  id: string;
  fullName: string;
  contactInfo?: string;
  parentPhone?: string;
  notes?: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface StudentGroup {
  studentId: string;
  groupId: string;
}

export interface Session {
  id: string;
  groupId: string;
  dateTime: string;
  topic?: string;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: 'present' | 'absent' | 'excused';
}

export interface Assessment {
  id: string;
  groupId: string;
  name: string;
  maxScore: number;
  date: string;
  createdAt: string;
}

export interface Grade {
  id: string;
  assessmentId: string;
  studentId: string;
  score: number;
  comments?: string;
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  groupId: string;
  month: string; // Format: "YYYY-MM"
  status: 'paid' | 'unpaid' | 'partial' | 'waived';
  amount: number;
  dueDate: string;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

export interface AppData {
  students: Student[];
  groups: Group[];
  studentGroups: StudentGroup[];
  sessions: Session[];
  attendanceRecords: AttendanceRecord[];
  assessments: Assessment[];
  grades: Grade[];
  paymentRecords: PaymentRecord[];
}
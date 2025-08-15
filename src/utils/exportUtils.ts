import { Student, Group, Session, Assessment, Grade, AttendanceRecord, PaymentRecord } from '../types';

// CSV Export with Arabic Support
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  // Add BOM for Arabic text support
  const BOM = '\uFEFF';
  
  // Convert data to CSV format
  const csvContent = convertToCSV(data, headers);
  
  // Create blob with BOM for proper Arabic text encoding
  const blob = new Blob([BOM + csvContent], { 
    type: 'text/csv;charset=utf-8;' 
  });
  
  // Download file
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Convert data to CSV format
const convertToCSV = (data: any[], headers?: string[]): string => {
  if (data.length === 0) return '';
  
  // Use provided headers or extract from first object
  const csvHeaders = headers || Object.keys(data[0]);
  
  // Create CSV header row
  const headerRow = csvHeaders.join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return csvHeaders.map(header => {
      const value = row[header];
      // Handle special characters and wrap in quotes if needed
      if (value === null || value === undefined) return '';
      const stringValue = String(value);
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
};

// Export all students data
export const exportStudentsToCSV = (students: Student[], groups: Group[]) => {
  const data = students.map(student => {
    const studentGroups = groups.filter(group => 
      groups.some(sg => sg.id === group.id)
    );
    
    return {
      'Student ID': student.id,
      'Full Name': student.fullName,
      'Contact Info': student.contactInfo || '',
      'Parent Phone': student.parentPhone || '',
      'Notes': student.notes || '',
      'Groups': studentGroups.map(g => g.name).join('; '),
      'Created Date': new Date(student.createdAt).toLocaleDateString('ar-SA'),
      'Created Time': new Date(student.createdAt).toLocaleTimeString('ar-SA')
    };
  });
  
  exportToCSV(data, 'students-export');
};

// Export student comprehensive report
export const exportStudentReportToCSV = (
  student: Student,
  sessions: Session[],
  assessments: Assessment[],
  grades: Grade[],
  attendanceRecords: AttendanceRecord[],
  payments: PaymentRecord[],
  groups: Group[],
  startDate: string,
  endDate: string
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Filter data by date range
  const filteredSessions = sessions.filter(s => {
    const sessionDate = new Date(s.dateTime);
    return sessionDate >= start && sessionDate <= end;
  });
  
  const filteredAssessments = assessments.filter(a => {
    const assessmentDate = new Date(a.date);
    return assessmentDate >= start && assessmentDate <= end;
  });
  
  const filteredGrades = grades.filter(g => {
    const assessment = assessments.find(a => a.id === g.assessmentId);
    if (!assessment) return false;
    const assessmentDate = new Date(assessment.date);
    return assessmentDate >= start && assessmentDate <= end;
  });
  
  const filteredAttendance = attendanceRecords.filter(a => {
    const session = sessions.find(s => s.id === a.sessionId);
    if (!session) return false;
    const sessionDate = new Date(session.dateTime);
    return sessionDate >= start && sessionDate <= end;
  });
  
  const filteredPayments = payments.filter(p => {
    const paymentDate = new Date(p.dueDate);
    return paymentDate >= start && paymentDate <= end;
  });
  
  // Student basic info
  const basicInfo = [{
    'Report Type': 'Student Comprehensive Report',
    'Student ID': student.id,
    'Full Name': student.fullName,
    'Contact Info': student.contactInfo || '',
    'Parent Phone': student.parentPhone || '',
    'Notes': student.notes || '',
    'Report Period': `${startDate} to ${endDate}`,
    'Generated Date': new Date().toLocaleDateString('ar-SA'),
    'Generated Time': new Date().toLocaleTimeString('ar-SA')
  }];
  
  // Sessions data
  const sessionsData = filteredSessions.map(session => {
    const group = groups.find(g => g.id === session.groupId);
    const attendance = filteredAttendance.find(a => a.sessionId === session.id);
    
    return {
      'Date': new Date(session.dateTime).toLocaleDateString('ar-SA'),
      'Time': new Date(session.dateTime).toLocaleTimeString('ar-SA'),
      'Group': group?.name || '',
      'Topic': session.topic || 'Class Session',
      'Attendance Status': attendance?.status || 'Not Recorded',
      'Session ID': session.id
    };
  });
  
  // Assessments data
  const assessmentsData = filteredAssessments.map(assessment => {
    const group = groups.find(g => g.id === assessment.groupId);
    const grade = filteredGrades.find(g => g.assessmentId === assessment.id);
    
    return {
      'Date': new Date(assessment.date).toLocaleDateString('ar-SA'),
      'Assessment Name': assessment.name,
      'Group': group?.name || '',
      'Max Score': assessment.maxScore,
      'Student Score': grade?.score || 'Not Graded',
      'Percentage': grade ? ((grade.score / assessment.maxScore) * 100).toFixed(2) + '%' : 'Not Graded',
      'Assessment ID': assessment.id
    };
  });
  
  // Payments data
  const paymentsData = filteredPayments.map(payment => {
    const group = groups.find(g => g.id === payment.groupId);
    
    return {
      'Month': payment.month,
      'Group': group?.name || '',
      'Amount': payment.amount,
      'Status': payment.status,
      'Due Date': new Date(payment.dueDate).toLocaleDateString('ar-SA'),
      'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-SA') : '',
      'Notes': payment.notes || '',
      'Payment ID': payment.id
    };
  });
  
  // Summary statistics
  const totalSessions = filteredSessions.length;
  const attendedSessions = filteredAttendance.filter(a => a.status === 'present').length;
  const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
  
  const totalAssessments = filteredAssessments.length;
  const gradedAssessments = filteredGrades.length;
  const averageGrade = gradedAssessments > 0 
    ? filteredGrades.reduce((sum, g) => sum + g.score, 0) / filteredGrades.length 
    : 0;
  
  const totalPayments = filteredPayments.reduce((sum, p) => sum + p.amount, 0);
  const paidAmount = filteredPayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);
  
  const summaryData = [{
    'Total Sessions': totalSessions,
    'Attended Sessions': attendedSessions,
    'Attendance Rate': attendanceRate.toFixed(2) + '%',
    'Total Assessments': totalAssessments,
    'Graded Assessments': gradedAssessments,
    'Average Grade': averageGrade.toFixed(2),
    'Total Payment Amount': totalPayments,
    'Paid Amount': paidAmount,
    'Payment Rate': totalPayments > 0 ? ((paidAmount / totalPayments) * 100).toFixed(2) + '%' : '0%'
  }];
  
  // Export all data as separate CSV files
  const studentName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
  const dateRange = `${startDate.replace(/-/g, '')}_${endDate.replace(/-/g, '')}`;
  
  // Basic info
  exportToCSV(basicInfo, `${studentName}_basic_info_${dateRange}`);
  
  // Sessions
  if (sessionsData.length > 0) {
    exportToCSV(sessionsData, `${studentName}_sessions_${dateRange}`);
  }
  
  // Assessments
  if (assessmentsData.length > 0) {
    exportToCSV(assessmentsData, `${studentName}_assessments_${dateRange}`);
  }
  
  // Payments
  if (paymentsData.length > 0) {
    exportToCSV(paymentsData, `${studentName}_payments_${dateRange}`);
  }
  
  // Summary
  exportToCSV(summaryData, `${studentName}_summary_${dateRange}`);
  
  // Combined report
  const combinedData = [
    ...basicInfo,
    ...sessionsData,
    ...assessmentsData,
    ...paymentsData,
    ...summaryData
  ];
  
  exportToCSV(combinedData, `${studentName}_complete_report_${dateRange}`);
};

// Export groups data
export const exportGroupsToCSV = (groups: Group[], students: Student[]) => {
  const data = groups.map(group => {
    const groupStudents = students.filter(student => 
      students.some(sg => sg.id === student.id)
    );
    
    return {
      'Group ID': group.id,
      'Group Name': group.name,
      'Description': group.description || '',
      'Student Count': groupStudents.length,
      'Student Names': groupStudents.map(s => s.fullName).join('; '),
      'Created Date': new Date(group.createdAt).toLocaleDateString('ar-SA'),
      'Created Time': new Date(group.createdAt).toLocaleTimeString('ar-SA')
    };
  });
  
  exportToCSV(data, 'groups-export');
};

// Export sessions data
export const exportSessionsToCSV = (sessions: Session[], groups: Group[]) => {
  const data = sessions.map(session => {
    const group = groups.find(g => g.id === session.groupId);
    
    return {
      'Session ID': session.id,
      'Date': new Date(session.dateTime).toLocaleDateString('ar-SA'),
      'Time': new Date(session.dateTime).toLocaleTimeString('ar-SA'),
      'Group': group?.name || '',
      'Topic': session.topic || 'Class Session',
      'Created Date': new Date(session.createdAt).toLocaleDateString('ar-SA')
    };
  });
  
  exportToCSV(data, 'sessions-export');
};

// Export assessments data
export const exportAssessmentsToCSV = (assessments: Assessment[], groups: Group[]) => {
  const data = assessments.map(assessment => {
    const group = groups.find(g => g.id === assessment.groupId);
    
    return {
      'Assessment ID': assessment.id,
      'Assessment Name': assessment.name,
      'Group': group?.name || '',
      'Max Score': assessment.maxScore,
      'Date': new Date(assessment.date).toLocaleDateString('ar-SA'),
      'Created Date': new Date(assessment.createdAt).toLocaleDateString('ar-SA')
    };
  });
  
  exportToCSV(data, 'assessments-export');
};

// Export grades data
export const exportGradesToCSV = (grades: Grade[], assessments: Assessment[], students: Student[]) => {
  const data = grades.map(grade => {
    const assessment = assessments.find(a => a.id === grade.assessmentId);
    const student = students.find(s => s.id === grade.studentId);
    
    return {
      'Grade ID': grade.id,
      'Student Name': student?.fullName || '',
      'Assessment Name': assessment?.name || '',
      'Score': grade.score,
      'Max Score': assessment?.maxScore || '',
      'Percentage': assessment ? ((grade.score / assessment.maxScore) * 100).toFixed(2) + '%' : '',
      'Comments': grade.comments || '',
      'Assessment Date': assessment ? new Date(assessment.date).toLocaleDateString('ar-SA') : ''
    };
  });
  
  exportToCSV(data, 'grades-export');
};

// Export attendance data
export const exportAttendanceToCSV = (attendance: AttendanceRecord[], sessions: Session[], students: Student[], groups: Group[]) => {
  const data = attendance.map(record => {
    const session = sessions.find(s => s.id === record.sessionId);
    const student = students.find(s => s.id === record.studentId);
    const group = groups.find(g => g.id === session?.groupId);
    
    return {
      'Attendance ID': record.id,
      'Student Name': student?.fullName || '',
      'Date': session ? new Date(session.dateTime).toLocaleDateString('ar-SA') : '',
      'Time': session ? new Date(session.dateTime).toLocaleTimeString('ar-SA') : '',
      'Group': group?.name || '',
      'Topic': session?.topic || 'Class Session',
      'Status': record.status,
      'Session ID': record.sessionId
    };
  });
  
  exportToCSV(data, 'attendance-export');
};

// Export payments data
export const exportPaymentsToCSV = (payments: PaymentRecord[], students: Student[], groups: Group[]) => {
  const data = payments.map(payment => {
    const student = students.find(s => s.id === payment.studentId);
    const group = groups.find(g => g.id === payment.groupId);
    
    return {
      'Payment ID': payment.id,
      'Student Name': student?.fullName || '',
      'Group': group?.name || '',
      'Month': payment.month,
      'Amount': payment.amount,
      'Status': payment.status,
      'Due Date': new Date(payment.dueDate).toLocaleDateString('ar-SA'),
      'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-SA') : '',
      'Notes': payment.notes || '',
      'Created Date': new Date(payment.createdAt).toLocaleDateString('ar-SA')
    };
  });
  
  exportToCSV(data, 'payments-export');
};

// Export all data
export const exportAllDataToCSV = (data: any) => {
  const { students, groups, sessions, assessments, grades, attendanceRecords, paymentRecords } = data;
  
  exportStudentsToCSV(students, groups);
  exportGroupsToCSV(groups, students);
  exportSessionsToCSV(sessions, groups);
  exportAssessmentsToCSV(assessments, groups);
  exportGradesToCSV(grades, assessments, students);
  exportAttendanceToCSV(attendanceRecords, sessions, students, groups);
  exportPaymentsToCSV(paymentRecords, students, groups);
}; 
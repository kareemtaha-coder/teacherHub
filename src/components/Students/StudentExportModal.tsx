import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Student } from '../../types';
import { X, Download, Calendar, FileText, BarChart3, DollarSign, Users } from 'lucide-react';
import { exportStudentReportToCSV } from '../../utils/exportUtils';

interface StudentExportModalProps {
  student: Student;
  onClose: () => void;
}

const StudentExportModal: React.FC<StudentExportModalProps> = ({ student, onClose }) => {
  const { state } = useApp();
  const { getGroupsForStudent, getSessionsForGroup, getAssessmentsForGroup, getGradesForAssessment, getAttendanceForSession, getPaymentsForStudentInGroup } = useDataQueries();
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return threeMonthsAgo.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });
  
  const [exportType, setExportType] = useState<'all' | 'sessions' | 'assessments' | 'payments' | 'summary'>('all');

  // Get student's groups
  const studentGroups = useMemo(() => {
    return state.groups.filter(group => 
      state.studentGroups.some(sg => sg.groupId === group.id && sg.studentId === student.id)
    );
  }, [state.groups, state.studentGroups, student.id]);

  // Get all sessions for student's groups
  const allSessions = useMemo(() => {
    return studentGroups.flatMap(group => getSessionsForGroup(group.id));
  }, [studentGroups, getSessionsForGroup]);

  // Get all assessments for student's groups
  const allAssessments = useMemo(() => {
    return studentGroups.flatMap(group => getAssessmentsForGroup(group.id));
  }, [studentGroups, getAssessmentsForGroup]);

  // Get all grades for the student
  const allGrades = useMemo(() => {
    return state.grades.filter(grade => grade.studentId === student.id);
  }, [state.grades, student.id]);

  // Get all attendance records for the student
  const allAttendance = useMemo(() => {
    return state.attendanceRecords.filter(record => record.studentId === student.id);
  }, [state.attendanceRecords, student.id]);

  // Get all payments for the student
  const allPayments = useMemo(() => {
    return studentGroups.flatMap(group => getPaymentsForStudentInGroup(student.id, group.id));
  }, [studentGroups, student.id, getPaymentsForStudentInGroup]);

  // Filter data by date range
  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const filteredSessions = allSessions.filter(s => {
      const sessionDate = new Date(s.dateTime);
      return sessionDate >= start && sessionDate <= end;
    });
    
    const filteredAssessments = allAssessments.filter(a => {
      const assessmentDate = new Date(a.date);
      return assessmentDate >= start && assessmentDate <= end;
    });
    
    const filteredGrades = allGrades.filter(g => {
      const assessment = allAssessments.find(a => a.id === g.assessmentId);
      if (!assessment) return false;
      const assessmentDate = new Date(assessment.date);
      return assessmentDate >= start && assessmentDate <= end;
    });
    
    const filteredAttendance = allAttendance.filter(a => {
      const session = allSessions.find(s => s.id === a.sessionId);
      if (!session) return false;
      const sessionDate = new Date(session.dateTime);
      return sessionDate >= start && sessionDate <= end;
    });
    
    const filteredPayments = allPayments.filter(p => {
      const paymentDate = new Date(p.dueDate);
      return paymentDate >= start && paymentDate <= end;
    });
    
    return {
      sessions: filteredSessions,
      assessments: filteredAssessments,
      grades: filteredGrades,
      attendance: filteredAttendance,
      payments: filteredPayments
    };
  }, [startDate, endDate, allSessions, allAssessments, allGrades, allAttendance, allPayments]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const { sessions, assessments, grades, attendance, payments } = filteredData;
    
    const totalSessions = sessions.length;
    const attendedSessions = attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    
    const totalAssessments = assessments.length;
    const gradedAssessments = grades.length;
    const averageGrade = gradedAssessments > 0 
      ? grades.reduce((sum, g) => sum + g.score, 0) / gradedAssessments 
      : 0;
    
    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalSessions,
      attendedSessions,
      attendanceRate,
      totalAssessments,
      gradedAssessments,
      averageGrade,
      totalPaymentAmount,
      paidAmount,
      paymentRate: totalPaymentAmount > 0 ? (paidAmount / totalPaymentAmount) * 100 : 0
    };
  }, [filteredData]);

  const handleExport = () => {
    if (exportType === 'all') {
      // Export comprehensive report
      exportStudentReportToCSV(
        student,
        allSessions,
        allAssessments,
        allGrades,
        allAttendance,
        allPayments,
        studentGroups,
        startDate,
        endDate
      );
    } else {
      // Export specific data type
      const { exportToCSV } = require('../../utils/exportUtils');
      
      let data: any[] = [];
      let filename = '';
      
      switch (exportType) {
        case 'sessions':
          data = filteredData.sessions.map(session => {
            const group = studentGroups.find(g => g.id === session.groupId);
            const attendance = filteredData.attendance.find(a => a.sessionId === session.id);
            
            return {
              'Date': new Date(session.dateTime).toLocaleDateString('ar-SA'),
              'Time': new Date(session.dateTime).toLocaleTimeString('ar-SA'),
              'Group': group?.name || '',
              'Topic': session.topic || 'Class Session',
              'Attendance Status': attendance?.status || 'Not Recorded'
            };
          });
          filename = `${student.fullName}_sessions_${startDate}_${endDate}`;
          break;
          
        case 'assessments':
          data = filteredData.assessments.map(assessment => {
            const group = studentGroups.find(g => g.id === assessment.groupId);
            const grade = filteredData.grades.find(g => g.assessmentId === assessment.id);
            
            return {
              'Date': new Date(assessment.date).toLocaleDateString('ar-SA'),
              'Assessment Name': assessment.name,
              'Group': group?.name || '',
              'Max Score': assessment.maxScore,
              'Student Score': grade?.score || 'Not Graded',
              'Percentage': grade ? ((grade.score / assessment.maxScore) * 100).toFixed(2) + '%' : 'Not Graded'
            };
          });
          filename = `${student.fullName}_assessments_${startDate}_${endDate}`;
          break;
          
        case 'payments':
          data = filteredData.payments.map(payment => {
            const group = studentGroups.find(g => g.id === payment.groupId);
            
            return {
              'Month': payment.month,
              'Group': group?.name || '',
              'Amount': payment.amount,
              'Status': payment.status,
              'Due Date': new Date(payment.dueDate).toLocaleDateString('ar-SA'),
              'Paid Date': payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-SA') : ''
            };
          });
          filename = `${student.fullName}_payments_${startDate}_${endDate}`;
          break;
          
        case 'summary':
          data = [{
            'Student Name': student.fullName,
            'Report Period': `${startDate} to ${endDate}`,
            'Total Sessions': summaryStats.totalSessions,
            'Attended Sessions': summaryStats.attendedSessions,
            'Attendance Rate': summaryStats.attendanceRate.toFixed(2) + '%',
            'Total Assessments': summaryStats.totalAssessments,
            'Graded Assessments': summaryStats.gradedAssessments,
            'Average Grade': summaryStats.averageGrade.toFixed(2),
            'Total Payment Amount': summaryStats.totalPaymentAmount,
            'Paid Amount': summaryStats.paidAmount,
            'Payment Rate': summaryStats.paymentRate.toFixed(2) + '%'
          }];
          filename = `${student.fullName}_summary_${startDate}_${endDate}`;
          break;
      }
      
      if (data.length > 0) {
        exportToCSV(data, filename);
      }
    }
  };

  const isDateRangeValid = startDate <= endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Export Student Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              Export data for {student.fullName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Date Range Selection */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Select Date Range
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            {!isDateRangeValid && (
              <p className="text-red-600 text-sm mt-2">End date must be after start date</p>
            )}
          </div>

          {/* Export Type Selection */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Select Export Type
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="all"
                  checked={exportType === 'all'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Complete Report</div>
                  <div className="text-sm text-gray-500">All data in separate files</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="sessions"
                  checked={exportType === 'sessions'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Sessions Only</div>
                  <div className="text-sm text-gray-500">Attendance and session data</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="assessments"
                  checked={exportType === 'assessments'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Assessments Only</div>
                  <div className="text-sm text-gray-500">Grades and assessment data</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="payments"
                  checked={exportType === 'payments'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Payments Only</div>
                  <div className="text-sm text-gray-500">Payment status and amounts</div>
                </div>
              </label>
              
              <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportType"
                  value="summary"
                  checked={exportType === 'summary'}
                  onChange={(e) => setExportType(e.target.value as any)}
                  className="mr-3 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <div className="font-medium text-gray-900">Summary Only</div>
                  <div className="text-sm text-gray-500">Overview and statistics</div>
                </div>
              </label>
            </div>
          </div>

          {/* Data Preview */}
          <div className="mb-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Data Preview
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-blue-900">{summaryStats.totalSessions}</div>
                <div className="text-xs text-blue-600">Sessions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <BarChart3 className="h-5 w-5 text-green-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-green-900">{summaryStats.totalAssessments}</div>
                <div className="text-xs text-green-600">Assessments</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-3 text-center">
                <DollarSign className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-purple-900">{filteredData.payments.length}</div>
                <div className="text-xs text-purple-600">Payments</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-3 text-center">
                <FileText className="h-5 w-5 text-orange-600 mx-auto mb-1" />
                <div className="text-lg font-semibold text-orange-900">{summaryStats.attendanceRate.toFixed(1)}%</div>
                <div className="text-xs text-orange-600">Attendance</div>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={!isDateRangeValid}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentExportModal; 
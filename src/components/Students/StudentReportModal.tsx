import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Student, Session, Assessment, Grade, AttendanceRecord, PaymentRecord, StudentGroup, SessionReport } from '../../types';
import { formatDate, formatDateTime } from '../../utils/generators';
import generatePDF from 'react-to-pdf';
import { useLanguage } from '../../context/LanguageContext';
import { 
  X, User, Calendar, Users, Target, TrendingUp, Award, 
  BarChart3, DollarSign, MessageSquare, Star, AlertTriangle, 
  CheckCircle, Clock, BookOpen, Eye, ChevronDown, ChevronUp, Download, FileText 
} from 'lucide-react';
import { exportStudentReportToCSV } from '../../utils/exportUtils';

interface StudentReportModalProps {
  student: Student;
  onClose: () => void;
}

const StudentReportModal: React.FC<StudentReportModalProps> = ({ student, onClose }) => {
  const { state } = useApp();
  const { getGroupsForStudent, getSessionsForGroup, getAssessmentsForGroup, getGradesForAssessment, getAttendanceForSession, getPaymentsForStudentInGroup } = useDataQueries();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    return threeMonthsAgo.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  });

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

  // Get session reports for this student
  const studentSessionReports = useMemo(() => 
    (state.sessionReports || []).filter(sr => sr.studentId === student.id),
    [state.sessionReports, student.id]
  );

  // Get all groups for displaying group names
  const groups = useMemo(() => state.groups, [state.groups]);

  // Get filtered data for the selected date range
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

  // Calculate essential student statistics
  const studentStats = useMemo(() => {
    const totalSessions = filteredData.sessions.length;
    const presentSessions = filteredData.attendance.filter(a => a.status === 'present').length;
    const attendanceRate = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

    const gradesWithScores = filteredData.grades.filter(g => g.score !== undefined);
    const averageGrade = gradesWithScores.length > 0 
      ? gradesWithScores.reduce((acc, g) => {
          const assessment = filteredData.assessments.find(a => a.id === g.assessmentId);
          if (!assessment) return acc;
          return acc + (g.score / assessment.maxScore) * 100;
        }, 0) / gradesWithScores.length
      : 0;

    const totalPayments = filteredData.payments.length;
    const paidPayments = filteredData.payments.filter(p => p.status === 'paid').length;
    const paymentRate = totalPayments > 0 ? (paidPayments / totalPayments) * 100 : 0;

    return {
      attendance: {
        total: totalSessions,
        present: presentSessions,
        rate: attendanceRate
      },
      grades: {
        total: gradesWithScores.length,
        average: averageGrade
      },
      payments: {
        total: totalPayments,
        paid: paidPayments,
        rate: paymentRate
      }
    };
  }, [filteredData]);

  // Export report
  const handleExport = () => {
    exportStudentReportToCSV(
      student,
      filteredData.sessions,
      filteredData.assessments,
      filteredData.grades,
      filteredData.attendance,
      filteredData.payments,
      studentGroups,
      startDate,
      endDate
    );
  };

  // Download PDF report
  const downloadPDF = () => {
    if (reportRef.current) {
      generatePDF(reportRef, {
        filename: `${student.fullName}-report-${startDate}-to-${endDate}.pdf`,
        page: {
          margin: 20,
          format: 'a4'
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 lg:p-4 z-50">
      <div className="bg-white rounded-2xl lg:rounded-lg max-w-6xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-4 lg:p-6 border-b border-gray-200">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Student Report - {student.fullName}</h3>
            <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
              {studentGroups.length} group(s) • {filteredData.sessions.length} sessions • {filteredData.assessments.length} assessments
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDF}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 lg:px-3 lg:py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl lg:rounded-lg hover:bg-red-100 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="lg:hidden">PDF</span>
              <span className="hidden lg:inline">Download PDF</span>
            </button>
            <button
              onClick={handleExport}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 py-2 lg:px-3 lg:py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl lg:rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="lg:hidden">CSV</span>
              <span className="hidden lg:inline">Export CSV</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(95vh-140px)] lg:max-h-[calc(90vh-140px)] space-y-6 lg:space-y-8">
          {/* PDF Report Content */}
          <div ref={reportRef} className="pdf-content">
            {/* Report Header for PDF */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-300">
              <div className="mb-4">
                <div className="inline-block p-3 bg-blue-100 rounded-full mb-3">
                  <User className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Student Performance Report</h1>
              <h2 className="text-3xl font-semibold text-blue-600 mb-2">{student.fullName}</h2>
              <div className="text-lg text-gray-600 space-y-1">
                <p>Period: {new Date(startDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })} - {new Date(endDate).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                <p className="text-base text-blue-800 font-medium">
                  {studentGroups.length} group(s) • {filteredData.sessions.length} sessions • {filteredData.assessments.length} assessments
                </p>
              </div>
            </div>

            {/* Mobile-Friendly Date Display */}
            <div className="lg:hidden mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <div className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Calendar className="h-6 w-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-bold text-blue-900">Report Information</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Report Period</div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      {new Date(startDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })} - {new Date(endDate).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">Date Range Analysis</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Generated Date</div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date().toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Executive Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{studentStats.attendance.total}</div>
                  <div className="text-sm font-medium text-blue-800">Total Sessions</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-1">{studentStats.attendance.rate.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-green-800">Attendance Rate</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{studentStats.grades.average.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-purple-800">Average Grade</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-emerald-600 mb-1">{studentStats.payments.rate.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-emerald-800">Payment Rate</div>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Student Information</h3>
              <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-6 border border-gray-200">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Full Name:</span>
                      <span className="font-bold text-gray-900">{student.fullName}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Contact Info:</span>
                      <span className="font-bold text-gray-900">{student.contactInfo || 'Not provided'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Parent Phone:</span>
                      <span className="font-bold text-gray-900">{student.parentPhone || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Groups:</span>
                      <span className="font-bold text-blue-600">{studentGroups.length} group(s)</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Created Date:</span>
                      <span className="font-bold text-gray-900">{new Date(student.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg border border-gray-200">
                      <span className="text-gray-600 font-medium">Report Period:</span>
                      <span className="font-bold text-gray-900">{filteredData.sessions.length} sessions</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Student Notes */}
            {student.notes && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Teacher Notes & Observations</h3>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-blue-900">Ongoing Notes</h4>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <p className="text-base text-gray-800 leading-relaxed font-medium">{student.notes}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Attendance Summary */}
            {filteredData.sessions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Attendance Summary</h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Session</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Date & Time</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Status</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Group</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.sessions.map((session, index) => {
                          const attendance = filteredData.attendance.find(a => a.sessionId === session.id);
                          const group = studentGroups.find(g => g.id === session.groupId);
                          
                          return (
                            <tr key={session.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                                  </div>
                                  {session.topic || 'Class Session'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                {/* Mobile Date Display */}
                                <div className="lg:hidden">
                                  <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Date</div>
                                    <div className="text-sm font-bold text-gray-900 mb-1">
                                      {new Date(session.dateTime).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      })}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      {new Date(session.dateTime).toLocaleTimeString('en-US', { 
                                        hour: '2-digit', 
                                        minute: '2-digit',
                                        hour12: true 
                                      })}
                                    </div>
                                  </div>
                                </div>
                                {/* Desktop Date Display */}
                                <span className="hidden lg:inline">{formatDateTime(session.dateTime)}</span>
                              </td>
                              <td className="px-6 py-4 text-center">
                                {attendance ? (
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                    attendance.status === 'present' ? 'bg-green-100 text-green-800 border border-green-200' :
                                    attendance.status === 'absent' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  }`}>
                                    {attendance.status.charAt(0).toUpperCase() + attendance.status.slice(1)}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 text-sm font-medium">Not recorded</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                {group?.name || 'Unknown Group'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Grades Summary */}
            {filteredData.grades.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Academic Performance</h3>
                <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Assessment</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Date</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Score</th>
                          <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Percentage</th>
                          <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Group</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredData.grades.map((grade, index) => {
                          const assessment = filteredData.assessments.find(a => a.id === grade.assessmentId);
                          const group = studentGroups.find(g => g.id === assessment?.groupId);
                          const percentage = assessment ? (grade.score / assessment.maxScore) * 100 : 0;
                          
                          return (
                            <tr key={grade.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                              <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                <div className="flex items-center">
                                  <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                    <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                                  </div>
                                  {assessment?.name || 'Unknown Assessment'}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                {/* Mobile Date Display */}
                                <div className="lg:hidden">
                                  <div className="bg-purple-50 rounded-lg p-2 border border-purple-200">
                                    <div className="text-xs text-purple-600 font-medium uppercase tracking-wide mb-1">Date</div>
                                    <div className="text-sm font-bold text-gray-900">
                                      {assessment ? new Date(assessment.date).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        year: 'numeric'
                                      }) : 'Unknown Date'}
                                    </div>
                                  </div>
                                </div>
                                {/* Desktop Date Display */}
                                <span className="hidden lg:inline">{assessment ? formatDate(assessment.date) : 'Unknown Date'}</span>
                              </td>
                              <td className="px-6 py-4 text-center text-sm text-gray-900 font-bold">
                                {grade.score}/{assessment?.maxScore || '?'}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                  percentage >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                                  percentage >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                  percentage >= 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {percentage.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                {group?.name || 'Unknown Group'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Assessment Comments */}
            {filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Assessment Feedback</h3>
                <div className="space-y-4">
                  {filteredData.grades
                    .filter(g => g.comments && g.comments.trim() !== '')
                    .map((grade, index) => {
                      const assessment = filteredData.assessments.find(a => a.id === grade.assessmentId);
                      return (
                        <div key={grade.id} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-5 border border-yellow-200 shadow-sm">
                          <div className="flex items-center mb-3">
                            <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-yellow-700">{index + 1}</span>
                            </div>
                            <h4 className="text-lg font-bold text-yellow-900">{assessment?.name || 'Assessment'}</h4>
                          </div>
                          <div className="flex justify-between items-start mb-3">
                            {/* Mobile Date Display */}
                            <div className="lg:hidden">
                              <div className="bg-white rounded-lg p-3 border border-yellow-200">
                                <div className="text-xs text-yellow-600 font-medium uppercase tracking-wide mb-1">Feedback Date</div>
                                <div className="text-sm font-bold text-gray-900 mb-1">
                                  {assessment ? new Date(assessment.date).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : ''}
                                </div>
                                <div className="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Teacher Feedback</div>
                              </div>
                            </div>
                            {/* Desktop Date Display */}
                            <span className="hidden lg:inline text-sm text-yellow-700 font-medium">Feedback Date: {assessment ? formatDate(assessment.date) : ''}</span>
                            <span className="hidden lg:inline text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Teacher Feedback</span>
                          </div>
                          <div className="bg-white rounded-lg p-4 border border-yellow-200">
                            <p className="text-base text-gray-800 leading-relaxed font-medium">{grade.comments}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Session Performance Reports */}
            {studentSessionReports.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Session Performance Reports</h3>
                <div className="space-y-4">
                  {studentSessionReports.map((report, index) => {
                    const session = allSessions.find(s => s.id === report.sessionId);
                    const group = studentGroups.find(g => g.id === session?.groupId);
                    return (
                      <div key={report.id} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-5 border border-indigo-200 shadow-sm">
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
                            <span className="text-xs font-bold text-indigo-700">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-indigo-900">
                              {session?.topic || 'Unknown Session'}
                            </h4>
                            <p className="text-sm text-indigo-700">
                              {group?.name || 'Unknown Group'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-3">
                          <div className="bg-indigo-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Star className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">Performance:</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-sm font-medium ${
                              report.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                              report.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                              report.performance === 'average' ? 'bg-yellow-100 text-yellow-800' :
                              report.performance === 'needs_improvement' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {report.performance.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <div className="bg-indigo-50 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">Session Date:</span>
                            </div>
                            <span className="text-gray-700">
                              {session ? formatDateTime(session.dateTime) : 'Unknown'}
                            </span>
                          </div>
                        </div>
                        
                        {report.strengths && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800">Strengths:</span>
                            </div>
                            <p className="text-gray-700 bg-green-50 rounded-lg p-3 border border-green-200">
                              {report.strengths}
                            </p>
                          </div>
                        )}
                        
                        {report.improvements && (
                          <div className="mb-3">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                              <span className="font-medium text-orange-800">Areas for Improvement:</span>
                            </div>
                            <p className="text-gray-700 bg-orange-50 rounded-lg p-3 border border-orange-200">
                              {report.improvements}
                            </p>
                          </div>
                        )}
                        
                        {report.notes && (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <MessageSquare className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-blue-800">Additional Notes:</span>
                            </div>
                            <p className="text-gray-700 bg-blue-50 rounded-lg p-3 border border-blue-200">
                              {report.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Performance Insights */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Performance Analysis & Insights</h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Attendance Insights */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h4 className="text-xl font-bold text-green-900">Attendance Pattern</h4>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-green-900 mb-2">{studentStats.attendance.rate.toFixed(1)}%</div>
                    <div className="text-sm text-green-700 font-medium">
                      {studentStats.attendance.rate >= 90 ? 'Excellent attendance record' :
                       studentStats.attendance.rate >= 80 ? 'Good attendance with room for improvement' :
                       studentStats.attendance.rate >= 70 ? 'Moderate attendance - consider support strategies' :
                       'Low attendance - intervention recommended'}
                    </div>
                  </div>
                </div>

                {/* Grade Insights */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <h4 className="text-xl font-bold text-blue-900">Academic Performance</h4>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-900 mb-2">{studentStats.grades.average.toFixed(1)}%</div>
                    <div className="text-sm text-blue-700 font-medium">
                      {studentStats.grades.average >= 90 ? 'Outstanding academic performance' :
                       studentStats.grades.average >= 80 ? 'Strong academic performance' :
                       studentStats.grades.average >= 70 ? 'Satisfactory performance - monitor progress' :
                       'Performance below expectations - support needed'}
                    </div>
                  </div>
                </div>

                {/* Payment Insights */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-6 border border-emerald-200">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                    <h4 className="text-xl font-bold text-emerald-900">Financial Compliance</h4>
                  </div>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-emerald-900 mb-2">{studentStats.payments.rate.toFixed(1)}%</div>
                    <div className="text-sm text-emerald-700 font-medium">
                      {studentStats.payments.rate >= 90 ? 'Excellent payment compliance' :
                       studentStats.payments.rate >= 80 ? 'Good payment compliance' :
                       studentStats.payments.rate >= 70 ? 'Moderate compliance - follow up recommended' :
                       'Low compliance - immediate attention needed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* PDF Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center">
              <div className="mb-4">
                <div className="inline-block p-2 bg-blue-100 rounded-full">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">TeacherHub - Professional Student Management</p>
              <p className="text-sm text-gray-600">Comprehensive educational management system for modern educators</p>
              <div className="mt-4 text-xs text-gray-500">
                <p>Report generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
                <p>For questions or support, contact your administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentReportModal; 
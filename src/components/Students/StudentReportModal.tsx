import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Student } from '../../types';
import { X, Download, Calendar, FileText, BarChart3, DollarSign, Users, TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Clock, BookOpen, Award, Target, User } from 'lucide-react';
import { exportStudentReportToCSV } from '../../utils/exportUtils';
import { formatDate, formatDateTime } from '../../utils/generators';

interface StudentReportModalProps {
  student: Student;
  onClose: () => void;
}

const StudentReportModal: React.FC<StudentReportModalProps> = ({ student, onClose }) => {
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

  // Calculate comprehensive statistics
  const studentStats = useMemo(() => {
    const { sessions, assessments, grades, attendance, payments } = filteredData;
    
    // Attendance statistics
    const totalSessions = sessions.length;
    const attendedSessions = attendance.filter(a => a.status === 'present').length;
    const absentSessions = attendance.filter(a => a.status === 'absent').length;
    const excusedSessions = attendance.filter(a => a.status === 'excused').length;
    const attendanceRate = totalSessions > 0 ? (attendedSessions / totalSessions) * 100 : 0;
    
    // Grade statistics
    const totalAssessments = assessments.length;
    const gradedAssessments = grades.length;
    const averageGrade = gradedAssessments > 0 
      ? grades.reduce((sum, g) => sum + g.score, 0) / gradedAssessments 
      : 0;
    const highestGrade = gradedAssessments > 0 ? Math.max(...grades.map(g => g.score)) : 0;
    const lowestGrade = gradedAssessments > 0 ? Math.min(...grades.map(g => g.score)) : 0;
    
    // Payment statistics
    const totalPaymentAmount = payments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const unpaidAmount = payments
      .filter(p => p.status === 'unpaid')
      .reduce((sum, p) => sum + p.amount, 0);
    const paymentRate = totalPaymentAmount > 0 ? (paidAmount / totalPaymentAmount) * 100 : 0;
    
    // Performance trends
    const recentSessions = sessions.slice(-5);
    const recentAttendanceRate = recentSessions.length > 0 
      ? recentSessions.filter(s => {
          const sessionAttendance = attendance.find(a => a.sessionId === s.id);
          return sessionAttendance?.status === 'present';
        }).length / recentSessions.length * 100
      : 0;
    
    const recentGrades = grades.slice(-3);
    const recentGradeTrend = recentGrades.length > 1 
      ? recentGrades[recentGrades.length - 1].score - recentGrades[0].score
      : 0;
    
    return {
      attendance: {
        total: totalSessions,
        present: attendedSessions,
        absent: absentSessions,
        excused: excusedSessions,
        rate: attendanceRate,
        recentRate: recentAttendanceRate
      },
      grades: {
        total: totalAssessments,
        graded: gradedAssessments,
        average: averageGrade,
        highest: highestGrade,
        lowest: lowestGrade,
        trend: recentGradeTrend
      },
      payments: {
        total: totalPaymentAmount,
        paid: paidAmount,
        unpaid: unpaidAmount,
        rate: paymentRate
      },
      performance: {
        overall: (attendanceRate + (averageGrade / 100 * 100)) / 2,
        trend: recentGradeTrend > 0 ? 'improving' : recentGradeTrend < 0 ? 'declining' : 'stable'
      }
    };
  }, [filteredData]);

  // Get detailed session data
  const sessionDetails = useMemo(() => {
    return filteredData.sessions.map(session => {
      const group = studentGroups.find(g => g.id === session.groupId);
      const attendance = filteredData.attendance.find(a => a.sessionId === session.id);
      
      return {
        ...session,
        groupName: group?.name || 'Unknown Group',
        attendanceStatus: attendance?.status || 'Not Recorded',
        date: new Date(session.dateTime).toLocaleDateString('ar-SA'),
        time: new Date(session.dateTime).toLocaleTimeString('ar-SA')
      };
    });
  }, [filteredData.sessions, studentGroups, filteredData.attendance]);

  // Get detailed assessment data
  const assessmentDetails = useMemo(() => {
    return filteredData.assessments.map(assessment => {
      const group = studentGroups.find(g => g.id === assessment.groupId);
      const grade = filteredData.grades.find(g => g.assessmentId === assessment.id);
      
      return {
        ...assessment,
        groupName: group?.name || 'Unknown Group',
        score: grade?.score || 'Not Graded',
        maxScore: assessment.maxScore,
        percentage: grade ? ((grade.score / assessment.maxScore) * 100).toFixed(1) + '%' : 'Not Graded',
        date: new Date(assessment.date).toLocaleDateString('ar-SA'),
        comments: grade?.comments || ''
      };
    });
  }, [filteredData.assessments, studentGroups, filteredData.grades]);

  // Get detailed payment data
  const paymentDetails = useMemo(() => {
    return filteredData.payments.map(payment => {
      const group = studentGroups.find(g => g.id === payment.groupId);
      
      return {
        ...payment,
        groupName: group?.name || 'Unknown Group',
        dueDate: new Date(payment.dueDate).toLocaleDateString('ar-SA'),
        paidDate: payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('ar-SA') : 'Not Paid',
        statusColor: payment.status === 'paid' ? 'text-green-600' : 
                    payment.status === 'partial' ? 'text-yellow-600' : 
                    payment.status === 'waived' ? 'text-blue-600' : 'text-red-600'
      };
    });
  }, [filteredData.payments, studentGroups]);

  const handleExport = () => {
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
  };

  const isDateRangeValid = startDate <= endDate;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Student Comprehensive Report</h3>
            <p className="text-sm text-gray-600 mt-1">
              {student.fullName} - {studentGroups.map(g => g.name).join(', ')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              disabled={!isDateRangeValid}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {/* Comprehensive Profile Summary */}
          <div className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Comprehensive Student Profile</h3>
                <p className="text-sm text-gray-600">Holistic view of {student.fullName}'s academic journey</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                <div className="text-lg font-bold text-blue-600">{filteredData.sessions.length}</div>
                <div className="text-xs text-blue-600">Sessions</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                <div className="text-lg font-bold text-green-600">{filteredData.assessments.length}</div>
                <div className="text-xs text-green-600">Assessments</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-purple-200">
                <div className="text-lg font-bold text-purple-600">{filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length}</div>
                <div className="text-xs text-purple-600">Feedback Entries</div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center border border-emerald-200">
                <div className="text-lg font-bold text-emerald-600">{student.notes ? '1' : '0'}</div>
                <div className="text-xs text-emerald-600">Ongoing Notes</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-700">
              <p className="mb-2">
                <span className="font-medium">Profile Type:</span> This comprehensive profile consolidates attendance records, grades, teacher feedback, and ongoing observations into a single, easily accessible view.
              </p>
              <p>
                <span className="font-medium">Purpose:</span> Enables educators to quickly understand each student's unique strengths and weaknesses for providing targeted, individualized support.
              </p>
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="mb-6 bg-gray-50 rounded-lg p-4">
            <h4 className="text-md font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Report Period
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

          {/* Student Overview */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Student Overview
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{studentStats.attendance.total}</div>
                <div className="text-xs text-blue-600">Total Sessions</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{studentStats.attendance.rate.toFixed(1)}%</div>
                <div className="text-xs text-green-600">Attendance Rate</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <Award className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{studentStats.grades.average.toFixed(1)}%</div>
                <div className="text-xs text-purple-600">Average Grade</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <DollarSign className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-900">{studentStats.payments.rate.toFixed(1)}%</div>
                <div className="text-xs text-emerald-600">Payment Rate</div>
              </div>
            </div>
          </div>

          {/* Comprehensive Student Profile */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="h-4 w-4 mr-2" />
              Comprehensive Student Profile
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Information Card */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Personal Information
                </h5>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Full Name:</span>
                    <span className="font-medium text-gray-900">{student.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Info:</span>
                    <span className="font-medium text-gray-900">{student.contactInfo || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parent Phone:</span>
                    <span className="font-medium text-gray-900">{student.parentPhone || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created Date:</span>
                    <span className="font-medium text-gray-900">{new Date(student.createdAt).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Groups:</span>
                    <span className="font-medium text-blue-600">{studentGroups.length} group(s)</span>
                  </div>
                </div>
              </div>

              {/* Student Notes & Observations */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Ongoing Notes & Observations
                </h5>
                {student.notes ? (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-gray-800 leading-relaxed">{student.notes}</p>
                    <div className="mt-3 text-xs text-blue-600">
                      <span className="font-medium">Note:</span> These are general observations about the student's behavior, progress, and specific needs.
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No ongoing notes recorded</p>
                    <p className="text-xs text-gray-400 mt-1">Add notes to track student progress and needs</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Qualitative Feedback Analysis */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Qualitative Feedback Analysis
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Assessment Comments Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Assessment Feedback
                </h5>
                {filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 mb-3">
                      {filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length} assessment(s) with detailed feedback
                    </div>
                    {filteredData.grades
                      .filter(g => g.comments && g.comments.trim() !== '')
                      .slice(0, 3)
                      .map((grade, index) => {
                        const assessment = filteredData.assessments.find(a => a.id === grade.assessmentId);
                        return (
                          <div key={grade.id} className="bg-yellow-50 rounded-lg p-3 border-l-4 border-yellow-400">
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-sm font-medium text-gray-900">{assessment?.name || 'Assessment'}</span>
                              <span className="text-xs text-gray-500">{assessment ? new Date(assessment.date).toLocaleDateString('ar-SA') : ''}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed">{grade.comments}</p>
                          </div>
                        );
                      })}
                    {filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length > 3 && (
                      <div className="text-center mt-3">
                        <span className="text-sm text-blue-600 font-medium">
                          +{filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length - 3} more feedback entries
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No assessment feedback recorded</p>
                    <p className="text-xs text-gray-400 mt-1">Add comments when grading assessments</p>
                  </div>
                )}
              </div>

              {/* Progress Insights */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h5 className="font-medium text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Progress Insights
                </h5>
                <div className="space-y-4">
                  {/* Attendance Insights */}
                  <div className="bg-green-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-900">Attendance Pattern</span>
                      <span className="text-xs text-green-600">{studentStats.attendance.rate.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-green-700">
                      {studentStats.attendance.rate >= 90 ? 'Excellent attendance record' :
                       studentStats.attendance.rate >= 80 ? 'Good attendance with room for improvement' :
                       studentStats.attendance.rate >= 70 ? 'Moderate attendance - consider support strategies' :
                       'Low attendance - intervention recommended'}
                    </div>
                  </div>

                  {/* Grade Insights */}
                  <div className="bg-blue-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-blue-900">Academic Performance</span>
                      <span className="text-xs text-blue-600">{studentStats.grades.average.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-blue-700">
                      {studentStats.grades.average >= 90 ? 'Outstanding academic performance' :
                       studentStats.grades.average >= 80 ? 'Strong academic performance' :
                       studentStats.grades.average >= 70 ? 'Satisfactory performance - monitor progress' :
                       'Performance below expectations - support needed'}
                    </div>
                  </div>

                  {/* Payment Insights */}
                  <div className="bg-emerald-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-emerald-900">Financial Compliance</span>
                      <span className="text-xs text-emerald-600">{studentStats.payments.rate.toFixed(1)}%</span>
                    </div>
                    <div className="text-xs text-emerald-700">
                      {studentStats.payments.rate >= 90 ? 'Excellent payment compliance' :
                       studentStats.payments.rate >= 80 ? 'Good payment compliance' :
                       studentStats.payments.rate >= 70 ? 'Moderate compliance - follow up recommended' :
                       'Low compliance - immediate attention needed'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Key Data Fields for Long-term Monitoring */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Key Data Fields for Long-term Monitoring
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Student Notes Field */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
                <h5 className="font-medium text-blue-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Student Notes Field
                </h5>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h6 className="font-medium text-blue-800 mb-2">Purpose & Usage</h6>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• General, ongoing observations about student behavior</li>
                      <li>• Long-term progress tracking and development notes</li>
                      <li>• Specific needs identification and accommodation notes</li>
                      <li>• Behavioral patterns and intervention strategies</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-blue-200">
                    <h6 className="font-medium text-blue-800 mb-2">Current Status</h6>
                    {student.notes ? (
                      <div className="text-sm text-blue-700">
                        <span className="font-medium">Active Notes:</span> {student.notes.length} characters
                        <div className="mt-2 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                          "{student.notes.substring(0, 100)}{student.notes.length > 100 ? '...' : ''}"
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-blue-700">
                        <span className="font-medium">Status:</span> No notes recorded
                        <div className="mt-2 text-xs text-blue-600">
                          Consider adding notes for long-term monitoring
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Grade Comments Field */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <h5 className="font-medium text-green-900 mb-4 flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Grade Comments Field
                </h5>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h6 className="font-medium text-green-800 mb-2">Purpose & Usage</h6>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Specific feedback related to particular assessments</li>
                      <li>• Detailed guidance for improvement and growth</li>
                      <li>• Achievement recognition and encouragement</li>
                      <li>• Targeted support recommendations</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-green-200">
                    <h6 className="font-medium text-green-800 mb-2">Current Status</h6>
                    <div className="text-sm text-green-700">
                      <span className="font-medium">Feedback Coverage:</span> {filteredData.grades.length > 0 ? 
                        `${((filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length / filteredData.grades.length) * 100).toFixed(0)}%` : 
                        '0%'} of assessments have feedback
                      <div className="mt-2 text-xs text-green-600">
                        {filteredData.grades.filter(g => g.comments && g.comments.trim() !== '').length} out of {filteredData.grades.length} assessments include detailed comments
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Combined Benefits */}
            <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200">
              <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Combined Benefits for Comprehensive Monitoring
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h6 className="font-medium text-purple-800 mb-2">Holistic Understanding</h6>
                  <p className="text-sm text-purple-700">
                    Notes and comments together create a rich, qualitative record that complements quantitative data from grades and attendance.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h6 className="font-medium text-purple-800 mb-2">Targeted Support</h6>
                  <p className="text-sm text-purple-700">
                    Educators can quickly identify specific needs and provide individualized support based on comprehensive observations.
                  </p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <h6 className="font-medium text-purple-800 mb-2">Long-term Tracking</h6>
                  <p className="text-sm text-purple-700">
                    Continuous monitoring enables tracking of progress, behavioral changes, and intervention effectiveness over time.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Performance Trends
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Recent Attendance
                </h5>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-900">{studentStats.attendance.recentRate.toFixed(1)}%</div>
                  <div className="text-sm text-blue-600">Last 5 sessions</div>
                  {studentStats.attendance.recentRate > studentStats.attendance.rate ? (
                    <div className="text-green-600 text-sm mt-1 flex items-center justify-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Improving
                    </div>
                  ) : (
                    <div className="text-red-600 text-sm mt-1 flex items-center justify-center">
                      <TrendingDown className="h-3 w-3 mr-1" />
                      Declining
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Grade Trend
                </h5>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-900">
                    {studentStats.grades.trend > 0 ? '+' : ''}{studentStats.grades.trend.toFixed(1)}
                  </div>
                  <div className="text-sm text-green-600">Last 3 assessments</div>
                  <div className={`text-sm mt-1 flex items-center justify-center ${
                    studentStats.grades.trend > 0 ? 'text-green-600' : 
                    studentStats.grades.trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {studentStats.grades.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                     studentStats.grades.trend < 0 ? <TrendingDown className="h-3 w-3 mr-1" /> : 
                     <Target className="h-3 w-3 mr-1" />}
                    {studentStats.grades.trend > 0 ? 'Improving' : 
                     studentStats.grades.trend < 0 ? 'Declining' : 'Stable'}
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Overall Performance
                </h5>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-900">{studentStats.performance.overall.toFixed(1)}%</div>
                  <div className="text-sm text-purple-600">Combined Score</div>
                  <div className={`text-sm mt-1 flex items-center justify-center ${
                    studentStats.performance.trend === 'improving' ? 'text-green-600' : 
                    studentStats.performance.trend === 'declining' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {studentStats.performance.trend === 'improving' ? <TrendingUp className="h-3 w-3 mr-1" /> : 
                     studentStats.performance.trend === 'declining' ? <TrendingDown className="h-3 w-3 mr-1" /> : 
                     <Target className="h-3 w-3 mr-1" />}
                    {studentStats.performance.trend === 'improving' ? 'Improving' : 
                     studentStats.performance.trend === 'declining' ? 'Declining' : 'Stable'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Statistics */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Detailed Statistics
            </h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Attendance Breakdown
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Present:</span>
                    <span className="font-medium text-green-600">{studentStats.attendance.present}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Absent:</span>
                    <span className="font-medium text-red-600">{studentStats.attendance.absent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Excused:</span>
                    <span className="font-medium text-yellow-600">{studentStats.attendance.excused}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total:</span>
                    <span className="font-medium text-gray-900">{studentStats.attendance.total}</span>
                  </div>
                </div>
              </div>

              {/* Grade Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Award className="h-4 w-4 mr-2" />
                  Grade Breakdown
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Graded:</span>
                    <span className="font-medium text-blue-600">{studentStats.grades.graded}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Highest:</span>
                    <span className="font-medium text-green-600">{studentStats.grades.highest}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lowest:</span>
                    <span className="font-medium text-red-600">{studentStats.grades.lowest}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Average:</span>
                    <span className="font-medium text-gray-900">{studentStats.grades.average.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Payment Breakdown
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid:</span>
                    <span className="font-medium text-green-600">${studentStats.payments.paid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unpaid:</span>
                    <span className="font-medium text-red-600">${studentStats.payments.unpaid}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-gray-900 font-medium">Total:</span>
                    <span className="font-medium text-gray-900">${studentStats.payments.total}</span>
                  </div>
                </div>
              </div>

              {/* Group Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Group Information
                </h5>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Groups:</span>
                    <span className="font-medium text-blue-600">{studentGroups.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Primary Group:</span>
                    <span className="font-medium text-gray-900">{studentGroups[0]?.name || 'None'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium text-gray-900">{student.contactInfo || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Parent Phone:</span>
                    <span className="font-medium text-gray-900">{student.parentPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          {sessionDetails.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="h-4 w-4 mr-2" />
                Session Details ({sessionDetails.length} sessions)
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Topic</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {sessionDetails.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.time}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.groupName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{session.topic}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.attendanceStatus === 'present' ? 'bg-green-100 text-green-800' :
                              session.attendanceStatus === 'absent' ? 'bg-red-100 text-red-800' :
                              session.attendanceStatus === 'excused' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {session.attendanceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Details */}
          {assessmentDetails.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Assessment Details ({assessmentDetails.length} assessments)
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {assessmentDetails.map((assessment) => (
                        <tr key={assessment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assessment.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.groupName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {assessment.score !== 'Not Graded' ? `${assessment.score}/${assessment.maxScore}` : 'Not Graded'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{assessment.percentage}</td>
                          <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                            {assessment.comments ? (
                              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded-r-lg">
                                <p className="text-sm text-gray-800 leading-relaxed">{assessment.comments}</p>
                                <div className="mt-2 text-xs text-yellow-600">
                                  <span className="font-medium">Feedback:</span> Specific guidance for improvement
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-3 rounded-lg text-center">
                                <span className="text-xs text-gray-500">No feedback provided</span>
                                <div className="text-xs text-gray-400 mt-1">Add comments when grading</div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payment Details */}
          {paymentDetails.length > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Payment Details ({paymentDetails.length} payments)
              </h4>
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid Date</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {paymentDetails.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.month}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.groupName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${payment.amount}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                              payment.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                              payment.status === 'waived' ? 'bg-blue-100 text-blue-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.dueDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payment.paidDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* No Data Message */}
          {sessionDetails.length === 0 && assessmentDetails.length === 0 && paymentDetails.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
              <p className="text-gray-500">No sessions, assessments, or payments found for the selected date range.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentReportModal; 
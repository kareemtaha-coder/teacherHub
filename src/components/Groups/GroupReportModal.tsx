import React, { useMemo } from 'react';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Group } from '../../types';
import { X, Users, Calendar, BarChart3, TrendingUp, TrendingDown, User, CheckCircle, XCircle, AlertCircle, Download } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/generators';
import { exportToCSV } from '../../utils/exportUtils';

interface GroupReportModalProps {
  group: Group;
  onClose: () => void;
}

const GroupReportModal: React.FC<GroupReportModalProps> = ({ group, onClose }) => {
  const { getStudentsInGroup, getSessionsForGroup, getAttendanceForSession, getAssessmentsForGroup, getGradesForAssessment, getPaymentsForGroup } = useDataQueries();
  
  const students = getStudentsInGroup(group.id);
  const sessions = getSessionsForGroup(group.id);
  const assessments = getAssessmentsForGroup(group.id);
  const payments = getPaymentsForGroup(group.id);

  // Calculate group statistics
  const groupStats = useMemo(() => {
    let totalSessions = sessions.length;
    let totalAssessments = assessments.length;
    let totalAttendanceRecords = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalExcused = 0;

    sessions.forEach(session => {
      const attendance = getAttendanceForSession(session.id);
      totalAttendanceRecords += attendance.length;
      attendance.forEach(record => {
        if (record.status === 'present') totalPresent++;
        else if (record.status === 'absent') totalAbsent++;
        else if (record.status === 'excused') totalExcused++;
      });
    });

    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalPresent / totalAttendanceRecords) * 100 : 0;

    // Calculate payment statistics
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    const currentMonthPayments = payments.filter(p => p.month === currentMonth);
    const totalPaymentAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = currentMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    const collectionRate = totalPaymentAmount > 0 ? (paidAmount / totalPaymentAmount) * 100 : 0;

    return {
      totalSessions,
      totalAssessments,
      totalAttendanceRecords,
      totalPresent,
      totalAbsent,
      totalExcused,
      overallAttendanceRate,
      totalPaymentAmount,
      paidAmount,
      collectionRate
    };
  }, [sessions, assessments, payments, getAttendanceForSession]);

  // Calculate student performance data
  const studentPerformance = useMemo(() => {
    return students.map(student => {
      // Attendance data
      let studentPresent = 0;
      let studentAbsent = 0;
      let studentExcused = 0;
      let studentTotalSessions = 0;

      sessions.forEach(session => {
        const attendance = getAttendanceForSession(session.id);
        const studentAttendance = attendance.find(a => a.studentId === student.id);
        if (studentAttendance) {
          studentTotalSessions++;
          if (studentAttendance.status === 'present') studentPresent++;
          else if (studentAttendance.status === 'absent') studentAbsent++;
          else if (studentAttendance.status === 'excused') studentExcused++;
        }
      });

      const studentAttendanceRate = studentTotalSessions > 0 ? (studentPresent / studentTotalSessions) * 100 : 0;

      // Grade data
      let totalScore = 0;
      let totalMaxScore = 0;
      let gradedAssessments = 0;

      assessments.forEach(assessment => {
        const grades = getGradesForAssessment(assessment.id);
        const studentGrade = grades.find(g => g.studentId === student.id);
        if (studentGrade) {
          totalScore += studentGrade.score;
          totalMaxScore += assessment.maxScore;
          gradedAssessments++;
        }
      });

      const averageGrade = gradedAssessments > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      // Payment data
      const currentMonth = new Date().toISOString().slice(0, 7);
      const studentPayments = payments.filter(p => p.studentId === student.id && p.month === currentMonth);
      const totalPaymentAmount = studentPayments.reduce((sum, p) => sum + p.amount, 0);
      const paidAmount = studentPayments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0);
      const paymentRate = totalPaymentAmount > 0 ? (paidAmount / totalPaymentAmount) * 100 : 0;

      return {
        student,
        attendance: {
          present: studentPresent,
          absent: studentAbsent,
          excused: studentExcused,
          total: studentTotalSessions,
          rate: studentAttendanceRate
        },
        grades: {
          totalScore,
          totalMaxScore,
          gradedAssessments,
          average: averageGrade
        },
        payments: {
          totalAmount: totalPaymentAmount,
          paidAmount,
          rate: paymentRate,
          status: studentPayments.length > 0 ? studentPayments[0].status : 'unpaid'
        }
      };
    });
  }, [students, sessions, assessments, payments, getAttendanceForSession, getGradesForAssessment]);

  // Sort students by attendance rate (descending)
  const sortedStudentPerformance = useMemo(() => 
    [...studentPerformance].sort((a, b) => b.attendance.rate - a.attendance.rate),
    [studentPerformance]
  );

  // Calculate additional statistics
  const additionalStats = useMemo(() => {
    const studentsWithGrades = studentPerformance.filter(s => s.grades.gradedAssessments > 0);
    const averageGrade = studentsWithGrades.length > 0 
      ? studentsWithGrades.reduce((acc, s) => acc + s.grades.average, 0) / studentsWithGrades.length 
      : 0;
    
    const topPerformers = sortedStudentPerformance.slice(0, 3);
    const needsImprovement = sortedStudentPerformance.filter(s => s.attendance.rate < 60);
    
    return {
      averageGrade,
      topPerformers,
      needsImprovement,
      studentsWithGrades: studentsWithGrades.length
    };
  }, [studentPerformance, sortedStudentPerformance]);

  // Export report data
  const exportReport = () => {
    // Export group overview
    const groupOverview = [{
      'Group Name': group.name,
      'Description': group.description || 'No description',
      'Total Students': students.length,
      'Total Sessions': groupStats.totalSessions,
      'Total Assessments': groupStats.totalAssessments,
      'Overall Attendance Rate': groupStats.overallAttendanceRate.toFixed(1) + '%',
      'Total Payment Amount': groupStats.totalPaymentAmount,
      'Paid Amount': groupStats.paidAmount,
      'Collection Rate': groupStats.collectionRate.toFixed(1) + '%',
      'Generated Date': new Date().toLocaleDateString('ar-SA'),
      'Generated Time': new Date().toLocaleTimeString('ar-SA')
    }];
    
    exportToCSV(groupOverview, `${group.name}-overview`);
    
    // Export student performance
    const studentPerformanceData = studentPerformance.map(sp => ({
      'Student Name': sp.student.fullName,
      'Parent Phone': sp.student.parentPhone || '',
      'Attendance Rate': sp.attendance.rate.toFixed(1) + '%',
      'Present Sessions': sp.attendance.present,
      'Total Sessions': sp.attendance.total,
      'Average Grade': sp.grades.average.toFixed(1) + '%',
      'Graded Assessments': sp.grades.gradedAssessments,
      'Total Score': sp.grades.totalScore,
      'Max Score': sp.grades.totalMaxScore
    }));
    
    exportToCSV(studentPerformanceData, `${group.name}-student-performance`);
    
    // Export recent sessions
    const sessionsData = sessions.slice(0, 5).map(session => {
      const attendance = getAttendanceForSession(session.id);
      const presentCount = attendance.filter(a => a.status === 'present').length;
      const totalStudentsInSession = getStudentsInGroup(session.groupId).length;
      const sessionAttendanceRate = totalStudentsInSession > 0 ? (presentCount / totalStudentsInSession) * 100 : 0;
      
      return {
        'Date': formatDateTime(session.dateTime),
        'Topic': session.topic || 'Class Session',
        'Present Students': presentCount,
        'Total Students': totalStudentsInSession,
        'Attendance Rate': sessionAttendanceRate.toFixed(0) + '%'
      };
    });
    
    exportToCSV(sessionsData, `${group.name}-recent-sessions`);
    
    // Export recent assessments
    const assessmentsData = assessments.slice(0, 5).map(assessment => {
      const grades = getGradesForAssessment(assessment.id);
      const studentsInGroup = getStudentsInGroup(assessment.groupId);
      const gradedCount = grades.length;
      const totalStudents = studentsInGroup.length;
      const completionRate = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
      
      return {
        'Assessment Name': assessment.name,
        'Date': formatDate(assessment.date),
        'Max Score': assessment.maxScore,
        'Graded Students': gradedCount,
        'Total Students': totalStudents,
        'Completion Rate': completionRate.toFixed(0) + '%'
      };
    });
    
    exportToCSV(assessmentsData, `${group.name}-recent-assessments`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Group Report - {group.name}</h3>
            <p className="text-sm text-gray-600 mt-1">
              {students.length} students • {groupStats.totalSessions} sessions • {groupStats.totalAssessments} assessments
            </p>
            {group.description && (
              <p className="text-sm text-gray-500">{group.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportReport}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors"
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Group Overview Statistics */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Group Overview</h4>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-900">{students.length}</div>
                <div className="text-xs text-blue-600">Students</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-900">{groupStats.totalSessions}</div>
                <div className="text-xs text-green-600">Sessions</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <BarChart3 className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-900">{groupStats.totalAssessments}</div>
                <div className="text-xs text-purple-600">Assessments</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-900">{groupStats.overallAttendanceRate.toFixed(1)}%</div>
                <div className="text-xs text-orange-600">Attendance Rate</div>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <BarChart3 className="h-6 w-6 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-900">{groupStats.collectionRate.toFixed(1)}%</div>
                <div className="text-xs text-emerald-600">Payment Rate</div>
              </div>
            </div>
          </div>

          {/* Additional Statistics */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Performance Insights</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Top Performers */}
              <div className="bg-green-50 rounded-lg p-4">
                <h5 className="font-medium text-green-900 mb-3 flex items-center">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Top Performers
                </h5>
                {additionalStats.topPerformers.length > 0 ? (
                  <div className="space-y-2">
                    {additionalStats.topPerformers.map((sp, index) => (
                      <div key={sp.student.id} className="flex items-center justify-between text-sm">
                        <span className="text-green-800">{index + 1}. {sp.student.fullName}</span>
                        <span className="font-medium text-green-900">{sp.attendance.rate.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-green-700">No data available</p>
                )}
              </div>

              {/* Students Needing Improvement */}
              <div className="bg-yellow-50 rounded-lg p-4">
                <h5 className="font-medium text-yellow-900 mb-3 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Needs Improvement
                </h5>
                {additionalStats.needsImprovement.length > 0 ? (
                  <div className="space-y-2">
                    {additionalStats.needsImprovement.map((sp) => (
                      <div key={sp.student.id} className="flex items-center justify-between text-sm">
                        <span className="text-yellow-800">{sp.student.fullName}</span>
                        <span className="font-medium text-yellow-900">{sp.attendance.rate.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-yellow-700">All students performing well!</p>
                )}
              </div>

              {/* Grade Summary */}
              <div className="bg-purple-50 rounded-lg p-4">
                <h5 className="font-medium text-purple-900 mb-3 flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Grade Summary
                </h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-purple-800">Students with Grades:</span>
                    <span className="font-medium text-purple-900">{additionalStats.studentsWithGrades}/{students.length}</span>
                  </div>
                  {additionalStats.averageGrade > 0 && (
                    <div className="flex justify-between">
                      <span className="text-purple-800">Average Grade:</span>
                      <span className="font-medium text-purple-900">{additionalStats.averageGrade.toFixed(1)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Performance Table */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Student Performance</h4>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Grades
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payments
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Performance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedStudentPerformance.map((item) => (
                      <tr key={item.student.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{item.student.fullName}</div>
                              {item.student.parentPhone && (
                                <div className="text-xs text-gray-500">Parent: {item.student.parentPhone}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="flex items-center space-x-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>{item.attendance.present}</span>
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span>{item.attendance.absent}</span>
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              <span>{item.attendance.excused}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Rate: {item.attendance.rate.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="mb-1">
                              {item.grades.gradedAssessments > 0 ? (
                                <>
                                  <span className="font-medium">{item.grades.average.toFixed(1)}%</span>
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({item.grades.gradedAssessments} assessments)
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500">No grades</span>
                              )}
                            </div>
                            {item.grades.gradedAssessments > 0 && (
                              <div className="text-xs text-gray-500">
                                Score: {item.grades.totalScore}/{item.grades.totalMaxScore}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            <div className="mb-1">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                item.payments.status === 'paid' ? 'bg-green-100 text-green-800' :
                                item.payments.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                item.payments.status === 'waived' ? 'bg-gray-100 text-gray-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.payments.status.charAt(0).toUpperCase() + item.payments.status.slice(1)}
                              </span>
                            </div>
                            {item.payments.totalAmount > 0 && (
                              <div className="text-xs text-gray-500">
                                {item.payments.paidAmount}/{item.payments.totalAmount} ({item.payments.rate.toFixed(0)}%)
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    item.attendance.rate >= 80 ? 'bg-green-500' :
                                    item.attendance.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${item.attendance.rate}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className={`text-xs font-medium ${
                              item.attendance.rate >= 80 ? 'text-green-600' :
                              item.attendance.rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {item.attendance.rate >= 80 ? 'Excellent' :
                               item.attendance.rate >= 60 ? 'Good' : 'Needs Improvement'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Sessions */}
          {sessions.length > 0 && (
            <div className="mb-8">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Sessions</h4>
              <div className="space-y-3">
                {sessions.slice(0, 5).map(session => {
                  const attendance = getAttendanceForSession(session.id);
                  const present = attendance.filter(a => a.status === 'present').length;
                  const total = students.length;
                  const rate = total > 0 ? (present / total) * 100 : 0;
                  
                  return (
                    <div key={session.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900">
                            {session.topic || 'Class Session'}
                          </h5>
                          <p className="text-sm text-gray-600">{formatDateTime(session.dateTime)}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {present}/{total} present
                          </div>
                          <div className={`text-sm ${
                            rate >= 80 ? 'text-green-600' : rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            {rate.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Assessments */}
          {assessments.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Assessments</h4>
              <div className="space-y-3">
                {assessments.slice(0, 5).map(assessment => {
                  const grades = getGradesForAssessment(assessment.id);
                  const graded = grades.length;
                  const total = students.length;
                  const average = grades.length > 0 
                    ? grades.reduce((acc, grade) => acc + (grade.score / assessment.maxScore) * 100, 0) / grades.length 
                    : 0;
                  
                  return (
                    <div key={assessment.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-gray-900">{assessment.name}</h5>
                          <p className="text-sm text-gray-600">
                            {formatDate(assessment.date)} • Max Score: {assessment.maxScore}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            {graded}/{total} graded
                          </div>
                          <div className="text-sm text-gray-600">
                            {graded > 0 ? `Avg: ${average.toFixed(1)}%` : 'No grades'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupReportModal; 
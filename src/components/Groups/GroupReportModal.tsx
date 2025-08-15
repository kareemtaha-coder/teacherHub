import React, { useMemo, useRef } from 'react';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Group } from '../../types';
import { X, Users, Calendar, BarChart3, TrendingUp, TrendingDown, User, CheckCircle, XCircle, AlertCircle, Download, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/generators';
import { exportToCSV } from '../../utils/exportUtils';
import { useLanguage } from '../../context/LanguageContext';
import generatePDF from 'react-to-pdf';

interface GroupReportModalProps {
  group: Group;
  onClose: () => void;
}

const GroupReportModal: React.FC<GroupReportModalProps> = ({ group, onClose }) => {
  const { t } = useLanguage();
  const { getStudentsInGroup, getSessionsForGroup, getAttendanceForSession, getAssessmentsForGroup, getGradesForAssessment } = useDataQueries();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const students = getStudentsInGroup(group.id);
  const sessions = getSessionsForGroup(group.id);
  const assessments = getAssessmentsForGroup(group.id);

  // Calculate essential group statistics
  const groupStats = useMemo(() => {
    let totalAttendanceRecords = 0;
    let totalPresent = 0;

    sessions.forEach(session => {
      const attendance = getAttendanceForSession(session.id);
      totalAttendanceRecords += attendance.length;
      attendance.forEach(record => {
        if (record.status === 'present') totalPresent++;
      });
    });

    const overallAttendanceRate = totalAttendanceRecords > 0 ? (totalPresent / totalAttendanceRecords) * 100 : 0;

    return {
      totalSessions: sessions.length,
      totalAssessments: assessments.length,
      overallAttendanceRate
    };
  }, [sessions, assessments, getAttendanceForSession]);

  // Calculate essential student performance data
  const studentPerformance = useMemo(() => {
    return students.map(student => {
      // Attendance data
      let studentPresent = 0;
      let studentTotalSessions = 0;

      sessions.forEach(session => {
        const attendance = getAttendanceForSession(session.id);
        const studentAttendance = attendance.find(a => a.studentId === student.id);
        if (studentAttendance) {
          studentTotalSessions++;
          if (studentAttendance.status === 'present') studentPresent++;
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

      return {
        student,
        attendance: {
          rate: studentAttendanceRate,
          total: studentTotalSessions,
          present: studentPresent
        },
        grades: {
          average: averageGrade,
          total: gradedAssessments
        }
      };
    });
  }, [students, sessions, assessments, getAttendanceForSession, getGradesForAssessment]);

  // Get top performers and students needing improvement
  const performanceInsights = useMemo(() => {
    const sortedStudents = [...studentPerformance].sort((a, b) => b.attendance.rate - a.attendance.rate);
    
    return {
      topPerformers: sortedStudents.slice(0, 3),
      needsImprovement: sortedStudents.filter(s => s.attendance.rate < 80).slice(0, 3),
      studentsWithGrades: studentPerformance.filter(s => s.grades.total > 0).length
    };
  }, [studentPerformance]);

  // Export essential data
  const exportReport = () => {
    // Export student performance
    const studentData = studentPerformance.map(sp => ({
      'Student Name': sp.student.fullName,
      'Attendance Rate': sp.attendance.rate.toFixed(1) + '%',
      'Sessions Attended': sp.attendance.present,
      'Total Sessions': sp.attendance.total,
      'Average Grade': sp.grades.average.toFixed(1) + '%',
      'Assessments Graded': sp.grades.total
    }));
    
    exportToCSV(studentData, `${group.name}-student-performance`);
  };

  // Download PDF report
  const downloadPDF = () => {
    if (reportRef.current) {
      generatePDF(reportRef, {
        filename: `${group.name}-report-${new Date().toISOString().split('T')[0]}.pdf`,
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
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Group Report - {group.name}</h3>
            <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
              {students.length} students • {groupStats.totalSessions} sessions • {groupStats.totalAssessments} assessments
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
              onClick={exportReport}
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
                  <Users className="h-12 w-12 text-blue-600" />
                </div>
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3">Group Performance Report</h1>
              <h2 className="text-3xl font-semibold text-blue-600 mb-2">{group.name}</h2>
              <div className="text-lg text-gray-600 space-y-1">
                <p>Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p>Report Period: {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long' 
                })}</p>
              </div>
              {group.description && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg inline-block">
                  <p className="text-base text-gray-700 font-medium">{group.description}</p>
                </div>
              )}
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
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Generated Date</div>
                    <div className="text-base font-bold text-gray-900">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date().toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="text-xs text-blue-600 font-medium uppercase tracking-wide mb-1">Report Period</div>
                    <div className="text-base font-bold text-gray-900">
                      {new Date().toLocaleDateString('en-US', { 
                        month: 'long',
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Current Month Analysis</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Executive Summary</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{students.length}</div>
                  <div className="text-sm font-medium text-blue-800">Total Students</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-green-600 mb-1">{groupStats.totalSessions}</div>
                  <div className="text-sm font-medium text-green-800">Sessions Conducted</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-purple-600 mb-1">{groupStats.totalAssessments}</div>
                  <div className="text-sm font-medium text-purple-800">Assessments</div>
                </div>
                <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                  <div className="text-3xl font-bold text-orange-600 mb-1">{groupStats.overallAttendanceRate.toFixed(1)}%</div>
                  <div className="text-sm font-medium text-orange-800">Attendance Rate</div>
                </div>
              </div>
            </div>

            {/* Performance Insights */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Performance Insights</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                  <h4 className="text-xl font-bold text-green-900 mb-4 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 mr-2" />
                    Top Performers
                  </h4>
                  {performanceInsights.topPerformers.length > 0 ? (
                    <div className="space-y-3">
                      {performanceInsights.topPerformers.map((sp, index) => (
                        <div key={sp.student.id} className="bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-bold text-green-700">{index + 1}</span>
                              </div>
                              <span className="text-base font-medium text-green-800">{sp.student.fullName}</span>
                            </div>
                            <span className="text-lg font-bold text-green-900 bg-green-100 px-3 py-1 rounded-full">
                              {sp.attendance.rate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-green-700 font-medium">No data available</p>
                    </div>
                  )}
                </div>

                {/* Students Needing Improvement */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 border border-yellow-200">
                  <h4 className="text-xl font-bold text-yellow-900 mb-4 flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 mr-2" />
                    Needs Improvement
                  </h4>
                  {performanceInsights.needsImprovement.length > 0 ? (
                    <div className="space-y-3">
                      {performanceInsights.needsImprovement.map((sp) => (
                        <div key={sp.student.id} className="bg-white rounded-lg p-3 border border-yellow-200 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-base font-medium text-yellow-800">{sp.student.fullName}</span>
                            <span className="text-lg font-bold text-yellow-900 bg-yellow-100 px-3 py-1 rounded-full">
                              {sp.attendance.rate.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-yellow-700 font-medium">All students performing well!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Student Performance Table */}
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Student Performance Analysis</h3>
              <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Student Name</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Attendance Rate</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Sessions</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Average Grade</th>
                        <th className="px-6 py-4 text-center text-sm font-bold text-gray-900 uppercase tracking-wider border-b-2 border-gray-200">Assessments</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentPerformance.map((sp, index) => (
                        <tr key={sp.student.id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-bold text-blue-700">{index + 1}</span>
                              </div>
                              {sp.student.fullName}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                              sp.attendance.rate >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                              sp.attendance.rate >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                              sp.attendance.rate >= 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                              'bg-red-100 text-red-800 border border-red-200'
                            }`}>
                              {sp.attendance.rate.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                            {sp.attendance.present}/{sp.attendance.total}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {sp.grades.total > 0 ? (
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                sp.grades.average >= 90 ? 'bg-green-100 text-green-800 border border-green-200' :
                                sp.grades.average >= 80 ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                sp.grades.average >= 70 ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {sp.grades.average.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="text-gray-400 text-sm font-medium">No grades</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                            {sp.grades.total}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Recent Sessions Summary */}
            {sessions.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Recent Sessions Overview</h3>
                <div className="space-y-4">
                  {sessions.slice(0, 5).map((session, index) => {
                    const attendance = getAttendanceForSession(session.id);
                    const presentCount = attendance.filter(a => a.status === 'present').length;
                    const totalStudentsInSession = students.length;
                    const sessionAttendanceRate = totalStudentsInSession > 0 ? (presentCount / totalStudentsInSession) * 100 : 0;
                    
                    return (
                      <div key={session.id} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-5 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-bold text-blue-700">{index + 1}</span>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900">{session.topic || 'Class Session'}</h4>
                            </div>
                            {/* Enhanced Mobile Date Display */}
                            <div className="lg:hidden mb-3">
                              <div className="bg-white rounded-lg p-3 border border-blue-200">
                                <div className="flex items-center mb-2">
                                  <Calendar className="h-4 w-4 text-blue-600 mr-2" />
                                  <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Session Date & Time</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900 mb-1">
                                  {new Date(session.dateTime).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">
                                  {new Date(session.dateTime).toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}
                                </div>
                              </div>
                            </div>
                            {/* Desktop Date Display */}
                            <p className="hidden lg:block text-sm text-gray-600 font-medium">{formatDateTime(session.dateTime)}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-900 mb-1">{sessionAttendanceRate.toFixed(0)}%</div>
                            <div className="text-sm text-gray-600 font-medium">{presentCount}/{totalStudentsInSession} present</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recent Assessments Summary */}
            {assessments.length > 0 && (
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center border-b-2 border-gray-200 pb-3">Recent Assessments Overview</h3>
                <div className="space-y-4">
                  {assessments.slice(0, 5).map((assessment, index) => {
                    const grades = getGradesForAssessment(assessment.id);
                    const gradedCount = grades.length;
                    const totalStudents = students.length;
                    const completionRate = totalStudents > 0 ? (gradedCount / totalStudents) * 100 : 0;
                    
                    return (
                      <div key={assessment.id} className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-lg p-5 border border-gray-200 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-bold text-purple-700">{index + 1}</span>
                              </div>
                              <h4 className="text-lg font-bold text-gray-900">{assessment.name}</h4>
                            </div>
                            {/* Enhanced Mobile Date Display */}
                            <div className="lg:hidden mb-3">
                              <div className="bg-white rounded-lg p-3 border border-purple-200">
                                <div className="flex items-center mb-2">
                                  <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                                  <span className="text-xs text-purple-600 font-medium uppercase tracking-wide">Assessment Date</span>
                                </div>
                                <div className="text-sm font-bold text-gray-900 mb-1">
                                  {new Date(assessment.date).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-gray-600 font-medium">Max Score: {assessment.maxScore}</div>
                              </div>
                            </div>
                            {/* Desktop Date Display */}
                            <p className="hidden lg:block text-sm text-gray-600 font-medium">{formatDate(assessment.date)} • Max Score: {assessment.maxScore}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-purple-900 mb-1">{completionRate.toFixed(0)}%</div>
                            <div className="text-sm text-gray-600 font-medium">{gradedCount}/{totalStudents} graded</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* PDF Footer */}
            <div className="mt-12 pt-8 border-t-2 border-gray-300 text-center">
              <div className="mb-4">
                <div className="inline-block p-2 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-900 mb-2">TeacherHub - Professional Group Management</p>
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

export default GroupReportModal; 
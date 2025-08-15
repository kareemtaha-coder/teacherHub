import React, { useState } from 'react';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Student } from '../../types';
import { X, User, BookOpen, Calendar, BarChart3, Download } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/generators';
import StudentReportModal from './StudentReportModal';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
}

const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ student, onClose }) => {
  const { getGroupsForStudent, getGradesForStudent, getAttendanceForStudent } = useDataQueries();
  const [showReport, setShowReport] = useState(false);
  
  const groups = getGroupsForStudent(student.id);
  const grades = getGradesForStudent(student.id);
  const attendance = getAttendanceForStudent(student.id);

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const totalSessions = attendance.length;
  const attendanceRate = totalSessions > 0 ? (presentCount / totalSessions) * 100 : 0;

  const averageGrade = grades.length > 0 
    ? grades.reduce((acc, grade) => acc + (grade.score / grade.assessment.maxScore) * 100, 0) / grades.length
    : 0;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{student.fullName}</h3>
                <p className="text-sm text-gray-500">Student Profile</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowReport(true)}
                className="inline-flex items-center px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Report
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Basic Information */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Full Name:</span>
                  <span className="text-sm font-medium text-gray-900">{student.fullName}</span>
                </div>
                {student.contactInfo && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Contact Info:</span>
                    <span className="text-sm font-medium text-gray-900">{student.contactInfo}</span>
                  </div>
                )}
                {student.parentPhone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Parent Phone:</span>
                    <span className="text-sm font-medium text-gray-900">{student.parentPhone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm font-medium text-gray-900">{formatDate(student.createdAt)}</span>
                </div>
              </div>
              {student.notes && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Notes:</h5>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{student.notes}</p>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Statistics</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <BookOpen className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{groups.length}</div>
                  <div className="text-xs text-blue-600">Groups</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">{attendanceRate.toFixed(0)}%</div>
                  <div className="text-xs text-green-600">Attendance</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <BarChart3 className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-orange-900">
                    {grades.length > 0 ? averageGrade.toFixed(0) + '%' : 'N/A'}
                  </div>
                  <div className="text-xs text-orange-600">Avg Grade</div>
                </div>
              </div>
            </div>

            {/* Groups */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Groups</h4>
              {groups.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {groups.map(group => (
                    <span
                      key={group.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                    >
                      {group.name}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No groups assigned</p>
              )}
            </div>

            {/* Recent Grades */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Grades</h4>
              {grades.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {grades.slice(0, 5).map(grade => (
                    <div key={grade.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{grade.assessment.name}</div>
                        <div className="text-xs text-gray-500">{formatDate(grade.assessment.date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">
                          {grade.score}/{grade.assessment.maxScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {((grade.score / grade.assessment.maxScore) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No grades recorded</p>
              )}
            </div>

            {/* Recent Attendance */}
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Recent Attendance</h4>
              {attendance.length > 0 ? (
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {attendance.slice(0, 5).map(record => (
                    <div key={record.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{record.session.group.name}</div>
                        <div className="text-xs text-gray-500">{formatDateTime(record.session.dateTime)}</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'present' 
                          ? 'bg-green-100 text-green-800'
                          : record.status === 'absent'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {record.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No attendance records</p>
              )}
            </div>
          </div>

          <div className="flex justify-end p-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
      
      {showReport && (
        <StudentReportModal student={student} onClose={() => setShowReport(false)} />
      )}
    </>
  );
};

export default StudentDetailModal;
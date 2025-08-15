import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Session, AttendanceRecord } from '../../types';
import { X, User, CheckCircle, XCircle, AlertCircle, Users, Calendar, BookOpen, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDateTime } from '../../utils/generators';
import { useLanguage } from '../../context/LanguageContext';

interface AttendanceModalProps {
  session: Session;
  onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, onClose }) => {
  const { t } = useLanguage();
  const { dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getAttendanceForSession } = useDataQueries();
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  
  // Memoize these values to prevent infinite re-renders
  const group = useMemo(() => getGroupById(session.groupId), [getGroupById, session.groupId]);
  const students = useMemo(() => getStudentsInGroup(session.groupId), [getStudentsInGroup, session.groupId]);
  const existingAttendance = useMemo(() => getAttendanceForSession(session.id), [getAttendanceForSession, session.id]);

  useEffect(() => {
    // Initialize attendance data with existing records
    const initialData: Record<string, 'present' | 'absent' | 'excused'> = {};
    
    students.forEach(student => {
      const existingRecord = existingAttendance.find(record => record.studentId === student.id);
      initialData[student.id] = existingRecord ? existingRecord.status : 'absent';
    });
    
    setAttendanceData(initialData);
  }, [students, existingAttendance, session.id]);

  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'excused') => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save attendance for all students
    students.forEach(student => {
      dispatch({
        type: 'ADD_ATTENDANCE',
        payload: {
          sessionId: session.id,
          studentId: student.id,
          status: attendanceData[student.id] || 'absent'
        }
      });
    });
    
    onClose();
  };

  const getStatusIcon = (status: 'present' | 'absent' | 'excused') => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />;
      case 'excused':
        return <AlertCircle className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />;
      case 'absent':
      default:
        return <XCircle className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'present' | 'absent' | 'excused') => {
    switch (status) {
      case 'present':
        return 'border-green-200 bg-green-50';
      case 'excused':
        return 'border-yellow-200 bg-yellow-50';
      case 'absent':
      default:
        return 'border-red-200 bg-red-50';
    }
  };

  const presentCount = Object.values(attendanceData).filter(status => status === 'present').length;
  const excusedCount = Object.values(attendanceData).filter(status => status === 'excused').length;
  const absentCount = Object.values(attendanceData).filter(status => status === 'absent').length;
  const attendanceRate = students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0;

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl lg:rounded-lg max-w-md w-full p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">No Students</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </div>
          <div className="text-center mb-6 lg:mb-8">
            <Users className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
            <h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-4">No Students Found</h4>
            <p className="text-gray-600 text-base lg:text-lg">
              This group has no students assigned. Add students to the group first.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 lg:py-4 text-base lg:text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-xl lg:rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 lg:p-4 z-50">
      <div className="bg-white rounded-2xl lg:rounded-lg max-w-4xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Header - Mobile First */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-3 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Take Attendance</h3>
              </div>
              <div className="space-y-1 lg:space-y-2">
                <p className="text-sm lg:text-base text-gray-600 flex items-center">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-500" />
                  {group?.name}
                </p>
                <p className="text-sm lg:text-base text-gray-600 flex items-center">
                  <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-500" />
                  {formatDateTime(session.dateTime)}
                </p>
                {session.topic && (
                  <p className="text-sm lg:text-base text-gray-500 flex items-center">
                    <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-400" />
                    {session.topic}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl lg:rounded-lg hover:bg-gray-100 self-end lg:self-start"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </div>
        </div>

        {/* Summary Stats - Mobile First */}
        <div className="px-4 lg:px-6 py-4 lg:py-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-gray-200">
              <div className="text-lg lg:text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-xs lg:text-sm text-gray-500">Total Students</div>
            </div>
            <div className="bg-green-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-green-200">
              <div className="text-lg lg:text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-xs lg:text-sm text-green-600">Present</div>
            </div>
            <div className="bg-yellow-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-yellow-200">
              <div className="text-lg lg:text-2xl font-bold text-yellow-600">{excusedCount}</div>
              <div className="text-xs lg:text-sm text-yellow-600">Excused</div>
            </div>
            <div className="bg-red-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-red-200">
              <div className="text-lg lg:text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-xs lg:text-sm text-red-600">Absent</div>
            </div>
          </div>
          
          {/* Attendance Rate Bar */}
          <div className="mt-4 lg:mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm lg:text-base font-medium text-gray-700">Attendance Rate</span>
              <span className="text-sm lg:text-base font-bold text-gray-900">{attendanceRate}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
              <div 
                className={`h-2 lg:h-3 rounded-full transition-all duration-300 ${
                  attendanceRate >= 80 ? 'bg-green-500' : 
                  attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${attendanceRate}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Student List - Mobile First */}
        <div className="p-4 lg:p-6 max-h-96 lg:max-h-80 overflow-y-auto">
          <div className="space-y-3 lg:space-y-4">
            {students.map(student => {
              const status = attendanceData[student.id] || 'absent';
              const isExpanded = expandedStudent === student.id;
              
              return (
                <div
                  key={student.id}
                  className={`border rounded-xl lg:rounded-lg p-4 lg:p-6 transition-all duration-200 ${getStatusColor(status)} hover:shadow-md`}
                >
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-white flex items-center justify-center border-2 border-gray-200">
                        <User className="h-6 w-7 lg:h-7 lg:w-7 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-base lg:text-lg">{student.fullName}</p>
                        <p className="text-sm lg:text-base text-gray-500">ID: {student.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      {getStatusIcon(status)}
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(student.id, e.target.value as 'present' | 'absent' | 'excused')}
                        className="text-sm lg:text-base border-gray-300 rounded-lg lg:rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-2 lg:px-3 py-1 lg:py-2"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                      <button
                        onClick={() => toggleStudentExpansion(student.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? 
                          <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5" /> : 
                          <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Student Details - Always Visible */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-3">
                    {student.contactInfo && (
                      <div className="bg-white rounded-lg p-2 lg:p-3 border border-gray-200">
                        <p className="text-xs lg:text-sm text-gray-500 mb-1">Contact Info</p>
                        <p className="text-sm lg:text-base text-gray-900">{student.contactInfo}</p>
                      </div>
                    )}
                    {student.parentPhone && (
                      <div className="bg-white rounded-lg p-2 lg:p-3 border border-gray-200">
                        <p className="text-xs lg:text-sm text-gray-500 mb-1">Parent Phone</p>
                        <p className="text-sm lg:text-base text-gray-900">{student.parentPhone}</p>
                      </div>
                    )}
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-white rounded-lg p-3 lg:p-4 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">Attendance Details</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-green-600">{status === 'present' ? '✓' : '○'}</div>
                            <div className="text-xs lg:text-sm text-gray-600">Current Status</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900 capitalize">{status}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-blue-600">{student.id.slice(0, 6)}...</div>
                            <div className="text-xs lg:text-sm text-gray-600">Student ID</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">Short ID</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-purple-600">{group?.name?.slice(0, 8)}...</div>
                            <div className="text-xs lg:text-sm text-gray-600">Group</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">{group?.name}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions - Mobile First */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col space-y-3 lg:space-y-0">
            {/* Attendance Rate Info */}
            <div className="text-center lg:text-left">
              <div className="text-sm lg:text-base text-gray-600">
                <span className="font-medium">Attendance Rate:</span> 
                <span className={`ml-2 font-bold ${
                  attendanceRate >= 80 ? 'text-green-600' : 
                  attendanceRate >= 60 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {attendanceRate}%
                </span>
              </div>
              <div className="text-xs lg:text-sm text-gray-500 mt-1">
                {presentCount} present • {excusedCount} excused • {absentCount} absent
              </div>
            </div>
            
            {/* Action Buttons - Improved Mobile Layout */}
            <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3">
              <button
                onClick={onClose}
                className="w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl lg:rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-white rounded-xl lg:rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>Save Attendance</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
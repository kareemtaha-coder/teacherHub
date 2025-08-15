import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Session, AttendanceRecord } from '../../types';
import { X, User, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDateTime } from '../../utils/generators';

interface AttendanceModalProps {
  session: Session;
  onClose: () => void;
}

const AttendanceModal: React.FC<AttendanceModalProps> = ({ session, onClose }) => {
  const { dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getAttendanceForSession } = useDataQueries();
  const [attendanceData, setAttendanceData] = useState<Record<string, 'present' | 'absent' | 'excused'>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
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
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'excused':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'absent':
      default:
        return <XCircle className="h-5 w-5 text-red-600" />;
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

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">No Students</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            This group has no students assigned. Add students to the group first.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Take Attendance</h3>
            <p className="text-sm text-gray-600 mt-1">
              {group?.name} • {formatDateTime(session.dateTime)}
            </p>
            {session.topic && (
              <p className="text-sm text-gray-500">{session.topic}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
              <div className="text-xs text-gray-500">Present</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">{excusedCount}</div>
              <div className="text-xs text-gray-500">Excused</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
              <div className="text-xs text-gray-500">Absent</div>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-3">
            {students.map(student => {
              const status = attendanceData[student.id] || 'absent';
              return (
                <div
                  key={student.id}
                  className={`border rounded-lg p-4 transition-colors ${getStatusColor(status)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.fullName}</p>
                        {student.contactInfo && (
                          <p className="text-sm text-gray-500">{student.contactInfo}</p>
                        )}
                        {student.parentPhone && (
                          <p className="text-sm text-gray-500">Parent: {student.parentPhone}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(status)}
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(student.id, e.target.value as 'present' | 'absent' | 'excused')}
                        className="text-sm border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                        <option value="excused">Excused</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Attendance Rate: <span className="font-medium">
              {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}%
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Attendance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceModal;
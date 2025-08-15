import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { ClipboardList, Calendar, User, TrendingUp, TrendingDown } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/generators';

const AttendanceOverview: React.FC = () => {
  const { state } = useApp();
  const { getGroupById, getStudentsInGroup, getSessionsForGroup, getAttendanceForSession, getStudentById } = useDataQueries();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');

  // Filter sessions based on timeframe
  const filteredSessions = useMemo(() => {
    let sessions = state.sessions;
    
    if (selectedGroupId !== 'all') {
      sessions = sessions.filter(s => s.groupId === selectedGroupId);
    }

    const now = new Date();
    switch (selectedTimeframe) {
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        sessions = sessions.filter(s => new Date(s.dateTime) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        sessions = sessions.filter(s => new Date(s.dateTime) >= monthAgo);
        break;
      default:
        break;
    }

    return sessions.sort((a, b) => 
      new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
    );
  }, [state.sessions, selectedGroupId, selectedTimeframe]);

  // Calculate overall statistics
  const stats = useMemo(() => {
    let totalStudents = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let totalExcused = 0;

    filteredSessions.forEach(session => {
      const attendance = getAttendanceForSession(session.id);
      const studentsInGroup = getStudentsInGroup(session.groupId);
      
      attendance.forEach(record => {
        totalStudents++;
        if (record.status === 'present') totalPresent++;
        else if (record.status === 'absent') totalAbsent++;
        else if (record.status === 'excused') totalExcused++;
      });
    });

    const attendanceRate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;

    return {
      totalSessions: filteredSessions.length,
      totalStudents,
      totalPresent,
      totalAbsent,
      totalExcused,
      attendanceRate
    };
  }, [filteredSessions, getAttendanceForSession, getStudentsInGroup]);

  // Get student attendance summary
  const studentAttendanceSummary = useMemo(() => {
    const studentStats: Record<string, {
      id: string;
      name: string;
      present: number;
      absent: number;
      excused: number;
      total: number;
      rate: number;
    }> = {};

    filteredSessions.forEach(session => {
      const attendance = getAttendanceForSession(session.id);
      attendance.forEach(record => {
        if (!studentStats[record.studentId]) {
          const student = getStudentById(record.studentId);
          if (student) {
            studentStats[record.studentId] = {
              id: record.studentId,
              name: student.fullName,
              present: 0,
              absent: 0,
              excused: 0,
              total: 0,
              rate: 0
            };
          }
        }

        if (studentStats[record.studentId]) {
          studentStats[record.studentId][record.status]++;
          studentStats[record.studentId].total++;
        }
      });
    });

    // Calculate rates
    Object.values(studentStats).forEach(student => {
      student.rate = student.total > 0 ? (student.present / student.total) * 100 : 0;
    });

    return Object.values(studentStats).sort((a, b) => b.rate - a.rate);
  }, [filteredSessions, getAttendanceForSession, getStudentById]);

  // Memoize recent sessions data
  const recentSessionsData = useMemo(() => 
    filteredSessions.slice(0, 10).map(session => {
      const group = getGroupById(session.groupId);
      const attendance = getAttendanceForSession(session.id);
      const students = getStudentsInGroup(session.groupId);
      const present = attendance.filter(a => a.status === 'present').length;
      const total = students.length;
      const rate = total > 0 ? (present / total) * 100 : 0;

      return {
        session,
        group,
        stats: { present, total, rate }
      };
    }),
    [filteredSessions, getGroupById, getAttendanceForSession, getStudentsInGroup]
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Attendance Overview</h2>
        <p className="text-gray-600">Track and analyze student attendance patterns</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Groups</option>
              {state.groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Timeframe</label>
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'all')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="week">Last 7 days</option>
              <option value="month">Last 30 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 rounded-lg p-3 mr-4">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 rounded-lg p-3 mr-4">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
              <p className="text-2xl font-bold text-gray-900">{stats.attendanceRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 rounded-lg p-3 mr-4">
              <User className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Present</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPresent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 rounded-lg p-3 mr-4">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Absent</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalAbsent}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Sessions</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center">
                <ClipboardList className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No sessions found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {recentSessionsData.map(item => (
                  <div key={item.session.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {item.session.topic || 'Class Session'}
                        </h4>
                        <p className="text-sm text-gray-600">{item.group?.name}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(item.session.dateTime)}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {item.stats.present}/{item.stats.total} present
                        </div>
                        <div className={`text-sm ${
                          item.stats.rate >= 80 ? 'text-green-600' : item.stats.rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {item.stats.rate.toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Student Attendance Summary</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {studentAttendanceSummary.length === 0 ? (
              <div className="p-8 text-center">
                <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No attendance data found</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {studentAttendanceSummary.map(student => (
                  <div key={student.id} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium text-gray-900">{student.name}</h4>
                      <span className={`text-sm font-medium ${
                        student.rate >= 80 ? 'text-green-600' : 
                        student.rate >= 60 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {student.rate.toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Present: {student.present}</span>
                      <span>Absent: {student.absent}</span>
                      <span>Excused: {student.excused}</span>
                    </div>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${student.rate}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;
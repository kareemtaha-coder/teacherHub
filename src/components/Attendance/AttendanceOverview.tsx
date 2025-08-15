import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { ClipboardList, Calendar, User, TrendingUp, TrendingDown, X, Menu, BarChart3, CheckCircle, XCircle, AlertCircle, Clock, Users, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate, formatDateTime } from '../../utils/generators';
import { useLanguage } from '../../context/LanguageContext';

const AttendanceOverview: React.FC = () => {
  const { t } = useLanguage();
  const { state } = useApp();
  const { getGroupById, getStudentsInGroup, getSessionsForGroup, getAttendanceForSession, getStudentById } = useDataQueries();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

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

    // Filter by search term
    let filtered = Object.values(studentStats);
    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.rate - a.rate);
  }, [filteredSessions, getAttendanceForSession, getStudentById, searchTerm]);

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

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Attendance</h1>
            <p className="text-sm text-gray-600">{stats.totalSessions} sessions</p>
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <Filter className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Attendance Overview</h1>
            <p className="text-lg text-gray-600">Track and analyze student attendance patterns</p>
          </div>
        </div>

        {/* Search and Filters - Mobile First */}
        <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search students by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">Group</label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full lg:w-auto px-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
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
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">Timeframe</label>
                <select
                  value={selectedTimeframe}
                  onChange={(e) => setSelectedTimeframe(e.target.value as 'week' | 'month' | 'all')}
                  className="w-full lg:w-auto px-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
                >
                  <option value="week">Last 7 days</option>
                  <option value="month">Last 30 days</option>
                  <option value="all">All time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards - Mobile First */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-blue-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Sessions</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalSessions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-green-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.attendanceRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-purple-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <User className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Present</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalPresent}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-red-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <TrendingDown className="h-5 w-5 lg:h-6 lg:w-6 text-red-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Absent</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{stats.totalAbsent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Grid - Mobile First */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sessions - Mobile First */}
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                <Clock className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-blue-600" />
                Recent Sessions
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {filteredSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <ClipboardList className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
                  <h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-4">No sessions found</h4>
                  <p className="text-gray-500 text-base lg:text-lg">No sessions available for the selected criteria</p>
                </div>
              ) : (
                <div className="space-y-1 lg:space-y-0 lg:divide-y lg:divide-gray-200">
                  {recentSessionsData.map(item => (
                    <div key={item.session.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-2 lg:space-y-0">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 text-base lg:text-lg mb-1 lg:mb-2">
                            {item.session.topic || 'Class Session'}
                          </h4>
                          <p className="text-sm lg:text-base text-gray-600 mb-1">{item.group?.name}</p>
                          <p className="text-sm lg:text-base text-gray-500">{formatDateTime(item.session.dateTime)}</p>
                        </div>
                        <div className="text-left lg:text-right">
                          <div className="text-sm lg:text-base font-medium text-gray-900 mb-1">
                            {item.stats.present}/{item.stats.total} present
                          </div>
                          <div className={`text-sm lg:text-base font-semibold ${
                            item.stats.rate >= 80 ? 'text-green-600' : 
                            item.stats.rate >= 60 ? 'text-yellow-600' : 'text-red-600'
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

          {/* Student Summary - Mobile First */}
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 lg:p-6 border-b border-gray-200">
              <h3 className="text-lg lg:text-xl font-semibold text-gray-900 flex items-center">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 mr-2 lg:mr-3 text-purple-600" />
                Student Attendance Summary
              </h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {studentAttendanceSummary.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
                  <h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-4">No attendance data found</h4>
                  <p className="text-gray-500 text-base lg:text-lg">No students found for the selected criteria</p>
                </div>
              ) : (
                <div className="space-y-1 lg:space-y-0 lg:divide-y lg:divide-gray-200">
                  {studentAttendanceSummary.map(student => (
                    <div key={student.id} className="p-4 lg:p-6 hover:bg-gray-50 transition-colors">
                      {/* Student Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-full bg-purple-100 flex items-center justify-center">
                            <User className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 text-base lg:text-lg">{student.name}</h4>
                            <p className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm lg:text-base font-bold px-2 py-1 rounded-lg ${
                            student.rate >= 80 ? 'bg-green-100 text-green-800' : 
                            student.rate >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {student.rate.toFixed(0)}%
                          </span>
                          <button
                            onClick={() => toggleStudentExpansion(student.id)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            {expandedStudent === student.id ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </button>
                        </div>
                      </div>

                      {/* Attendance Stats */}
                      <div className="grid grid-cols-3 gap-2 lg:gap-3 mb-3">
                        <div className="bg-green-50 rounded-lg p-2 lg:p-3 text-center">
                          <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 mx-auto mb-1" />
                          <div className="text-sm lg:text-base font-semibold text-green-900">{student.present}</div>
                          <div className="text-xs lg:text-sm text-green-600">Present</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-2 lg:p-3 text-center">
                          <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 mx-auto mb-1" />
                          <div className="text-sm lg:text-base font-semibold text-red-900">{student.absent}</div>
                          <div className="text-xs lg:text-sm text-red-600">Absent</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-2 lg:p-3 text-center">
                          <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 mx-auto mb-1" />
                          <div className="text-sm lg:text-base font-semibold text-yellow-900">{student.excused}</div>
                          <div className="text-xs lg:text-sm text-yellow-600">Excused</div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Attendance Rate</span>
                          <span className="font-medium">{student.total} sessions</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
                          <div 
                            className={`h-2 lg:h-3 rounded-full transition-all duration-300 ${
                              student.rate >= 80 ? 'bg-green-500' : 
                              student.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${student.rate}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {expandedStudent === student.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="bg-gray-50 rounded-lg p-3 lg:p-4">
                            <h5 className="font-medium text-gray-900 mb-2 text-sm lg:text-base">Detailed Breakdown</h5>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4 text-sm lg:text-base">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Sessions:</span>
                                <span className="font-medium">{student.total}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Present Rate:</span>
                                <span className="font-medium text-green-600">{((student.present / student.total) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Absent Rate:</span>
                                <span className="font-medium text-red-600">{((student.absent / student.total) * 100).toFixed(1)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Excused Rate:</span>
                                <span className="font-medium text-yellow-600">{((student.excused / student.total) * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceOverview;
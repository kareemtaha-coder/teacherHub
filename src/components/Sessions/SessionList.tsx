import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Calendar, Plus, Edit, Trash2, Users, Clock, X, Menu, BookOpen, TrendingUp, CheckCircle, XCircle, AlertCircle, Download, MessageSquare } from 'lucide-react';
import { formatDateTime, formatTime } from '../../utils/generators';
import { useLanguage } from '../../context/LanguageContext';
import AddSessionModal from './AddSessionModal';
import EditSessionModal from './EditSessionModal';
import AttendanceModal from './AttendanceModal';
import SessionReportModal from './SessionReportModal';
import { Session } from '../../types';
import generatePDF from 'react-to-pdf';

const SessionList: React.FC = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getAttendanceForSession } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(null);
  const [sessionReportSession, setSessionReportSession] = useState<Session | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = useMemo(() => {
    let filtered = state.sessions.filter(session => {
      const matchesGroup = selectedGroupFilter === 'all' || session.groupId === selectedGroupFilter;
      const matchesSearch = !searchTerm || 
        (session.topic && session.topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        getGroupById(session.groupId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesGroup && matchesSearch;
    });
    
    return filtered.sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [state.sessions, selectedGroupFilter, searchTerm, getGroupById]);

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? This will also remove all attendance records.')) {
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    }
  }, [dispatch]);

  const getAttendanceStats = useCallback((session: Session) => {
    const attendance = getAttendanceForSession(session.id);
    const students = getStudentsInGroup(session.groupId);
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const total = students.length;
    const rate = total > 0 ? (present / total) * 100 : 0;
    
    return { present, absent, excused, total, rate };
  }, [getAttendanceForSession, getStudentsInGroup]);

  const downloadSessionPDF = useCallback(async (session: Session) => {
    const group = getGroupById(session.groupId);
    const students = getStudentsInGroup(session.groupId);
    const attendance = getAttendanceForSession(session.id);
    const stats = getAttendanceStats(session);
    
    // Create attendance data for each student
    const studentAttendance = students.map(student => {
      const attendanceRecord = attendance.find(a => a.studentId === student.id);
      return {
        student,
        status: attendanceRecord?.status || 'Not recorded'
      };
    });

    // Create a temporary div element for PDF generation
    const tempDiv = document.createElement('div');
    tempDiv.id = 'session-pdf-temp';
    tempDiv.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 32px; background: white;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #d1d5db; padding-bottom: 24px; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <span style="color: white; font-size: 32px;">📅</span>
          </div>
          <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">Session Report</h1>
          <p style="font-size: 16px; color: #6b7280;">Detailed Session Information & Attendance</p>
        </div>

        <!-- Session Information -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 24px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">Session Details</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div style="background: linear-gradient(to right, #dbeafe, #c7d2fe); border-radius: 8px; padding: 24px; border: 1px solid #bfdbfe;">
              <h3 style="font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 16px;">📚 Session Information</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Topic:</span>
                <span style="color: #111827;">${session.topic || 'Class Session'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Group:</span>
                <span style="color: #111827;">${group?.name || 'N/A'}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Date & Time:</span>
                <span style="color: #111827;">${formatDateTime(session.dateTime)}</span>
              </div>
            </div>
            
            <div style="background: linear-gradient(to right, #dcfce7, #bbf7d0); border-radius: 8px; padding: 24px; border: 1px solid #bbf7d0;">
              <h3 style="font-size: 18px; font-weight: 600; color: #16a34a; margin-bottom: 16px;">📊 Attendance Summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Present:</span>
                <span style="color: #111827;">${stats.present}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Absent:</span>
                <span style="color: #111827;">${stats.absent}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Excused:</span>
                <span style="color: #111827;">${stats.excused}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <span style="font-weight: 500; color: #374151;">Rate:</span>
                <span style="color: #111827;">${stats.rate.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Student Attendance Table -->
        <div style="margin-bottom: 32px;">
          <h2 style="font-size: 20px; font-weight: bold; color: #111827; margin-bottom: 24px; text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">Student Attendance</h2>
          <div style="background: white; border: 2px solid #e5e7eb; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <table style="width: 100%; border-collapse: collapse;">
              <thead style="background: linear-gradient(to right, #f9fafb, #f3f4f6);">
                <tr>
                  <th style="padding: 16px; text-align: left; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Student Name</th>
                  <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Status</th>
                  <th style="padding: 16px; text-align: center; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb;">Contact Info</th>
                </tr>
              </thead>
              <tbody>
                ${studentAttendance.map((item, index) => `
                  <tr style="${index % 2 === 0 ? 'background: white;' : 'background: #f9fafb;'}">
                    <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; font-weight: 500; color: #111827;">
                      <div style="display: flex; align-items: center;">
                        <div style="width: 32px; height: 32px; background: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px; color: white; font-weight: bold; font-size: 14px;">
                          ${index + 1}
                        </div>
                        ${item.student.fullName}
                      </div>
                    </td>
                    <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
                      <span style="padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; border: 1px solid; ${
                        item.status === 'present' ? 'background: #dcfce7; color: #16a34a; border-color: #bbf7d0;' :
                        item.status === 'absent' ? 'background: #fee2e2; color: #dc2626; border-color: #fecaca;' :
                        'background: #fef3c7; color: #d97706; border-color: #fed7aa;'
                      }">
                        ${item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td style="padding: 16px; border-bottom: 1px solid #e5e7eb; text-align: center; color: #6b7280;">
                      ${item.student.contactInfo || 'N/A'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 2px solid #d1d5db; color: #6b7280;">
          <div style="width: 48px; height: 48px; background: #2563eb; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <span style="color: white; font-size: 24px;">📚</span>
          </div>
          <p style="font-weight: 600; color: #374151; margin-bottom: 4px;">TeacherHub</p>
          <p style="font-size: 14px;">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
        </div>
      </div>
    `;

    try {
      // Append the temporary div to the document body
      document.body.appendChild(tempDiv);
      
      // Use the DOM element directly for PDF generation
      await generatePDF(tempDiv as any, {
        filename: `session-report-${session.topic || 'class-session'}-${formatDateTime(session.dateTime).split(' ')[0]}.pdf`,
        page: { margin: 20 }
      });
      
      // Remove the temporary div after PDF generation
      document.body.removeChild(tempDiv);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
      // Clean up the temporary div in case of error
      if (document.body.contains(tempDiv)) {
        document.body.removeChild(tempDiv);
      }
    }
  }, [getGroupById, getStudentsInGroup, getAttendanceForSession, getAttendanceStats]);

  // Memoize session data to prevent unnecessary recalculations
  const sessionData = useMemo(() => 
    filteredSessions.map(session => {
      const group = getGroupById(session.groupId);
      const stats = getAttendanceStats(session);
      const isUpcoming = new Date(session.dateTime) > new Date();
      const isToday = new Date(session.dateTime).toDateString() === new Date().toDateString();
      
      return {
        session,
        group,
        stats,
        isUpcoming,
        isToday
      };
    }),
    [filteredSessions, getGroupById, getAttendanceStats]
  );

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalSessions = sessionData.length;
    const upcomingSessions = sessionData.filter(item => item.isUpcoming).length;
    const todaySessions = sessionData.filter(item => item.isToday).length;
    const completedSessions = sessionData.filter(item => !item.isUpcoming).length;
    
    return { totalSessions, upcomingSessions, todaySessions, completedSessions };
  }, [sessionData]);

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
            <h1 className="text-lg font-bold text-gray-900">Sessions</h1>
            <p className="text-sm text-gray-600">{summaryStats.totalSessions} sessions</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-6">
        <div>
              <h1 className="text-3xl font-bold text-gray-900">Sessions</h1>
              <p className="text-lg text-gray-600 mt-2">Schedule and track class sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
        >
              <Plus className="h-5 w-5 mr-2" />
          Add Session
        </button>
          </div>
      </div>

        {/* Summary Statistics - Mobile First */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-blue-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center">
            <Calendar className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-lg lg:text-xl font-bold text-blue-900">{summaryStats.totalSessions}</div>
            <div className="text-xs lg:text-sm text-blue-600">Total</div>
          </div>
          <div className="bg-green-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center">
            <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-green-600 mx-auto mb-2" />
            <div className="text-lg lg:text-xl font-bold text-green-900">{summaryStats.upcomingSessions}</div>
            <div className="text-xs lg:text-sm text-green-600">Upcoming</div>
          </div>
          <div className="bg-orange-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center">
            <Clock className="h-5 w-5 lg:h-6 lg:w-6 text-orange-600 mx-auto mb-2" />
            <div className="text-lg lg:text-xl font-bold text-orange-900">{summaryStats.todaySessions}</div>
            <div className="text-xs lg:text-sm text-orange-600">Today</div>
          </div>
          <div className="bg-purple-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center">
            <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-lg lg:text-xl font-bold text-purple-900">{summaryStats.completedSessions}</div>
            <div className="text-xs lg:text-sm text-purple-600">Completed</div>
          </div>
        </div>

        {/* Search and Filters - Mobile First */}
        <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions by topic or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
              />
            </div>

            {/* Group Filter */}
            <div className="flex-shrink-0">
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
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
          </div>
            </div>

        {/* Sessions Content */}
        {state.groups.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl lg:rounded-lg p-6 lg:p-8 text-center">
            <BookOpen className="h-16 lg:h-20 w-16 lg:w-20 text-yellow-400 mx-auto mb-4 lg:mb-6" />
            <h3 className="text-lg lg:text-xl font-medium text-yellow-800 mb-2 lg:mb-4">No Groups Available</h3>
            <p className="text-yellow-700 text-base lg:text-lg">
              You need to create at least one group before scheduling sessions.
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
            <Calendar className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2 lg:mb-4">No sessions found</h3>
            <p className="text-gray-500 text-base lg:text-lg mb-6 lg:mb-8">
                  {selectedGroupFilter === 'all' 
                    ? 'Start by scheduling your first session'
                    : 'No sessions scheduled for this group'
                  }
                </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-blue-600 text-white text-base lg:text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 lg:h-6 w-5 lg:w-6 mr-2 lg:mr-3" />
              Schedule First Session
            </button>
              </div>
            ) : (
          <div className="space-y-4 lg:space-y-6">
            {sessionData.map((item) => {
              const { session, group, stats, isUpcoming, isToday } = item;
                  
                  return (
                <div key={session.id} className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Session Header */}
                  <div className="p-4 lg:p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3 lg:space-x-4">
                        <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-lg flex items-center justify-center ${
                          isUpcoming ? 'bg-blue-100' : isToday ? 'bg-orange-100' : 'bg-gray-100'
                        }`}>
                          <Calendar className={`h-6 w-6 lg:h-7 lg:w-7 ${
                            isUpcoming ? 'text-blue-600' : isToday ? 'text-orange-600' : 'text-gray-600'
                            }`} />
                          </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                                {session.topic || 'Class Session'}
                              </h3>
                              {isUpcoming && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Upcoming
                                </span>
                              )}
                            {isToday && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                Today
                              </span>
                            )}
                          </div>
                          <p className="text-base lg:text-lg text-gray-600 mb-2">
                            {group?.name}
                          </p>
                          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-1 lg:space-y-0 text-sm lg:text-base text-gray-500">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2" />
                              {formatDateTime(session.dateTime)}
                            </div>
                            {!isUpcoming && stats.total > 0 && (
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2" />
                                {stats.present}/{stats.total} present ({stats.rate.toFixed(0)}%)
                                </div>
                              )}
                            </div>
                          </div>
                      </div>
                    </div>

                    {/* Attendance Statistics - Mobile First */}
                    {!isUpcoming && stats.total > 0 && (
                      <div className="grid grid-cols-3 gap-3 lg:gap-4">
                        <div className="bg-green-50 rounded-xl p-3 lg:p-4 text-center">
                          <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 mx-auto mb-1 lg:mb-2" />
                          <div className="text-sm lg:text-base font-semibold text-green-900">{stats.present}</div>
                          <div className="text-xs lg:text-sm text-green-600">Present</div>
                        </div>
                        <div className="bg-red-50 rounded-xl p-3 lg:p-4 text-center">
                          <XCircle className="h-4 w-4 lg:h-5 lg:w-5 text-red-600 mx-auto mb-1 lg:mb-2" />
                          <div className="text-sm lg:text-base font-semibold text-red-900">{stats.absent}</div>
                          <div className="text-xs lg:text-sm text-red-600">Absent</div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-3 lg:p-4 text-center">
                          <AlertCircle className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600 mx-auto mb-1 lg:mb-2" />
                          <div className="text-sm lg:text-base font-semibold text-yellow-900">{stats.excused}</div>
                          <div className="text-xs lg:text-sm text-yellow-600">Excused</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Session Actions - Mobile First */}
                  <div className="p-4 lg:p-6 bg-gray-50">
                    <div className="flex flex-col space-y-3 lg:space-y-0">
                      {/* Session ID Info */}
                      <div className="flex items-center justify-center lg:justify-start text-sm lg:text-base text-gray-500">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Session ID: {session.id.slice(0, 8)}...
                        </span>
                        </div>
                        
                      {/* Action Buttons - Improved Mobile Layout */}
                      <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3">
                          {!isUpcoming && (
                            <button
                              onClick={() => setAttendanceSession(session)}
                            className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-3 lg:px-3 lg:py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-xl lg:rounded-lg hover:bg-green-100 transition-colors shadow-sm hover:shadow-md"
                            >
                            <Users className="h-4 w-4 mr-2" />
                            <span className="lg:hidden">Take Attendance</span>
                            <span className="hidden lg:inline">Take Attendance</span>
                            </button>
                          )}
                          <button
                            onClick={() => setEditingSession(session)}
                          className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-3 lg:px-3 lg:py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl lg:rounded-lg hover:bg-blue-100 transition-colors shadow-sm hover:shadow-md"
                          >
                          <Edit className="h-4 w-4 mr-2" />
                          <span className="lg:hidden">Edit Session</span>
                          <span className="hidden lg:inline">Edit Session</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
                          className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-3 lg:px-3 lg:py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl lg:rounded-lg hover:bg-red-100 transition-colors shadow-sm hover:shadow-md"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          <span className="lg:hidden">Delete Session</span>
                          <span className="hidden lg:inline">Delete Session</span>
                        </button>
                        <button
                          onClick={() => downloadSessionPDF(session)}
                          className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-3 lg:px-3 lg:py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-xl lg:rounded-lg hover:bg-purple-100 transition-colors shadow-sm hover:shadow-md"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          <span className="lg:hidden">Download Report</span>
                          <span className="hidden lg:inline">Download Report</span>
                          </button>
                          <button
                            onClick={() => setSessionReportSession(session)}
                            className="w-full lg:w-auto inline-flex items-center justify-center px-4 py-3 lg:px-3 lg:py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-xl lg:rounded-lg hover:bg-purple-100 transition-colors shadow-sm hover:shadow-md"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="lg:hidden">Session Report</span>
                            <span className="hidden lg:inline">Session Report</span>
                          </button>
                      </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
      )}

        {/* Modals */}
      {showAddModal && (
        <AddSessionModal onClose={() => setShowAddModal(false)} />
      )}
      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}
      {attendanceSession && (
        <AttendanceModal
          session={attendanceSession}
          onClose={() => setAttendanceSession(null)}
        />
      )}
      {sessionReportSession && (
        <SessionReportModal
          session={sessionReportSession}
          onClose={() => setSessionReportSession(null)}
        />
      )}
      </div>
    </div>
  );
};

export default SessionList;
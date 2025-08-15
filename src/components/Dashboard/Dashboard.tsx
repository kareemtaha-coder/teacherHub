import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { 
  Users, BookOpen, Calendar, ClipboardList, DollarSign, UserPlus, 
  CalendarPlus, FilePlus, Menu, X, ChevronDown, CheckCircle, 
  XCircle, Clock, TrendingUp, BarChart3, Smartphone, Target, Award,
  Activity, Zap, Lightbulb, ArrowRight, Star, Bookmark, Eye
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Activity {
  type: string;
  message: string;
  time: string;
  action: string;
  icon: React.ComponentType<{ className?: string }>;
}

const Dashboard: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t } = useLanguage();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      
      switch (key) {
        case 's':
          event.preventDefault();
          dispatch({ type: 'SET_VIEW', payload: 'students' });
          break;
        case 'g':
          event.preventDefault();
          dispatch({ type: 'SET_VIEW', payload: 'groups' });
          break;
        case 'c':
          event.preventDefault();
          dispatch({ type: 'SET_VIEW', payload: 'sessions' });
          break;
        case 'a':
          event.preventDefault();
          dispatch({ type: 'SET_VIEW', payload: 'grades' });
          break;
        case 'd':
          event.preventDefault();
          dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dispatch]);

  // Calculate payment rate for current month
  const paymentRate = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthPayments = state.paymentRecords.filter(p => {
      const paymentMonth = new Date(p.dueDate);
      return paymentMonth.getMonth() === currentMonth && 
             paymentMonth.getFullYear() === currentYear;
    });
    
    if (monthPayments.length === 0) return 0;
    
    const paidPayments = monthPayments.filter(p => p.status === 'paid');
    return (paidPayments.length / monthPayments.length) * 100;
  }, [state.paymentRecords]);

  // Get selected group data
  const selectedGroup = useMemo(() => {
    return state.groups.find(g => g.id === selectedGroupId);
  }, [state.groups, selectedGroupId]);

  // Get students in selected group
  const groupStudents = useMemo(() => {
    if (!selectedGroupId) return [];
    return state.students.filter(student => 
      state.studentGroups.some(sg => 
        sg.studentId === student.id && sg.groupId === selectedGroupId
      )
    );
  }, [state.students, state.studentGroups, selectedGroupId]);

  // Get attendance data for selected group
  const groupAttendance = useMemo(() => {
    if (!selectedGroupId) return [];
    return state.attendanceRecords.filter(ar => 
      state.studentGroups.some(sg => 
        sg.studentId === ar.studentId && sg.groupId === selectedGroupId
      )
    );
  }, [state.attendanceRecords, state.studentGroups, selectedGroupId]);

  // Calculate overall statistics
  const overallStats = useMemo(() => {
  const totalStudents = state.students.length;
  const totalGroups = state.groups.length;
  const totalSessions = state.sessions.length;
  const totalAssessments = state.assessments.length;

    // Calculate attendance rate
    const totalAttendanceRecords = state.attendanceRecords.length;
    const presentRecords = state.attendanceRecords.filter(ar => ar.status === 'present').length;
    const overallAttendanceRate = totalAttendanceRecords > 0 ? (presentRecords / totalAttendanceRecords) * 100 : 0;
    
    // Calculate completion rate
    const totalGrades = state.grades.length;
    const totalPossibleGrades = state.students.length * state.assessments.length;
    const completionRate = totalPossibleGrades > 0 ? (totalGrades / totalPossibleGrades) * 100 : 0;

    return {
      totalStudents,
      totalGroups,
      totalSessions,
      totalAssessments,
      overallAttendanceRate,
      completionRate,
      paymentRate
    };
  }, [state.students, state.groups, state.sessions, state.assessments, state.attendanceRecords, state.grades, paymentRate]);

  // Smart suggestions based on current data
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    
    if (state.students.length === 0) {
      suggestions.push({
        id: 'add-students',
        title: 'Add Your First Students',
        description: 'Start by adding students to your class',
        action: 'students',
        icon: UserPlus,
        priority: 'high',
        color: 'bg-blue-500'
      });
    }
    
    if (state.groups.length === 0) {
      suggestions.push({
        id: 'create-groups',
        title: 'Create Your First Group',
        description: 'Organize students into groups for better management',
        action: 'groups',
        icon: BookOpen,
        priority: 'high',
        color: 'bg-green-500'
      });
    }
    
    if (state.sessions.length === 0) {
      suggestions.push({
        id: 'schedule-sessions',
        title: 'Schedule Your First Session',
        description: 'Plan your class schedule and sessions',
        action: 'sessions',
        icon: CalendarPlus,
        priority: 'medium',
        color: 'bg-purple-500'
      });
    }
    
    if (state.assessments.length === 0) {
      suggestions.push({
        id: 'create-assessments',
        title: 'Create Your First Assessment',
        description: 'Start tracking student progress with assessments',
        action: 'grades',
        icon: FilePlus,
        priority: 'medium',
        color: 'bg-orange-500'
      });
    }

    // Add performance-based suggestions
    if (overallStats.overallAttendanceRate < 80) {
      suggestions.push({
        id: 'improve-attendance',
        title: 'Improve Attendance',
        description: 'Your overall attendance rate is below 80%',
        action: 'attendance',
        icon: TrendingUp,
        priority: 'medium',
        color: 'bg-yellow-500'
      });
    }

    if (overallStats.completionRate < 70) {
      suggestions.push({
        id: 'complete-grading',
        title: 'Complete Grading',
        description: 'Complete grading for better student insights',
        action: 'grades',
        icon: CheckCircle,
        priority: 'medium',
        color: 'bg-teal-500'
      });
    }

    return suggestions.slice(0, 4); // Show max 4 suggestions
  }, [state.students.length, state.groups.length, state.sessions.length, state.assessments.length, overallStats]);

  // Recent activities
  const recentActivities = useMemo(() => {
    interface ActivityItem {
      id: string;
      type: string;
      title: string;
      subtitle: string;
      time: string;
      icon: React.ComponentType<{ className?: string }>;
      color: string;
      bgColor: string;
    }
    
    const activities: ActivityItem[] = [];
    
    // Add recent sessions
    const recentSessions = state.sessions
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, 3);
    
    recentSessions.forEach(session => {
      const group = state.groups.find(g => g.id === session.groupId);
      activities.push({
        id: `session-${session.id}`,
      type: 'session',
        title: session.topic || 'Class Session',
        subtitle: group?.name || 'Unknown Group',
        time: new Date(session.dateTime).toLocaleDateString(),
        icon: Calendar,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
      });
    });

    // Add recent students
    const recentStudents = state.students
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 2);
    
    recentStudents.forEach(student => {
      activities.push({
        id: `student-${student.id}`,
        type: 'student',
        title: student.fullName,
        subtitle: 'New student added',
        time: new Date(student.createdAt).toLocaleDateString(),
        icon: Users,
        color: 'text-green-600',
        bgColor: 'bg-green-50'
      });
    });

    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [state.sessions, state.students, state.groups]);

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
            <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, Kareem!</p>
          </div>
          
          <button 
            onClick={() => setShowOnboarding(!showOnboarding)} 
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <Lightbulb className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  Welcome back, Kareem! 👋
                </h1>
                <p className="text-xl text-gray-600">
                  Here's what's happening with your math classes today
                </p>
              </div>
              <button
                onClick={() => setShowOnboarding(!showOnboarding)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors"
              >
                <Lightbulb className="h-5 w-5" />
                <span>Tips & Help</span>
              </button>
            </div>
          </div>
        </div>

        {/* Onboarding Tips */}
        {showOnboarding && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 lg:p-8">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg lg:text-xl font-semibold text-blue-900">Quick Tips</h3>
                  <p className="text-blue-700">Make the most of TeacherHub</p>
                </div>
              </div>
              <button
                onClick={() => setShowOnboarding(false)}
                className="text-blue-400 hover:text-blue-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  <h4 className="font-medium text-gray-900">Keyboard Shortcuts</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Use S, G, C, A, D to navigate quickly</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>S</span>
                    <span>Students</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>G</span>
                    <span>Groups</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span>C</span>
                    <span>Sessions</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Target className="h-5 w-5 text-green-500" />
                  <h4 className="font-medium text-gray-900">Quick Actions</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Use the quick action buttons in the header</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Add Student</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Create Group</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Schedule Session</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-blue-200">
                <div className="flex items-center space-x-3 mb-3">
                  <Eye className="h-5 w-5 text-purple-500" />
                  <h4 className="font-medium text-gray-900">Monitor Progress</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">Track attendance, grades, and performance</p>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Attendance tracking</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <BarChart3 className="h-3 w-3 text-blue-500" />
                    <span>Grade analytics</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span>Performance insights</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Overall Statistics - Enhanced */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <div className="text-xs lg:text-sm text-gray-500">Total</div>
                <div className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalStudents}</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm lg:text-base font-medium text-gray-900">Students</p>
              <p className="text-xs lg:text-sm text-gray-500">Enrolled in your classes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-right">
                <div className="text-xs lg:text-sm text-gray-500">Total</div>
                <div className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalGroups}</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm lg:text-base font-medium text-gray-900">Groups</p>
              <p className="text-xs lg:text-sm text-gray-500">Organized classes</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-right">
                <div className="text-xs lg:text-sm text-gray-500">Total</div>
                <div className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalSessions}</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm lg:text-base font-medium text-gray-900">Sessions</p>
              <p className="text-xs lg:text-sm text-gray-500">Scheduled classes</p>
            </div>
      </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6 hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
              <div className="h-12 w-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <FilePlus className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-right">
                <div className="text-xs lg:text-sm text-gray-500">Total</div>
                <div className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalAssessments}</div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm lg:text-base font-medium text-gray-900">Assessments</p>
              <p className="text-xs lg:text-sm text-gray-500">Created evaluations</p>
            </div>
          </div>
        </div>

        {/* Performance Metrics - New Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Attendance Rate</h3>
                <p className="text-sm text-gray-500">Overall student attendance</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-green-600">
                {overallStats.overallAttendanceRate.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-green-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${overallStats.overallAttendanceRate}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                {overallStats.overallAttendanceRate >= 80 ? 'Excellent' : 
                 overallStats.overallAttendanceRate >= 60 ? 'Good' : 'Needs improvement'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Completion Rate</h3>
                <p className="text-sm text-gray-500">Assessment grading progress</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-blue-600">
                {overallStats.completionRate.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${overallStats.completionRate}%` }}
                ></div>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                {overallStats.completionRate >= 70 ? 'Well done' : 
                 overallStats.completionRate >= 40 ? 'In progress' : 'Get started'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Payment Rate</h3>
                <p className="text-sm text-gray-500">Monthly payment collection</p>
              </div>
            </div>
            <div className="text-center mb-4">
              <div className="text-3xl font-bold text-purple-600">
                {overallStats.paymentRate.toFixed(1)}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${overallStats.paymentRate}%` }}
              ></div>
            </div>
            <div className="text-center mt-2">
              <p className="text-xs text-gray-500">
                {overallStats.paymentRate >= 80 ? 'Excellent' : 
                 overallStats.paymentRate >= 60 ? 'Good' : 'Needs attention'}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Suggestions - Enhanced */}
        {smartSuggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Smart Suggestions</h3>
                <p className="text-gray-500">Recommended actions to improve your teaching</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {smartSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: suggestion.action })}
                  className="group relative p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 text-left"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`h-10 w-10 ${suggestion.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <suggestion.icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">
                        {suggestion.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {suggestion.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500">Priority:</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          suggestion.priority === 'high' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {suggestion.priority === 'high' ? 'High' : 'Medium'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Group Selector - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Group Overview</h3>
                <p className="text-gray-500">Select a group to view detailed information</p>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'groups' })}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors text-sm font-medium"
            >
              Manage Groups
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Group</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full lg:w-auto px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base"
            >
              <option value="">Choose a group...</option>
              {state.groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name} ({state.studentGroups.filter(sg => sg.groupId === group.id).length} students)
                </option>
              ))}
            </select>
          </div>

          {selectedGroup && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Users className="h-5 w-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Students</h4>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{groupStudents.length}</div>
                  <p className="text-sm text-gray-500">Enrolled students</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <ClipboardList className="h-5 w-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Attendance</h4>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {groupAttendance.length > 0 
                      ? Math.round((groupAttendance.filter(ar => ar.status === 'present').length / groupAttendance.length) * 100)
                      : 0}%
                  </div>
                  <p className="text-sm text-gray-500">Average attendance</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Sessions</h4>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {state.sessions.filter(s => s.groupId === selectedGroup.id).length}
                  </div>
                  <p className="text-sm text-gray-500">Total sessions</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Activities - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Recent Activities</h3>
                <p className="text-gray-500">Latest updates from your classes</p>
              </div>
            </div>
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
              className="px-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-xl transition-colors text-sm font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No recent activities</p>
                <p className="text-sm text-gray-400">Start by adding students or scheduling sessions</p>
              </div>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className={`h-10 w-10 ${activity.bgColor} rounded-xl flex items-center justify-center`}>
                    <activity.icon className={`h-5 w-5 ${activity.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-500">{activity.subtitle}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400">{activity.time}</div>
                    <div className="text-xs text-gray-500 capitalize">{activity.type}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions - Enhanced */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Quick Actions</h3>
              <p className="text-gray-500">Common tasks to get you started</p>
        </div>
      </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'students' })}
              className="group p-6 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-blue-900">Add Student</h4>
              </div>
              <p className="text-blue-700 text-sm mb-3">
                Register new students and manage their information
              </p>
              <div className="flex items-center text-blue-600 text-sm font-medium">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'groups' })}
              className="group p-6 bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-green-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-green-900">Create Group</h4>
              </div>
              <p className="text-green-700 text-sm mb-3">
                Organize students into groups for better management
              </p>
              <div className="flex items-center text-green-600 text-sm font-medium">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
              </button>

            <button
              onClick={() => dispatch({ type: 'SET_VIEW', payload: 'sessions' })}
              className="group p-6 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-200 text-left"
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-10 w-10 bg-purple-500 rounded-xl flex items-center justify-center">
                  <CalendarPlus className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-purple-900">Schedule Session</h4>
              </div>
              <p className="text-purple-700 text-sm mb-3">
                Plan your class schedule and manage sessions
              </p>
              <div className="flex items-center text-purple-600 text-sm font-medium">
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Users, BookOpen, Calendar, ClipboardList, DollarSign, UserPlus, CalendarPlus, FilePlus, Menu, X } from 'lucide-react';
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
  const [quickAction, setQuickAction] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input fields
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
    const currentMonth = new Date().toISOString().slice(0, 7);
    const currentMonthPayments = state.paymentRecords.filter(p => p.month === currentMonth);
    const totalAmount = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = currentMonthPayments
      .filter(p => p.status === 'paid')
      .reduce((sum, p) => sum + p.amount, 0);
    return totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
  }, [state.paymentRecords]);

  const stats = [
    {
      label: t('nav.students'),
      value: state.students.length,
      icon: Users,
      color: 'bg-blue-500',
      action: 'students'
    },
    {
      label: t('nav.groups'),
      value: state.groups.length,
      icon: BookOpen,
      color: 'bg-green-500',
      action: 'groups'
    },
    {
      label: t('nav.sessions'),
      value: state.sessions.length,
      icon: Calendar,
      color: 'bg-purple-500',
      action: 'sessions'
    },
    {
      label: t('nav.grades'),
      value: state.assessments.length,
      icon: ClipboardList,
      color: 'bg-orange-500',
      action: 'grades'
    }
  ];

  const quickActions = [
    { 
      title: t('students.addStudent'), 
      description: t('dashboard.quickActionAddStudent'), 
      icon: UserPlus, 
      color: 'bg-blue-500', 
      action: 'students', 
      shortcut: 'S' 
    },
    { 
      title: t('groups.createGroup'), 
      description: t('dashboard.quickActionCreateGroup'), 
      icon: BookOpen, 
      color: 'bg-green-500', 
      action: 'groups', 
      shortcut: 'G' 
    },
    { 
      title: t('sessions.scheduleSession'), 
      description: t('dashboard.quickActionScheduleSession'), 
      icon: CalendarPlus, 
      color: 'bg-purple-500', 
      action: 'sessions', 
      shortcut: 'C' 
    },
    { 
      title: t('grades.createAssessment'), 
      description: t('dashboard.quickActionCreateAssessment'), 
      icon: FilePlus, 
      color: 'bg-orange-500', 
      action: 'grades', 
      shortcut: 'A' 
    }
  ];

  const handleQuickAction = (action: string) => {
    setQuickAction(action);
    dispatch({ type: 'SET_VIEW', payload: action });
  };

  // Smart suggestions with action handlers
  const smartSuggestions = useMemo(() => {
    const suggestions = [];
    
    if (state.students.length === 0) {
      suggestions.push({
        type: 'info',
        message: t('dashboard.noStudents'),
        action: t('dashboard.addFirstStudent'),
        icon: Users,
        onClick: () => dispatch({ type: 'SET_VIEW', payload: 'students' })
      });
    }
    
    if (state.groups.length === 0) {
      suggestions.push({
        type: 'info',
        message: t('dashboard.noGroups'),
        action: t('dashboard.createFirstGroup'),
        icon: BookOpen,
        onClick: () => dispatch({ type: 'SET_VIEW', payload: 'groups' })
      });
    }
    
    if (state.paymentRecords.filter(p => p.status === 'unpaid' && new Date(p.dueDate) < new Date()).length > 0) {
      suggestions.push({
        type: 'warning',
        message: t('dashboard.overduePayments'),
        action: t('dashboard.reviewPayments'),
        icon: DollarSign,
        onClick: () => dispatch({ type: 'SET_VIEW', payload: 'settings' })
      });
    }
    
    return suggestions;
  }, [state.students.length, state.groups.length, state.paymentRecords, t, dispatch]);

  const recentActivity = useMemo((): Activity[] => {
    const activities: Activity[] = [];
    
    // Add recent sessions
    const recentSessions = state.sessions
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, 3);
    
    recentSessions.forEach(session => {
      const group = state.groups.find(g => g.id === session.groupId);
      activities.push({
        type: 'session',
        message: t('dashboard.recentSessionActivity', { group: group?.name || t('common.group'), topic: session.topic || t('sessions.defaultTopic') }),
        time: new Date(session.dateTime).toLocaleDateString(),
        action: 'sessions',
        icon: Calendar
      });
    });
    
    // Add recent assessments
    const recentAssessments = state.assessments
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
    
    recentAssessments.forEach(assessment => {
      const group = state.groups.find(g => g.id === assessment.groupId);
      activities.push({
        type: 'assessment',
        message: t('dashboard.recentAssessmentActivity', { assessment: assessment.name, group: group?.name || t('common.group') }),
        time: new Date(assessment.date).toLocaleDateString(),
        action: 'grades',
        icon: ClipboardList
      });
    });
    
    return activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);
  }, [state.sessions, state.assessments, state.groups, t]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-4">
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)} 
          className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="text-xl font-bold text-gray-900">TeacherHub</h1>
        <div className="w-10"></div>
      </div>

      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          {t('dashboard.welcomeTeacher', { name: 'Kareem Taha', subject: 'Math' })}
        </h1>
        <p className="text-base sm:text-lg text-gray-600">{t('dashboard.subtitle')}</p>
      </div>

      {/* Smart Suggestions */}
      {smartSuggestions.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.smartSuggestions')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {smartSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={suggestion.onClick}
                className={`w-full text-left p-4 rounded-lg border-l-4 hover:shadow-md transition-all duration-200 ${
                  suggestion.type === 'warning' 
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100' 
                    : 'bg-blue-50 border-blue-400 text-blue-800 hover:bg-blue-100'
                }`}
              >
                <div className="flex items-start">
                  <suggestion.icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <p className="font-medium">{suggestion.message}</p>
                    <p className="text-sm mt-1 opacity-90">{suggestion.action}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Action Cards */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {quickActions.map((action) => (
            <button
              key={action.action}
              onClick={() => handleQuickAction(action.action)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow text-left"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <action.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{action.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{action.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{t('dashboard.shortcut')}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                  {action.shortcut}
                </kbd>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid with Quick Access */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.overview')}</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <button
                key={index}
                onClick={() => dispatch({ type: 'SET_VIEW', payload: stat.action })}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md transition-shadow text-center cursor-pointer"
              >
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Performance Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Attendance Rate Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('attendance.attendanceRate')}</h3>
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {state.sessions.length > 0 
                ? (state.attendanceRecords.filter(a => a.status === 'present').length / state.attendanceRecords.length * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-sm text-gray-600">{t('dashboard.overallAttendance')}</p>
          </div>
        </div>

        {/* Payment Rate Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.paymentRate')}</h3>
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{paymentRate.toFixed(1)}%</div>
            <p className="text-sm text-gray-600">{t('dashboard.currentMonthPayments')}</p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('dashboard.recentActivity')}</h2>
          <button 
            onClick={() => dispatch({ type: 'SET_VIEW', payload: 'dashboard' })}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {t('dashboard.viewAll')} →
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {recentActivity.map((activity, index) => (
                <div 
                  key={index} 
                  className="p-3 sm:p-4 hover:bg-gray-50 transition-colors cursor-pointer" 
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: activity.action })}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <activity.icon className="h-5 w-5 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                      <p className="text-sm text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 sm:p-8 text-center">
              <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-base sm:text-lg text-gray-500 mb-2">{t('dashboard.noActivity')}</p>
              <p className="text-sm sm:text-base text-gray-400">{t('dashboard.startMessage')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
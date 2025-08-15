import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { 
  Users, BookOpen, Calendar, ClipboardList, DollarSign, UserPlus, 
  CalendarPlus, FilePlus, Menu, X, ChevronDown, CheckCircle, 
  XCircle, Clock, TrendingUp, BarChart3, Smartphone
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

  // Calculate attendance rate for selected group
  const groupAttendanceRate = useMemo(() => {
    if (groupAttendance.length === 0) return 0;
    const presentCount = groupAttendance.filter(ar => ar.status === 'present').length;
    return (presentCount / groupAttendance.length) * 100;
  }, [groupAttendance]);

  // Get recent sessions for selected group
  const recentGroupSessions = useMemo(() => {
    if (!selectedGroupId) return [];
    return state.sessions
      .filter(s => s.groupId === selectedGroupId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime())
      .slice(0, 5);
  }, [state.sessions, selectedGroupId]);

  // Quick actions for mobile
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Menu Toggle */}
      <div className="lg:hidden flex items-center justify-between mb-4 p-4">
        <button 
          onClick={() => setShowMobileMenu(!showMobileMenu)} 
          className="p-2 rounded-lg bg-white shadow-sm border border-gray-200"
        >
          {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        
        <div className="text-center">
          <h1 className="text-lg font-bold text-gray-900">TeacherHub</h1>
          <p className="text-sm text-gray-600">Kareem Taha - Math Teacher</p>
        </div>
        
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      <div className="p-4 space-y-6">
        {/* Welcome Header - Mobile First */}
        <div className="text-center lg:text-left">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcomeTeacher', { name: 'Kareem Taha', subject: 'Math' })}
          </h1>
          <p className="text-base lg:text-lg text-gray-600">{t('dashboard.subtitle')}</p>
        </div>

        {/* Group Selector - Mobile First */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900">
              {t('dashboard.selectGroup')}
            </h2>
            <button
              onClick={() => setShowGroupSelector(!showGroupSelector)}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span>{selectedGroup ? selectedGroup.name : t('dashboard.chooseGroup')}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${showGroupSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Group Dropdown */}
          {showGroupSelector && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {state.groups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setShowGroupSelector(false);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedGroupId === group.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{group.name}</span>
                      <span className="text-sm text-gray-500">
                        {state.studentGroups.filter(sg => sg.groupId === group.id).length} {t('common.students')}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Group Overview Cards */}
          {selectedGroup && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <div className="bg-blue-50 rounded-xl p-3 lg:p-4 text-center">
                <Users className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg lg:text-xl font-bold text-blue-900">{groupStudents.length}</div>
                <div className="text-xs lg:text-sm text-blue-700">{t('common.students')}</div>
              </div>
              
              <div className="bg-green-50 rounded-xl p-3 lg:p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg lg:text-xl font-bold text-green-900">{groupAttendanceRate.toFixed(1)}%</div>
                <div className="text-xs lg:text-sm text-green-700">{t('attendance.attendanceRate')}</div>
              </div>
              
              <div className="bg-purple-50 rounded-xl p-3 lg:p-4 text-center">
                <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg lg:text-xl font-bold text-purple-900">{recentGroupSessions.length}</div>
                <div className="text-xs lg:text-sm text-purple-700">{t('sessions.recentSessions')}</div>
              </div>
              
              <div className="bg-orange-50 rounded-xl p-3 lg:p-4 text-center">
                <TrendingUp className="h-6 w-6 text-orange-600 mx-auto mb-2" />
                <div className="text-lg lg:text-xl font-bold text-orange-900">
                  {state.assessments.filter(a => a.groupId === selectedGroupId).length}
                </div>
                <div className="text-xs lg:text-sm text-orange-700">{t('grades.assessments')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Student Attendance List - Mobile First */}
        {selectedGroup && groupStudents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">
              {t('dashboard.studentAttendance')} - {selectedGroup.name}
            </h2>
            
            <div className="space-y-3">
              {groupStudents.map((student) => {
                const studentAttendance = groupAttendance.filter(ar => ar.studentId === student.id);
                const presentCount = studentAttendance.filter(ar => ar.status === 'present').length;
                const attendanceRate = studentAttendance.length > 0 ? (presentCount / studentAttendance.length) * 100 : 0;
                
                return (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{student.fullName}</div>
                        <div className="text-sm text-gray-600">{student.contactInfo}</div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{attendanceRate.toFixed(1)}%</div>
                      <div className="text-xs text-gray-500">
                        {presentCount}/{studentAttendance.length} {t('attendance.present')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions - Mobile First Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {quickActions.map((action) => (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className="bg-gray-50 rounded-xl border border-gray-200 p-4 hover:bg-gray-100 transition-colors text-left group"
              >
                <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-3`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm lg:text-base">{action.title}</h3>
                <p className="text-xs lg:text-sm text-gray-600 mb-2">{action.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{t('dashboard.shortcut')}</span>
                  <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                    {action.shortcut}
                  </kbd>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Smart Suggestions - Mobile First */}
        {smartSuggestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
            <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.smartSuggestions')}</h2>
            <div className="space-y-3">
              {smartSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={suggestion.onClick}
                  className={`w-full text-left p-4 rounded-xl border-l-4 hover:shadow-md transition-all duration-200 ${
                    suggestion.type === 'warning' 
                      ? 'bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100' 
                      : 'bg-blue-50 border-blue-400 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  <div className="flex items-start">
                    <suggestion.icon className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm lg:text-base">{suggestion.message}</p>
                      <p className="text-xs lg:text-sm mt-1 opacity-90">{suggestion.action}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity - Mobile First */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 lg:p-6">
          <h2 className="text-lg lg:text-xl font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
          <div className="space-y-3">
            {state.sessions.slice(0, 3).map((session) => {
              const group = state.groups.find(g => g.id === session.groupId);
              return (
                <div key={session.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {group?.name || t('common.group')} - {session.topic || t('sessions.defaultTopic')}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(session.dateTime).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
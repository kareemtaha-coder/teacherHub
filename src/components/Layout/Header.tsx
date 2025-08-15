import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  BookOpen, Users, Calendar, ClipboardList, BarChart3, Settings, Plus, Bell, Menu, X, 
  Home, TrendingUp, FileText, CheckCircle, AlertCircle, UserPlus, BookOpen as BookOpenIcon, 
  CalendarPlus, DollarSign, Eye, Star, Target, Award, Activity, Lightbulb
} from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t, isRTL } = useLanguage();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrl = event.ctrlKey || event.metaKey;
      
      if (ctrl) {
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
        }
      } else {
        switch (key) {
          case 'd':
            event.preventDefault();
            dispatch({ type: 'SET_VIEW', payload: 'dashboard' });
            break;
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
            dispatch({ type: 'SET_VIEW', payload: 'attendance' });
            break;
          case 'r':
            event.preventDefault();
            dispatch({ type: 'SET_VIEW', payload: 'grades' });
            break;
          case 't':
            event.preventDefault();
            dispatch({ type: 'SET_VIEW', payload: 'settings' });
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dispatch]);

  // Enhanced navigation items with better organization and descriptions
  const navItems = [
    { 
      id: 'dashboard', 
      label: t('nav.dashboard'), 
      icon: Home, 
      shortcut: 'D',
      description: 'Overview and quick actions',
      color: 'text-blue-600',
      category: 'main'
    },
    { 
      id: 'students', 
      label: t('nav.students'), 
      icon: Users, 
      shortcut: 'S',
      description: 'Manage student information',
      color: 'text-green-600',
      category: 'main'
    },
    { 
      id: 'groups', 
      label: t('nav.groups'), 
      icon: BookOpen, 
      shortcut: 'G',
      description: 'Organize students into groups',
      color: 'text-purple-600',
      category: 'main'
    },
    { 
      id: 'sessions', 
      label: t('nav.sessions'), 
      icon: Calendar, 
      shortcut: 'C',
      description: 'Schedule and manage classes',
      color: 'text-orange-600',
      category: 'main'
    },
    { 
      id: 'attendance', 
      label: t('nav.attendance'), 
      icon: ClipboardList, 
      shortcut: 'A',
      description: 'Track student attendance',
      color: 'text-indigo-600',
      category: 'tracking'
    },
    { 
      id: 'grades', 
      label: t('nav.grades'), 
      icon: FileText, 
      shortcut: 'R',
      description: 'Manage assessments and grades',
      color: 'text-teal-600',
      category: 'tracking'
    },
    { 
      id: 'settings', 
      label: t('nav.settings'), 
      icon: Settings, 
      shortcut: 'T',
      description: 'App configuration and preferences',
      color: 'text-gray-600',
      category: 'system'
    }
  ];

  // Enhanced quick actions with better descriptions and keyboard shortcuts
  const quickActions = [
    { 
      label: t('students.addStudent'), 
      action: 'students', 
      icon: UserPlus, 
      color: 'bg-blue-500 hover:bg-blue-600',
      description: 'Add new student',
      shortcut: 'Ctrl+S',
      category: 'student'
    },
    { 
      label: t('groups.createGroup'), 
      action: 'groups', 
      icon: BookOpenIcon, 
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Create new group',
      shortcut: 'Ctrl+G',
      category: 'group'
    },
    { 
      label: t('sessions.addSession'), 
      action: 'sessions', 
      icon: CalendarPlus, 
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Schedule new session',
      shortcut: 'Ctrl+C',
      category: 'session'
    }
  ];

  const handleQuickAction = (action: string) => {
    dispatch({ type: 'SET_VIEW', payload: action });
    setShowMobileMenu(false);
  };

  // Enhanced notifications with better categorization and actionable items
  const upcomingSessions = state.sessions.filter(s => {
    const sessionDate = new Date(s.dateTime);
    const now = new Date();
    const diffTime = sessionDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7;
  });

  const overduePayments = state.paymentRecords.filter(p => {
    const dueDate = new Date(p.dueDate);
    const now = new Date();
    return dueDate < now && p.status !== 'paid';
  });

  const lowAttendanceGroups = state.groups.filter(group => {
    const groupStudents = state.studentGroups.filter(sg => sg.groupId === group.id);
    if (groupStudents.length === 0) return false;
    
    const attendanceRecords = state.attendanceRecords.filter(ar => 
      groupStudents.some(sg => sg.studentId === ar.studentId)
    );
    
    if (attendanceRecords.length === 0) return false;
    
    const presentCount = attendanceRecords.filter(ar => ar.status === 'present').length;
    const attendanceRate = (presentCount / attendanceRecords.length) * 100;
    
    return attendanceRate < 80;
  });

  const notifications = [
    ...upcomingSessions.map(s => ({ ...s, type: 'session', priority: 'medium', action: 'view-session' })),
    ...overduePayments.map(p => ({ ...p, type: 'payment', priority: 'high', action: 'view-payments' })),
    ...lowAttendanceGroups.map(g => ({ ...g, type: 'attendance', priority: 'medium', action: 'view-attendance' }))
  ];

  const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
  const totalNotifications = notifications.length;

  // Handle notification actions
  const handleNotificationAction = (notification: any) => {
    switch (notification.action) {
      case 'view-session':
        dispatch({ type: 'SET_VIEW', payload: 'sessions' });
        break;
      case 'view-payments':
        // Could navigate to a payments view if implemented
        console.log('Navigate to payments');
        break;
      case 'view-attendance':
        dispatch({ type: 'SET_VIEW', payload: 'attendance' });
        break;
    }
    setShowNotifications(false);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Desktop Header - Enhanced UX */}
        <div className="hidden lg:flex items-center justify-between h-16">
          {/* Logo and Brand - Enhanced */}
          <div className="flex items-center">
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TeacherHub
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Kareem Taha - Math Teacher</p>
            </div>
          </div>

          {/* Enhanced Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            {/* Search functionality removed */}
          </div>
          
          {/* Right Side - Enhanced */}
          <div className="flex items-center space-x-3">
            {/* Enhanced Quick Actions - Hidden on Desktop */}
            <div className="hidden lg:hidden flex items-center space-x-2">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className={`${action.color} text-white p-3 rounded-xl hover:shadow-lg transition-all duration-200 group relative`}
                  title={`${action.description} (${action.shortcut})`}
                >
                  <action.icon className="h-5 w-5" />
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{action.description}</div>
                    <div className="text-gray-300 mt-1">{action.shortcut}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}
            </div>

            {/* Enhanced Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className={`absolute -top-1 -right-1 h-5 w-5 text-white text-xs rounded-full flex items-center justify-center font-medium ${
                    highPriorityNotifications.length > 0 ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {totalNotifications > 9 ? '9+' : totalNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <p className="text-sm text-gray-500">{totalNotifications} items</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>No notifications</p>
                        <p className="text-sm text-gray-400">You're all caught up!</p>
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((notification, index) => (
                        <button
                          key={index}
                          onClick={() => handleNotificationAction(notification)}
                          className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${
                              notification.type === 'session' ? 'bg-blue-100' : 
                              notification.type === 'payment' ? 'bg-red-100' : 'bg-yellow-100'
                            }`}>
                              {notification.type === 'session' ? (
                                <Calendar className="h-4 w-4 text-blue-600" />
                              ) : notification.type === 'payment' ? (
                                <DollarSign className="h-4 w-4 text-red-600" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-yellow-600" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {notification.type === 'session' ? 'Upcoming Session' : 
                                 notification.type === 'payment' ? 'Overdue Payment' : 'Low Attendance Alert'}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {notification.type === 'session' 
                                  ? `Session on ${new Date((notification as any).dateTime).toLocaleDateString()}`
                                  : notification.type === 'payment'
                                  ? `Due on ${new Date((notification as any).dueDate).toLocaleDateString()}`
                                  : `${(notification as any).name} has attendance below 80%`
                                }
                              </p>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${
                              notification.priority === 'high' ? 'bg-red-500' : 'bg-blue-500'
                            }`}></div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  {notifications.length > 5 && (
                    <div className="px-4 py-2 border-t border-gray-100 text-center">
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        View all notifications
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Enhanced Desktop Navigation - Organized by Categories */}
            <nav className="flex items-center space-x-1">
              {/* Main Navigation */}
              {navItems.filter(item => item.category === 'main').map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                  className={`group relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    state.currentView === item.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={`${item.description} (${item.shortcut})`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-gray-300 mt-1">Press {item.shortcut}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              {/* Tracking Navigation */}
              {navItems.filter(item => item.category === 'tracking').map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                  className={`group relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    state.currentView === item.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={`${item.description} (${item.shortcut})`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-gray-300 mt-1">Press {item.shortcut}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}

              {/* Divider */}
              <div className="w-px h-6 bg-gray-300 mx-2"></div>

              {/* System Navigation */}
              {navItems.filter(item => item.category === 'system').map((item) => (
                <button
                  key={item.id}
                  onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                  className={`group relative px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                    state.currentView === item.id
                      ? 'bg-blue-100 text-blue-700 shadow-sm'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={`${item.description} (${item.shortcut})`}
                >
                  <div className="flex items-center space-x-2">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                  
                  {/* Enhanced Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-gray-300 mt-1">Press {item.shortcut}</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Header - Enhanced UX */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16 px-2">
            {/* Mobile Logo */}
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-white" />
              </div>
              <div className="ml-2">
                <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  TeacherHub
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Kareem Taha</p>
              </div>
            </div>

            {/* Mobile Actions */}
            <div className="flex items-center space-x-2">
              {/* Mobile Notifications */}
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5" />
                {totalNotifications > 0 && (
                  <span className={`absolute -top-1 -right-1 h-5 w-5 text-white text-xs rounded-full flex items-center justify-center font-medium ${
                    highPriorityNotifications.length > 0 ? 'bg-red-500' : 'bg-blue-500'
                  }`}>
                    {totalNotifications > 9 ? '9+' : totalNotifications}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {/* Removed search bar */}

          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="px-2 pb-4">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                {/* Quick Actions */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.action}
                        onClick={() => handleQuickAction(action.action)}
                        className={`${action.color} text-white p-3 rounded-xl text-center transition-all duration-200`}
                      >
                        <action.icon className="h-5 w-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Navigation Items - Organized by Category */}
                <div className="p-2">
                  {/* Main Navigation */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Main</h4>
                    {navItems.filter(item => item.category === 'main').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                          state.currentView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          {item.shortcut}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Tracking Navigation */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Tracking</h4>
                    {navItems.filter(item => item.category === 'tracking').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                          state.currentView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          {item.shortcut}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* System Navigation */}
                  <div className="mb-4">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">System</h4>
                    {navItems.filter(item => item.category === 'system').map((item) => (
                      <button
                        key={item.id}
                        onClick={() => dispatch({ type: 'SET_VIEW', payload: item.id })}
                        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors ${
                          state.currentView === item.id
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{item.label}</div>
                          <div className="text-xs text-gray-500">{item.description}</div>
                        </div>
                        <div className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                          {item.shortcut}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language Switcher */}
                <div className="p-4 border-t border-gray-100">
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close notifications */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
};

export default Header;
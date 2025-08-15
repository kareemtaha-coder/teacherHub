import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { BookOpen, Users, Calendar, ClipboardList, BarChart3, Settings, Plus, Search, Bell, Menu, X } from 'lucide-react';
import LanguageSwitcher from './LanguageSwitcher';

const Header: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Essential navigation items - restored important ones
  const navItems = [
    { 
      id: 'dashboard', 
      label: t('nav.dashboard'), 
      icon: BarChart3, 
      shortcut: 'D'
    },
    { 
      id: 'students', 
      label: t('nav.students'), 
      icon: Users, 
      shortcut: 'S'
    },
    { 
      id: 'groups', 
      label: t('nav.groups'), 
      icon: BookOpen, 
      shortcut: 'G'
    },
    { 
      id: 'sessions', 
      label: t('nav.sessions'), 
      icon: Calendar, 
      shortcut: 'C'
    },
    { 
      id: 'attendance', 
      label: t('nav.attendance'), 
      icon: ClipboardList, 
      shortcut: 'A'
    },
    { 
      id: 'grades', 
      label: t('nav.grades'), 
      icon: BarChart3, 
      shortcut: 'R'
    },
    { 
      id: 'settings', 
      label: t('nav.settings'), 
      icon: Settings, 
      shortcut: 'T'
    }
  ];

  // Essential quick actions - restored important ones
  const quickActions = [
    { 
      label: t('students.addStudent'), 
      action: 'add-student', 
      icon: Users, 
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    { 
      label: t('groups.createGroup'), 
      action: 'add-group', 
      icon: BookOpen, 
      color: 'bg-green-500 hover:bg-green-600'
    },
    { 
      label: t('sessions.addSession'), 
      action: 'add-session', 
      icon: Calendar, 
      color: 'bg-purple-500 hover:bg-purple-600'
    }
  ];

  const handleQuickAction = (action: string) => {
    dispatch({ type: 'SET_VIEW', payload: action });
    setShowMobileMenu(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
      setSearchQuery('');
      setShowSearch(false);
    }
  };

  const handleNavigation = (viewId: string) => {
    dispatch({ type: 'SET_VIEW', payload: viewId });
    setShowMobileMenu(false);
  };

  // Calculate notifications
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

  const notifications = [...upcomingSessions, ...overduePayments];

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
        : 'bg-white border-b border-gray-100'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Desktop Header - Compact for laptop */}
        <div className="hidden lg:flex items-center justify-between h-14">
          {/* Logo and Brand - Smaller */}
          <div className="flex items-center">
            <div className="h-7 w-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <h1 className="ml-2 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              TeacherHub
            </h1>
          </div>

          {/* Search Bar - Compact */}
          <div className="flex-1 max-w-md mx-6">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('common.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white text-sm"
              />
            </form>
          </div>

          {/* Right Side - Compact */}
          <div className="flex items-center space-x-2">
            {/* Quick Actions - Only essential ones */}
            <div className="flex items-center space-x-1">
              {quickActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => handleQuickAction(action.action)}
                  className={`${action.color} text-white p-2 rounded-lg hover:shadow-md transition-all duration-200`}
                  title={action.label}
                >
                  <action.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            {/* Notifications - Compact */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Language Switcher - Compact */}
            <LanguageSwitcher />

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    state.currentView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>

            {/* Mobile Navigation */}
            <nav className="lg:hidden flex items-center space-x-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`p-2 text-sm font-medium rounded-lg transition-colors ${
                    state.currentView === item.id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-5 w-5" />
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-14">
            {/* Mobile Logo and Brand */}
            <div className="flex items-center">
              <div className="h-6 w-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-white" />
              </div>
              <h1 className="ml-2 text-base font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                TeacherHub
              </h1>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setShowSearch(!showSearch)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Search className="h-4 w-4" />
              </button>
              
              <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="h-4 w-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  </span>
                )}
              </button>
              
              <LanguageSwitcher />
              
              <button 
                onClick={() => setShowMobileMenu(!showMobileMenu)} 
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showMobileMenu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          {/* Mobile Search */}
          {showSearch && (
            <div className="pb-3">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-sm"
                  autoFocus
                />
              </form>
            </div>
          )}
          
          {/* Mobile Navigation Menu */}
          {showMobileMenu && (
            <div className="border-t border-gray-200 py-4 bg-gray-50 rounded-b-lg">
              {/* Quick Actions */}
              <div className="mb-4 px-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('dashboard.quickActions')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action.action}
                      onClick={() => handleQuickAction(action.action)}
                      className={`${action.color} text-white p-3 rounded-lg hover:shadow-md transition-all duration-200 text-sm font-medium text-center`}
                    >
                      <div className="flex flex-col items-center space-y-1">
                        <action.icon className="h-4 w-4" />
                        <span className="text-xs">{action.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Navigation Items */}
              <div className="px-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{t('common.navigation')}</h3>
                <nav className="space-y-1">
                  {navItems.map(item => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigation(item.id)}
                      className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                        state.currentView === item.id
                          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </div>
                        <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 rounded">
                          {item.shortcut}
                        </kbd>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>
              
              {/* Notifications - Compact */}
              {notifications.length > 0 && (
                <div className="mt-4 px-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{t('common.notifications')}</h3>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {upcomingSessions.slice(0, 2).map(session => (
                      <div key={session.id} className="text-xs text-gray-600 bg-blue-50 p-2 rounded border border-blue-100">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-blue-500" />
                          <span>{t('sessions.upcomingSession')}: {session.topic}</span>
                        </div>
                      </div>
                    ))}
                    {overduePayments.slice(0, 2).map(payment => (
                      <div key={payment.id} className="text-xs text-gray-600 bg-red-50 p-2 rounded border border-red-100">
                        <div className="flex items-center space-x-2">
                          <Bell className="h-3 w-3 text-red-500" />
                          <span>{t('payments.overduePayment')}: ${payment.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';
import Header from './components/Layout/Header';
import Dashboard from './components/Dashboard/Dashboard';
import StudentList from './components/Students/StudentList';
import GroupList from './components/Groups/GroupList';
import SessionList from './components/Sessions/SessionList';
import AttendanceOverview from './components/Attendance/AttendanceOverview';
import GradesList from './components/Grades/GradesList';
import Settings from './components/Settings/Settings';
import PWAInstallPrompt from './components/Layout/PWAInstallPrompt';

const AppContent: React.FC = () => {
  const { state } = useApp();

  const renderCurrentView = () => {
    switch (state.currentView) {
      case 'students':
        return <StudentList />;
      case 'groups':
        return <GroupList />;
      case 'sessions':
        return <SessionList />;
      case 'attendance':
        return <AttendanceOverview />;
      case 'grades':
        return <GradesList />;
      case 'settings':
        return <Settings />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>
        {renderCurrentView()}
      </main>
      <PWAInstallPrompt />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </LanguageProvider>
  );
};

export default App;
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get language from localStorage or default to English
    const savedLang = localStorage.getItem('teacherHubLanguage') as Language;
    return savedLang && ['en', 'ar'].includes(savedLang) ? savedLang : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('teacherHubLanguage', lang);
    
    // Update document direction and language
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    
    // Add/remove RTL CSS class
    if (lang === 'ar') {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };

  const isRTL = language === 'ar';
  const direction = language === 'ar' ? 'rtl' : 'ltr';

  // Translation function
  const t = (key: string, params?: Record<string, string | number>): string => {
    const translation = translations[language]?.[key] || translations.en[key] || key;
    
    // If translation is an array, join it with newlines
    if (Array.isArray(translation)) {
      return translation.join('\n');
    }
    
    if (params) {
      return translation.replace(/\{(\w+)\}/g, (match: string, param: string) => {
        return String(params[param] || match);
      });
    }
    
    return translation;
  };

  useEffect(() => {
    // Set initial document direction and language
    setLanguage(language);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, direction }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Translation files
const translations: Record<Language, Record<string, string | string[]>> = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.add': 'Add',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.remove': 'Remove',
    'common.select': 'Select',
    'common.all': 'All',
    'common.none': 'None',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.name': 'Name',
    'common.description': 'Description',
    'common.notes': 'Notes',
    'common.comments': 'Comments',
    'common.phone': 'Phone',
    'common.email': 'Email',
    'common.contact': 'Contact',
    'common.group': 'Group',
    'common.student': 'Student',
    'common.teacher': 'Teacher',
    'common.session': 'Session',
    'common.assessment': 'Assessment',
    'common.grade': 'Grade',
    'common.attendance': 'Attendance',
    'common.payment': 'Payment',
    'common.report': 'Report',
    'common.overview': 'Overview',
    'common.details': 'Details',
    'common.summary': 'Summary',
    'common.statistics': 'Statistics',
    'common.performance': 'Performance',
    'common.progress': 'Progress',
    'common.trends': 'Trends',
    'common.insights': 'Insights',
    'common.feedback': 'Feedback',
    'common.observations': 'Observations',
    'common.monitoring': 'Monitoring',
    'common.support': 'Support',
    'common.help': 'Help',
    'common.settings': 'Settings',
    'common.profile': 'Profile',
    'common.dashboard': 'Dashboard',
    'common.home': 'Home',
    'common.menu': 'Menu',
    'common.language': 'Language',
    'common.english': 'English',
    'common.arabic': 'Arabic',
    'common.rtl': 'Right to Left',
    'common.ltr': 'Left to Right',
    'common.navigation': 'Navigation',
    'common.notifications': 'Notifications',

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.students': 'Students',
    'nav.groups': 'Groups',
    'nav.sessions': 'Sessions',
    'nav.attendance': 'Attendance',
    'nav.grades': 'Grades',
    'nav.settings': 'Settings',
    'nav.dashboardDescription': 'View overview and statistics',
    'nav.studentsDescription': 'Manage student roster and information',
    'nav.groupsDescription': 'Organize students into classes and cohorts',
    'nav.sessionsDescription': 'Schedule and manage class sessions',
    'nav.attendanceDescription': 'Track student attendance and records',
    'nav.gradesDescription': 'Manage assessments and student grades',
    'nav.settingsDescription': 'Configure application preferences',

    // Quick Actions
    'quickActions.addStudentDesc': 'Add a new student to your roster',
    'quickActions.createGroupDesc': 'Create a new class or cohort',
    'quickActions.addSessionDesc': 'Schedule a new class session',
    'quickActions.addGradeDesc': 'Create a new assessment or grade',

    // Dashboard
    'dashboard.welcome': 'Welcome to TeacherHub! 👋',
    'dashboard.welcomeTeacher': 'Welcome back, {name}! 👋',
    'dashboard.subtitle': 'Here\'s what\'s happening with your classes today.',
    'dashboard.selectGroup': 'Select Group',
    'dashboard.chooseGroup': 'Choose a group',
    'dashboard.studentAttendance': 'Student Attendance',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.overview': 'Overview',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noActivity': 'No recent activity',
    'dashboard.startMessage': 'Start by creating groups and scheduling sessions!',
    'dashboard.smartSuggestions': 'Smart Suggestions',
    'dashboard.noStudents': 'No students yet',
    'dashboard.addFirstStudent': 'Add your first student to get started!',
    'dashboard.noGroups': 'No groups created',
    'dashboard.createFirstGroup': 'Create your first group to organize students!',
    'dashboard.overduePayments': 'Overdue payments detected',
    'dashboard.reviewPayments': 'Review payment status for timely collection!',
    'dashboard.quickActionAddStudent': 'Quickly add a new student to your roster',
    'dashboard.quickActionCreateGroup': 'Set up a new class or cohort',
    'dashboard.quickActionScheduleSession': 'Plan your next class session',
    'dashboard.quickActionCreateAssessment': 'Set up a new quiz or exam',
    'dashboard.shortcut': 'Shortcut',
    'dashboard.overallAttendance': 'Overall attendance rate',
    'dashboard.paymentRate': 'Payment Rate',
    'dashboard.currentMonthPayments': 'Current month payments',
    'dashboard.viewAll': 'View All',
    'dashboard.recentSessionActivity': 'Session in {group}: {topic}',
    'dashboard.recentAssessmentActivity': 'Assessment {assessment} in {group}',

    // Students
    'students.title': 'Students',
    'students.addStudent': 'Add Student',
    'students.editStudent': 'Edit Student',
    'students.deleteStudent': 'Delete Student',
    'students.viewDetails': 'View Details',
    'students.exportReport': 'Export Report',
    'students.bulkDelete': 'Delete Selected',
    'students.clearSelection': 'Clear Selection',
    'students.selectAll': 'Select All',
    'students.filters': 'Filters',
    'students.exportCSV': 'Export CSV',
    'students.searchPlaceholder': 'Search students by name, contact info, or parent phone...',
    'students.groupStatus': 'Group Status',
    'students.sortBy': 'Sort By',
    'students.createdDate': 'Created Date',
    'students.name': 'Name',
    'students.contactInfo': 'Contact Info',
    'students.parentPhone': 'Parent Phone',
    'students.groups': 'Groups',
    'students.notes': 'Notes',
    'students.actions': 'Actions',
    'students.noStudents': 'No students found',
    'students.noStudentsMessage': 'Start by adding your first student!',
    'students.studentCard': 'Student Card',
    'students.tapToExpand': 'Tap to expand',
    'students.studentsInGroup': 'student(s)',
    'students.subtitle': 'Manage your student roster • {count} students',
    'students.withGroups': 'With Groups',
    'students.withoutGroups': 'Without Groups',
    'students.sortByName': 'Name (A-Z)',
    'students.sortByCreated': 'Recently Added',
    'students.sortByGroups': 'Most Groups',
    'students.selectedCount': '{count} student(s) selected',
    'students.addedOn': 'Added {date}',
    'students.groupCount': '{count} group(s)',
    'students.noContactInfo': 'No contact info',
    'students.noParentPhone': 'No parent phone',
    'students.noGroups': 'No groups',
    'students.noNotes': 'No notes',

    // Groups
    'groups.title': 'Groups',
    'groups.createGroup': 'Create Group',
    'groups.editGroup': 'Edit Group',
    'groups.deleteGroup': 'Delete Group',
    'groups.manageStudents': 'Manage Students',
    'groups.viewReport': 'View Report',
    'groups.managePayments': 'Manage Payments',
    'groups.groupName': 'Group Name',
    'groups.description': 'Description',
    'groups.studentCount': 'Student Count',
    'groups.sessions': 'Sessions',
    'groups.assessments': 'Assessments',
    'groups.students': 'Students',
    'groups.noGroups': 'No groups found',
    'groups.noGroupsMessage': 'Create your first group to get started!',
    'groups.studentsInGroup': 'student(s)',
    'groups.tapToExpand': 'Tap to expand',

    // Sessions
    'sessions.title': 'Sessions',
    'sessions.addSession': 'Add Session',
    'sessions.editSession': 'Edit Session',
    'sessions.deleteSession': 'Delete Session',
    'sessions.takeAttendance': 'Take Attendance',
    'sessions.sessionDate': 'Session Date',
    'sessions.sessionTime': 'Session Time',
    'sessions.topic': 'Topic',
    'sessions.group': 'Group',
    'sessions.attendance': 'Attendance',
    'sessions.noSessions': 'No sessions found',
    'sessions.noSessionsMessage': 'Schedule your first session to get started!',
    'sessions.upcomingSession': 'Upcoming Session',
    'sessions.scheduleSession': 'Schedule Session',
    'sessions.defaultTopic': 'Class Session',

    // Payments
    'payments.title': 'Payments',
    'payments.overduePayment': 'Overdue Payment',

    // Attendance
    'attendance.title': 'Attendance',
    'attendance.present': 'Present',
    'attendance.absent': 'Absent',
    'attendance.excused': 'Excused',
    'attendance.notRecorded': 'Not Recorded',
    'attendance.attendanceRate': 'Attendance Rate',
    'attendance.overallRate': 'Overall Rate',
    'attendance.recentSessions': 'Recent Sessions',
    'attendance.studentAttendance': 'Student Attendance',
    'attendance.noAttendance': 'No attendance records found',

    // Grades
    'grades.title': 'Grades',
    'grades.addGrade': 'Add Grade',
    'grades.editGrade': 'Edit Grade',
    'grades.deleteGrade': 'Delete Grade',
    'grades.assessmentName': 'Assessment Name',
    'grades.studentName': 'Student Name',
    'grades.score': 'Score',
    'grades.maxScore': 'Max Score',
    'grades.percentage': 'Percentage',
    'grades.comments': 'Comments',
    'grades.assessmentDate': 'Assessment Date',
    'grades.noGrades': 'No grades found',
    'grades.noGradesMessage': 'Add grades for your assessments!',
    'grades.createAssessment': 'Create Assessment',

    // Reports
    'reports.title': 'Reports',
    'reports.studentReport': 'Student Report',
    'reports.groupReport': 'Group Report',
    'reports.comprehensiveProfile': 'Comprehensive Student Profile',
    'reports.holisticView': 'Holistic view of {name}\'s academic journey',
    'reports.profileType': 'Profile Type',
    'reports.profileDescription': 'This comprehensive profile consolidates attendance records, grades, teacher feedback, and ongoing observations into a single, easily accessible view.',
    'reports.purpose': 'Purpose',
    'reports.purposeDescription': 'Enables educators to quickly understand each student\'s unique strengths and weaknesses for providing targeted, individualized support.',
    'reports.reportPeriod': 'Report Period',
    'reports.startDate': 'Start Date',
    'reports.endDate': 'End Date',
    'reports.exportReport': 'Export Report',
    'reports.ongoingNotes': 'Ongoing Notes & Observations',
    'reports.notesDescription': 'These are general observations about the student\'s behavior, progress, and specific needs.',
    'reports.noNotes': 'No ongoing notes recorded',
    'reports.addNotesPrompt': 'Add notes to track student progress and needs',
    'reports.qualitativeFeedback': 'Qualitative Feedback Analysis',
    'reports.assessmentFeedback': 'Assessment Feedback',
    'reports.feedbackEntries': 'assessment(s) with detailed feedback',
    'reports.noFeedback': 'No assessment feedback recorded',
    'reports.addFeedbackPrompt': 'Add comments when grading assessments',
    'reports.progressInsights': 'Progress Insights',
    'reports.attendancePattern': 'Attendance Pattern',
    'reports.academicPerformance': 'Academic Performance',
    'reports.financialCompliance': 'Financial Compliance',
    'reports.excellent': 'Excellent',
    'reports.good': 'Good',
    'reports.moderate': 'Moderate',
    'reports.needsImprovement': 'Needs Improvement',
    'reports.performanceBelow': 'Performance below expectations - support needed',
    'reports.attendanceRecord': 'attendance record',
    'reports.roomForImprovement': 'with room for improvement',
    'reports.considerSupport': 'consider support strategies',
    'reports.interventionRecommended': 'intervention recommended',
    'reports.outstandingPerformance': 'Outstanding academic performance',
    'reports.strongPerformance': 'Strong academic performance',
    'reports.satisfactoryPerformance': 'Satisfactory performance - monitor progress',
    'reports.excellentCompliance': 'Excellent payment compliance',
    'reports.goodCompliance': 'Good payment compliance',
    'reports.followUpRecommended': 'follow up recommended',
    'reports.immediateAttention': 'immediate attention needed',

    // Key Data Fields
    'dataFields.title': 'Key Data Fields for Long-term Monitoring',
    'dataFields.studentNotes': 'Student Notes Field',
    'dataFields.gradeComments': 'Grade Comments Field',
    'dataFields.purposeUsage': 'Purpose & Usage',
    'dataFields.currentStatus': 'Current Status',
    'dataFields.notesPurpose': [
      'General, ongoing observations about student behavior',
      'Long-term progress tracking and development notes',
      'Specific needs identification and accommodation notes',
      'Behavioral patterns and intervention strategies'
    ],
    'dataFields.commentsPurpose': [
      'Specific feedback related to particular assessments',
      'Detailed guidance for improvement and growth',
      'Achievement recognition and encouragement',
      'Targeted support recommendations'
    ],
    'dataFields.activeNotes': 'Active Notes',
    'dataFields.characters': 'characters',
    'dataFields.noNotesRecorded': 'No notes recorded',
    'dataFields.considerAddingNotes': 'Consider adding notes for long-term monitoring',
    'dataFields.feedbackCoverage': 'Feedback Coverage',
    'dataFields.ofAssessments': 'of assessments have feedback',
    'dataFields.outOfAssessments': 'out of {total} assessments include detailed comments',
    'dataFields.combinedBenefits': 'Combined Benefits for Comprehensive Monitoring',
    'dataFields.holisticUnderstanding': 'Holistic Understanding',
    'dataFields.holisticDescription': 'Notes and comments together create a rich, qualitative record that complements quantitative data from grades and attendance.',
    'dataFields.targetedSupport': 'Targeted Support',
    'dataFields.targetedDescription': 'Educators can quickly identify specific needs and provide individualized support based on comprehensive observations.',
    'dataFields.longTermTracking': 'Long-term Tracking',
    'dataFields.longTermDescription': 'Continuous monitoring enables tracking of progress, behavioral changes, and intervention effectiveness over time.',

    // Performance
    'performance.title': 'Performance',
    'performance.trends': 'Performance Trends',
    'performance.recentAttendance': 'Recent Attendance',
    'performance.lastSessions': 'Last {count} sessions',
    'performance.gradeTrend': 'Grade Trend',
    'performance.lastAssessments': 'Last {count} assessments',
    'performance.overallPerformance': 'Overall Performance',
    'performance.combinedScore': 'Combined Score',
    'performance.improving': 'Improving',
    'performance.declining': 'Declining',
    'performance.stable': 'Stable',

    // Statistics
    'statistics.title': 'Statistics',
    'statistics.detailedStatistics': 'Detailed Statistics',
    'statistics.attendanceBreakdown': 'Attendance Breakdown',
    'statistics.gradeBreakdown': 'Grade Breakdown',
    'statistics.paymentBreakdown': 'Payment Breakdown',
    'statistics.groupInformation': 'Group Information',
    'statistics.personalInformation': 'Personal Information',
    'statistics.totalSessions': 'Total Sessions',
    'statistics.attendedSessions': 'Attended Sessions',
    'statistics.absentSessions': 'Absent Sessions',
    'statistics.excusedSessions': 'Excused Sessions',
    'statistics.total': 'Total',
    'statistics.graded': 'Graded',
    'statistics.highest': 'Highest',
    'statistics.lowest': 'Lowest',
    'statistics.average': 'Average',
    'statistics.paid': 'Paid',
    'statistics.unpaid': 'Unpaid',
    'statistics.groups': 'Groups',
    'statistics.primaryGroup': 'Primary Group',
    'statistics.contact': 'Contact',
    'statistics.parentPhone': 'Parent Phone',
    'statistics.notProvided': 'Not provided',

    // Tables
    'tables.student': 'Student',
    'tables.attendance': 'Attendance',
    'tables.grades': 'Grades',
    'tables.payments': 'Payments',
    'tables.teacherFeedback': 'Teacher Feedback',
    'tables.feedback': 'Feedback',
    'tables.specificGuidance': 'Specific guidance for improvement',
    'tables.noFeedbackProvided': 'No feedback provided',
    'tables.addCommentsWhenGrading': 'Add comments when grading',
    'tables.moreFeedbackEntries': '+{count} more feedback entries',

    // Modals
    'modals.confirmDelete': 'Confirm Delete',
    'modals.deleteWarning': 'Are you sure you want to delete this item?',
    'modals.deleteGroupWarning': 'This group contains {count} students. Deleting it will remove all associated data. Are you sure?',
    'modals.deleteStudentWarning': 'This will permanently delete the student and all associated data. Are you sure?',
    'modals.deleteMultipleStudents': 'Are you sure you want to delete {count} selected student(s)? This action cannot be undone.',

    // Errors
    'errors.required': 'This field is required',
    'errors.invalidDate': 'Invalid date',
    'errors.dateRange': 'End date must be after start date',
    'errors.general': 'An error occurred. Please try again.',

    // Success
    'success.saved': 'Saved successfully',
    'success.deleted': 'Deleted successfully',
    'success.updated': 'Updated successfully',
    'success.created': 'Created successfully',

    // Time
    'time.today': 'Today',
    'time.yesterday': 'Yesterday',
    'time.thisWeek': 'This Week',
    'time.lastWeek': 'Last Week',
    'time.thisMonth': 'This Month',
    'time.lastMonth': 'Last Month',
    'time.thisYear': 'This Year',
    'time.lastYear': 'Last Year',

    // Numbers
    'numbers.zero': 'Zero',
    'numbers.one': 'One',
    'numbers.two': 'Two',
    'numbers.three': 'Three',
    'numbers.four': 'Four',
    'numbers.five': 'Five',
    'numbers.six': 'Six',
    'numbers.seven': 'Seven',
    'numbers.eight': 'Eight',
    'numbers.nine': 'Nine',
    'numbers.ten': 'Ten',

    // PWA
    'pwa.installTitle': 'Install TeacherHub App',
    'pwa.installDescription': 'Install this app on your phone for quick access and offline use.',
    'pwa.installButton': 'Install',
    'pwa.notNow': 'Not Now'
  },

  ar: {
    // Common
    'common.loading': 'جاري التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    'common.confirm': 'تأكيد',
    'common.back': 'رجوع',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.export': 'تصدير',
    'common.import': 'استيراد',
    'common.add': 'إضافة',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.remove': 'إزالة',
    'common.select': 'اختيار',
    'common.all': 'الكل',
    'common.none': 'لا شيء',
    'common.actions': 'الإجراءات',
    'common.status': 'الحالة',
    'common.date': 'التاريخ',
    'common.time': 'الوقت',
    'common.name': 'الاسم',
    'common.description': 'الوصف',
    'common.notes': 'ملاحظات',
    'common.comments': 'تعليقات',
    'common.phone': 'الهاتف',
    'common.email': 'البريد الإلكتروني',
    'common.contact': 'معلومات الاتصال',
    'common.group': 'المجموعة',
    'common.student': 'الطالب',
    'common.teacher': 'المعلم',
    'common.session': 'الجلسة',
    'common.assessment': 'التقييم',
    'common.grade': 'الدرجة',
    'common.attendance': 'الحضور',
    'common.payment': 'الدفع',
    'common.report': 'التقرير',
    'common.overview': 'نظرة عامة',
    'common.details': 'التفاصيل',
    'common.summary': 'ملخص',
    'common.statistics': 'الإحصائيات',
    'common.performance': 'الأداء',
    'common.progress': 'التقدم',
    'common.trends': 'الاتجاهات',
    'common.insights': 'رؤى',
    'common.feedback': 'التغذية الراجعة',
    'common.observations': 'الملاحظات',
    'common.monitoring': 'المراقبة',
    'common.support': 'الدعم',
    'common.help': 'المساعدة',
    'common.settings': 'الإعدادات',
    'common.profile': 'الملف الشخصي',
    'common.dashboard': 'لوحة التحكم',
    'common.home': 'الرئيسية',
    'common.menu': 'القائمة',
    'common.language': 'اللغة',
    'common.english': 'الإنجليزية',
    'common.arabic': 'العربية',
    'common.rtl': 'من اليمين إلى اليسار',
    'common.ltr': 'من اليسار إلى اليمين',
    'common.navigation': 'التنقل',
    'common.notifications': 'الإشعارات',

    // Navigation
    'nav.dashboard': 'لوحة التحكم',
    'nav.students': 'الطلاب',
    'nav.groups': 'المجموعات',
    'nav.sessions': 'الجلسات',
    'nav.attendance': 'الحضور',
    'nav.grades': 'الدرجات',
    'nav.settings': 'الإعدادات',
    'nav.dashboardDescription': 'عرض النظرة العامة والإحصائيات',
    'nav.studentsDescription': 'إدارة قائمتك بالطلاب ومعلوماتهم',
    'nav.groupsDescription': 'تنظيم الطلاب في الفصول والمجموعات',
    'nav.sessionsDescription': 'جدول وإدارة الجلسات الصفية',
    'nav.attendanceDescription': 'تتبع حضور الطلاب وسجلاتهم',
    'nav.gradesDescription': 'إدارة التقييمات والدرجات الطلابية',
    'nav.settingsDescription': 'تكوين تفضيلات التطبيق',

    // Quick Actions
    'quickActions.addStudentDesc': 'إضافة طالب جديد إلى قائمتك',
    'quickActions.createGroupDesc': 'إعداد فصل جديد أو مجموعة',
    'quickActions.addSessionDesc': 'جدول جلستك التالية',
    'quickActions.addGradeDesc': 'إعداد اختبار أو درجة جديدة',

    // Dashboard
    'dashboard.welcome': 'مرحباً بك في TeacherHub! 👋',
    'dashboard.welcomeTeacher': 'مرحباً بعودتك، {name}! 👋',
    'dashboard.subtitle': 'إليك ما يحدث في فصولك اليوم.',
    'dashboard.selectGroup': 'اختر المجموعة',
    'dashboard.chooseGroup': 'اختر مجموعة',
    'dashboard.studentAttendance': 'حضور الطالب',
    'dashboard.quickActions': 'الإجراءات السريعة',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.noActivity': 'لا يوجد نشاط حديث',
    'dashboard.startMessage': 'ابدأ بإنشاء المجموعات وجدولة الجلسات!',
    'dashboard.smartSuggestions': 'اقتراحات ذكية',
    'dashboard.noStudents': 'لا يوجد طلاب بعد',
    'dashboard.addFirstStudent': 'أضف طالبك الأول للبدء!',
    'dashboard.noGroups': 'لا توجد مجموعات منشأة',
    'dashboard.createFirstGroup': 'أنشئ مجموعتك الأولى لتنظيم الطلاب!',
    'dashboard.overduePayments': 'تم اكتشاف مدفوعات متأخرة',
    'dashboard.reviewPayments': 'راجع حالة الدفع للتحصيل في الوقت المناسب!',
    'dashboard.quickActionAddStudent': 'أضف طالباً جديداً بسرعة لقائمتك',
    'dashboard.quickActionCreateGroup': 'إعداد فصل جديد أو مجموعة',
    'dashboard.quickActionScheduleSession': 'خطط جلستك التالية',
    'dashboard.quickActionCreateAssessment': 'إعداد اختبار أو امتحان جديد',
    'dashboard.shortcut': 'اختصار',
    'dashboard.overallAttendance': 'معدل الحضور العام',
    'dashboard.paymentRate': 'معدل الدفع',
    'dashboard.currentMonthPayments': 'المدفوعات الشهرية الحالية',
    'dashboard.viewAll': 'عرض الكل',
    'dashboard.recentSessionActivity': 'جلسة في {group}: {topic}',
    'dashboard.recentAssessmentActivity': 'التقييم {assessment} في {group}',

    // Students
    'students.title': 'الطلاب',
    'students.addStudent': 'إضافة طالب',
    'students.editStudent': 'تعديل الطالب',
    'students.deleteStudent': 'حذف الطالب',
    'students.viewDetails': 'عرض التفاصيل',
    'students.exportReport': 'تصدير التقرير',
    'students.bulkDelete': 'حذف المحدد',
    'students.clearSelection': 'مسح التحديد',
    'students.selectAll': 'تحديد الكل',
    'students.filters': 'التصفية',
    'students.exportCSV': 'تصدير CSV',
    'students.searchPlaceholder': 'البحث عن الطلاب بالاسم أو معلومات الاتصال أو هاتف الوالد...',
    'students.groupStatus': 'حالة المجموعة',
    'students.sortBy': 'ترتيب حسب',
    'students.createdDate': 'تاريخ الإنشاء',
    'students.name': 'الاسم',
    'students.contactInfo': 'معلومات الاتصال',
    'students.parentPhone': 'هاتف الوالد',
    'students.groups': 'المجموعات',
    'students.notes': 'ملاحظات',
    'students.actions': 'الإجراءات',
    'students.noStudents': 'لا يوجد طلاب',
    'students.noStudentsMessage': 'ابدأ بإضافة طالبك الأول!',
    'students.studentCard': 'بطاقة الطالب',
    'students.tapToExpand': 'اضغط للتوسيع',
    'students.studentsInGroup': 'طالب(ة)',
    'students.subtitle': 'إدارة قائمتك بالطلاب • {count} طالب',
    'students.withGroups': 'مع المجموعات',
    'students.withoutGroups': 'بدون مجموعات',
    'students.sortByName': 'الاسم (أ-ي)',
    'students.sortByCreated': 'الأخيرة',
    'students.sortByGroups': 'الأكثر مجموعات',
    'students.selectedCount': '{count} طالب(ة) محدد(ة)',
    'students.addedOn': 'أضيف في {date}',
    'students.groupCount': '{count} مجموعة(ة)',
    'students.noContactInfo': 'لا توجد معلومات اتصال',
    'students.noParentPhone': 'لا هاتف للوالد',
    'students.noGroups': 'لا توجد مجموعات',
    'students.noNotes': 'لا توجد ملاحظات',

    // Groups
    'groups.title': 'المجموعات',
    'groups.createGroup': 'إنشاء مجموعة',
    'groups.editGroup': 'تعديل المجموعة',
    'groups.deleteGroup': 'حذف المجموعة',
    'groups.manageStudents': 'إدارة الطلاب',
    'groups.viewReport': 'عرض التقرير',
    'groups.managePayments': 'إدارة المدفوعات',
    'groups.groupName': 'اسم المجموعة',
    'groups.description': 'الوصف',
    'groups.studentCount': 'عدد الطلاب',
    'groups.sessions': 'الجلسات',
    'groups.assessments': 'التقييمات',
    'groups.students': 'الطلاب',
    'groups.noGroups': 'لا توجد مجموعات',
    'groups.noGroupsMessage': 'أنشئ مجموعتك الأولى للبدء!',
    'groups.studentsInGroup': 'طالب(ة)',
    'groups.tapToExpand': 'اضغط للتوسيع',

    // Sessions
    'sessions.title': 'الجلسات',
    'sessions.addSession': 'إضافة جلسة',
    'sessions.editSession': 'تعديل الجلسة',
    'sessions.deleteSession': 'حذف الجلسة',
    'sessions.takeAttendance': 'تسجيل الحضور',
    'sessions.sessionDate': 'تاريخ الجلسة',
    'sessions.sessionTime': 'وقت الجلسة',
    'sessions.topic': 'الموضوع',
    'sessions.group': 'المجموعة',
    'sessions.attendance': 'الحضور',
    'sessions.noSessions': 'لا توجد جلسات',
    'sessions.noSessionsMessage': 'جدول جلستك الأولى للبدء!',
    'sessions.upcomingSession': 'الجلسة القادمة',
    'sessions.scheduleSession': 'جدول جلستك التالية',
    'sessions.defaultTopic': 'جلسة صفية',

    // Payments
    'payments.title': 'المدفوعات',
    'payments.overduePayment': 'المدفوعة المتأخرة',

    // Attendance
    'attendance.title': 'الحضور',
    'attendance.present': 'حاضر',
    'attendance.absent': 'غائب',
    'attendance.excused': 'معذور',
    'attendance.notRecorded': 'غير مسجل',
    'attendance.attendanceRate': 'معدل الحضور',
    'attendance.overallRate': 'المعدل العام',
    'attendance.recentSessions': 'الجلسات الأخيرة',
    'attendance.studentAttendance': 'حضور الطالب',
    'attendance.noAttendance': 'لا توجد سجلات حضور',

    // Grades
    'grades.title': 'الدرجات',
    'grades.addGrade': 'إضافة درجة',
    'grades.editGrade': 'تعديل الدرجة',
    'grades.deleteGrade': 'حذف الدرجة',
    'grades.assessmentName': 'اسم التقييم',
    'grades.studentName': 'اسم الطالب',
    'grades.score': 'الدرجة',
    'grades.maxScore': 'الدرجة القصوى',
    'grades.percentage': 'النسبة المئوية',
    'grades.comments': 'التعليقات',
    'grades.assessmentDate': 'تاريخ التقييم',
    'grades.noGrades': 'لا توجد درجات',
    'grades.noGradesMessage': 'أضف درجات لتقييماتك!',
    'grades.createAssessment': 'إنشاء تقييم',

    // Reports
    'reports.title': 'التقارير',
    'reports.studentReport': 'تقرير الطالب',
    'reports.groupReport': 'تقرير المجموعة',
    'reports.comprehensiveProfile': 'الملف الشخصي الشامل للطالب',
    'reports.holisticView': 'نظرة شاملة لرحلة {name} الأكاديمية',
    'reports.profileType': 'نوع الملف الشخصي',
    'reports.profileDescription': 'هذا الملف الشخصي الشامل يجمع سجلات الحضور والدرجات والتغذية الراجعة من المعلم والملاحظات المستمرة في عرض واحد سهل الوصول إليه.',
    'reports.purpose': 'الغرض',
    'reports.purposeDescription': 'يمكن المعلمين من فهم نقاط القوة والضعف الفريدة لكل طالب بسرعة لتقديم دعم مستهدف وفردي.',
    'reports.reportPeriod': 'فترة التقرير',
    'reports.startDate': 'تاريخ البداية',
    'reports.endDate': 'تاريخ النهاية',
    'reports.exportReport': 'تصدير التقرير',
    'reports.ongoingNotes': 'ملاحظات وتعليقات مستمرة',
    'reports.notesDescription': 'هذه ملاحظات عامة مستمرة حول سلوك الطالب وتقدمه واحتياجاته المحددة.',
    'reports.noNotes': 'لا توجد ملاحظات مستمرة مسجلة',
    'reports.addNotesPrompt': 'أضف ملاحظات لتتبع تقدم الطالب واحتياجاته',
    'reports.qualitativeFeedback': 'تحليل التغذية الراجعة النوعية',
    'reports.assessmentFeedback': 'تغذية راجعة التقييم',
    'reports.feedbackEntries': 'تقييم(ات) مع تغذية راجعة مفصلة',
    'reports.noFeedback': 'لا توجد تغذية راجعة للتقييم مسجلة',
    'reports.addFeedbackPrompt': 'أضف تعليقات عند تقييم الدرجات',
    'reports.progressInsights': 'رؤى التقدم',
    'reports.attendancePattern': 'نمط الحضور',
    'reports.academicPerformance': 'الأداء الأكاديمي',
    'reports.financialCompliance': 'الامتثال المالي',
    'reports.excellent': 'ممتاز',
    'reports.good': 'جيد',
    'reports.moderate': 'متوسط',
    'reports.needsImprovement': 'يحتاج تحسين',
    'reports.performanceBelow': 'الأداء أقل من المتوقع - يحتاج دعم',
    'reports.attendanceRecord': 'سجل حضور',
    'reports.roomForImprovement': 'مع مجال للتحسين',
    'reports.considerSupport': 'فكر في استراتيجيات الدعم',
    'reports.interventionRecommended': 'التدخل موصى به',
    'reports.outstandingPerformance': 'أداء أكاديمي متميز',
    'reports.strongPerformance': 'أداء أكاديمي قوي',
    'reports.satisfactoryPerformance': 'أداء مرضٍ - راقب التقدم',
    'reports.excellentCompliance': 'امتثال ممتاز للدفع',
    'reports.goodCompliance': 'امتثال جيد للدفع',
    'reports.followUpRecommended': 'المتابعة موصى بها',
    'reports.immediateAttention': 'يحتاج اهتمام فوري',

    // Key Data Fields
    'dataFields.title': 'حقول البيانات الرئيسية للمراقبة طويلة المدى',
    'dataFields.studentNotes': 'حقل ملاحظات الطالب',
    'dataFields.gradeComments': 'حقل تعليقات الدرجة',
    'dataFields.purposeUsage': 'الغرض والاستخدام',
    'dataFields.currentStatus': 'الحالة الحالية',
    'dataFields.notesPurpose': [
      'ملاحظات عامة مستمرة حول سلوك الطالب',
      'تتبع التقدم طويل المدى وملاحظات التطوير',
      'تحديد الاحتياجات المحددة وملاحظات التسهيلات',
      'أنماط السلوك واستراتيجيات التدخل'
    ],
    'dataFields.commentsPurpose': [
      'تغذية راجعة محددة متعلقة بتقييمات معينة',
      'توجيه مفصل للتحسين والنمو',
      'الاعتراف بالإنجاز والتشجيع',
      'توصيات الدعم المستهدف'
    ],
    'dataFields.activeNotes': 'ملاحظات نشطة',
    'dataFields.characters': 'حرف',
    'dataFields.noNotesRecorded': 'لا توجد ملاحظات مسجلة',
    'dataFields.considerAddingNotes': 'فكر في إضافة ملاحظات للمراقبة طويلة المدى',
    'dataFields.feedbackCoverage': 'تغطية التغذية الراجعة',
    'dataFields.ofAssessments': 'من التقييمات لها تغذية راجعة',
    'dataFields.outOfAssessments': 'من أصل {total} تقييم يتضمن تعليقات مفصلة',
    'dataFields.combinedBenefits': 'الفوائد المشتركة للمراقبة الشاملة',
    'dataFields.holisticUnderstanding': 'الفهم الشامل',
    'dataFields.holisticDescription': 'الملاحظات والتعليقات معاً تنشئ سجلاً نوعياً غنياً يكمل البيانات الكمية من الدرجات والحضور.',
    'dataFields.targetedSupport': 'الدعم المستهدف',
    'dataFields.targetedDescription': 'يمكن المعلمين من تحديد الاحتياجات المحددة بسرعة وتقديم دعم فردي بناءً على الملاحظات الشاملة.',
    'dataFields.longTermTracking': 'التتبع طويل المدى',
    'dataFields.longTermDescription': 'المراقبة المستمرة تمكن من تتبع التقدم والتغيرات السلوكية وفعالية التدخل مع مرور الوقت.',

    // Performance
    'performance.title': 'الأداء',
    'performance.trends': 'اتجاهات الأداء',
    'performance.recentAttendance': 'الحضور الأخير',
    'performance.lastSessions': 'آخر {count} جلسات',
    'performance.gradeTrend': 'اتجاه الدرجة',
    'performance.lastAssessments': 'آخر {count} تقييمات',
    'performance.overallPerformance': 'الأداء العام',
    'performance.combinedScore': 'الدرجة المركبة',
    'performance.improving': 'يتحسن',
    'performance.declining': 'يتدهور',
    'performance.stable': 'مستقر',

    // Statistics
    'statistics.title': 'الإحصائيات',
    'statistics.detailedStatistics': 'إحصائيات مفصلة',
    'statistics.attendanceBreakdown': 'تفصيل الحضور',
    'statistics.gradeBreakdown': 'تفصيل الدرجات',
    'statistics.paymentBreakdown': 'تفصيل المدفوعات',
    'statistics.groupInformation': 'معلومات المجموعة',
    'statistics.personalInformation': 'المعلومات الشخصية',
    'statistics.totalSessions': 'إجمالي الجلسات',
    'statistics.attendedSessions': 'الجلسات الحاضرة',
    'statistics.absentSessions': 'الجلسات الغائبة',
    'statistics.excusedSessions': 'الجلسات المعذورة',
    'statistics.total': 'الإجمالي',
    'statistics.graded': 'مقيّم',
    'statistics.highest': 'الأعلى',
    'statistics.lowest': 'الأدنى',
    'statistics.average': 'المتوسط',
    'statistics.paid': 'مدفوع',
    'statistics.unpaid': 'غير مدفوع',
    'statistics.groups': 'المجموعات',
    'statistics.primaryGroup': 'المجموعة الأساسية',
    'statistics.contact': 'الاتصال',
    'statistics.parentPhone': 'هاتف الوالد',
    'statistics.notProvided': 'غير متوفر',

    // Tables
    'tables.student': 'الطالب',
    'tables.attendance': 'الحضور',
    'tables.grades': 'الدرجات',
    'tables.payments': 'المدفوعات',
    'tables.teacherFeedback': 'تغذية راجعة المعلم',
    'tables.feedback': 'التغذية الراجعة',
    'tables.specificGuidance': 'توجيه محدد للتحسين',
    'tables.noFeedbackProvided': 'لا توجد تغذية راجعة مقدمة',
    'tables.addCommentsWhenGrading': 'أضف تعليقات عند التقييم',
    'tables.moreFeedbackEntries': '+{count} مدخلات تغذية راجعة أخرى',

    // Modals
    'modals.confirmDelete': 'تأكيد الحذف',
    'modals.deleteWarning': 'هل أنت متأكد من أنك تريد حذف هذا العنصر؟',
    'modals.deleteGroupWarning': 'هذه المجموعة تحتوي على {count} طالب. حذفها سيؤدي إلى إزالة جميع البيانات المرتبطة. هل أنت متأكد؟',
    'modals.deleteStudentWarning': 'سيؤدي هذا إلى حذف الطالب وجميع البيانات المرتبطة به نهائياً. هل أنت متأكد؟',
    'modals.deleteMultipleStudents': 'هل أنت متأكد من أنك تريد حذف {count} طالباً محدداً؟ هذه العملية غير قابلة للتراجع.',

    // Errors
    'errors.required': 'هذا الحقل مطلوب',
    'errors.invalidDate': 'تاريخ غير صحيح',
    'errors.dateRange': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية',
    'errors.general': 'حدث خطأ. يرجى المحاولة مرة أخرى.',

    // Success
    'success.saved': 'تم الحفظ بنجاح',
    'success.deleted': 'تم الحذف بنجاح',
    'success.updated': 'تم التحديث بنجاح',
    'success.created': 'تم الإنشاء بنجاح',

    // Time
    'time.today': 'اليوم',
    'time.yesterday': 'أمس',
    'time.thisWeek': 'هذا الأسبوع',
    'time.lastWeek': 'الأسبوع الماضي',
    'time.thisMonth': 'هذا الشهر',
    'time.lastMonth': 'الشهر الماضي',
    'time.thisYear': 'هذا العام',
    'time.lastYear': 'العام الماضي',

    // Numbers
    'numbers.zero': 'صفر',
    'numbers.one': 'واحد',
    'numbers.two': 'اثنان',
    'numbers.three': 'ثلاثة',
    'numbers.four': 'أربعة',
    'numbers.five': 'خمسة',
    'numbers.six': 'ستة',
    'numbers.seven': 'سبعة',
    'numbers.eight': 'ثمانية',
    'numbers.nine': 'تسعة',
    'numbers.ten': 'عشرة',

    // PWA
    'pwa.installTitle': 'تثبيت تطبيق TeacherHub',
    'pwa.installDescription': 'قم بتثبيت هذا التطبيق على هاتفك للوصول بسرعة واستخدام خارج الإنترنت.',
    'pwa.installButton': 'تثبيت الآن',
    'pwa.notNow': 'لاحقاً'
  }
}; 
import { AppData } from '../types';

const defaultData: AppData = {
  students: [],
  groups: [],
  studentGroups: [],
  sessions: [],
  attendanceRecords: [],
  sessionReports: [],
  assessments: [],
  grades: [],
  paymentRecords: []
};

export const loadData = (): AppData => {
  try {
    const data = localStorage.getItem('teacherHubData');
    if (data) {
      const parsedData = JSON.parse(data);
      // Validate that required properties exist
      if (parsedData && typeof parsedData === 'object') {
        return {
          students: Array.isArray(parsedData.students) ? parsedData.students : [],
          groups: Array.isArray(parsedData.groups) ? parsedData.groups : [],
          studentGroups: Array.isArray(parsedData.studentGroups) ? parsedData.studentGroups : [],
          sessions: Array.isArray(parsedData.sessions) ? parsedData.sessions : [],
          attendanceRecords: Array.isArray(parsedData.attendanceRecords) ? parsedData.attendanceRecords : [],
          sessionReports: Array.isArray(parsedData.sessionReports) ? parsedData.sessionReports : [],
          assessments: Array.isArray(parsedData.assessments) ? parsedData.assessments : [],
          grades: Array.isArray(parsedData.grades) ? parsedData.grades : [],
          paymentRecords: Array.isArray(parsedData.paymentRecords) ? parsedData.paymentRecords : []
        };
      }
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return defaultData;
};

export const saveData = (data: AppData): void => {
  try {
    localStorage.setItem('teacherHubData', JSON.stringify(data));
  } catch (error) {
    console.error('Error saving data:', error);
  }
};

export const exportData = (): void => {
  try {
    const data = loadData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `teacherhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
  }
};

export const importData = (jsonData: string): boolean => {
  try {
    const data = JSON.parse(jsonData) as AppData;
    // Validate that required properties exist
    if (data && typeof data === 'object') {
      const validatedData: AppData = {
        students: Array.isArray(data.students) ? data.students : [],
        groups: Array.isArray(data.groups) ? data.groups : [],
        studentGroups: Array.isArray(data.studentGroups) ? data.studentGroups : [],
        sessions: Array.isArray(data.sessions) ? data.sessions : [],
        attendanceRecords: Array.isArray(data.attendanceRecords) ? data.attendanceRecords : [],
        sessionReports: Array.isArray(data.sessionReports) ? data.sessionReports : [],
        assessments: Array.isArray(data.assessments) ? data.assessments : [],
        grades: Array.isArray(data.grades) ? data.grades : [],
        paymentRecords: Array.isArray(data.paymentRecords) ? data.paymentRecords : []
      };
      saveData(validatedData);
      return true;
    }
  } catch (error) {
    console.error('Error importing data:', error);
  }
  return false;
};
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AppData, Student, Group, StudentGroup, Session, AttendanceRecord, SessionReport, Assessment, Grade, PaymentRecord } from '../types';
import { loadData, saveData } from '../utils/storage';
import { generateId } from '../utils/generators';

interface AppState extends AppData {
  currentView: string;
}

type AppAction =
  | { type: 'SET_VIEW'; payload: string }
  | { type: 'ADD_STUDENT'; payload: Omit<Student, 'id' | 'createdAt'> }
  | { type: 'UPDATE_STUDENT'; payload: Student }
  | { type: 'DELETE_STUDENT'; payload: string }
  | { type: 'ADD_GROUP'; payload: Omit<Group, 'id' | 'createdAt'> }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: string }
  | { type: 'ADD_STUDENT_TO_GROUP'; payload: { studentId: string; groupId: string } }
  | { type: 'REMOVE_STUDENT_FROM_GROUP'; payload: { studentId: string; groupId: string } }
  | { type: 'ADD_SESSION'; payload: Omit<Session, 'id' | 'createdAt'> }
  | { type: 'UPDATE_SESSION'; payload: Session }
  | { type: 'DELETE_SESSION'; payload: string }
  | { type: 'ADD_ATTENDANCE'; payload: Omit<AttendanceRecord, 'id'> }
  | { type: 'UPDATE_ATTENDANCE'; payload: AttendanceRecord }
  | { type: 'ADD_SESSION_REPORT'; payload: Omit<SessionReport, 'id' | 'createdAt' | 'updatedAt'> }
  | { type: 'UPDATE_SESSION_REPORT'; payload: SessionReport }
  | { type: 'DELETE_SESSION_REPORT'; payload: string }
  | { type: 'ADD_ASSESSMENT'; payload: Omit<Assessment, 'id' | 'createdAt'> }
  | { type: 'UPDATE_ASSESSMENT'; payload: Assessment }
  | { type: 'DELETE_ASSESSMENT'; payload: string }
  | { type: 'ADD_GRADE'; payload: Omit<Grade, 'id'> }
  | { type: 'UPDATE_GRADE'; payload: Grade }
  | { type: 'DELETE_GRADE'; payload: string }
  | { type: 'ADD_PAYMENT'; payload: Omit<PaymentRecord, 'id' | 'createdAt'> }
  | { type: 'UPDATE_PAYMENT'; payload: PaymentRecord }
  | { type: 'DELETE_PAYMENT'; payload: string }
  | { type: 'IMPORT_DATA'; payload: AppData };

const initialState: AppState = {
  ...loadData(),
  currentView: 'dashboard',
  sessionReports: []
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

const appReducer = (state: AppState, action: AppAction): AppState => {
  let newState: AppState;

  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, currentView: action.payload };

    case 'ADD_STUDENT':
      newState = {
        ...state,
        students: [...state.students, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_STUDENT':
      newState = {
        ...state,
        students: state.students.map(s => s.id === action.payload.id ? action.payload : s)
      };
      break;

    case 'DELETE_STUDENT':
      newState = {
        ...state,
        students: state.students.filter(s => s.id !== action.payload),
        studentGroups: state.studentGroups.filter(sg => sg.studentId !== action.payload),
        attendanceRecords: state.attendanceRecords.filter(ar => ar.studentId !== action.payload),
        grades: state.grades.filter(g => g.studentId !== action.payload)
      };
      break;

    case 'ADD_GROUP':
      newState = {
        ...state,
        groups: [...state.groups, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_GROUP':
      newState = {
        ...state,
        groups: state.groups.map(g => g.id === action.payload.id ? action.payload : g)
      };
      break;

    case 'DELETE_GROUP':
      newState = {
        ...state,
        groups: state.groups.filter(g => g.id !== action.payload),
        studentGroups: state.studentGroups.filter(sg => sg.groupId !== action.payload),
        sessions: state.sessions.filter(s => s.groupId !== action.payload),
        assessments: state.assessments.filter(a => a.groupId !== action.payload)
      };
      break;

    case 'ADD_STUDENT_TO_GROUP':
      const existingRelation = state.studentGroups.find(
        sg => sg.studentId === action.payload.studentId && sg.groupId === action.payload.groupId
      );
      if (!existingRelation) {
        newState = {
          ...state,
          studentGroups: [...state.studentGroups, action.payload]
        };
      } else {
        return state;
      }
      break;

    case 'REMOVE_STUDENT_FROM_GROUP':
      newState = {
        ...state,
        studentGroups: state.studentGroups.filter(
          sg => !(sg.studentId === action.payload.studentId && sg.groupId === action.payload.groupId)
        )
      };
      break;

    case 'ADD_SESSION':
      newState = {
        ...state,
        sessions: [...state.sessions, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_SESSION':
      newState = {
        ...state,
        sessions: state.sessions.map(s => s.id === action.payload.id ? action.payload : s)
      };
      break;

    case 'DELETE_SESSION':
      newState = {
        ...state,
        sessions: state.sessions.filter(s => s.id !== action.payload),
        attendanceRecords: state.attendanceRecords.filter(ar => ar.sessionId !== action.payload),
        sessionReports: state.sessionReports.filter(sr => sr.sessionId !== action.payload)
      };
      break;

    case 'ADD_ATTENDANCE':
      const existingAttendance = state.attendanceRecords.find(
        ar => ar.sessionId === action.payload.sessionId && ar.studentId === action.payload.studentId
      );
      if (existingAttendance) {
        newState = {
          ...state,
          attendanceRecords: state.attendanceRecords.map(
            ar => ar.sessionId === action.payload.sessionId && ar.studentId === action.payload.studentId
              ? { ...action.payload, id: ar.id }
              : ar
          )
        };
      } else {
        newState = {
          ...state,
          attendanceRecords: [...state.attendanceRecords, {
            ...action.payload,
            id: generateId()
          }]
        };
      }
      break;

    case 'UPDATE_ATTENDANCE':
      newState = {
        ...state,
        attendanceRecords: state.attendanceRecords.map(ar => ar.id === action.payload.id ? action.payload : ar)
      };
      break;

    case 'ADD_SESSION_REPORT':
      newState = {
        ...state,
        sessionReports: [...state.sessionReports, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_SESSION_REPORT':
      newState = {
        ...state,
        sessionReports: state.sessionReports.map(sr => sr.id === action.payload.id ? action.payload : sr)
      };
      break;

    case 'DELETE_SESSION_REPORT':
      newState = {
        ...state,
        sessionReports: state.sessionReports.filter(sr => sr.id !== action.payload)
      };
      break;

    case 'ADD_ASSESSMENT':
      newState = {
        ...state,
        assessments: [...state.assessments, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_ASSESSMENT':
      newState = {
        ...state,
        assessments: state.assessments.map(a => a.id === action.payload.id ? action.payload : a)
      };
      break;

    case 'DELETE_ASSESSMENT':
      newState = {
        ...state,
        assessments: state.assessments.filter(a => a.id !== action.payload),
        grades: state.grades.filter(g => g.assessmentId !== action.payload)
      };
      break;

    case 'ADD_GRADE':
      const existingGrade = state.grades.find(
        g => g.assessmentId === action.payload.assessmentId && g.studentId === action.payload.studentId
      );
      if (existingGrade) {
        newState = {
          ...state,
          grades: state.grades.map(
            g => g.assessmentId === action.payload.assessmentId && g.studentId === action.payload.studentId
              ? { ...action.payload, id: g.id }
              : g
          )
        };
      } else {
        newState = {
          ...state,
          grades: [...state.grades, {
            ...action.payload,
            id: generateId()
          }]
        };
      }
      break;

    case 'UPDATE_GRADE':
      newState = {
        ...state,
        grades: state.grades.map(g => g.id === action.payload.id ? action.payload : g)
      };
      break;

    case 'DELETE_GRADE':
      newState = {
        ...state,
        grades: state.grades.filter(g => g.id !== action.payload)
      };
      break;

    case 'ADD_PAYMENT':
      newState = {
        ...state,
        paymentRecords: [...state.paymentRecords, {
          ...action.payload,
          id: generateId(),
          createdAt: new Date().toISOString()
        }]
      };
      break;

    case 'UPDATE_PAYMENT':
      newState = {
        ...state,
        paymentRecords: state.paymentRecords.map(p => p.id === action.payload.id ? action.payload : p)
      };
      break;

    case 'DELETE_PAYMENT':
      newState = {
        ...state,
        paymentRecords: state.paymentRecords.filter(p => p.id !== action.payload)
      };
      break;

    case 'IMPORT_DATA':
      newState = { ...action.payload, currentView: state.currentView };
      break;

    default:
      return state;
  }

  return newState;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    const { currentView, ...dataToSave } = state;
    saveData(dataToSave);
  }, [state]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
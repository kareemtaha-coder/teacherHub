import React, { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Student, Group, Session, Assessment, AttendanceRecord, Grade, PaymentRecord } from '../types';

export const useDataQueries = () => {
  const { state } = useApp();

  const getStudentsInGroup = useCallback((groupId: string): Student[] => {
    const studentIds = state.studentGroups
      .filter(sg => sg.groupId === groupId)
      .map(sg => sg.studentId);
    
    return state.students.filter(s => studentIds.includes(s.id));
  }, [state.studentGroups, state.students]);

  const getGroupsForStudent = useCallback((studentId: string): Group[] => {
    const groupIds = state.studentGroups
      .filter(sg => sg.studentId === studentId)
      .map(sg => sg.groupId);
    
    return state.groups.filter(g => groupIds.includes(g.id));
  }, [state.studentGroups, state.groups]);

  const getSessionsForGroup = useCallback((groupId: string): Session[] => {
    return state.sessions.filter(s => s.groupId === groupId)
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [state.sessions]);

  const getAttendanceForSession = useCallback((sessionId: string): AttendanceRecord[] => {
    return state.attendanceRecords.filter(ar => ar.sessionId === sessionId);
  }, [state.attendanceRecords]);

  const getAssessmentsForGroup = useCallback((groupId: string): Assessment[] => {
    return state.assessments.filter(a => a.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.assessments]);

  const getGradesForAssessment = useCallback((assessmentId: string): Grade[] => {
    return state.grades.filter(g => g.assessmentId === assessmentId);
  }, [state.grades]);

  const getGradesForStudent = useCallback((studentId: string): (Grade & { assessment: Assessment })[] => {
    const studentGrades = state.grades.filter(g => g.studentId === studentId);
    return studentGrades.map(grade => ({
      ...grade,
      assessment: state.assessments.find(a => a.id === grade.assessmentId)!
    })).filter(g => g.assessment);
  }, [state.grades, state.assessments]);

  const getAttendanceForStudent = useCallback((studentId: string): (AttendanceRecord & { session: Session & { group: Group } })[] => {
    const studentAttendance = state.attendanceRecords.filter(ar => ar.studentId === studentId);
    return studentAttendance.map(attendance => {
      const session = state.sessions.find(s => s.id === attendance.sessionId);
      const group = session ? state.groups.find(g => g.id === session.groupId) : undefined;
      return session && group ? {
        ...attendance,
        session: { ...session, group }
      } : null;
    }).filter(Boolean) as (AttendanceRecord & { session: Session & { group: Group } })[];
  }, [state.attendanceRecords, state.sessions, state.groups]);

  const getStudentById = useCallback((studentId: string): Student | undefined => {
    return state.students.find(s => s.id === studentId);
  }, [state.students]);

  const getGroupById = useCallback((groupId: string): Group | undefined => {
    return state.groups.find(g => g.id === groupId);
  }, [state.groups]);

  const getSessionById = useCallback((sessionId: string): Session | undefined => {
    return state.sessions.find(s => s.id === sessionId);
  }, [state.sessions]);

  const getAssessmentById = useCallback((assessmentId: string): Assessment | undefined => {
    return state.assessments.find(a => a.id === assessmentId);
  }, [state.assessments]);

  const getPaymentById = useCallback((paymentId: string): PaymentRecord | undefined => {
    return state.paymentRecords.find(p => p.id === paymentId);
  }, [state.paymentRecords]);

  const getPaymentsForStudent = useCallback((studentId: string): PaymentRecord[] => {
    return state.paymentRecords.filter(p => p.studentId === studentId)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [state.paymentRecords]);

  const getPaymentsForGroup = useCallback((groupId: string): PaymentRecord[] => {
    return state.paymentRecords.filter(p => p.groupId === groupId)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [state.paymentRecords]);

  const getPaymentsForMonth = useCallback((month: string): PaymentRecord[] => {
    return state.paymentRecords.filter(p => p.month === month);
  }, [state.paymentRecords]);

  const getPaymentsForStudentInGroup = useCallback((studentId: string, groupId: string): PaymentRecord[] => {
    return state.paymentRecords.filter(p => p.studentId === studentId && p.groupId === groupId)
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [state.paymentRecords]);

  const getPaymentStatusForStudentInMonth = useCallback((studentId: string, groupId: string, month: string): PaymentRecord | undefined => {
    return state.paymentRecords.find(p => p.studentId === studentId && p.groupId === groupId && p.month === month);
  }, [state.paymentRecords]);

  return {
    getStudentsInGroup,
    getGroupsForStudent,
    getSessionsForGroup,
    getAttendanceForSession,
    getAssessmentsForGroup,
    getGradesForAssessment,
    getGradesForStudent,
    getAttendanceForStudent,
    getStudentById,
    getGroupById,
    getSessionById,
    getAssessmentById,
    getPaymentById,
    getPaymentsForStudent,
    getPaymentsForGroup,
    getPaymentsForMonth,
    getPaymentsForStudentInGroup,
    getPaymentStatusForStudentInMonth
  };
};
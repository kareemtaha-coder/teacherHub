import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Session, SessionReport } from '../../types';
import { X, User, Save, ChevronDown, ChevronUp, Star, TrendingUp, AlertTriangle, MessageSquare, BookOpen, Download, Users } from 'lucide-react';
import { formatDateTime } from '../../utils/generators';
import { useLanguage } from '../../context/LanguageContext';
import generatePDF from 'react-to-pdf';

interface SessionReportModalProps {
  session: Session;
  onClose: () => void;
}

const SessionReportModal: React.FC<SessionReportModalProps> = ({ session, onClose }) => {
  const { t } = useLanguage();
  const { state, dispatch } = useApp();
  const { getGroupById, getStudentsInGroup } = useDataQueries();
  const reportRef = useRef<HTMLDivElement>(null);
  
  const [reports, setReports] = useState<Record<string, Omit<SessionReport, 'id' | 'sessionId' | 'studentId' | 'createdAt' | 'updatedAt'>>>({});
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const group = useMemo(() => getGroupById(session.groupId), [getGroupById, session.groupId]);
  const students = useMemo(() => getStudentsInGroup(session.groupId), [getStudentsInGroup, session.groupId]);
  
  // Get existing reports for this session
  const existingReports = useMemo(() => 
    (state.sessionReports || []).filter(sr => sr.sessionId === session.id),
    [state.sessionReports, session.id]
  );

  useEffect(() => {
    // Initialize reports with existing data or default values
    const initialReports: Record<string, Omit<SessionReport, 'id' | 'sessionId' | 'studentId' | 'createdAt' | 'updatedAt'>> = {};
    
    students.forEach(student => {
      const existingReport = existingReports.find(r => r.studentId === student.id);
      if (existingReport) {
        initialReports[student.id] = {
          performance: existingReport.performance,
          strengths: existingReport.strengths,
          improvements: existingReport.improvements,
          notes: existingReport.notes
        };
      } else {
        initialReports[student.id] = {
          performance: 'average',
          strengths: '',
          improvements: '',
          notes: ''
        };
      }
    });
    
    setReports(initialReports);
  }, [students, existingReports]);

  const handleReportChange = (studentId: string, field: keyof Omit<SessionReport, 'id' | 'sessionId' | 'studentId' | 'createdAt' | 'updatedAt'>, value: string | 'excellent' | 'good' | 'average' | 'needs_improvement' | 'poor') => {
    setReports(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save or update reports for all students
    students.forEach(student => {
      const existingReport = existingReports.find(r => r.studentId === student.id);
      const reportData = reports[student.id];
      
      if (existingReport) {
        // Update existing report
        dispatch({
          type: 'UPDATE_SESSION_REPORT',
          payload: {
            ...existingReport,
            ...reportData,
            updatedAt: new Date().toISOString()
          }
        });
      } else {
        // Create new report
        dispatch({
          type: 'ADD_SESSION_REPORT',
          payload: {
            sessionId: session.id,
            studentId: student.id,
            ...reportData
          }
        });
      }
    });
    
    onClose();
  };

  const downloadPDF = () => {
    if (reportRef.current) {
      generatePDF(reportRef, {
        filename: `session-report-${session.topic || 'session'}-${new Date(session.dateTime).toISOString().split('T')[0]}.pdf`,
        page: {
          margin: 20,
          format: 'a4'
        }
      });
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'average': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'needs_improvement': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'poor': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPerformanceIcon = (performance: string) => {
    switch (performance) {
      case 'excellent': return <Star className="h-4 w-4 text-green-600" />;
      case 'good': return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case 'average': return <BookOpen className="h-4 w-4 text-yellow-600" />;
      case 'needs_improvement': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'poor': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <BookOpen className="h-4 w-4 text-gray-600" />;
    }
  };

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl lg:rounded-lg max-w-md w-full p-6 lg:p-8">
          <div className="text-center">
            <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-500 mb-6">This group has no students to report on.</p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl lg:rounded-lg max-w-4xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center p-4 lg:p-6 border-b border-gray-200">
          <div className="mb-4 lg:mb-0">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900">Session Report - {session.topic || 'Untitled Session'}</h3>
            <p className="text-sm lg:text-base text-gray-600 mt-1 lg:mt-2">
              {group?.name || 'Unknown Group'} • {students.length} student(s) • {formatDateTime(session.dateTime)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={downloadPDF}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl lg:rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="lg:hidden">PDF</span>
              <span className="hidden lg:inline">Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div ref={reportRef} className="space-y-6">
            {/* No Students Found */}
            {students.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">This group doesn't have any students assigned to it.</p>
              </div>
            )}
            {students.map(student => {
              const report = reports[student.id] || {
                performance: 'average',
                strengths: '',
                improvements: '',
                notes: ''
              };
              const isExpanded = expandedStudent === student.id;
              
              return (
                <div
                  key={student.id}
                  className="border rounded-xl lg:rounded-lg p-4 lg:p-6 bg-white hover:shadow-md transition-all duration-200"
                >
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-gray-200">
                        <User className="h-6 w-7 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-lg">{student.fullName}</p>
                        <p className="text-sm text-gray-500">ID: {student.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Performance Selector */}
                      <select
                        value={report.performance}
                        onChange={(e) => handleReportChange(student.id, 'performance', e.target.value as any)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium ${getPerformanceColor(report.performance)}`}
                      >
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="average">Average</option>
                        <option value="needs_improvement">Needs Improvement</option>
                        <option value="poor">Poor</option>
                      </select>
                      
                      <button
                        onClick={() => toggleStudentExpansion(student.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? 
                          <ChevronUp className="h-5 w-5" /> : 
                          <ChevronDown className="h-5 w-5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Performance Icon and Status */}
                  <div className="flex items-center space-x-2 mb-4">
                    {getPerformanceIcon(report.performance)}
                    <span className={`text-sm font-medium px-2 py-1 rounded-full border ${getPerformanceColor(report.performance)}`}>
                      {report.performance.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {/* Strengths */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Star className="h-4 w-4 inline mr-2 text-green-600" />
                          What went well / Strengths
                        </label>
                        <textarea
                          value={report.strengths}
                          onChange={(e) => handleReportChange(student.id, 'strengths', e.target.value)}
                          placeholder="Describe what the student did well in this session..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Areas for Improvement */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <AlertTriangle className="h-4 w-4 inline mr-2 text-orange-600" />
                          What needs improvement
                        </label>
                        <textarea
                          value={report.improvements}
                          onChange={(e) => handleReportChange(student.id, 'improvements', e.target.value)}
                          placeholder="Describe areas where the student can improve..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                          rows={3}
                        />
                      </div>

                      {/* Additional Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MessageSquare className="h-4 w-4 inline mr-2 text-blue-600" />
                          Additional observations
                        </label>
                        <textarea
                          value={report.notes}
                          onChange={(e) => handleReportChange(student.id, 'notes', e.target.value)}
                          placeholder="Any other observations or recommendations..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:justify-between lg:items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Students:</span> {students.length} • 
              <span className="font-medium ml-2">Reports:</span> {existingReports.length} completed
            </div>
            
            <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3">
              <button
                onClick={onClose}
                className="w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl lg:rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-white rounded-xl lg:rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center justify-center space-x-2 shadow-sm hover:shadow-md ${
                  hasChanges 
                    ? 'bg-purple-600 hover:bg-purple-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>Save Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionReportModal; 
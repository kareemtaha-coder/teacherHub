import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Assessment } from '../../types';
import { X, User, Save, BarChart3, BookOpen, Users, Calendar, Target, TrendingUp, Award, ChevronDown, ChevronUp, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import { formatDate } from '../../utils/generators';
import { useLanguage } from '../../context/LanguageContext';

interface GradeAssessmentModalProps {
  assessment: Assessment;
  onClose: () => void;
}

const GradeAssessmentModal: React.FC<GradeAssessmentModalProps> = ({ assessment, onClose }) => {
  const { t } = useLanguage();
  const { dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getGradesForAssessment } = useDataQueries();
  const [gradeData, setGradeData] = useState<Record<string, { score: string; comments: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);

  // Memoize these values to prevent infinite re-renders
  const group = useMemo(() => getGroupById(assessment.groupId), [getGroupById, assessment.groupId]);
  const students = useMemo(() => getStudentsInGroup(assessment.groupId), [getStudentsInGroup, assessment.groupId]);
  const existingGrades = useMemo(() => getGradesForAssessment(assessment.id), [getGradesForAssessment, assessment.id]);

  useEffect(() => {
    // Initialize grade data with existing grades
    const initialData: Record<string, { score: string; comments: string }> = {};
    
    students.forEach(student => {
      const existingGrade = existingGrades.find(grade => grade.studentId === student.id);
      initialData[student.id] = {
        score: existingGrade ? existingGrade.score.toString() : '',
        comments: existingGrade ? existingGrade.comments || '' : ''
      };
    });
    
    setGradeData(initialData);
  }, [students, existingGrades, assessment.id]);

  const handleScoreChange = (studentId: string, score: string) => {
    // Validate score is within range
    const numScore = parseFloat(score);
    if (score && (isNaN(numScore) || numScore < 0 || numScore > assessment.maxScore)) {
      return;
    }

    setGradeData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score
      }
    }));
    setHasChanges(true);
  };

  const handleCommentsChange = (studentId: string, comments: string) => {
    setGradeData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments
      }
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Save grades for all students with scores
    students.forEach(student => {
      const data = gradeData[student.id];
      if (data && data.score.trim()) {
        dispatch({
          type: 'ADD_GRADE',
          payload: {
            assessmentId: assessment.id,
            studentId: student.id,
            score: parseFloat(data.score),
            comments: data.comments.trim() || undefined
          }
        });
      }
    });
    
    onClose();
  };

  // Calculate statistics
  const validScores = Object.values(gradeData)
    .map(data => parseFloat(data.score))
    .filter(score => !isNaN(score));

  const gradedCount = validScores.length;
  const average = validScores.length > 0 
    ? validScores.reduce((acc, score) => acc + score, 0) / validScores.length 
    : 0;
  const averagePercentage = (average / assessment.maxScore) * 100;

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl lg:rounded-lg max-w-md w-full p-6 lg:p-8">
          <div className="flex justify-between items-center mb-4 lg:mb-6">
            <h3 className="text-lg lg:text-xl font-semibold text-gray-900">No Students</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </div>
          <div className="text-center mb-6 lg:mb-8">
            <Users className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
            <h4 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-4">No Students Found</h4>
            <p className="text-gray-600 text-base lg:text-lg">
              This group has no students assigned. Add students to the group first.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full px-6 py-3 lg:py-4 text-base lg:text-lg font-medium text-gray-700 bg-white border border-gray-300 rounded-xl lg:rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 lg:p-4 z-50">
      <div className="bg-white rounded-2xl lg:rounded-lg max-w-5xl w-full max-h-[95vh] lg:max-h-[90vh] overflow-hidden">
        {/* Header - Mobile First */}
        <div className="p-4 lg:p-6 border-b border-gray-200">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start space-y-3 lg:space-y-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2 lg:space-x-3 mb-2 lg:mb-3">
                <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600" />
                </div>
                <h3 className="text-lg lg:text-xl font-semibold text-gray-900">Grade Assessment</h3>
              </div>
              <div className="space-y-1 lg:space-y-2">
                <p className="text-sm lg:text-base text-gray-600 flex items-center">
                  <BookOpen className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-500" />
                  {assessment.name}
                </p>
                <p className="text-sm lg:text-base text-gray-600 flex items-center">
                  <Users className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-500" />
                  {group?.name}
                </p>
                <p className="text-sm lg:text-base text-gray-600 flex items-center">
                  <Target className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-500" />
                  Max Score: {assessment.maxScore}
                </p>
                <p className="text-sm lg:text-base text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 lg:h-5 lg:w-5 mr-2 text-gray-400" />
                  {formatDate(assessment.date)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-xl lg:rounded-lg hover:bg-gray-100 self-end lg:self-start"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </button>
          </div>
        </div>

        {/* Statistics Bar - Mobile First */}
        <div className="px-4 lg:px-6 py-4 lg:py-6 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-gray-200">
              <div className="text-lg lg:text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-xs lg:text-sm text-gray-500">Total Students</div>
            </div>
            <div className="bg-blue-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-blue-200">
              <div className="text-lg lg:text-2xl font-bold text-blue-600">{gradedCount}</div>
              <div className="text-xs lg:text-sm text-blue-600">Graded</div>
            </div>
            <div className="bg-green-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-green-200">
              <div className="text-lg lg:text-2xl font-bold text-green-600">
                {gradedCount > 0 ? averagePercentage.toFixed(1) + '%' : 'N/A'}
              </div>
              <div className="text-xs lg:text-sm text-green-600">Average</div>
            </div>
            <div className="bg-orange-50 rounded-xl lg:rounded-lg p-3 lg:p-4 text-center border border-orange-200">
              <div className="text-lg lg:text-2xl font-bold text-orange-600">
                {gradedCount > 0 ? average.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs lg:text-sm text-orange-600">Avg Score</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4 lg:mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm lg:text-base font-medium text-gray-700">Grading Progress</span>
              <span className="text-sm lg:text-base font-bold text-gray-900">{gradedCount}/{students.length} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
              <div 
                className={`h-2 lg:h-3 rounded-full transition-all duration-300 ${
                  gradedCount === students.length ? 'bg-green-500' : 
                  gradedCount > students.length / 2 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${students.length > 0 ? (gradedCount / students.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Student List - Mobile First */}
        <div className="p-4 lg:p-6 max-h-96 lg:max-h-80 overflow-y-auto">
          <div className="space-y-3 lg:space-y-4">
            {students.map(student => {
              const data = gradeData[student.id] || { score: '', comments: '' };
              const score = parseFloat(data.score);
              const percentage = !isNaN(score) ? (score / assessment.maxScore) * 100 : 0;
              const isExpanded = expandedStudent === student.id;
              
              return (
                <div key={student.id} className="border border-gray-200 rounded-xl lg:rounded-lg p-4 lg:p-6 hover:shadow-md transition-all duration-200">
                  {/* Student Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <div className="h-12 w-12 lg:h-14 lg:w-14 rounded-full bg-blue-100 flex items-center justify-center border-2 border-blue-200">
                        <User className="h-6 w-7 lg:h-7 lg:w-7 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-base lg:text-lg mb-1">{student.fullName}</h4>
                        <p className="text-sm lg:text-base text-gray-500">ID: {student.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 lg:space-x-3">
                      {!isNaN(score) && (
                        <span className={`text-sm lg:text-base font-bold px-2 py-1 rounded-lg ${
                          percentage >= 80 ? 'bg-green-100 text-green-800' : 
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {percentage.toFixed(0)}%
                        </span>
                      )}
                      <button
                        onClick={() => toggleStudentExpansion(student.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {isExpanded ? 
                          <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5" /> : 
                          <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Student Details - Always Visible */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 mb-3">
                    {student.parentPhone && (
                      <div className="bg-gray-50 rounded-lg p-2 lg:p-3 border border-gray-200">
                        <p className="text-xs lg:text-sm text-gray-500 mb-1">Parent Phone</p>
                        <p className="text-sm lg:text-base text-gray-900">{student.parentPhone}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-lg p-2 lg:p-3 border border-gray-200">
                      <p className="text-xs lg:text-sm text-gray-500 mb-1">Assessment</p>
                      <p className="text-sm lg:text-base text-gray-900">{assessment.name}</p>
                    </div>
                  </div>

                  {/* Grade Inputs */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                    <div>
                      <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                        Score (out of {assessment.maxScore})
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={data.score}
                          onChange={(e) => handleScoreChange(student.id, e.target.value)}
                          min="0"
                          max={assessment.maxScore}
                          step="0.1"
                          className="flex-1 px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                          placeholder="Enter score"
                        />
                        {!isNaN(score) && (
                          <span className={`text-sm lg:text-base font-medium px-2 py-1 rounded-lg ${
                            percentage >= 80 ? 'bg-green-100 text-green-800' :
                            percentage >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {percentage.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm lg:text-base font-medium text-gray-700 mb-2">
                        Comments (Optional)
                      </label>
                      <textarea
                        value={data.comments}
                        onChange={(e) => handleCommentsChange(student.id, e.target.value)}
                        rows={2}
                        className="w-full px-3 lg:px-4 py-2 lg:py-3 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm lg:text-base"
                        placeholder="Additional feedback"
                      />
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-gray-50 rounded-xl lg:rounded-lg p-3 lg:p-4 border border-gray-200">
                        <h5 className="font-medium text-gray-900 mb-3 lg:mb-4 text-sm lg:text-base">Grade Details</h5>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-blue-600">{assessment.maxScore}</div>
                            <div className="text-xs lg:text-sm text-gray-600">Maximum Score</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">Points</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-green-600">{!isNaN(score) ? score : 'N/A'}</div>
                            <div className="text-xs lg:text-sm text-gray-600">Student Score</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">Achieved</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg lg:text-xl font-bold text-purple-600">{!isNaN(percentage) ? percentage.toFixed(1) : 'N/A'}%</div>
                            <div className="text-xs lg:text-sm text-gray-600">Percentage</div>
                            <div className="text-sm lg:text-base font-medium text-gray-900">Performance</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions - Mobile First */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 lg:p-6">
          <div className="flex flex-col space-y-3 lg:space-y-0">
            {/* Progress Info */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start text-sm lg:text-base text-gray-600 mb-1">
                <BarChart3 className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Progress: {gradedCount}/{students.length} students graded
              </div>
              {hasChanges && (
                <div className="text-sm lg:text-base text-yellow-600 font-medium flex items-center justify-center lg:justify-start">
                  <Clock className="h-4 w-4 lg:h-5 lg:w-5 mr-1" />
                  Unsaved changes
                </div>
              )}
            </div>
            
            {/* Action Buttons - Improved Mobile Layout */}
            <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-3">
              <button
                onClick={onClose}
                className="w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl lg:rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-sm hover:shadow-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className={`w-full lg:w-auto px-6 py-3 lg:py-2 text-base lg:text-sm font-medium text-white rounded-xl lg:rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center justify-center space-x-2 shadow-sm hover:shadow-md ${
                  hasChanges 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-400 cursor-not-allowed'
                }`}
              >
                <Save className="h-4 w-4 lg:h-5 lg:w-5" />
                <span>Save Grades</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeAssessmentModal;
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Assessment } from '../../types';
import { X, User, Save, BarChart3 } from 'lucide-react';
import { formatDate } from '../../utils/generators';

interface GradeAssessmentModalProps {
  assessment: Assessment;
  onClose: () => void;
}

const GradeAssessmentModal: React.FC<GradeAssessmentModalProps> = ({ assessment, onClose }) => {
  const { dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getGradesForAssessment } = useDataQueries();
  const [gradeData, setGradeData] = useState<Record<string, { score: string; comments: string }>>({});
  const [hasChanges, setHasChanges] = useState(false);

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

  if (students.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg max-w-md w-full p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">No Students</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <p className="text-gray-600 mb-4">
            This group has no students assigned. Add students to the group first.
          </p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Grade Assessment</h3>
            <p className="text-sm text-gray-600 mt-1">
              {assessment.name} • {group?.name} • Max Score: {assessment.maxScore}
            </p>
            <p className="text-sm text-gray-500">{formatDate(assessment.date)}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Statistics Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-gray-900">{students.length}</div>
              <div className="text-xs text-gray-500">Total Students</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{gradedCount}</div>
              <div className="text-xs text-gray-500">Graded</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {gradedCount > 0 ? averagePercentage.toFixed(1) + '%' : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Average</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {gradedCount > 0 ? average.toFixed(1) : 'N/A'}
              </div>
              <div className="text-xs text-gray-500">Avg Score</div>
            </div>
          </div>
        </div>

        <div className="p-6 max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {students.map(student => {
              const data = gradeData[student.id] || { score: '', comments: '' };
              const score = parseFloat(data.score);
              const percentage = !isNaN(score) ? (score / assessment.maxScore) * 100 : 0;
              
              return (
                <div key={student.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start space-x-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 mb-2">{student.fullName}</h4>
                      {student.parentPhone && (
                        <p className="text-sm text-gray-500 mb-2">Parent: {student.parentPhone}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
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
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Enter score"
                            />
                            {!isNaN(score) && (
                              <span className={`text-sm font-medium ${
                                percentage >= 80 ? 'text-green-600' :
                                percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {percentage.toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Comments (Optional)
                          </label>
                          <textarea
                            value={data.comments}
                            onChange={(e) => handleCommentsChange(student.id, e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Additional feedback"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="h-4 w-4 mr-2" />
            Progress: {gradedCount}/{students.length} students graded
            {hasChanges && (
              <span className="ml-4 text-yellow-600 font-medium">
                Unsaved changes
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-flex items-center"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Grades
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GradeAssessmentModal;
import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { BarChart3, Plus, Edit, Trash2, FileText } from 'lucide-react';
import { formatDate } from '../../utils/generators';
import AddAssessmentModal from './AddAssessmentModal';
import EditAssessmentModal from './EditAssessmentModal';
import GradeAssessmentModal from './GradeAssessmentModal';
import { Assessment } from '../../types';

const GradesList: React.FC = () => {
  const { state, dispatch } = useApp();
  const { getGroupById, getGradesForAssessment, getStudentsInGroup } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [gradingAssessment, setGradingAssessment] = useState<Assessment | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const filteredAssessments = useMemo(() => 
    state.assessments
      .filter(assessment => selectedGroupFilter === 'all' || assessment.groupId === selectedGroupFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.assessments, selectedGroupFilter]
  );

  const handleDeleteAssessment = useCallback((assessmentId: string) => {
    if (window.confirm('Are you sure you want to delete this assessment? This will also remove all associated grades.')) {
      dispatch({ type: 'DELETE_ASSESSMENT', payload: assessmentId });
    }
  }, [dispatch]);

  const getGradingStats = useCallback((assessment: Assessment) => {
    const grades = getGradesForAssessment(assessment.id);
    const students = getStudentsInGroup(assessment.groupId);
    const graded = grades.length;
    const total = students.length;
    const average = grades.length > 0 
      ? grades.reduce((acc, grade) => acc + (grade.score / assessment.maxScore) * 100, 0) / grades.length 
      : 0;

    return { graded, total, average };
  }, [getGradesForAssessment, getStudentsInGroup]);

  // Memoize assessment data to prevent unnecessary recalculations
  const assessmentData = useMemo(() => 
    filteredAssessments.map(assessment => {
      const group = getGroupById(assessment.groupId);
      const { graded, total, average } = getGradingStats(assessment);
      const isFullyGraded = graded === total && total > 0;
      
      return {
        assessment,
        group,
        stats: { graded, total, average },
        isFullyGraded
      };
    }),
    [filteredAssessments, getGroupById, getGradingStats]
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Assessments & Grades</h2>
          <p className="text-gray-600">Create assessments and manage student grades</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Assessment
        </button>
      </div>

      {state.groups.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to create at least one group before adding assessments.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Groups</option>
                {state.groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>

            {filteredAssessments.length === 0 ? (
              <div className="p-12 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No assessments found</p>
                <p className="text-gray-400 text-sm">
                  {selectedGroupFilter === 'all' 
                    ? 'Start by creating your first assessment'
                    : 'No assessments for this group'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {assessmentData.map((item) => {
                  const { assessment, group, stats, isFullyGraded } = item;
                  
                  return (
                    <div key={assessment.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            isFullyGraded ? 'bg-green-100' : 'bg-orange-100'
                          }`}>
                            <BarChart3 className={`h-6 w-6 ${
                              isFullyGraded ? 'text-green-600' : 'text-orange-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{assessment.name}</h3>
                              {isFullyGraded && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Complete
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {group?.name} • Max Score: {assessment.maxScore}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>Date: {formatDate(assessment.date)}</span>
                              <span>Graded: {stats.graded}/{stats.total}</span>
                              {stats.average > 0 && (
                                <span>Average: {stats.average.toFixed(1)}%</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setGradingAssessment(assessment)}
                            className="text-blue-600 hover:text-blue-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-blue-50 border border-blue-200"
                          >
                            <FileText className="h-4 w-4 mr-1 inline" />
                            Grade
                          </button>
                          <button
                            onClick={() => setEditingAssessment(assessment)}
                            className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAssessment(assessment.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {showAddModal && (
        <AddAssessmentModal onClose={() => setShowAddModal(false)} />
      )}

      {editingAssessment && (
        <EditAssessmentModal
          assessment={editingAssessment}
          onClose={() => setEditingAssessment(null)}
        />
      )}

      {gradingAssessment && (
        <GradeAssessmentModal
          assessment={gradingAssessment}
          onClose={() => setGradingAssessment(null)}
        />
      )}
    </div>
  );
};

export default GradesList;
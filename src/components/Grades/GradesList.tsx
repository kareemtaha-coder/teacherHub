import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { BarChart3, Plus, Edit, Trash2, FileText, X, Menu, Search, Filter, TrendingUp, Users, Calendar, Target, Award, ChevronDown, ChevronUp, BookOpen, CheckCircle, Clock } from 'lucide-react';
import { formatDate } from '../../utils/generators';
import AddAssessmentModal from './AddAssessmentModal';
import EditAssessmentModal from './EditAssessmentModal';
import GradeAssessmentModal from './GradeAssessmentModal';
import { Assessment } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

const GradesList: React.FC = () => {
  const { t } = useLanguage();
  const { state, dispatch } = useApp();
  const { getGroupById, getGradesForAssessment, getStudentsInGroup } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<Assessment | null>(null);
  const [gradingAssessment, setGradingAssessment] = useState<Assessment | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedAssessment, setExpandedAssessment] = useState<string | null>(null);

  const filteredAssessments = useMemo(() => 
    state.assessments
      .filter(assessment => {
        const matchesGroup = selectedGroupFilter === 'all' || assessment.groupId === selectedGroupFilter;
        const matchesSearch = searchTerm === '' || 
          assessment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getGroupById(assessment.groupId)?.name.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesGroup && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [state.assessments, selectedGroupFilter, searchTerm, getGroupById]
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

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    let totalAssessments = 0;
    let totalGraded = 0;
    let totalStudents = 0;
    let overallAverage = 0;

    assessmentData.forEach(item => {
      totalAssessments++;
      totalGraded += item.stats.graded;
      totalStudents += item.stats.total;
      if (item.stats.average > 0) {
        overallAverage += item.stats.average;
      }
    });

    return {
      totalAssessments,
      totalGraded,
      totalStudents,
      overallAverage: totalAssessments > 0 ? overallAverage / totalAssessments : 0,
      completionRate: totalStudents > 0 ? (totalGraded / totalStudents) * 100 : 0
    };
  }, [assessmentData]);

  const toggleAssessmentExpansion = (assessmentId: string) => {
    setExpandedAssessment(expandedAssessment === assessmentId ? null : assessmentId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => setShowMobileMenu(!showMobileMenu)} 
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Grades</h1>
            <p className="text-sm text-gray-600">{overallStats.totalAssessments} assessments</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <Plus className="h-5 w-5 text-blue-600" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Assessments & Grades</h1>
            <p className="text-lg text-gray-600">Create assessments and manage student grades</p>
          </div>
        </div>

        {/* Search and Filters - Mobile First */}
        <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            {/* Search Bar */}
            <div className="relative flex-1 lg:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search assessments by name or group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
              />
            </div>

            {/* Filters and Add Button */}
            <div className="flex flex-col lg:flex-row gap-3 lg:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 lg:mb-1">Group Filter</label>
                <select
                  value={selectedGroupFilter}
                  onChange={(e) => setSelectedGroupFilter(e.target.value)}
                  className="w-full lg:w-auto px-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm"
                >
                  <option value="all">All Groups</option>
                  {state.groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full lg:w-auto bg-blue-600 text-white px-6 py-3 lg:py-2 rounded-xl lg:rounded-lg text-base lg:text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center justify-center"
              >
                <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                Add Assessment
              </button>
            </div>
          </div>
        </div>

        {/* Overall Statistics - Mobile First */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-6">
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-blue-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <BookOpen className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalAssessments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-green-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <CheckCircle className="h-5 w-5 lg:h-6 lg:w-6 text-green-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Graded</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalGraded}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-purple-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <Users className="h-5 w-5 lg:h-6 lg:w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-yellow-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <TrendingUp className="h-5 w-5 lg:h-6 lg:w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Completion Rate</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.completionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-3 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center text-center lg:text-left">
              <div className="bg-indigo-100 rounded-xl lg:rounded-lg p-2 lg:p-3 mx-auto lg:mr-4 mb-2 lg:mb-0">
                <Award className="h-5 w-5 lg:h-6 lg:w-6 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-600">Overall Average</p>
                <p className="text-lg lg:text-2xl font-bold text-gray-900">{overallStats.overallAverage.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* No Groups Warning */}
        {state.groups.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl lg:rounded-lg p-6 lg:p-8">
            <div className="text-center">
              <Users className="h-16 lg:h-20 w-16 lg:w-20 text-yellow-400 mx-auto mb-4 lg:mb-6" />
              <h3 className="text-lg lg:text-xl font-medium text-yellow-800 mb-2 lg:mb-4">No Groups Available</h3>
              <p className="text-yellow-700 text-base lg:text-lg">
                You need to create at least one group before adding assessments.
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Assessments List */}
            {filteredAssessments.length === 0 ? (
              <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-8 lg:p-12 text-center">
                <BarChart3 className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
                <h3 className="text-lg lg:text-xl font-medium text-gray-900 mb-2 lg:mb-4">No assessments found</h3>
                <p className="text-gray-500 text-base lg:text-lg mb-4 lg:mb-6">
                  {selectedGroupFilter === 'all' 
                    ? 'Start by creating your first assessment'
                    : 'No assessments for this group'
                  }
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 lg:py-2 rounded-xl lg:rounded-lg text-base lg:text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
                >
                  <Plus className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                  Create First Assessment
                </button>
              </div>
            ) : (
              <div className="space-y-4 lg:space-y-6">
                {assessmentData.map((item) => {
                  const { assessment, group, stats, isFullyGraded } = item;
                  const isExpanded = expandedAssessment === assessment.id;
                  
                  return (
                    <div key={assessment.id} className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200">
                      {/* Assessment Header */}
                      <div className="p-4 lg:p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3 lg:space-x-4">
                            <div className={`h-12 w-12 lg:h-14 lg:w-14 rounded-xl lg:rounded-lg flex items-center justify-center ${
                              isFullyGraded ? 'bg-green-100' : 'bg-orange-100'
                            }`}>
                              <BarChart3 className={`h-6 w-7 lg:h-7 lg:w-7 ${
                                isFullyGraded ? 'text-green-600' : 'text-orange-600'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold text-gray-900 text-base lg:text-lg">{assessment.name}</h3>
                                {isFullyGraded && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs lg:text-sm font-medium bg-green-100 text-green-800">
                                    Complete
                                  </span>
                                )}
                              </div>
                              <p className="text-sm lg:text-base text-gray-600 mb-1">
                                {group?.name} • Max Score: {assessment.maxScore}
                              </p>
                              <div className="flex items-center space-x-2 lg:space-x-4 text-sm lg:text-base text-gray-500">
                                <span className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1" />
                                  {formatDate(assessment.date)}
                                </span>
                                <span className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {stats.graded}/{stats.total}
                                </span>
                                {stats.average > 0 && (
                                  <span className="flex items-center">
                                    <Target className="h-4 w-4 mr-1" />
                                    {stats.average.toFixed(1)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 lg:space-x-3">
                            <button
                              onClick={() => toggleAssessmentExpansion(assessment.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              {isExpanded ? 
                                <ChevronUp className="h-4 w-4 lg:h-5 lg:w-5" /> : 
                                <ChevronDown className="h-4 w-4 lg:h-5 lg:w-5" />
                              }
                            </button>
                            <button
                              onClick={() => setGradingAssessment(assessment)}
                              className="text-blue-600 hover:text-blue-800 px-3 lg:px-4 py-2 rounded-xl lg:rounded-lg text-sm lg:text-base font-medium hover:bg-blue-50 border border-blue-200 transition-colors"
                            >
                              <FileText className="h-4 w-4 lg:h-5 lg:w-5 mr-1 lg:mr-2 inline" />
                              Grade
                            </button>
                            <button
                              onClick={() => setEditingAssessment(assessment)}
                              className="text-green-600 hover:text-green-900 p-2 rounded-xl lg:rounded-lg hover:bg-green-50 transition-colors"
                              title="Edit"
                            >
                              <Edit className="h-4 w-4 lg:h-5 lg:w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAssessment(assessment.id)}
                              className="text-red-600 hover:text-red-900 p-2 rounded-xl lg:rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 lg:h-5 lg:w-5" />
                            </button>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm lg:text-base text-gray-600">
                            <span>Grading Progress</span>
                            <span className="font-medium">{stats.graded}/{stats.total} students</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 lg:h-3">
                            <div 
                              className={`h-2 lg:h-3 rounded-full transition-all duration-300 ${
                                stats.graded === stats.total ? 'bg-green-500' : 
                                stats.graded > stats.total / 2 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${stats.total > 0 ? (stats.graded / stats.total) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="bg-gray-50 rounded-xl lg:rounded-lg p-4 lg:p-6">
                              <h5 className="font-medium text-gray-900 mb-4 text-sm lg:text-base">Assessment Details</h5>
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
                                <div className="text-center">
                                  <div className="text-lg lg:text-xl font-bold text-blue-600">{assessment.maxScore}</div>
                                  <div className="text-xs lg:text-sm text-gray-600">Maximum Score</div>
                                  <div className="text-sm lg:text-base font-medium text-gray-900">Points</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg lg:text-xl font-bold text-green-600">{stats.graded}</div>
                                  <div className="text-xs lg:text-sm text-gray-600">Students Graded</div>
                                  <div className="text-sm lg:text-base font-medium text-gray-900">Completed</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg lg:text-xl font-bold text-purple-600">{stats.average.toFixed(1)}%</div>
                                  <div className="text-xs lg:text-sm text-gray-600">Class Average</div>
                                  <div className="text-sm lg:text-base font-medium text-gray-900">Performance</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modals */}
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
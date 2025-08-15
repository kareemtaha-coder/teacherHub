import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Search, Plus, Edit, Trash2, Eye, Filter, Download, Upload, MoreHorizontal, Phone, Mail, User, ChevronDown, ChevronUp, BarChart3, X, Menu, Users, Calendar } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import AddStudentModal from './AddStudentModal';
import EditStudentModal from './EditStudentModal';
import StudentDetailModal from './StudentDetailModal';
import StudentExportModal from './StudentExportModal';
import StudentReportModal from './StudentReportModal';
import { exportStudentsToCSV } from '../../utils/exportUtils';
import { Student } from '../../types';

const StudentList: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t } = useLanguage();
  const { getGroupsForStudent } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [viewingStudent, setViewingStudent] = useState<Student | null>(null);
  const [exportingStudent, setExportingStudent] = useState<Student | null>(null);
  const [reportingStudent, setReportingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with-groups' | 'without-groups'>('all');
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const filteredStudents = useMemo(() => {
    let filtered = state.students;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.contactInfo && student.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.parentPhone && student.parentPhone.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.notes && student.notes.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter === 'with-groups') {
      filtered = filtered.filter(student => getGroupsForStudent(student.id).length > 0);
    } else if (statusFilter === 'without-groups') {
      filtered = filtered.filter(student => getGroupsForStudent(student.id).length === 0);
    }

    return filtered;
  }, [state.students, searchTerm, statusFilter, getGroupsForStudent]);

  const handleDeleteStudent = useCallback((studentId: string) => {
    if (window.confirm(t('modals.deleteStudentWarning'))) {
      dispatch({ type: 'DELETE_STUDENT', payload: studentId });
    }
  }, [dispatch, t]);

  const handleBulkDelete = useCallback(() => {
    if (window.confirm(t('modals.deleteMultipleStudents', { count: selectedStudents.size }))) {
      selectedStudents.forEach(studentId => {
        dispatch({ type: 'DELETE_STUDENT', payload: studentId });
      });
      setSelectedStudents(new Set());
    }
  }, [selectedStudents, dispatch, t]);

  const handleSelectAll = useCallback(() => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
    }
  }, [selectedStudents.size, filteredStudents]);

  const handleSelectStudent = useCallback((studentId: string) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
  }, [selectedStudents]);

  const exportStudents = useCallback(() => {
    exportStudentsToCSV(state.students, state.groups);
  }, [state.students, state.groups]);

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
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
            <h1 className="text-lg font-bold text-gray-900">{t('students.title')}</h1>
            <p className="text-sm text-gray-600">{t('students.subtitle', { count: state.students.length })}</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('students.title')}</h1>
              <p className="text-lg text-gray-600 mt-2">{t('students.subtitle', { count: state.students.length })}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={() => setShowFilters(!showFilters)} 
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showFilters ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" /> {t('common.filter')}
              </button>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="inline-flex items-center justify-center px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" /> {t('students.addStudent')}
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile First */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('students.searchPlaceholder')}
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base lg:text-sm" 
          />
        </div>
        
        {/* Filters - Responsive */}
        {showFilters && (
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.groupStatus')}</label>
                <select 
                  value={statusFilter} 
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="with-groups">{t('students.withGroups')}</option>
                  <option value="without-groups">{t('students.withoutGroups')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.sortBy')}</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="name">{t('students.sortByName')}</option>
                  <option value="created">{t('students.sortByCreated')}</option>
                  <option value="groups">{t('students.sortByGroups')}</option>
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('students.actions')}</label>
                <button 
                  onClick={exportStudents}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" /> {t('students.exportCSV')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Actions - Responsive */}
        {selectedStudents.size > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl lg:rounded-lg p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
              <span className="text-sm lg:text-base text-blue-800 font-medium">
                {t('students.selectedCount', { count: selectedStudents.size })}
              </span>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button 
                  onClick={handleBulkDelete}
                  className="inline-flex items-center justify-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" /> {t('students.bulkDelete')}
                </button>
                <button 
                  onClick={() => setSelectedStudents(new Set())}
                  className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                >
                  {t('students.clearSelection')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Students List - Mobile Cards */}
        <div className="lg:hidden">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-200">
              <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('students.noStudents')}</h3>
              <p className="text-gray-500 mb-4">{t('students.noStudentsMessage')}</p>
              <button 
                onClick={() => setShowAddModal(true)} 
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" /> {t('students.addFirstStudent')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map(student => {
                const groups = getGroupsForStudent(student.id);
                const isSelected = selectedStudents.has(student.id);
                const isExpanded = expandedStudent === student.id;
                
                return (
                  <div key={student.id} className={`bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
                    {/* Student Card Header */}
                    <div className="p-4 lg:p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => handleSelectStudent(student.id)} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-5 w-5" 
                          />
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-gray-900 truncate">{student.fullName}</h3>
                            <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(student.createdAt).toLocaleDateString()}
                              </span>
                              <span className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {groups.length} {t('common.groups')}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleStudentExpansion(student.id)} 
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                        >
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                      
                      {/* Quick Actions - Responsive Grid */}
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 mt-4">
                        <button 
                          onClick={() => setViewingStudent(student)} 
                          className="inline-flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Eye className="h-4 w-4 mr-1 lg:mr-2" /> {t('common.view')}
                        </button>
                        <button 
                          onClick={() => setReportingStudent(student)} 
                          className="inline-flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4 mr-1 lg:mr-2" /> {t('common.report')}
                        </button>
                        <button 
                          onClick={() => setEditingStudent(student)} 
                          className="inline-flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-1 lg:mr-2" /> {t('common.edit')}
                        </button>
                        <button 
                          onClick={() => setExportingStudent(student)} 
                          className="inline-flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                        >
                          <Download className="h-4 w-4 mr-1 lg:mr-2" /> {t('common.export')}
                        </button>
                        <button 
                          onClick={() => handleDeleteStudent(student.id)} 
                          className="inline-flex items-center justify-center px-3 py-2 text-xs lg:text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-4 w-4 mr-1 lg:mr-2" /> {t('common.delete')}
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50 p-4 lg:p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-gray-700">{t('students.contactInfo')}:</span>
                              <p className="text-gray-600 mt-1">{student.contactInfo || t('students.noContactInfo')}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">{t('students.parentPhone')}:</span>
                              <p className="text-gray-600 mt-1">{student.parentPhone || t('students.noParentPhone')}</p>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <span className="font-medium text-gray-700">{t('students.groups')}:</span>
                              <div className="mt-1">
                                {groups.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {groups.map(group => (
                                      <span key={group.id} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                        {group.name}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500">{t('students.noGroups')}</p>
                                )}
                              </div>
                            </div>
                            {student.notes && (
                              <div>
                                <span className="font-medium text-gray-700">{t('common.notes')}:</span>
                                <p className="text-gray-600 mt-1">{student.notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Students Table - Desktop View */}
        <div className="hidden lg:block">
          <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0} 
                        onChange={handleSelectAll} 
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('students.name')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('students.contactInfo')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('students.parentPhone')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('students.groups')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.notes')}</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map(student => {
                    const groups = getGroupsForStudent(student.id);
                    return (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox" 
                            checked={selectedStudents.has(student.id)} 
                            onChange={() => handleSelectStudent(student.id)} 
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                              <div className="text-sm text-gray-500">{t('students.addedOn', { date: new Date(student.createdAt).toLocaleDateString() })}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.contactInfo || t('students.noContactInfo')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.parentPhone || t('students.noParentPhone')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {groups.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {groups.map(group => (
                                <span key={group.id} className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                  {group.name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-500">{t('students.noGroups')}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                          {student.notes || t('students.noNotes')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => setViewingStudent(student)} 
                              className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors" 
                              title={t('students.viewDetails')}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setReportingStudent(student)} 
                              className="text-purple-600 hover:text-purple-900 p-2 rounded-lg hover:bg-purple-50 transition-colors" 
                              title={t('common.report')}
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setEditingStudent(student)} 
                              className="text-green-600 hover:text-green-900 p-2 rounded-lg hover:bg-green-50 transition-colors" 
                              title={t('common.edit')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => setExportingStudent(student)} 
                              className="text-orange-600 hover:text-orange-900 p-2 rounded-lg hover:bg-orange-50 transition-colors" 
                              title={t('common.export')}
                            >
                              <Download className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudent(student.id)} 
                              className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors" 
                              title={t('common.delete')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Empty State for Desktop */}
        {filteredStudents.length === 0 && (
          <div className="hidden lg:block text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <User className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-medium text-gray-900 mb-4">{t('students.noStudents')}</h3>
            <p className="text-lg text-gray-500 mb-6">{t('students.noStudentsMessage')}</p>
            <button 
              onClick={() => setShowAddModal(true)} 
              className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-6 w-6 mr-3" /> {t('students.addFirstStudent')}
            </button>
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddStudentModal onClose={() => setShowAddModal(false)} />
        )}
        {editingStudent && (
          <EditStudentModal student={editingStudent} onClose={() => setEditingStudent(null)} />
        )}
        {viewingStudent && (
          <StudentDetailModal student={viewingStudent} onClose={() => setViewingStudent(null)} />
        )}
        {exportingStudent && (
          <StudentExportModal student={exportingStudent} onClose={() => setExportingStudent(null)} />
        )}
        {reportingStudent && (
          <StudentReportModal student={reportingStudent} onClose={() => setReportingStudent(null)} />
        )}
      </div>
    </div>
  );
};

export default StudentList;
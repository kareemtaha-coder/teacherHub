import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { BookOpen, Plus, Edit, Trash2, Users, BarChart3, DollarSign, Search, Filter, Calendar, FileText, MoreHorizontal, ChevronDown, ChevronUp, X, Menu, UserPlus, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import AddGroupModal from './AddGroupModal';
import EditGroupModal from './EditGroupModal';
import ManageGroupModal from './ManageGroupModal';
import GroupReportModal from './GroupReportModal';
import PaymentManagementModal from './PaymentManagementModal';
import { Group } from '../../types';

const GroupList: React.FC = () => {
  const { state, dispatch } = useApp();
  const { t } = useLanguage();
  const { getStudentsInGroup, getSessionsForGroup, getAssessmentsForGroup } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [managingGroup, setManagingGroup] = useState<Group | null>(null);
  const [reportingGroup, setReportingGroup] = useState<Group | null>(null);
  const [paymentGroup, setPaymentGroup] = useState<Group | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'with-students' | 'without-students'>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const filteredGroups = useMemo(() => {
    let filtered = state.groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (!matchesSearch) return false;
      
      const students = getStudentsInGroup(group.id);
      switch (statusFilter) {
        case 'with-students':
          return students.length > 0;
        case 'without-students':
          return students.length === 0;
        default:
          return true;
      }
    });
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.groups, searchTerm, statusFilter, getStudentsInGroup]);

  const handleDeleteGroup = useCallback((groupId: string) => {
    const group = state.groups.find(g => g.id === groupId);
    const studentsInGroup = getStudentsInGroup(groupId);
    
    if (studentsInGroup.length > 0) {
      if (!window.confirm(`This group has ${studentsInGroup.length} student(s). Deleting it will remove all students from the group. Are you sure?`)) {
        return;
      }
    }
    
    if (window.confirm(`Are you sure you want to delete the group "${group?.name}"? This action cannot be undone.`)) {
      dispatch({ type: 'DELETE_GROUP', payload: groupId });
    }
  }, [dispatch, state.groups, getStudentsInGroup]);

  const getGroupStats = useCallback((groupId: string) => {
    const students = getStudentsInGroup(groupId);
    const sessions = getSessionsForGroup(groupId);
    const assessments = getAssessmentsForGroup(groupId);
    
    return {
      students: students.length,
      sessions: sessions.length,
      assessments: assessments.length,
      hasData: students.length > 0 || sessions.length > 0 || assessments.length > 0
    };
  }, [getStudentsInGroup, getSessionsForGroup, getAssessmentsForGroup]);

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
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
            <h1 className="text-lg font-bold text-gray-900">Groups</h1>
            <p className="text-sm text-gray-600">{filteredGroups.length} of {state.groups.length} groups</p>
          </div>
          
          <button 
            onClick={() => setShowAddModal(true)} 
            className="p-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
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
              <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
              <p className="text-lg text-gray-600 mt-2">
                Manage your classes and cohorts • {filteredGroups.length} of {state.groups.length} groups
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  showFilters 
                    ? 'bg-green-50 text-green-700 border-green-300' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center justify-center px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Group
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar - Mobile First */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search groups by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 lg:py-2 border border-gray-300 rounded-xl lg:rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-base lg:text-sm"
          />
        </div>

        {/* Advanced Filters - Responsive */}
        {showFilters && (
          <div className="bg-white rounded-2xl lg:rounded-lg shadow-sm border border-gray-200 p-4 lg:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="all">All Groups</option>
                  <option value="with-students">With Students</option>
                  <option value="without-students">Without Students</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500">
                  <option>Name (A-Z)</option>
                  <option>Name (Z-A)</option>
                  <option>Recently Created</option>
                  <option>Most Students</option>
                  <option>Most Sessions</option>
                </select>
              </div>
              <div className="md:col-span-2 lg:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Groups Grid - Mobile First */}
        {filteredGroups.length === 0 ? (
          <div className="text-center py-12 lg:py-16 bg-white rounded-2xl shadow-sm border border-gray-200">
            <BookOpen className="h-16 lg:h-20 w-16 lg:w-20 text-gray-400 mx-auto mb-4 lg:mb-6" />
            <h3 className="text-xl lg:text-2xl font-medium text-gray-900 mb-2 lg:mb-4">No groups found</h3>
            <p className="text-gray-500 mb-6 lg:mb-8 text-base lg:text-lg">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first group'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-green-600 text-white text-base lg:text-lg font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="h-5 lg:h-6 w-5 lg:w-6 mr-2 lg:mr-3" />
                Create Your First Group
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {filteredGroups.map(group => {
              const stats = getGroupStats(group.id);
              const studentsInGroup = getStudentsInGroup(group.id);
              const isExpanded = expandedGroup === group.id;
              
              return (
                <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden">
                  {/* Group Header */}
                  <div className="p-4 lg:p-6 border-b border-gray-100">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg lg:text-xl font-semibold text-gray-900 truncate mb-2">
                          {group.name}
                        </h3>
                        {group.description && (
                          <p className="text-sm lg:text-base text-gray-600 line-clamp-2">{group.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => toggleGroupExpansion(group.id)}
                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-2"
                      >
                        {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Quick Stats - Mobile First */}
                    <div className="grid grid-cols-3 gap-3 lg:gap-4 text-center">
                      <div className="bg-blue-50 rounded-xl p-3 lg:p-4">
                        <div className="text-lg lg:text-xl font-semibold text-blue-900">{stats.students}</div>
                        <div className="text-xs lg:text-sm text-blue-600">Students</div>
                      </div>
                      <div className="bg-purple-50 rounded-xl p-3 lg:p-4">
                        <div className="text-lg lg:text-xl font-semibold text-purple-900">{stats.sessions}</div>
                        <div className="text-xs lg:text-sm text-purple-600">Sessions</div>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-3 lg:p-4">
                        <div className="text-lg lg:text-xl font-semibold text-orange-900">{stats.assessments}</div>
                        <div className="text-xs lg:text-sm text-orange-600">Assessments</div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Actions - Mobile First */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 lg:p-6 space-y-3 lg:space-y-4">
                      {/* Primary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setReportingGroup(group)}
                          className="inline-flex items-center justify-center px-3 py-3 lg:py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors"
                        >
                          <BarChart3 className="h-4 w-4 mr-2" />
                          Report
                        </button>
                        <button
                          onClick={() => setPaymentGroup(group)}
                          className="inline-flex items-center justify-center px-3 py-3 lg:py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Payments
                        </button>
                      </div>
                      
                      {/* Secondary Actions */}
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setManagingGroup(group)}
                          className="inline-flex items-center justify-center px-3 py-3 lg:py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Students
                        </button>
                        <button
                          onClick={() => setEditingGroup(group)}
                          className="inline-flex items-center justify-center px-3 py-3 lg:py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                      </div>

                      {/* Delete Button */}
                      <button
                        onClick={() => handleDeleteGroup(group.id)}
                        className="w-full inline-flex items-center justify-center px-4 py-3 lg:py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Group
                      </button>
                    </div>
                  )}

                  {/* Group Actions Footer - Mobile First */}
                  <div className="p-4 lg:p-6 bg-gray-50 rounded-b-2xl">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                      <div className="flex items-center space-x-3 text-sm lg:text-base text-gray-500">
                        <span className="flex items-center">
                          <UserPlus className="h-4 w-4 mr-1" />
                          Tap to expand
                        </span>
                        {studentsInGroup.length > 0 && (
                          <span className="text-green-600 font-medium flex items-center">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            {studentsInGroup.length} student(s)
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setReportingGroup(group)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 border border-purple-200 rounded-lg hover:bg-purple-200 transition-colors"
                      >
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modals */}
        {showAddModal && (
          <AddGroupModal onClose={() => setShowAddModal(false)} />
        )}
        {editingGroup && (
          <EditGroupModal group={editingGroup} onClose={() => setEditingGroup(null)} />
        )}
        {managingGroup && (
          <ManageGroupModal group={managingGroup} onClose={() => setManagingGroup(null)} />
        )}
        {reportingGroup && (
          <GroupReportModal
            group={reportingGroup}
            onClose={() => setReportingGroup(null)}
          />
        )}
        {paymentGroup && (
          <PaymentManagementModal
            group={paymentGroup}
            onClose={() => setPaymentGroup(null)}
          />
        )}
      </div>
    </div>
  );
};

export default GroupList;
import React, { useState, useCallback, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Calendar, Plus, Edit, Trash2, Users, Clock } from 'lucide-react';
import { formatDateTime, formatTime } from '../../utils/generators';
import AddSessionModal from './AddSessionModal';
import EditSessionModal from './EditSessionModal';
import AttendanceModal from './AttendanceModal';
import { Session } from '../../types';

const SessionList: React.FC = () => {
  const { state, dispatch } = useApp();
  const { getGroupById, getStudentsInGroup, getAttendanceForSession } = useDataQueries();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [attendanceSession, setAttendanceSession] = useState<Session | null>(null);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');

  const filteredSessions = state.sessions
    .filter(session => selectedGroupFilter === 'all' || session.groupId === selectedGroupFilter)
    .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const handleDeleteSession = useCallback((sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session? This will also remove all attendance records.')) {
      dispatch({ type: 'DELETE_SESSION', payload: sessionId });
    }
  }, [dispatch]);

  const getAttendanceStats = useCallback((session: Session) => {
    const attendance = getAttendanceForSession(session.id);
    const students = getStudentsInGroup(session.groupId);
    const present = attendance.filter(a => a.status === 'present').length;
    const total = students.length;
    return { present, total };
  }, [getAttendanceForSession, getStudentsInGroup]);

  // Memoize session data to prevent unnecessary recalculations
  const sessionData = useMemo(() => 
    filteredSessions.map(session => {
      const group = getGroupById(session.groupId);
      const { present, total } = getAttendanceStats(session);
      const isUpcoming = new Date(session.dateTime) > new Date();
      
      return {
        session,
        group,
        stats: { present, total },
        isUpcoming
      };
    }),
    [filteredSessions, getGroupById, getAttendanceStats]
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sessions</h2>
          <p className="text-gray-600">Schedule and track class sessions</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </button>
      </div>

      {state.groups.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <p className="text-yellow-800">
            You need to create at least one group before scheduling sessions.
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

            {filteredSessions.length === 0 ? (
              <div className="p-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No sessions found</p>
                <p className="text-gray-400 text-sm">
                  {selectedGroupFilter === 'all' 
                    ? 'Start by scheduling your first session'
                    : 'No sessions scheduled for this group'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sessionData.map((item) => {
                  const { session, group, stats, isUpcoming } = item;
                  
                  return (
                    <div key={session.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                            isUpcoming ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <Calendar className={`h-6 w-6 ${
                              isUpcoming ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">
                                {session.topic || 'Class Session'}
                              </h3>
                              {isUpcoming && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Upcoming
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              {group?.name}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {formatDateTime(session.dateTime)}
                              </div>
                              {!isUpcoming && stats.total > 0 && (
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1" />
                                  {stats.present}/{stats.total} present ({((stats.present / stats.total) * 100).toFixed(0)}%)
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {!isUpcoming && (
                            <button
                              onClick={() => setAttendanceSession(session)}
                              className="text-green-600 hover:text-green-800 px-3 py-1 rounded-md text-sm font-medium hover:bg-green-50 border border-green-200"
                            >
                              Attendance
                            </button>
                          )}
                          <button
                            onClick={() => setEditingSession(session)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSession(session.id)}
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
        <AddSessionModal onClose={() => setShowAddModal(false)} />
      )}

      {editingSession && (
        <EditSessionModal
          session={editingSession}
          onClose={() => setEditingSession(null)}
        />
      )}

      {attendanceSession && (
        <AttendanceModal
          session={attendanceSession}
          onClose={() => setAttendanceSession(null)}
        />
      )}
    </div>
  );
};

export default SessionList;
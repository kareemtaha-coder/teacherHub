import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useDataQueries } from '../../hooks/useDataQueries';
import { Group } from '../../types';
import { X, User, Plus, Minus } from 'lucide-react';

interface ManageGroupModalProps {
  group: Group;
  onClose: () => void;
}

const ManageGroupModal: React.FC<ManageGroupModalProps> = ({ group, onClose }) => {
  const { state, dispatch } = useApp();
  const { getStudentsInGroup } = useDataQueries();
  const [searchTerm, setSearchTerm] = useState('');
  
  const studentsInGroup = getStudentsInGroup(group.id);
  const studentsNotInGroup = state.students.filter(
    student => !studentsInGroup.find(s => s.id === student.id)
  );

  const filteredAvailableStudents = studentsNotInGroup.filter(student =>
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.contactInfo && student.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.parentPhone && student.parentPhone.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddStudent = (studentId: string) => {
    dispatch({
      type: 'ADD_STUDENT_TO_GROUP',
      payload: { studentId, groupId: group.id }
    });
  };

  const handleRemoveStudent = (studentId: string) => {
    dispatch({
      type: 'REMOVE_STUDENT_FROM_GROUP',
      payload: { studentId, groupId: group.id }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Manage Students - {group.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[70vh]">
          {/* Students in Group */}
          <div className="flex-1 border-r border-gray-200">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">
                Students in Group ({studentsInGroup.length})
              </h4>
            </div>
            <div className="overflow-y-auto h-full">
              {studentsInGroup.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No students in this group</p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {studentsInGroup.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName}</p>
                          {student.contactInfo && (
                            <p className="text-xs text-gray-500">{student.contactInfo}</p>
                          )}
                          {student.parentPhone && (
                            <p className="text-xs text-gray-500">Parent: {student.parentPhone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        title="Remove from group"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Students */}
          <div className="flex-1">
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">
                Available Students ({studentsNotInGroup.length})
              </h4>
              <input
                type="text"
                placeholder="Search students by name, contact info, or parent phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="overflow-y-auto h-full">
              {filteredAvailableStudents.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    {studentsNotInGroup.length === 0 
                      ? 'All students are in this group'
                      : 'No students found'
                    }
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredAvailableStudents.map(student => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{student.fullName}</p>
                          {student.contactInfo && (
                            <p className="text-xs text-gray-500">{student.contactInfo}</p>
                          )}
                          {student.parentPhone && (
                            <p className="text-xs text-gray-500">Parent: {student.parentPhone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddStudent(student.id)}
                        className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-50"
                        title="Add to group"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ManageGroupModal;
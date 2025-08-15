import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportData, importData } from '../../utils/storage';
import { Settings as SettingsIcon, Download, Upload, Trash2, AlertCircle } from 'lucide-react';

const Settings: React.FC = () => {
  const { state, dispatch } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `teacher-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const success = importData(content);
        
        if (success) {
          // Reload the page to refresh the app state
          window.location.reload();
        } else {
          setImportError('Invalid file format or corrupted data.');
        }
      } catch (error) {
        setImportError('Failed to read the file. Please check the file format.');
      } finally {
        setIsImporting(false);
      }
    };

    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    dispatch({
      type: 'IMPORT_DATA',
      payload: {
        students: [],
        groups: [],
        studentGroups: [],
        sessions: [],
        attendanceRecords: [],
        assessments: [],
        grades: []
      }
    });
    setShowClearConfirm(false);
  };

  const dataStats = {
    students: state.students.length,
    groups: state.groups.length,
    sessions: state.sessions.length,
    assessments: state.assessments.length,
    attendanceRecords: state.attendanceRecords.length,
    grades: state.grades.length
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Settings</h2>
        <p className="text-gray-600">Manage your application data and preferences</p>
      </div>

      <div className="space-y-6">
        {/* Data Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <SettingsIcon className="h-5 w-5 mr-2" />
            Data Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{dataStats.students}</div>
              <div className="text-sm text-gray-600">Students</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{dataStats.groups}</div>
              <div className="text-sm text-gray-600">Groups</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{dataStats.sessions}</div>
              <div className="text-sm text-gray-600">Sessions</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{dataStats.assessments}</div>
              <div className="text-sm text-gray-600">Assessments</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-teal-600">{dataStats.attendanceRecords}</div>
              <div className="text-sm text-gray-600">Attendance Records</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-indigo-600">{dataStats.grades}</div>
              <div className="text-sm text-gray-600">Grades</div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="space-y-4">
            {/* Export Data */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">Export Data</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Download all your data as a JSON file for backup purposes
                </p>
              </div>
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors inline-flex items-center disabled:opacity-50"
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Exporting...' : 'Export Data'}
              </button>
            </div>

            {/* Import Data */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-gray-900">Import Data</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    Restore data from a previously exported JSON file
                  </p>
                </div>
                <label className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors inline-flex items-center cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? 'Importing...' : 'Import Data'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    disabled={isImporting}
                    className="hidden"
                  />
                </label>
              </div>
              
              {importError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">Import Failed</p>
                    <p className="text-sm text-red-600">{importError}</p>
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-3">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">Warning</p>
                    <p className="text-sm text-yellow-600">
                      Importing data will replace all current data. Make sure to export your current data first if you want to keep it.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Clear All Data */}
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium text-red-900">Clear All Data</h4>
                  <p className="text-sm text-red-700 mt-1">
                    Permanently delete all students, groups, sessions, and grades
                  </p>
                </div>
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors inline-flex items-center"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Application Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Version:</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Storage:</span>
              <span className="font-medium">Local Browser Storage</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data Sync:</span>
              <span className="font-medium">Offline Only</span>
            </div>
          </div>
        </div>
      </div>

      {/* Clear Data Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Data Clear</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Are you absolutely sure you want to delete all data? This action cannot be undone and will permanently remove:
            </p>
            
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>{dataStats.students} students</li>
              <li>{dataStats.groups} groups</li>
              <li>{dataStats.sessions} sessions</li>
              <li>{dataStats.assessments} assessments</li>
              <li>{dataStats.attendanceRecords} attendance records</li>
              <li>{dataStats.grades} grades</li>
            </ul>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
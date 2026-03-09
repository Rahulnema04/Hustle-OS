import React, { useState, useEffect, useRef } from 'react';
import StatCard from './StatCard.jsx';
import { Calendar, Clock, Users, UserCheck, UserX, AlertTriangle, Filter, Upload, Download, X } from 'lucide-react';
import api from '../utils/api.js';
import { showToast } from '../utils/toast';

const AttendanceManagement = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [summary, setSummary] = useState({});
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  // Generate Sparkline Data
  const generateSparkline = (trend = 'neutral', points = 15) => {
    const data = [];
    let current = 50;
    for (let i = 0; i < points; i++) {
      let change = (Math.random() - 0.5) * 10;
      if (trend === 'up') change += 2;
      if (trend === 'down') change -= 2;
      current = Math.max(10, current + change);
      data.push({ value: current });
    }
    return data;
  };

  useEffect(() => {
    fetchAttendanceData();
  }, [selectedDate, selectedDepartment, selectedStatus]);

  // ... existing fetch and helper functions ...

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const params = {
        date: selectedDate,
        ...(selectedDepartment && { department: selectedDepartment }),
        ...(selectedStatus && { status: selectedStatus })
      };

      console.log('Fetching attendance data for date:', selectedDate, 'params:', params);

      const response = await api.get('/attendance/all', { params });

      console.log('Attendance API Response:', response.data);

      if (response.data && response.data.success) {
        const attendance = response.data.data.attendance || [];
        const summary = response.data.data.summary || {};
        const departments = response.data.data.departments || [];
        
        console.log('Attendance Records:', attendance.length);
        console.log('Summary:', summary);
        console.log('Departments:', departments);
        
        setAttendanceData(attendance);
        setSummary(summary);
        setDepartments(departments);
        
        if (attendance.length === 0) {
          console.log(`No attendance records found for ${selectedDate}`);
        }
      } else {
        console.error('Failed to fetch attendance data:', response.data);
        const errorMsg = response.data?.message || 'Failed to fetch attendance data';
        showToast.error(errorMsg);
        setAttendanceData([]);
        setSummary({});
        setDepartments([]);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load attendance data. Please try again.';
      showToast.error(errorMsg);
      // Reset data on error
      setAttendanceData([]);
      setSummary({});
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
      absent: 'text-red-400 bg-red-500/10 border border-red-500/20',
      late: 'text-amber-400 bg-amber-500/10 border border-amber-500/20',
      partial: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
      'early-departure': 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
      leave: 'text-blue-400 bg-blue-500/10 border border-blue-500/20',
      holiday: 'text-purple-400 bg-purple-500/10 border border-purple-500/20'
    };
    return colors[status] || 'text-zinc-400 bg-zinc-500/10 border border-zinc-500/20';
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatWorkingHours = (minutes) => {
    if (!minutes || minutes <= 0) return '0h 0m';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const exportToCSV = () => {
    const headers = ['Employee Name', 'Department', 'Punch In', 'Punch Out', 'Working Hours', 'Status', 'Notes'];
    const csvData = attendanceData.map(record => [
      `${record.employee.firstName} ${record.employee.lastName}`,
      record.employee.department || '',
      formatTime(record.punchIn?.time),
      formatTime(record.punchOut?.time),
      formatWorkingHours(record.totalWorkingHours),
      record.status,
      record.notes || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadTemplate = () => {
    const templateUrl = '/attendance-import-template.csv';
    const a = document.createElement('a');
    a.href = templateUrl;
    a.download = 'attendance-import-template.csv';
    a.click();
  };

  const downloadCSVTemplate = () => {
    const headers = [
      'Employee Code',
      'Date (YYYY-MM-DD)',
      'Punch In (HH:MM)',
      'Punch Out (HH:MM)',
      'Status',
      'Notes'
    ];

    const sampleData = [
      'EMP001,2025-10-14,09:00,17:30,present,Regular working day',
      'EMP002,2025-10-14,09:15,17:30,late,Late arrival',
      'EMP003,2025-10-14,,,,absent,Did not come to office'
    ];

    const csvContent = [headers.join(','), ...sampleData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-import-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const parseCSVContent = (csvContent) => {
    // Remove BOM character if present
    const cleanContent = csvContent.replace(/^\uFEFF/, '');
    const lines = cleanContent.trim().split('\n');

    if (lines.length < 2) return [];

    // Parse headers and clean them
    const headers = parseCSVLine(lines[0]).map(h =>
      h.trim().replace(/"/g, '').toLowerCase()
    );

    console.log('Parsed headers:', headers);

    return lines.slice(1).map((line, index) => {
      if (!line.trim()) return null; // Skip empty lines

      const values = parseCSVLine(line);
      console.log(`Line ${index + 2}:`, values);

      const record = {};
      headers.forEach((header, i) => {
        record[header] = values[i] ? values[i].trim().replace(/"/g, '') : '';
      });

      return record;
    }).filter(record => record !== null);
  };

  const parseCSVLine = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    return values;
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        setImporting(true);
        const csvContent = e.target.result;
        const parsedData = parseCSVContent(csvContent);

        console.log('Parsed data sample:', parsedData[0]);

        // Validate and transform data
        const attendanceRecords = parsedData.map(row => {
          const record = {
            employeeCode: row['employee code'] || row['employeecode'] || row['employee_code'] || '',
            date: row['date (yyyy-mm-dd)'] || row['date'] || row['dateyyyy_mm_dd'] || '',
            punchIn: row['punch in (hh:mm)'] || row['punchin'] || row['punch_in'] || '',
            punchOut: row['punch out (hh:mm)'] || row['punchout'] || row['punch_out'] || '',
            status: row['status'] || 'present',
            notes: row['notes'] || ''
          };

          console.log('Mapped record:', record);
          return record;
        }).filter(record => record.employeeCode && record.date);

        console.log('Valid attendance records:', attendanceRecords.length);

        if (attendanceRecords.length === 0) {
          throw new Error('No valid attendance records found in CSV');
        }

        // Send to backend
        const response = await api.post('/attendance/import', {
          records: attendanceRecords
        });

        if (response.data && response.data.success) {
          setImportResults({
            success: response.data.data.successful || 0,
            failed: response.data.data.failed || 0,
            errors: response.data.data.errors || []
          });

          // Refresh attendance data
          fetchAttendanceData();
        } else {
          throw new Error(response.data?.message || 'Import failed');
        }
      } catch (error) {
        console.error('Import error:', error);
        setImportResults({
          success: 0,
          failed: 0,
          errors: [error.message || 'Failed to import CSV']
        });
      } finally {
        setImporting(false);
      }
    };

    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance Management</h1>
          <p className="text-zinc-400">Track and manage employee attendance</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center px-4 py-2 rounded-xl transition-colors border ${showFilters ? 'bg-zinc-700 text-white border-zinc-600' : 'bg-zinc-800/50 text-zinc-300 border-white/5 hover:bg-zinc-700/50'}`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={downloadTemplate}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 transition-colors border border-white/5"
          >
            <Download className="h-4 w-4 mr-2" />
            Template
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/20"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-zinc-800/50 backdrop-blur-md p-6 rounded-xl shadow-lg border border-white/5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-700 rounded-xl px-3 py-2.5 text-white focus:ring-2 focus:ring-blue-500/50 outline-none"
              >
                <option value="">All Status</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="partial">Partial</option>
                <option value="early-departure">Early Departure</option>
                <option value="leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Summary Stat Cards with Sparklines */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <StatCard
          title="Total Employees"
          value={summary.totalEmployees || 0}
          icon={Users}
          color="primary"
          trend="Total"
          chartData={generateSparkline('neutral')}
          className="stagger-1 bg-zinc-800/50 backdrop-blur-md border border-white/5"
        />
        <StatCard
          title="Present"
          value={summary.present || 0}
          icon={UserCheck}
          color="success"
          trend={summary.totalEmployees ? `${Math.round((summary.present / summary.totalEmployees) * 100)}%` : '0%'}
          trendUp={true}
          chartData={generateSparkline('up')}
          className="stagger-2 bg-zinc-800/50 backdrop-blur-md border border-white/5"
        />
        <StatCard
          title="Absent"
          value={summary.absent || 0}
          icon={UserX}
          color="danger"
          trend="Attention Needed"
          trendUp={false}
          chartData={generateSparkline('down')}
          className="stagger-3 bg-zinc-800/50 backdrop-blur-md border border-white/5"
        />
        <StatCard
          title="Late"
          value={summary.late || 0}
          icon={AlertTriangle}
          color="warning"
          trend="Warning"
          chartData={generateSparkline('neutral')}
          className="stagger-4 bg-zinc-800/50 backdrop-blur-md border border-white/5"
        />
        <StatCard
          title="On Leave"
          value={summary.onLeave || 0}
          icon={Calendar}
          color="info"
          trend="Planned"
          chartData={generateSparkline('neutral')}
          className="stagger-5 bg-zinc-800/50 backdrop-blur-md border border-white/5"
        />
      </div>

      {/* Attendance Table */}
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-zinc-900/30">
          <h3 className="flex items-center text-lg font-semibold text-white">
            <Clock className="h-5 w-5 mr-2 text-blue-400" />
            Attendance Records - {new Date(selectedDate).toLocaleDateString()}
          </h3>
        </div>
        <div className="p-0">
          {attendanceData.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              No attendance records found for the selected criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-zinc-700/50">
                <thead className="bg-zinc-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Punch In</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Punch Out</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Working Hours</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {attendanceData.map((record) => (
                    <tr key={record._id} className="hover:bg-zinc-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-white">
                            {record.employee.firstName} {record.employee.lastName}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {record.employee.employeeId}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-300">
                        {record.employee.department || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-300">
                        {formatTime(record.punchIn?.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-zinc-300">
                        {formatTime(record.punchOut?.time)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="font-mono font-medium text-zinc-300">
                          {formatWorkingHours(record.totalWorkingHours)}
                        </span>
                        {record.overtime?.hours > 0 && (
                          <span className="ml-1 text-xs text-blue-400">
                            (+{formatWorkingHours(record.overtime.hours)} OT)
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(record.status)}`}>
                          {record.status.replace('-', ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">Import Attendance Data</h3>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportResults(null);
                }}
                className="text-zinc-400 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!importResults ? (
              <div className="space-y-4">
                <p className="text-sm text-zinc-400">
                  Upload a CSV file with attendance data. Make sure your CSV has the correct format.
                </p>

                <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    disabled={importing}
                    className="hidden"
                  />

                  {importing ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                      <span className="ml-2 text-sm text-zinc-400">Processing...</span>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 text-zinc-500 mx-auto mb-2" />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Choose CSV file
                      </button>
                      <p className="text-xs text-zinc-500 mt-1">
                        Supported format: CSV files only
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-2">
                  <button
                    onClick={downloadCSVTemplate}
                    className="text-sm text-blue-400 hover:text-blue-300 underline"
                  >
                    Download template CSV
                  </button>
                  <button
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 text-zinc-300 border border-white/10 rounded-xl hover:bg-zinc-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${importResults.errors.length === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                    {importResults.errors.length === 0 ? '✓ Import Completed' : '⚠ Import Completed with Issues'}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-zinc-400">
                    <span>Successfully imported:</span>
                    <span className="font-medium text-emerald-400">{importResults.success}</span>
                  </div>
                  {importResults.failed > 0 && (
                    <div className="flex justify-between text-zinc-400">
                      <span>Failed to import:</span>
                      <span className="font-medium text-red-400">{importResults.failed}</span>
                    </div>
                  )}
                </div>

                {importResults.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium text-white mb-2">Errors:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
                      {importResults.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-3">
                  <button
                    onClick={() => {
                      setShowImportModal(false);
                      setImportResults(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
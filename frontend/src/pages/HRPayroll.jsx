import React, { useState, useEffect, useCallback } from 'react';
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  Download,
  Filter,
  Search,
  CheckCircle,
  AlertCircle,
  Clock,
  Award,
  FileText,
  RefreshCw,
  Eye
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const HRPayroll = () => {
  const [payrollData, setPayrollData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  const fetchPayrollData = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log(`Fetching payroll data for ${selectedMonth}/${selectedYear}...`);
      
      const response = await api.get('/hr/payroll/preview', {
        params: {
          month: selectedMonth,
          year: selectedYear
        }
      });

      console.log('Payroll data response:', response.data);

      if (response.data.success) {
        setPayrollData(response.data.data || []);
        showToast.success(`Loaded payroll data for ${response.data.count} employees`);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
      showToast.error('Failed to fetch payroll data');
      setPayrollData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayrollData();
  }, [fetchPayrollData]);

  // Filter and sort data
  const filteredData = payrollData
    .filter(employee => {
      if (!searchTerm) return true;
      const search = searchTerm.toLowerCase();
      return (
        employee.name?.toLowerCase().includes(search) ||
        employee.employeeCode?.toLowerCase().includes(search) ||
        employee.email?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      let compareA, compareB;
      
      switch (sortBy) {
        case 'name':
          compareA = a.name || '';
          compareB = b.name || '';
          break;
        case 'netSalary':
          compareA = a.payroll?.netSalary || 0;
          compareB = b.payroll?.netSalary || 0;
          break;
        case 'completionRate':
          compareA = a.performance?.completionRate || 0;
          compareB = b.performance?.completionRate || 0;
          break;
        case 'attendance':
          compareA = a.attendance?.attendanceRate || 0;
          compareB = b.attendance?.attendanceRate || 0;
          break;
        default:
          compareA = a.name || '';
          compareB = b.name || '';
      }

      if (typeof compareA === 'string') {
        return sortOrder === 'asc' 
          ? compareA.localeCompare(compareB)
          : compareB.localeCompare(compareA);
      }
      
      return sortOrder === 'asc' 
        ? compareA - compareB
        : compareB - compareA;
    });

  // Calculate summary statistics
  const summary = {
    totalEmployees: filteredData.length,
    totalPayroll: filteredData.reduce((sum, emp) => sum + (emp.payroll?.netSalary || 0), 0),
    avgCompletionRate: filteredData.length > 0 
      ? filteredData.reduce((sum, emp) => sum + (emp.performance?.completionRate || 0), 0) / filteredData.length
      : 0,
    avgAttendance: filteredData.length > 0
      ? filteredData.reduce((sum, emp) => sum + (emp.attendance?.attendanceRate || 0), 0) / filteredData.length
      : 0
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const exportToCSV = () => {
    const headers = [
      'Employee Code',
      'Name',
      'Email',
      'Role',
      'Department',
      'Completion Rate',
      'Tasks Completed',
      'Overdue Tasks',
      'Points Earned',
      'Attendance Rate',
      'Present Days',
      'Leave Days',
      'Total Working Days',
      'Basic Salary',
      'Attendance Adjusted Salary',
      'Performance Bonus %',
      'Performance Bonus',
      'Points Incentive',
      'Net Salary',
      'Performance Tier'
    ];

    const rows = filteredData.map(emp => [
      emp.employeeCode,
      emp.name,
      emp.email,
      emp.role,
      emp.department || 'N/A',
      `${emp.performance?.completionRate || 0}%`,
      emp.performance?.completedTasks || 0,
      emp.performance?.overdueTasks || 0,
      emp.performance?.totalPointsEarned || 0,
      `${emp.attendance?.attendanceRate || 0}%`,
      emp.attendance?.presentDays || 0,
      emp.attendance?.leaveDays || 0,
      emp.attendance?.totalWorkingDays || 0,
      emp.payroll?.basicSalary || 0,
      emp.payroll?.attendanceAdjustedSalary || 0,
      `${emp.payroll?.performanceBonusPercentage || 0}%`,
      emp.payroll?.performanceBonus || 0,
      emp.payroll?.pointsIncentive || 0,
      emp.payroll?.netSalary || 0,
      emp.payroll?.performanceTier || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll_${months[selectedMonth - 1]}_${selectedYear}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast.success('Payroll data exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-zinc-400">Loading payroll data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Payroll Management</h1>
            <p className="text-zinc-400">
              Automated payroll calculation based on performance, attendance, and leave data
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span className="text-xs text-zinc-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.totalEmployees}</p>
            <p className="text-xs text-zinc-400">Employees</p>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-xs text-zinc-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-white">{formatCurrency(summary.totalPayroll)}</p>
            <p className="text-xs text-zinc-400">Net Payroll</p>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <span className="text-xs text-zinc-500">Average</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.avgCompletionRate.toFixed(1)}%</p>
            <p className="text-xs text-zinc-400">Completion Rate</p>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-5 h-5 text-orange-400" />
              <span className="text-xs text-zinc-500">Average</span>
            </div>
            <p className="text-2xl font-bold text-white">{summary.avgAttendance.toFixed(1)}%</p>
            <p className="text-xs text-zinc-400">Attendance</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900 border border-white/10 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Month Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Month
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {months.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {[2024, 2025, 2026].map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, code, email..."
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="netSalary">Net Salary</option>
                <option value="completionRate">Completion Rate</option>
                <option value="attendance">Attendance</option>
              </select>
            </div>

            {/* Sort Order */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full bg-zinc-800 border border-white/10 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>

          <button
            onClick={fetchPayrollData}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-zinc-900 border border-white/10 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-800/50 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Attendance
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Salary Breakdown
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Net Salary
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredData.map((employee, index) => (
                <tr key={employee.employeeId || index} className="hover:bg-zinc-800/30 transition-colors">
                  {/* Employee Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-400">
                          {employee.name?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{employee.name}</p>
                        <p className="text-xs text-zinc-400">{employee.employeeCode}</p>
                        <p className="text-xs text-zinc-500">{employee.role}</p>
                      </div>
                    </div>
                  </td>

                  {/* Performance */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          (employee.performance?.completionRate || 0) >= 80 ? 'text-green-400' :
                          (employee.performance?.completionRate || 0) >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {employee.performance?.completionRate || 0}%
                        </span>
                        <span className="text-xs text-zinc-500">completion</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span>✓ {employee.performance?.completedTasks || 0}</span>
                        <span className="text-red-400">! {employee.performance?.overdueTasks || 0}</span>
                        <span className="text-blue-400">⭐ {employee.performance?.totalPointsEarned || 0}</span>
                      </div>
                    </div>
                  </td>

                  {/* Attendance */}
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-semibold ${
                          (employee.attendance?.attendanceRate || 0) >= 90 ? 'text-green-400' :
                          (employee.attendance?.attendanceRate || 0) >= 75 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {employee.attendance?.attendanceRate || 0}%
                        </span>
                      </div>
                      <div className="text-xs text-zinc-400">
                        {employee.attendance?.presentDays || 0} / {employee.attendance?.totalWorkingDays || 0} days
                        {employee.attendance?.leaveDays > 0 && (
                          <span className="ml-2 text-orange-400">({employee.attendance.leaveDays} leave)</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Salary Breakdown */}
                  <td className="px-6 py-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-zinc-400">
                        <span>Basic Salary:</span>
                        <span className="text-white">{formatCurrency(employee.payroll?.basicSalary || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-blue-400">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Attendance Adj:
                        </span>
                        <span className="font-semibold">{formatCurrency(employee.payroll?.attendanceAdjustedSalary || 0)}</span>
                      </div>
                      {(employee.payroll?.performanceBonus || 0) > 0 && (
                        <div className="flex justify-between items-center text-green-400">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Performance ({employee.payroll?.performanceBonusPercentage}%):
                          </span>
                          <span className="font-semibold">+{formatCurrency(employee.payroll.performanceBonus)}</span>
                        </div>
                      )}
                      {(employee.payroll?.pointsIncentive || 0) > 0 && (
                        <div className="flex justify-between items-center text-purple-400">
                          <span className="flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            Points ({employee.performance?.totalPointsEarned}):
                          </span>
                          <span className="font-semibold">+{formatCurrency(employee.payroll.pointsIncentive)}</span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Net Salary */}
                  <td className="px-6 py-4 text-right">
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(employee.payroll?.netSalary || 0)}
                    </p>
                    {employee.payroll?.performanceTier && (
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                        employee.payroll.performanceTier === 'Excellent' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        employee.payroll.performanceTier === 'Great' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        employee.payroll.performanceTier === 'Good' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        employee.payroll.performanceTier === 'Satisfactory' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        <Award className="w-3 h-3" />
                        {employee.payroll.performanceTier}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No payroll data found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRPayroll;

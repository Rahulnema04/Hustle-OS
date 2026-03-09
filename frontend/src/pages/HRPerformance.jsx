import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Medal,
  Award,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Clock,
  Star,
  Calendar,
  Filter,
  Download,
  Eye,
  ArrowUp,
  ArrowDown,
  Trash2,
  UserPlus,
  X,
  Search,
  Zap
} from 'lucide-react';
import api from '../utils/api';
import { filterEmployees, FILTERED_EMPLOYEES } from '../utils/employeeFilter';
import { showToast } from '../utils/toast';
import PerformanceDetailModal from '../components/PerformanceDetailModal';

const HRPerformance = () => {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    department: '',
    employeeId: ''
  });

  // Fetch performance data
  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log('[HRPerformance] Fetching data with period:', selectedPeriod);
      const response = await api.get(`/hr/performance/all?period=${selectedPeriod}&page=1&limit=100`);
      console.log('[HRPerformance] Response received:', response.data);
      const employees = response.data.data || [];
      console.log('[HRPerformance] Number of employees:', employees.length);
      setPerformanceData(employees);
      setError(null);
    } catch (error) {
      console.error('[HRPerformance] Error fetching performance data:', error);
      console.error('[HRPerformance] Error details:', error.response);
      setPerformanceData([]);
      const errorMessage = error.response?.data?.message || 'Failed to load performance data. Please try again.';
      setError(errorMessage);
      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    fetchPerformanceData();
  }, [fetchPerformanceData]);

  // Sort and filter performance data
  const getSortedAndFilteredData = () => {
    console.log('[HRPerformance] Filtering and sorting data...');
    console.log('[HRPerformance] Performance data:', performanceData);
    console.log('[HRPerformance] Search term:', searchTerm);
    console.log('[HRPerformance] Sort by:', sortBy, 'Order:', sortOrder);
    
    let filteredData = performanceData.filter(individual => {
      // Commented out employee filtering to show all data
      // if (FILTERED_EMPLOYEES.includes(individual.name)) return false;
      const nameMatch = individual.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const emailMatch = individual.email?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || emailMatch;
    });

    console.log('[HRPerformance] Filtered data length:', filteredData.length);

    filteredData.sort((a, b) => {
      // Map sortBy to actual field names in the response
      let sortField = sortBy;
      if (sortBy === 'totalPoints') {
        sortField = 'totalPointsEarned';
      }
      
      let aValue = a[sortField];
      let bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined) aValue = 0;
      if (bValue === undefined) bValue = 0;

      if (sortBy === 'name') {
        aValue = String(aValue).toLowerCase();
        bValue = String(bValue).toLowerCase();
      }

      if (sortOrder === 'asc') return aValue > bValue ? 1 : -1;
      return aValue < bValue ? 1 : -1;
    });

    return filteredData.map((individual, index) => ({
      ...individual,
      rank: index + 1
    }));
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-zinc-400" />;
      case 3: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-zinc-500">#{rank}</span>;
    }
  };

  const getPerformanceLevel = (completionRate) => {
    if (completionRate >= 90) return { label: 'Excellent', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
    if (completionRate >= 75) return { label: 'Good', color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' };
    if (completionRate >= 60) return { label: 'Average', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'Below Avg', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      showToast.success(`Add employee functionality: ${newEmployee.name}`);
      setShowAddEmployeeModal(false);
      setNewEmployee({ name: '', email: '', department: '', employeeId: '' });
    } catch (error) {
      showToast.error('Failed to add employee');
    }
  };

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove) return;
    try {
      showToast.success(`Remove employee functionality: ${employeeToRemove.name}`);
      setShowRemoveConfirm(false);
      setEmployeeToRemove(null);
    } catch (error) {
      showToast.error('Failed to remove employee');
    }
  };

  const handleViewDetails = async (employee) => {
    console.log('[HRPerformance] View details clicked for:', employee);
    console.log('[HRPerformance] Employee ID field:', employee.employeeId, 'Employee _id:', employee._id);
    
    try {
      // Use _id from MongoDB, not employeeId which might be the employee code
      const employeeId = employee.employeeId || employee._id;
      if (!employeeId) {
        showToast.error('Employee ID not found');
        return;
      }
      
      console.log('[HRPerformance] Fetching details for ID:', employeeId);
      
      // Fetch detailed performance data for this employee
      const response = await api.get(`/hr/performance/${employeeId}?period=${selectedPeriod}`);
      console.log('[HRPerformance] Details response:', response.data);
      
      setSelectedEmployee(response.data.data);
      setShowDetailModal(true);
    } catch (error) {
      console.error('[HRPerformance] Error fetching employee details:', error);
      console.error('[HRPerformance] Error response:', error.response);
      showToast.error('Failed to load employee details: ' + (error.response?.data?.message || error.message));
    }
  };

  const exportPerformanceData = () => {
    const csvContent = [
      ['Rank', 'Name', 'Email', 'Total Points', 'Completed Tasks', 'Total Tasks', 'Completion Rate %', 'On-Time Rate %', 'Productivity Score'],
      ...getSortedAndFilteredData().map(individual => [
        individual.rank || 0,
        individual.name,
        individual.email,
        individual.totalPointsEarned || 0,
        individual.completedTasks || 0,
        individual.totalTasks || 0,
        individual.completionRate || 0,
        individual.onTimeDeliveryRate || 0,
        individual.productivityScore || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const sortedData = getSortedAndFilteredData();
  
  console.log('[HRPerformance] Sorted data length:', sortedData.length);
  console.log('[HRPerformance] Is loading:', isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center">
            <Trophy className="h-6 w-6 mr-3 text-yellow-500" />
            Performance Dashboard
          </h1>
          <p className="mt-1 text-zinc-400">Track and analyze individual employee performance metrics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddEmployeeModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={exportPerformanceData}
            className="flex items-center px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 transition-colors border border-white/5"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters and Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Card */}
        <div className="lg:col-span-4 bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 p-4">
          <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="w-full md:w-48">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="all-time">All Time</option>
                <option value="this-year">This Year</option>
                <option value="this-quarter">This Quarter</option>
                <option value="this-month">This Month</option>
                <option value="last-30-days">Last 30 Days</option>
              </select>
            </div>
            <div className="w-full md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="totalPoints">Points</option>
                <option value="completionRate">Completion Rate</option>
                <option value="completedTasks">Tasks Completed</option>
                <option value="name">Name</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <span className="text-xs font-medium text-zinc-400 bg-zinc-700/50 px-2 py-1 rounded">Total</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">{sortedData.length}</span>
            <p className="text-sm text-zinc-400 mt-1">Active Employees</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+2.5%</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">
              {sortedData.length > 0
                ? Math.round(sortedData.reduce((sum, emp) => sum + emp.completionRate, 0) / sortedData.length)
                : 0}%
            </span>
            <p className="text-sm text-zinc-400 mt-1">Avg Completion Rate</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-amber-500/10 rounded-xl">
              <Star className="w-6 h-6 text-amber-400" />
            </div>
            <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-1 rounded">Points</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">
              {sortedData.reduce((sum, emp) => sum + (emp.totalPointsEarned || emp.totalPoints || 0), 0).toLocaleString()}
            </span>
            <p className="text-sm text-zinc-400 mt-1">Total Points Earned</p>
          </div>
        </div>

        <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <span className="text-xs font-medium text-purple-400 bg-purple-500/10 px-2 py-1 rounded">Tasks</span>
          </div>
          <div>
            <span className="text-3xl font-bold text-white">
              {sortedData.reduce((sum, emp) => sum + emp.completedTasks, 0).toLocaleString()}
            </span>
            <p className="text-sm text-zinc-400 mt-1">Tasks Completed</p>
          </div>
        </div>
      </div>

      {/* Performance Rankings Table */}
      <div className="bg-zinc-800/50 backdrop-blur-md rounded-xl shadow-lg border border-white/5 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
          <h3 className="text-lg font-semibold text-white flex items-center">
            <Award className="h-5 w-5 mr-2 text-blue-400" />
            Performance Rankings
          </h3>
          <span className="text-xs text-zinc-400">
            Showing {sortedData.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-700/50">
            <thead className="bg-zinc-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Rank</th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Employee
                    {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('totalPoints')}
                >
                  <div className="flex items-center">
                    Total Points
                    {sortBy === 'totalPoints' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('completedTasks')}
                >
                  <div className="flex items-center">
                    Tasks
                    {sortBy === 'completedTasks' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                  onClick={() => handleSort('completionRate')}
                >
                  <div className="flex items-center">
                    Rate
                    {sortBy === 'completionRate' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />)}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-zinc-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {sortedData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-zinc-500">
                    <Users className="mx-auto h-12 w-12 text-zinc-600 mb-3" />
                    <p className="text-base font-medium">No performance data found</p>
                    <p className="text-sm mt-1">Try adjusting your search criteria</p>
                  </td>
                </tr>
              ) : sortedData.map((individual, index) => {
                const performanceLevel = getPerformanceLevel(individual.completionRate);
                return (
                  <tr key={individual.employeeId || individual.id || index} className="hover:bg-zinc-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {individual.rank <= 3 ? (
                          <span className="text-xl filter drop-shadow-md">
                            {individual.rank === 1 ? '🥇' : individual.rank === 2 ? '🥈' : '🥉'}
                          </span>
                        ) : (
                          <span className="w-6 h-6 flex items-center justify-center text-xs font-bold text-zinc-500 bg-zinc-800 rounded-full border border-zinc-700">
                            #{individual.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shadow-lg font-bold text-xs text-white ${index % 4 === 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                          index % 4 === 1 ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                            index % 4 === 2 ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                              'bg-gradient-to-br from-orange-500 to-red-600'
                          }`}>
                          {individual.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-zinc-200">{individual.name}</div>
                          <div className="text-xs text-zinc-500">{individual.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Zap className="w-3 h-3 text-yellow-500 mr-1.5" />
                        <span className="text-sm font-bold text-zinc-200">{(individual.totalPointsEarned || individual.totalPoints || 0).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-zinc-300">
                        <span className="font-medium text-white">{individual.completedTasks}</span>
                        <span className="text-zinc-500 mx-1">/</span>
                        {individual.totalTasks}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-zinc-700 rounded-full h-1.5 mr-3">
                          <div
                            className={`h-1.5 rounded-full ${individual.completionRate >= 80 ? 'bg-emerald-500' :
                              individual.completionRate >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                            style={{ width: `${Math.min(individual.completionRate, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-bold text-zinc-400">{individual.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${performanceLevel.color}`}>
                        {performanceLevel.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          onClick={() => handleViewDetails(individual)}
                          className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" 
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEmployeeToRemove(individual);
                            setShowRemoveConfirm(true);
                          }}
                          className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Remove Employee"
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Add Employee Modal */}
      {showAddEmployeeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-md w-full mx-4 shadow-2xl">
            <form onSubmit={handleAddEmployee}>
              <div className="p-6 border-b border-white/10">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-white">Add New Employee</h3>
                  <button
                    type="button"
                    onClick={() => setShowAddEmployeeModal(false)}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Employee ID</label>
                    <input
                      type="text"
                      value={newEmployee.employeeId}
                      onChange={(e) => setNewEmployee({ ...newEmployee, employeeId: e.target.value })}
                      className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 pt-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmployeeModal(false)}
                  className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-xl hover:bg-zinc-600 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 text-sm font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemoveConfirm && employeeToRemove && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-white/10 rounded-xl max-w-sm w-full mx-4 shadow-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Removal</h3>
            <p className="text-zinc-400 text-sm mb-6">
              Are you sure you want to remove <strong className="text-white">{employeeToRemove.name}</strong> from the performance system?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setEmployeeToRemove(null);
                }}
                className="px-4 py-2 bg-zinc-800/50 text-zinc-300 rounded-xl hover:bg-zinc-700/50 text-sm font-medium transition-colors border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveEmployee}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 text-sm font-medium transition-colors shadow-lg shadow-red-500/20"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance Detail Modal */}
      <PerformanceDetailModal
        employee={selectedEmployee}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedEmployee(null);
        }}
      />
    </div>
  );
};

export default HRPerformance;
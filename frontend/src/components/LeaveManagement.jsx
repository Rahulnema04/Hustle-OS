import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Eye,
  Filter,
  Download,
  Plus,
  BarChart3,
  AlertTriangle,
  Search
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveStats, setLeaveStats] = useState({});
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('requests'); // 'requests', 'balances', 'stats', 'myLeaves'
  const [filters, setFilters] = useState({
    status: 'all',
    leaveType: 'all',
    employee: 'all',
    dateRange: 'all'
  });
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchLeaveRequests();
    fetchPendingApprovals();
    fetchLeaveStats();
    fetchEmployees();
    if (user?.role === 'hr') {
      fetchMyLeaves();
      fetchMyLeaveBalance();
    }
  }, [filters, pagination.page]);

  useEffect(() => {
    if (currentView === 'balances') {
      fetchLeaveBalances();
    } else if (currentView === 'myLeaves' && user?.role === 'hr') {
      fetchMyLeaves();
      fetchMyLeaveBalance();
    }
  }, [currentView]);

  const fetchLeaveRequests = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        t: Date.now(), // Cache-busting timestamp
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.leaveType !== 'all' && { leaveType: filters.leaveType }),
        ...(filters.employee !== 'all' && { employee: filters.employee })
      });

      const response = await api.get(`/leave/requests?${queryParams}`);
      setLeaves(response.data.data.docs);
      setPagination(prev => ({
        ...prev,
        total: response.data.data.totalDocs,
        totalPages: response.data.data.totalPages
      }));
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      showToast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPendingApprovals = async () => {
    try {
      const timestamp = Date.now();
      const response = await api.get(`/leave/pending-approvals?t=${timestamp}`);
      setPendingApprovals(response.data.data);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    }
  };

  const fetchLeaveBalances = async () => {
    try {
      const response = await api.get('/users');
      const allEmployees = response.data.data.users || [];

      const balancesPromises = allEmployees.map(emp =>
        api.get(`/leave/balance/${emp._id}`).then(res => ({
          employee: emp,
          balance: res.data.data
        })).catch(() => ({ employee: emp, balance: null }))
      );

      const balancesData = await Promise.all(balancesPromises);
      setLeaveBalances(balancesData);
    } catch (error) {
      console.error('Error fetching leave balances:', error);
      showToast.error('Failed to fetch leave balances');
      setLeaveBalances([]); // Ensure it's an array even on error
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await api.get('/leave/stats');
      setLeaveStats(response.data.data);
    } catch (error) {
      console.error('Error fetching leave statistics:', error);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/users');
      setEmployees(response.data.data.users || []);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]); // Ensure employees remains an array even on error
    }
  };

  const fetchMyLeaves = async () => {
    try {
      const response = await api.get('/leave/my-leaves');
      setMyLeaves(response.data.data || []);
    } catch (error) {
      console.error('Error fetching my leaves:', error);
      setMyLeaves([]);
    }
  };

  const fetchMyLeaveBalance = async () => {
    try {
      const response = await api.get('/leave/my-balance');
      setMyLeaveBalance(response.data.data || {});
    } catch (error) {
      console.error('Error fetching my leave balance:', error);
      setMyLeaveBalance({});
    }
  };

  const handleApproval = async (leaveId, action, comments = '') => {
    try {
      await api.put(`/leave/approve/${leaveId}`, { action, comments });
      showToast.success(`Leave request ${action}d successfully`);
      fetchLeaveRequests();
      fetchPendingApprovals();
    } catch (error) {
      console.error(`Error ${action}ing leave:`, error);
      showToast.error(`Failed to ${action} leave request`);
    }
  };

  const handleBalanceUpdate = async (employeeId, leaveType, newAllocated) => {
    try {
      await api.put(`/leave/balance/${employeeId}`, {
        leaveType,
        allocated: newAllocated
      });
      showToast.success('Leave balance updated successfully');
      fetchLeaveBalances();
    } catch (error) {
      console.error('Error updating leave balance:', error);
      showToast.error('Failed to update leave balance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
      manager_approved: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      hr_approved: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      approved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      rejected: 'bg-red-500/10 text-red-400 border border-red-500/20',
      cancelled: 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30'
    };
    return colors[status] || colors.pending;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'bg-red-500/10 text-red-500 border border-red-500/20',
      casual: 'bg-blue-500/10 text-blue-500 border border-blue-500/20',
      vacation: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20',
      emergency: 'bg-orange-500/10 text-orange-500 border border-orange-500/20',
      maternity: 'bg-pink-500/10 text-pink-500 border border-pink-500/20',
      paternity: 'bg-purple-500/10 text-purple-500 border border-purple-500/20',
      compensatory: 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20'
    };
    return colors[type] || colors.casual;
  };

  const LeaveRequestsView = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-zinc-900/50 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="bg-black/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="manager_approved">Manager Approved</option>
            <option value="hr_approved">HR Approved</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.leaveType}
            onChange={(e) => setFilters({ ...filters, leaveType: e.target.value })}
            className="bg-black/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <option value="all">All Types</option>
            <option value="sick">Sick Leave</option>
            <option value="casual">Casual Leave</option>
            <option value="vacation">Vacation</option>
            <option value="emergency">Emergency</option>
            <option value="maternity">Maternity</option>
            <option value="paternity">Paternity</option>
          </select>

          <select
            value={filters.employee}
            onChange={(e) => setFilters({ ...filters, employee: e.target.value })}
            className="bg-black/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 hover:border-zinc-600 transition-colors"
          >
            <option value="all">All Employees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>

          <button
            onClick={() => setFilters({ status: 'all', leaveType: 'all', employee: 'all', dateRange: 'all' })}
            className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2.5 rounded-xl transition-colors border border-white/10"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Leave Requests Table */}
      <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl shadow-lg border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-zinc-900/50">
          <h3 className="text-lg font-bold text-white">Leave Requests</h3>
        </div>

        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-zinc-500">Loading leave requests...</p>
          </div>
        ) : leaves.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-zinc-700" />
            <p>No leave requests found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800/50">
              <thead className="bg-zinc-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Leave Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Applied Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {leaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {leave.employee.firstName} {leave.employee.lastName}
                        </div>
                        <div className="text-xs text-zinc-500">{leave.employee.role}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      <div>
                        {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                      </div>
                      <div className="text-xs text-zinc-600 font-medium">{leave.totalDays} days</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2.5 py-0.5 text-xs font-medium rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {formatDate(leave.appliedDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowLeaveDetails(true);
                        }}
                        className="text-blue-400 hover:text-white hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {leave.status === 'pending' || leave.status === 'manager_approved' ? (
                        <>
                          <button
                            onClick={() => handleApproval(leave._id, 'approve')}
                            className="text-emerald-400 hover:text-white hover:bg-emerald-500/20 p-2 rounded-lg transition-colors"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleApproval(leave._id, 'reject')}
                            className="text-red-400 hover:text-white hover:bg-red-500/20 p-2 rounded-lg transition-colors"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-white/5 bg-zinc-900/30 flex justify-between items-center">
            <div className="text-sm text-zinc-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page === pagination.totalPages}
                className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:bg-zinc-700 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const LeaveBalancesView = () => (
    <div className="space-y-6">
      <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl shadow-lg border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-zinc-900/50">
          <h3 className="text-lg font-bold text-white">Employee Leave Balances</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/50">
            <thead className="bg-zinc-900/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Sick Leave
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Casual Leave
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Vacation
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Total Used
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {leaveBalances.map(({ employee, balance }) => {
                const totalUsed = balance ?
                  Object.values(balance.balances).reduce((sum, b) => sum + b.used, 0) : 0;

                return (
                  <tr key={employee._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-xs text-zinc-500">{employee.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-white font-medium">
                        {balance ? `${balance.balances.sick.remaining}/${balance.balances.sick.allocated}` : 'N/A'}
                      </div>
                      <div className="text-xs text-zinc-600">Available/Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-white font-medium">
                        {balance ? `${balance.balances.casual.remaining}/${balance.balances.casual.allocated}` : 'N/A'}
                      </div>
                      <div className="text-xs text-zinc-600">Available/Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-white font-medium">
                        {balance ? `${balance.balances.vacation.remaining}/${balance.balances.vacation.allocated}` : 'N/A'}
                      </div>
                      <div className="text-xs text-zinc-600">Available/Total</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {totalUsed} days
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const LeaveStatsView = () => (
    <div className="space-y-6">
      {/* Stats Cards - Updated to CEO Dashboard Style */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium tracking-wide">Total Requests</p>
              <p className="text-3xl font-bold text-white mt-2 tracking-tight">{leaveStats.overview?.totalRequests || 0}</p>
            </div>
            <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium tracking-wide">Approved</p>
              <p className="text-3xl font-bold text-white mt-2 tracking-tight">{leaveStats.overview?.approvedRequests || 0}</p>
            </div>
            <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium tracking-wide">Pending</p>
              <p className="text-3xl font-bold text-white mt-2 tracking-tight">{leaveStats.overview?.pendingRequests || 0}</p>
            </div>
            <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
              <Clock className="h-6 w-6 text-amber-400" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-sm font-medium tracking-wide">Rejected</p>
              <p className="text-3xl font-bold text-white mt-2 tracking-tight">{leaveStats.overview?.rejectedRequests || 0}</p>
            </div>
            <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Leave Type Statistics */}
      <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl shadow-lg border border-white/5">
        <div className="p-6 border-b border-white/5 bg-zinc-900/50">
          <h3 className="text-lg font-bold text-white">Leave Type Statistics</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveStats.byLeaveType?.map((stat) => (
              <div key={stat._id} className="bg-zinc-900/50 p-6 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-sm font-medium text-zinc-400 capitalize">
                    {stat._id} Leave
                  </h4>
                  <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getLeaveTypeColor(stat._id)}`}>
                    {stat.count} requests
                  </span>
                </div>
                <p className="text-2xl font-bold text-white mt-1">
                  {stat.totalDays} days
                </p>
                <div className="text-xs text-zinc-500 mt-2 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 mr-2" />
                  Avg: {(stat.totalDays / stat.count || 0).toFixed(1)} days/request
                </div>
              </div>
            )) || (
                <div className="col-span-3 text-center text-zinc-500 py-12">
                  No leave statistics available
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );

  // MyLeavesView component for HR personal leave management
  const MyLeavesView = () => {
    const [showLeaveForm, setShowLeaveForm] = useState(false);
    const [leaveForm, setLeaveForm] = useState({
      leaveType: 'vacation',
      startDate: '',
      endDate: '',
      reason: '',
      handoverTo: '',
      documents: []
    });

    const handleSubmitLeave = async (e) => {
      e.preventDefault();
      try {
        // Prepare the request data (excluding documents for now)
        const requestData = {
          leaveType: leaveForm.leaveType,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          reason: leaveForm.reason,
          handoverTo: leaveForm.handoverTo || undefined
        };

        await api.post('/leave/request', requestData);

        showToast.success('Leave request submitted successfully');
        setShowLeaveForm(false);
        setLeaveForm({
          leaveType: 'vacation',
          startDate: '',
          endDate: '',
          reason: '',
          handoverTo: '',
          documents: []
        });
        fetchMyLeaves();
      } catch (error) {
        console.error('Error submitting leave request:', error);
        showToast.error('Failed to submit leave request');
      }
    };

    return (
      <div className="space-y-6">
        {/* Personal Leave Balance */}
        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl shadow-xl border border-white/5 p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <h3 className="text-xl font-bold text-white mb-6 relative z-10">My Leave Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative z-10">
            {myLeaveBalance && Object.entries(myLeaveBalance).filter(([key]) => key !== '_id' && key !== 'employee' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt').map(([leaveType, balance]) => (
              <div key={leaveType} className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-800 backdrop-blur-sm">
                <div className="text-sm font-medium text-zinc-400 capitalize mb-2">
                  {leaveType}
                </div>
                <div className="text-3xl font-bold text-white mb-1">
                  {balance?.allocated - balance?.used || 0}
                </div>
                <div className="text-xs text-zinc-500">
                  of {balance?.allocated || 0} days allocated
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Request New Leave Button */}
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">My Leave Requests</h3>
          <button
            onClick={() => setShowLeaveForm(true)}
            className="bg-zinc-100 text-black px-4 py-2.5 rounded-xl hover:bg-white transition-all flex items-center shadow-lg font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </button>
        </div>

        {/* Leave Requests List */}
        <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl shadow-lg border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-zinc-800/50">
              <thead className="bg-zinc-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Days
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    HR Approval
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Co-Founder Approval
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {myLeaves.map((leave) => (
                  <tr key={leave._id} className="hover:bg-zinc-900/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {leave.leaveType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                      {leave.totalDays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        leave.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.hrApproval?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        leave.hrApproval?.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                        {leave.hrApproval?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${leave.coFounderApproval?.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        leave.coFounderApproval?.status === 'rejected' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                        }`}>
                        {leave.coFounderApproval?.status || 'pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedLeave(leave);
                          setShowLeaveDetails(true);
                        }}
                        className="text-blue-400 hover:text-white hover:bg-blue-500/20 p-2 rounded-lg transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {myLeaves.length === 0 && (
              <div className="text-center py-12 text-zinc-500">
                No leave requests found
              </div>
            )}
          </div>
        </div>

        {/* Leave Request Form Modal */}
        {showLeaveForm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Request Leave</h3>
                  <button
                    onClick={() => setShowLeaveForm(false)}
                    className="text-zinc-500 hover:text-white transition-colors"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmitLeave} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Leave Type
                    </label>
                    <select
                      value={leaveForm.leaveType}
                      onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    >
                      <option value="vacation">Annual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="casual">Casual Leave</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.startDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={leaveForm.endDate}
                      onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Reason
                    </label>
                    <textarea
                      value={leaveForm.reason}
                      onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                      rows="3"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">
                      Handover To
                    </label>
                    <select
                      value={leaveForm.handoverTo}
                      onChange={(e) => setLeaveForm({ ...leaveForm, handoverTo: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-zinc-700 transition-colors"
                    >
                      <option value="">Select colleague (optional)</option>
                      {employees.filter(emp => emp._id !== user?._id).map(emp => (
                        <option key={emp._id} value={emp._id}>
                          {emp.firstName} {emp.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setShowLeaveForm(false)}
                      className="flex-1 bg-zinc-800 text-white py-2.5 px-4 rounded-xl hover:bg-zinc-700 transition-colors border border-white/5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-zinc-100 text-black font-semibold py-2.5 px-4 rounded-xl hover:bg-white transition-all shadow-lg"
                    >
                      Submit Request
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black p-6 space-y-6">
      {/* Header with Navigation */}
      <div className="bg-zinc-900/30 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/5">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white tracking-tight">Leave Management</h2>
          <div className="flex space-x-2">
            <button className="bg-zinc-800/80 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-700 transition-colors flex items-center border border-white/5">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-zinc-800/50">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setCurrentView('requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'requests'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Leave Requests
                {pendingApprovals.length > 0 && (
                  <span className="ml-1 bg-red-500/10 text-red-500 text-xs font-bold px-2 py-0.5 rounded-full border border-red-500/20">
                    {pendingApprovals.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setCurrentView('balances')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'balances'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Leave Balances
              </div>
            </button>
            <button
              onClick={() => setCurrentView('stats')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'stats'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Statistics
              </div>
            </button>
            {user?.role === 'hr' && (
              <button
                onClick={() => setCurrentView('myLeaves')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${currentView === 'myLeaves'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  My Leaves
                </div>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content based on current view */}
      {currentView === 'requests' && <LeaveRequestsView />}
      {currentView === 'balances' && <LeaveBalancesView />}
      {currentView === 'stats' && <LeaveStatsView />}
      {currentView === 'myLeaves' && <MyLeavesView />}

      {/* Leave Details Modal */}
      {showLeaveDetails && selectedLeave && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-zinc-950 border border-white/10 rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b border-white/5">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">Leave Request Details</h3>
                <button
                  onClick={() => setShowLeaveDetails(false)}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Employee</label>
                  <p className="text-white font-medium mt-1">
                    {selectedLeave.employee.firstName} {selectedLeave.employee.lastName}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Leave Type</label>
                  <p className="text-white capitalize mt-1">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Start Date</label>
                  <p className="text-white mt-1">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">End Date</label>
                  <p className="text-white mt-1">{formatDate(selectedLeave.endDate)}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Total Days</label>
                  <p className="text-white mt-1">{selectedLeave.totalDays} days</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</label>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(selectedLeave.status)}`}>
                      {selectedLeave.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Reason</label>
                <p className="text-zinc-300 mt-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.handoverDetails && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Handover Details</label>
                  <p className="text-zinc-300 mt-2 bg-zinc-900/50 p-4 rounded-xl border border-white/5">{selectedLeave.handoverDetails}</p>
                </div>
              )}

              {/* Approval Progress Timeline */}
              <div className="border-t border-white/5 pt-6 mt-6">
                <h4 className="text-sm font-bold text-white mb-4">Approval Progress</h4>
                <div className="space-y-4">
                  {/* Manager Approval */}
                  {(selectedLeave.managerApproval || ['individual', 'service-delivery', 'service-onboarding'].includes(selectedLeave.employee?.role)) && (
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${selectedLeave.managerApproval?.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
                        selectedLeave.managerApproval?.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-amber-500/10 border-amber-500/20'
                        }`}>
                        {selectedLeave.managerApproval?.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : selectedLeave.managerApproval?.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-white">Manager Approval</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {selectedLeave.managerApproval?.status === 'approved' && selectedLeave.managerApproval?.approvedAt
                            ? `Approved on ${formatDate(selectedLeave.managerApproval.approvedAt)}`
                            : selectedLeave.managerApproval?.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* HR Approval */}
                  <div className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${selectedLeave.hrApproval?.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      selectedLeave.hrApproval?.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                        'bg-amber-500/10 border-amber-500/20'
                      }`}>
                      {selectedLeave.hrApproval?.status === 'approved' ? (
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                      ) : selectedLeave.hrApproval?.status === 'rejected' ? (
                        <XCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Clock className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-sm font-medium text-white">HR Approval</p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {selectedLeave.hrApproval?.status === 'approved' && selectedLeave.hrApproval?.approvedAt
                          ? `Approved on ${formatDate(selectedLeave.hrApproval.approvedAt)}`
                          : selectedLeave.hrApproval?.status === 'rejected'
                            ? 'Rejected'
                            : 'Pending'}
                      </p>
                    </div>
                  </div>

                  {/* Cofounder Approval (only for manager/HR leaves) */}
                  {(selectedLeave.employee?.role === 'manager' || selectedLeave.employee?.role === 'hr') && (
                    <div className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${selectedLeave.coFounderApproval?.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20' :
                        selectedLeave.coFounderApproval?.status === 'rejected' ? 'bg-red-500/10 border-red-500/20' :
                          'bg-amber-500/10 border-amber-500/20'
                        }`}>
                        {selectedLeave.coFounderApproval?.status === 'approved' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : selectedLeave.coFounderApproval?.status === 'rejected' ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-amber-500" />
                        )}
                      </div>
                      <div className="ml-4 flex-1">
                        <p className="text-sm font-medium text-white">Co-Founder Approval</p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          {selectedLeave.coFounderApproval?.status === 'approved' && selectedLeave.coFounderApproval?.approvedAt
                            ? `Approved on ${formatDate(selectedLeave.coFounderApproval.approvedAt)}`
                            : selectedLeave.coFounderApproval?.status === 'rejected'
                              ? 'Rejected'
                              : 'Pending'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/20 flex justify-end space-x-3 rounded-b-2xl">
              {selectedLeave.status === 'pending' || selectedLeave.status === 'manager_approved' ? (
                <>
                  <button
                    onClick={() => {
                      handleApproval(selectedLeave._id, 'approve');
                      setShowLeaveDetails(false);
                    }}
                    className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20 font-medium"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleApproval(selectedLeave._id, 'reject');
                      setShowLeaveDetails(false);
                    }}
                    className="bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-500 transition-colors shadow-lg shadow-red-500/20 font-medium"
                  >
                    Reject
                  </button>
                </>
              ) : null}
              <button
                onClick={() => setShowLeaveDetails(false)}
                className="bg-zinc-800 text-white px-4 py-2.5 rounded-xl hover:bg-zinc-700 border border-white/5 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  FileText,
  Eye,
  Plus,
  XCircle,
  CheckCircle
} from 'lucide-react';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast } from '../utils/toast';

const EmployeeLeaveManagement = () => {
  const [myLeaves, setMyLeaves] = useState([]);
  const [myLeaveBalance, setMyLeaveBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showLeaveDetails, setShowLeaveDetails] = useState(false);

  // New leave request form
  const [leaveRequest, setLeaveRequest] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    handoverDetails: '',
    isHalfDay: false,
    halfDayPeriod: 'first-half'
  });

  useEffect(() => {
    fetchMyLeaves();
    fetchMyLeaveBalance();
  }, []);

  const fetchMyLeaves = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leave/requests');
      setMyLeaves(response.data.data.docs);
    } catch (error) {
      console.error('Error fetching my leaves:', error);
      showToast.error('Failed to fetch leave requests');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyLeaveBalance = async () => {
    try {
      const response = await api.get('/leave/balance');
      setMyLeaveBalance(response.data.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    }
  };

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave/request', leaveRequest);
      showToast.success('Leave request submitted successfully');
      setShowRequestModal(false);
      setLeaveRequest({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
        handoverDetails: '',
        isHalfDay: false,
        halfDayPeriod: 'first-half'
      });
      fetchMyLeaves();
      fetchMyLeaveBalance();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await api.put(`/leave/cancel/${leaveId}`);
      showToast.success('Leave request cancelled successfully');
      fetchMyLeaves();
      fetchMyLeaveBalance();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      showToast.error('Failed to cancel leave request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      manager_approved: 'bg-blue-100 text-blue-800',
      hr_approved: 'bg-indigo-100 text-indigo-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || colors.pending;
  };

  const getLeaveTypeColor = (type) => {
    const colors = {
      sick: 'bg-red-50 text-red-700',
      casual: 'bg-blue-50 text-blue-700',
      vacation: 'bg-green-50 text-green-700',
      emergency: 'bg-orange-50 text-orange-700',
      maternity: 'bg-pink-50 text-pink-700',
      paternity: 'bg-purple-50 text-purple-700',
      compensatory: 'bg-indigo-50 text-indigo-700'
    };
    return colors[type] || colors.casual;
  };

  const getStatusMessage = (status) => {
    const messages = {
      pending: 'Waiting for manager approval',
      manager_approved: 'Approved by manager, waiting for HR approval',
      hr_approved: 'Approved by HR, waiting for final approval',
      approved: 'Leave approved! Enjoy your time off.',
      rejected: 'Leave request was rejected',
      cancelled: 'Leave request was cancelled'
    };
    return messages[status] || 'Unknown status';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Leave Management</h2>
          <button
            onClick={() => setShowRequestModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </button>
        </div>
      </div>

      {/* Leave Balance Card */}
      {myLeaveBalance && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Leave Balance</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Casual Leave</div>
              <div className="text-2xl font-bold text-blue-900">
                {myLeaveBalance.balances.casual.remaining}
              </div>
              <div className="text-xs text-blue-600">
                of {myLeaveBalance.balances.casual.allocated} days available
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Vacation</div>
              <div className="text-2xl font-bold text-green-900">
                {myLeaveBalance.balances.vacation.remaining}
              </div>
              <div className="text-xs text-green-600">
                of {myLeaveBalance.balances.vacation.allocated} days available
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-sm text-red-600 font-medium">Sick Leave</div>
              <div className="text-2xl font-bold text-red-900">
                {myLeaveBalance.balances.sick.remaining}
              </div>
              <div className="text-xs text-red-600">
                of {myLeaveBalance.balances.sick.allocated} days available
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Compensatory</div>
              <div className="text-2xl font-bold text-purple-900">
                {myLeaveBalance.balances.compensatory.remaining}
              </div>
              <div className="text-xs text-purple-600">
                of {myLeaveBalance.balances.compensatory.allocated} days available
              </div>
            </div>
          </div>
        </div>
      )}

      {/* My Leave Requests */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">My Leave Requests</h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading leave requests...</p>
          </div>
        ) : myLeaves.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No leave requests found</p>
            <p className="text-sm mt-2">Click "Request Leave" to submit your first leave request</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {myLeaves.map((leave) => (
              <div key={leave._id} className="p-6 hover:bg-gray-50">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getLeaveTypeColor(leave.leaveType)}`}>
                        {leave.leaveType.charAt(0).toUpperCase() + leave.leaveType.slice(1)} Leave
                      </span>
                      <span className={`ml-3 inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(leave.status)}`}>
                        {leave.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Duration:</span> {formatDate(leave.startDate)} to {formatDate(leave.endDate)} ({leave.totalDays} days)
                    </div>

                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Reason:</span> {leave.reason}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      <span className="font-medium">Status:</span> {getStatusMessage(leave.status)}
                    </div>

                    <div className="text-xs text-gray-500">
                      Applied on: {formatDate(leave.appliedDate)}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => {
                        setSelectedLeave(leave);
                        setShowLeaveDetails(true);
                      }}
                      className="text-blue-600 hover:text-blue-900 p-2"
                      title="View Details"
                    >
                      <Eye className="h-5 w-5" />
                    </button>
                    {['pending', 'manager_approved'].includes(leave.status) && (
                      <button
                        onClick={() => handleCancelLeave(leave._id)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Cancel Request"
                      >
                        <XCircle className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Leave Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleLeaveRequest}>
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Request Leave</h3>
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Leave Type</label>
                    <select
                      value={leaveRequest.leaveType}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, leaveType: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    >
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="vacation">Vacation</option>
                      <option value="emergency">Emergency</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="compensatory">Compensatory Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <input
                        type="checkbox"
                        checked={leaveRequest.isHalfDay}
                        onChange={(e) => {
                          const isHalfDay = e.target.checked;
                          setLeaveRequest({
                            ...leaveRequest,
                            isHalfDay,
                            // Auto-set end date to start date when half-day is checked
                            endDate: isHalfDay ? leaveRequest.startDate : leaveRequest.endDate
                          });
                        }}
                        className="mr-2"
                      />
                      Half Day Leave
                    </label>
                    {leaveRequest.isHalfDay && (
                      <select
                        value={leaveRequest.halfDayPeriod}
                        onChange={(e) => setLeaveRequest({ ...leaveRequest, halfDayPeriod: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      >
                        <option value="first-half">First Half</option>
                        <option value="second-half">Second Half</option>
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={leaveRequest.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        setLeaveRequest({
                          ...leaveRequest,
                          startDate,
                          // Auto-update end date if half-day is selected
                          endDate: leaveRequest.isHalfDay ? startDate : leaveRequest.endDate
                        });
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {leaveRequest.isHalfDay ? 'End Date (same as start date for half day)' : 'End Date'}
                    </label>
                    <input
                      type="date"
                      value={leaveRequest.endDate}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      disabled={leaveRequest.isHalfDay}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
                  <textarea
                    value={leaveRequest.reason}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder="Please provide a reason for your leave request"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Handover Details (Optional)</label>
                  <textarea
                    value={leaveRequest.handoverDetails}
                    onChange={(e) => setLeaveRequest({ ...leaveRequest, handoverDetails: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 h-24"
                    placeholder="Describe any work handover arrangements or important tasks"
                  />
                </div>

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Emergency Contact (Optional)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={leaveRequest.emergencyContact.name}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, name: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="tel"
                      placeholder="Phone Number"
                      value={leaveRequest.emergencyContact.phone}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, phone: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={leaveRequest.emergencyContact.relationship}
                      onChange={(e) => setLeaveRequest({
                        ...leaveRequest,
                        emergencyContact: { ...leaveRequest.emergencyContact, relationship: e.target.value }
                      })}
                      className="border border-gray-300 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Leave Details Modal */}
      {showLeaveDetails && selectedLeave && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Leave Request Details</h3>
                <button
                  onClick={() => setShowLeaveDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Leave Type</label>
                  <p className="text-gray-900 capitalize">{selectedLeave.leaveType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Total Days</label>
                  <p className="text-gray-900">{selectedLeave.totalDays} days</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Start Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.startDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">End Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.endDate)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLeave.status)}`}>
                    {selectedLeave.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Applied Date</label>
                  <p className="text-gray-900">{formatDate(selectedLeave.appliedDate)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Reason</label>
                <p className="text-gray-900 mt-1">{selectedLeave.reason}</p>
              </div>

              {selectedLeave.handoverDetails && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Handover Details</label>
                  <p className="text-gray-900 mt-1">{selectedLeave.handoverDetails}</p>
                </div>
              )}

              {/* Approval Status */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Approval Status</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Manager Approval</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${selectedLeave.managerApproval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedLeave.managerApproval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {selectedLeave.managerApproval.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>HR Approval</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${selectedLeave.hrApproval.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedLeave.hrApproval.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                      }`}>
                      {selectedLeave.hrApproval.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              {['pending', 'manager_approved'].includes(selectedLeave.status) && (
                <button
                  onClick={() => {
                    handleCancelLeave(selectedLeave._id);
                    setShowLeaveDetails(false);
                  }}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Cancel Request
                </button>
              )}
              <button
                onClick={() => setShowLeaveDetails(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
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

export default EmployeeLeaveManagement;
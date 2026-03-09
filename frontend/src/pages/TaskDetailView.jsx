import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, User, FileText, Image, Video, Link, Download, CheckCircle, AlertCircle, X, Clock, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const TaskDetailView = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pointsToAward, setPointsToAward] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  // Helper function to get user's full name
  const getUserName = (user) => {
    if (!user) return 'Unknown User';
    return user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || 'Unknown User';
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [taskId]);

  const fetchTaskDetails = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/details`);
      const taskData = response.data.data || response.data;
      console.log('Task data loaded:', taskData); // Temporary debug log
      console.log('Task evidence:', taskData.evidence); // Temporary debug log
      console.log('Task statusHistory:', taskData.statusHistory); // Temporary debug log
      setTask(taskData);
      setPointsToAward(taskData.points || '');
    } catch (error) {
      console.error('Error fetching task details:', error);
      showToast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!pointsToAward || pointsToAward <= 0) {
      showToast.error('Please enter valid points to award');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.patch(`/tasks/${taskId}/manager-complete`, {
        pointsAwarded: parseInt(pointsToAward)
      });
      
      setTask(response.data);
      showToast.success(`Task completed and ${pointsToAward} points awarded to ${getUserName(task.assignedTo)}`);
      
      // Navigate back to dashboard immediately
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing task:', error);
      showToast.error('Failed to complete task');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionFeedback.trim()) {
      showToast.error('Please provide feedback for the revision request');
      return;
    }

    setSubmitting(true);
    try {
      const requestData = {
        feedback: revisionFeedback.trim()
      };

      if (newDeadline) {
        requestData.newDeadline = newDeadline;
      }

      const response = await api.patch(`/tasks/${taskId}/request-revision`, requestData);
      
      setTask(response.data.data);
      showToast.success('Revision requested successfully. The individual has been notified.');
      
      // Close modal and reset form
      setShowRevisionModal(false);
      setRevisionFeedback('');
      setNewDeadline('');
      
      // Navigate back to dashboard immediately
      navigate('/dashboard');
    } catch (error) {
      console.error('Error requesting revision:', error);
      showToast.error(error.response?.data?.message || 'Failed to request revision');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      'not-started': 'bg-gray-100 text-gray-800',
      'in-progress': 'bg-blue-100 text-blue-800',
      'review': 'bg-yellow-100 text-yellow-800',
      'completed': 'bg-green-100 text-green-800',
      'cant-complete': 'bg-red-100 text-red-800',
      'needs-revision': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderEvidence = (task) => {
    // Check both evidence field and statusHistory for evidence
    let evidence = task.evidence;
    
    // If no evidence in main field, check latest statusHistory entry with evidence
    if ((!evidence || (!evidence.files?.length && !evidence.urls?.length)) && task.statusHistory?.length > 0) {
      // Find the most recent status entry that has evidence
      for (let i = task.statusHistory.length - 1; i >= 0; i--) {
        const statusEntry = task.statusHistory[i];
        if (statusEntry.evidence && (statusEntry.evidence.files?.length > 0 || statusEntry.evidence.urls?.length > 0)) {
          evidence = statusEntry.evidence;
          break;
        }
      }
    }

    if (!evidence) {
      return <p className="text-gray-500 italic">No evidence submitted</p>;
    }

    const evidenceItems = [];
    
    // Handle files
    if (evidence.files && evidence.files.length > 0) {
      const baseURL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://193.203.160.42:9000';
      evidence.files.forEach((file, index) => {
        evidenceItems.push({
          type: file.mimetype?.startsWith('image/') ? 'image' : 
                file.mimetype?.startsWith('video/') ? 'video' : 'document',
          filename: file.originalName || file.filename,
          url: `${baseURL}/uploads/screenshots/${file.filename}`,
          uploadedAt: evidence.submittedAt,
          description: evidence.description
        });
      });
    }
    
    // Handle URLs
    if (evidence.urls && evidence.urls.length > 0) {
      evidence.urls.forEach((url, index) => {
        evidenceItems.push({
          type: 'url',
          url: url,
          uploadedAt: evidence.submittedAt,
          description: evidence.description
        });
      });
    }
    
    if (evidenceItems.length === 0) {
      return <p className="text-gray-500 italic">No evidence submitted</p>;
    }

    return (
      <div className="space-y-4">
        {evidenceItems.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {item.type === 'image' && <Image className="w-5 h-5 text-blue-500" />}
                {item.type === 'video' && <Video className="w-5 h-5 text-purple-500" />}
                {item.type === 'url' && <Link className="w-5 h-5 text-green-500" />}
                {item.type === 'document' && <FileText className="w-5 h-5 text-red-500" />}
                <span className="font-medium capitalize">{item.type}</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(item.uploadedAt)}
              </span>
            </div>
            
            {item.type === 'url' ? (
              <div>
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {item.url}
                </a>
                {item.description && (
                  <p className="mt-2 text-gray-600">{item.description}</p>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">{item.filename}</span>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800"
                  >
                    <Download className="w-4 h-4" />
                    <span>View</span>
                  </a>
                </div>
                {item.description && (
                  <p className="mt-2 text-gray-600">{item.description}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Task not found</p>
          <button
            onClick={() => navigate('/manager-dashboard')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-cyan-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Back Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center px-4 py-2 bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg shadow-sm border border-gray-200 transition-all duration-200 font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span>Back to Dashboard</span>
          </button>
        </div>

        {/* Status Badge Section */}
        <div className="flex items-center justify-between mb-6 bg-white rounded-lg shadow-md border border-blue-100 px-6 py-4">
          <h2 className="text-xl font-bold text-gray-800">Task Review</h2>
          <div className="flex items-center space-x-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${getStatusBadgeColor(task.status)}`}>
              {task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('-', ' ') : 'Unknown'}
            </span>
            {task.status === 'completed' && (
              <span className="flex items-center text-green-600 font-semibold">
                <CheckCircle className="w-5 h-5 mr-1" />
                Completed
              </span>
            )}
          </div>
        </div>

        {/* Task Details Card */}
        <div className={`bg-white rounded-xl shadow-lg border overflow-hidden ${task.source === 'cofounder_rag' ? 'border-purple-300 ring-2 ring-purple-200' : 'border-blue-100'}`}>
          <div className={`px-6 py-5 border-b ${task.source === 'cofounder_rag' ? 'bg-gradient-to-r from-purple-600 to-purple-500 border-purple-200' : 'bg-gradient-to-r from-blue-500 to-cyan-500 border-blue-200'}`}>
            {task.source === 'cofounder_rag' && (
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                <span className="text-sm font-bold text-yellow-100 uppercase tracking-wide">
                  Executive Priority Task
                </span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-white drop-shadow-sm">{task.title}</h1>
            {task.description && (
              <p className="mt-2 text-blue-50">{task.description}</p>
            )}
          </div>

          <div className="px-6 py-6 space-y-6 bg-gradient-to-b from-white to-blue-50">
            {/* Task Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Assigned to</p>
                    <p className="font-semibold text-gray-900">{getUserName(task.assignedTo)}</p>
                    <p className="text-sm text-gray-600">{task.assignedTo.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Due Date</p>
                    <p className="font-semibold text-gray-900">
                      {task.deadline ? formatDate(task.deadline) : 'No due date'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-white rounded-lg p-4 border border-blue-100 shadow-sm">
                <div>
                  <p className="text-sm text-gray-500 font-medium">Created</p>
                  <p className="font-semibold text-gray-900">{formatDate(task.createdAt)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 font-medium">Last Updated</p>
                  <p className="font-semibold text-gray-900">{formatDate(task.updatedAt)}</p>
                </div>

                {task.acceptedAt && (
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Accepted</p>
                    <p className="font-semibold text-gray-900">{formatDate(task.acceptedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Evidence Section */}
            <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Submitted Evidence
                </h3>
              </div>
              <div className="p-4">
                {renderEvidence(task)}
              </div>
            </div>

            {/* Revision History */}
            {task.revisionHistory && task.revisionHistory.length > 0 && (
              <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Revision History
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {task.revisionHistory.map((revision, index) => (
                    <div key={index} className="border border-blue-100 rounded-lg p-4 bg-gradient-to-r from-white to-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 text-xs rounded-full font-medium shadow-sm ${
                            revision.isResolved 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : 'bg-orange-100 text-orange-700 border border-orange-200'
                          }`}>
                            {revision.isResolved ? 'Resolved' : 'Pending'}
                          </span>
                          <span className="text-sm font-semibold text-gray-900">
                            Revision #{task.revisionHistory.length - index}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          {formatDate(revision.requestedAt)}
                        </span>
                      </div>
                      
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-gray-700">Feedback:</p>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{revision.feedback}</p>
                      </div>
                      
                      {revision.newDeadline && (
                        <div className="mb-2">
                          <p className="text-sm font-semibold text-gray-700">New Deadline:</p>
                          <p className="text-sm text-gray-600">{formatDate(revision.newDeadline)}</p>
                        </div>
                      )}
                      
                      {revision.resolvedAt && (
                        <div>
                          <p className="text-sm font-semibold text-gray-700">Resolved At:</p>
                          <p className="text-sm text-gray-600">{formatDate(revision.resolvedAt)}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manager Actions */}
            {task.status === 'review' && (user?.role === 'manager' || user?.role === 'ceo' || user?.role === 'hr') && (
              <div className="bg-white rounded-lg border border-blue-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-blue-600" />
                    Manager Actions
                  </h3>
                </div>
                <div className="p-6 bg-gradient-to-b from-white to-blue-50">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Points to Award
                      </label>
                      <input
                        type="number"
                        value={pointsToAward}
                        onChange={(e) => setPointsToAward(e.target.value)}
                        min="1"
                        max="1000"
                        className="w-40 px-4 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                        placeholder="Enter points"
                      />
                      <p className="mt-2 text-sm text-gray-600">
                        Points will be added to <span className="font-medium text-gray-900">{getUserName(task.assignedTo)}'s</span> account
                      </p>
                    </div>

                    <div className="flex space-x-3 pt-2">
                      <button
                        onClick={handleCompleteTask}
                        disabled={submitting || !pointsToAward}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200 font-medium"
                      >
                        {submitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Completing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Complete Task & Award Points
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setShowRevisionModal(true)}
                        disabled={submitting}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all duration-200 font-medium"
                      >
                        <AlertCircle className="w-5 h-5 mr-2" />
                        Request Changes
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Needs Revision Status */}
            {task.status === 'needs-revision' && (
              <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-5 border border-orange-200 shadow-sm">
                <div className="flex items-start">
                  <div className="p-2 bg-orange-200 rounded-full mr-3">
                    <AlertCircle className="w-6 h-6 text-orange-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 text-lg">
                      Changes Requested
                    </p>
                    <p className="text-sm text-orange-700 mt-1">
                      The individual has been notified and needs to address the feedback provided.
                    </p>
                    {task.revisionDeadline && (
                      <p className="text-sm text-orange-700 mt-1 font-medium">
                        Revision deadline: {formatDate(task.revisionDeadline)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Already Completed */}
            {task.status === 'completed' && task.completedByManager && (
              <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-5 border border-green-200 shadow-sm">
                <div className="flex items-start">
                  <div className="p-2 bg-green-200 rounded-full mr-3">
                    <CheckCircle className="w-6 h-6 text-green-700" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 text-lg">
                      Task Completed by Manager
                    </p>
                    <p className="text-sm text-green-700 mt-1 font-medium">
                      {task.pointsAwarded} points awarded to {getUserName(task.assignedTo)}
                    </p>
                    <p className="text-sm text-green-700 mt-1">
                      Completed on {formatDate(task.completedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Revision Request Modal */}
      {showRevisionModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Request Changes</h3>
                  <button
                    onClick={() => setShowRevisionModal(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Feedback for {getUserName(task.assignedTo)} *
                    </label>
                    <textarea
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                      placeholder="Explain what needs to be improved or changed..."
                      required
                    />
                    <p className="mt-2 text-xs text-gray-600">
                      Be specific about what needs improvement and provide clear instructions.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      New Deadline (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                    />
                    <p className="mt-2 text-xs text-gray-600">
                      Leave empty to keep the current deadline.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-6 py-4 sm:flex sm:flex-row-reverse gap-3">
                <button
                  onClick={handleRequestRevision}
                  disabled={submitting || !revisionFeedback.trim()}
                  className="w-full inline-flex justify-center items-center rounded-lg border border-transparent shadow-md px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-base font-medium text-white hover:from-orange-700 hover:to-orange-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Revision Request'
                  )}
                </button>
                <button
                  onClick={() => setShowRevisionModal(false)}
                  disabled={submitting}
                  className="mt-3 w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-6 py-3 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailView;
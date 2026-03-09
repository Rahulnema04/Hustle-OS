import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckSquare,
  CheckCircle, 
  Clock, 
  Calendar, 
  User,
  Target,
  AlertCircle,
  Eye,
  Upload,
  Link,
  Image,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Search
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import TaskStatusDropdown from '../components/TaskStatusDropdown';
import TaskEvidenceModal from '../components/TaskEvidenceModal';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { showToast as toast } from '../utils/toast';

const MyTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal states
  const [showCheckpointModal, setShowCheckpointModal] = useState(false);
  const [selectedCheckpoint, setSelectedCheckpoint] = useState(null);
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  
  // Task evidence modal states
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  
  // Checkpoint form state
  const [checkpointEvidence, setCheckpointEvidence] = useState({
    verificationUrl: '',
    verificationMethod: 'url',
    screenshot: null,
    caption: ''
  });
  
  // Preview state for uploaded images
  const [previewUrl, setPreviewUrl] = useState(null);

  // Fetch tasks on component mount
  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      try {
        const tasksRes = await api.get('/tasks/assigned');
        setTasks(tasksRes.data.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTasks();
  }, []);

  // Handle input change for checkpoint evidence
  const handleEvidenceInputChange = (e) => {
    const { name, value } = e.target;
    setCheckpointEvidence({ ...checkpointEvidence, [name]: value });
  };
  
  // Handle screenshot file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCheckpointEvidence({ 
        ...checkpointEvidence, 
        screenshot: file,
        verificationMethod: 'screenshot'
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Clear file preview and selection
  const clearFileSelection = () => {
    setCheckpointEvidence({ 
      ...checkpointEvidence, 
      screenshot: null 
    });
    setPreviewUrl(null);
  };
  
  // Submit checkpoint evidence
  const handleSubmitEvidence = async (e) => {
    e.preventDefault();
    
    if (!selectedCheckpoint) return;
    
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('checkpointId', selectedCheckpoint._id);
      formData.append('verificationMethod', checkpointEvidence.verificationMethod);
      
      if (checkpointEvidence.verificationMethod === 'url') {
        formData.append('verificationUrl', checkpointEvidence.verificationUrl);
      } else if (checkpointEvidence.verificationMethod === 'screenshot' && checkpointEvidence.screenshot) {
        formData.append('screenshot', checkpointEvidence.screenshot);
        formData.append('caption', checkpointEvidence.caption);
      }
      
      // Submit checkpoint completion
      const res = await api.post('/checkpoints/complete', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update task in state
      const updatedTasks = tasks.map(task => {
        if (task.checkpoints && task.checkpoints.some(cp => cp._id === selectedCheckpoint._id)) {
          const updatedCheckpoints = task.checkpoints.map(cp => 
            cp._id === selectedCheckpoint._id 
              ? { ...cp, isCompleted: true, ...res.data.data }
              : cp
          );
          return { ...task, checkpoints: updatedCheckpoints };
        }
        return task;
      });
      
      setTasks(updatedTasks);
      
      // Reset form and close modal
      setCheckpointEvidence({
        verificationUrl: '',
        verificationMethod: 'url',
        screenshot: null,
        caption: ''
      });
      setPreviewUrl(null);
      setShowCheckpointModal(false);
      setSelectedCheckpoint(null);
      
      toast.success('Checkpoint completed successfully');
    } catch (err) {
      console.error('Error completing checkpoint:', err);
      setError('Failed to complete checkpoint. Please try again.');
      toast.error('Failed to complete checkpoint');
    }
  };
  
  // Toggle task details expansion
  const toggleTaskExpand = (taskId) => {
    if (expandedTaskId === taskId) {
      setExpandedTaskId(null);
    } else {
      setExpandedTaskId(taskId);
    }
  };

  // Handle evidence requirement for status changes
  const handleEvidenceRequired = (newStatus, task) => {
    setSelectedTask(task);
    setPendingStatus(newStatus);
    setShowEvidenceModal(true);
  };

  // Handle direct status changes (no evidence required)
  const handleDirectStatusChange = async (taskId, newStatus) => {
    try {
      console.log('Updating task status:', { taskId, newStatus });
      
      let res;
      if (newStatus === 'accept') {
        // Use the accept endpoint for accepting tasks
        res = await api.patch(`/tasks/${taskId}/accept`);
      } else {
        // Use the status endpoint for other status changes
        res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      }
      
      // Update task status in state
      const updatedTasks = tasks.map(task => 
        task._id === taskId 
          ? { 
              ...task, 
              status: newStatus === 'accept' ? 'in-progress' : newStatus, 
              updatedAt: new Date(),
              ...(newStatus === 'accept' ? { acceptedAt: new Date() } : {})
            }
          : task
      );
      
      setTasks(updatedTasks);
      const statusLabel = newStatus === 'accept' ? 'accepted' : newStatus.replace('-', ' ');
      toast.success(`Task ${statusLabel} successfully`);
    } catch (err) {
      console.error('Error updating task status:', err);
      console.error('Error details:', err.response?.data);
      toast.error('Failed to update task status');
    }
  };

  // Submit evidence with status change
  const handleTaskEvidenceSubmit = async (formData) => {
    try {
      const res = await api.post('/tasks/update-with-evidence', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update task in state
      const updatedTasks = tasks.map(task => 
        task._id === selectedTask._id 
          ? { ...task, ...res.data.data }
          : task
      );
      
      setTasks(updatedTasks);
      
      const statusLabel = pendingStatus === 'accept' ? 'accepted' : pendingStatus;
      toast.success(`Task ${statusLabel} successfully with evidence!`);
      
    } catch (err) {
      console.error('Error submitting evidence:', err);
      toast.error('Failed to submit evidence');
      throw err;
    }
  };

  // Accept a task
  const handleAcceptTask = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/accept`);
      
      // Update task status in state
      const updatedTasks = tasks.map(task => 
        task._id === taskId 
          ? { ...task, status: 'in-progress', acceptedAt: new Date() }
          : task
      );
      
      setTasks(updatedTasks);
      toast.success('Task accepted successfully');
    } catch (err) {
      console.error('Error accepting task:', err);
      toast.error('Failed to accept task');
    }
  };

  // Update task status
  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      
      // Update task status in state
      const updatedTasks = tasks.map(task => 
        task._id === taskId 
          ? { ...task, status: newStatus }
          : task
      );
      
      setTasks(updatedTasks);
      toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
    } catch (err) {
      console.error('Error updating task status:', err);
      toast.error('Failed to update task status');
    }
  };

  // Mark task as completed
  const handleCompleteTask = async (taskId) => {
    try {
      console.log('Starting task completion for taskId:', taskId);
      
      // Try force complete first
      const res = await api.patch(`/tasks/${taskId}/force-complete`);
      console.log('Task completion response:', res.data);
      
      if (res.data.success) {
        // Update task status in state using the response data
        const updatedTask = res.data.data; // Get the task from the response
        console.log('Updated task from server:', updatedTask);
        
        const updatedTasks = tasks.map(task => 
          task._id === taskId ? updatedTask : task
        );
        
        console.log('Updated tasks array:', updatedTasks.find(t => t._id === taskId));
        setTasks(updatedTasks);
        toast.success('Task completed successfully!');
        
        // Refresh data to ensure consistency
        setTimeout(() => {
          console.log('Refreshing task data...');
          // Re-fetch tasks to ensure data consistency
          window.location.reload();
        }, 1000);
      }
    } catch (err) {
      console.error('Error completing task:', err);
      toast.error('Failed to complete task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle resubmission after revision
  const handleResubmitTask = async (taskId) => {
    try {
      const response = await api.patch(`/tasks/${taskId}/resolve-revision`);
      
      // Update the task in local state
      setTasks(tasks.map(task => 
        task._id === taskId 
          ? { ...task, status: 'review', revisionRequired: false }
          : task
      ));
      
      toast.success('Task resubmitted for review successfully');
    } catch (err) {
      console.error('Error resubmitting task:', err);
      toast.error('Failed to resubmit task: ' + (err.response?.data?.message || err.message));
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'assigned':
        return 'bg-gray-100 text-gray-800';
      case 'not-started':
        return 'bg-gray-100 text-gray-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cant-complete':
        return 'bg-red-100 text-red-800';
      case 'review':
        return 'bg-amber-100 text-amber-800';
      case 'needs-revision':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get priority badge color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Format deadline with color based on proximity
  const formatDeadline = (deadline) => {
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntil = Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
    
    let colorClass = 'text-gray-600';
    if (daysUntil < 0) {
      colorClass = 'text-red-600 font-medium';
    } else if (daysUntil <= 3) {
      colorClass = 'text-amber-600 font-medium';
    } else if (daysUntil <= 7) {
      colorClass = 'text-orange-500';
    }
    
    return <span className={colorClass}>{formatDate(deadline)}</span>;
  };

  // Filter tasks based on search and status
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.project?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const taskStats = {
    total: tasks.length,
    assigned: tasks.filter(t => t.status === 'assigned').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    review: tasks.filter(t => t.status === 'review').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              <p className="text-gray-600 mt-1">Manage and track your assigned tasks</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary-600">{tasks.length}</div>
              <div className="text-sm text-gray-500">Total Tasks</div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Assigned', value: taskStats.assigned, color: 'bg-gray-100 text-gray-800' },
            { label: 'In Progress', value: taskStats.inProgress, color: 'bg-blue-100 text-blue-800' },
            { label: 'Review', value: taskStats.review, color: 'bg-amber-100 text-amber-800' },
            { label: 'Completed', value: taskStats.completed, color: 'bg-green-100 text-green-800' },
            { label: 'Blocked', value: taskStats.blocked, color: 'bg-red-100 text-red-800' },
            { label: 'Total', value: taskStats.total, color: 'bg-primary-100 text-primary-800' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${stat.color} mb-2`}>
                {stat.label}
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">All Status</option>
                <option value="assigned">Assigned</option>
                <option value="in-progress">In Progress</option>
                <option value="review">Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-t-primary-500 border-r-primary-500 border-b-transparent border-l-transparent"></div>
              <p className="mt-2 text-gray-500">Loading tasks...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2" />
              <p>{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-2 text-primary-600 hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-12 text-center">
              <CheckSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <h3 className="text-gray-500 text-lg font-medium mb-1">
                {searchTerm || statusFilter !== 'all' ? 'No tasks match your filters' : 'No tasks assigned yet'}
              </h3>
              <p className="text-gray-400">
                {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Tasks will appear here once they are assigned to you'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTasks.map((task) => (
                <div key={task._id} className="p-4">
                  <div 
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-2 rounded-md"
                    onClick={() => toggleTaskExpand(task._id)}
                  >
                    <div className="flex items-center flex-1">
                      <div className={`h-3 w-3 rounded-full mr-3 ${
                        task.status === 'completed' ? 'bg-green-500' :
                        task.status === 'in-progress' ? 'bg-blue-500' :
                        task.status === 'blocked' ? 'bg-red-500' :
                        task.status === 'review' ? 'bg-amber-500' :
                        task.status === 'needs-revision' ? 'bg-orange-500' :
                        'bg-gray-300'
                      }`}></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">{task.title}</h3>
                          <div className="flex items-center space-x-2 ml-4">
                            <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority?.charAt(0).toUpperCase() + task.priority?.slice(1)}
                            </span>
                            <TaskStatusDropdown 
                              task={task}
                              onStatusChange={handleDirectStatusChange}
                              onEvidenceRequired={handleEvidenceRequired}
                            />
                          </div>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <span className="truncate">Project: {task.project?.name}</span>
                          <span className="mx-2">•</span>
                          <span>Points: {task.points}</span>
                          <span className="mx-2">•</span>
                          <span>Due: {formatDeadline(task.deadline)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      {expandedTaskId === task._id ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
                    </div>
                  </div>
                  
                  {expandedTaskId === task._id && (
                    <div className="mt-4 pl-6 space-y-4">
                      {/* Description */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                        <p className="text-sm text-gray-600">{task.description}</p>
                      </div>
                      
                      {/* Assigned By */}
                      {task.assignedBy && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned By</h4>
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs">
                              {task.assignedBy.firstName?.[0]}{task.assignedBy.lastName?.[0]}
                            </div>
                            <span className="ml-2 text-sm text-gray-600">
                              {task.assignedBy.firstName} {task.assignedBy.lastName}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Revision Feedback */}
                      {task.status === 'needs-revision' && task.revisionHistory && task.revisionHistory.length > 0 && (
                        <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                          <div className="flex items-center mb-3">
                            <AlertCircle className="h-5 w-5 text-orange-500 mr-2" />
                            <h4 className="text-sm font-medium text-orange-800">Changes Requested</h4>
                          </div>
                          
                          {/* Latest revision feedback */}
                          {(() => {
                            const latestRevision = task.revisionHistory[task.revisionHistory.length - 1];
                            return (
                              <div className="space-y-2">
                                <div>
                                  <p className="text-sm font-medium text-orange-700">Manager Feedback:</p>
                                  <p className="text-sm text-orange-600 mt-1">{latestRevision.feedback}</p>
                                </div>
                                
                                {latestRevision.newDeadline && (
                                  <div>
                                    <p className="text-sm font-medium text-orange-700">New Deadline:</p>
                                    <p className="text-sm text-orange-600">{formatDate(latestRevision.newDeadline)}</p>
                                  </div>
                                )}
                                
                                <div className="pt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResubmitTask(task._id);
                                    }}
                                    className="inline-flex items-center px-3 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 text-sm"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark as Addressed & Resubmit
                                  </button>
                                  <p className="text-xs text-orange-600 mt-1">
                                    Click this when you've addressed all the feedback and want to resubmit for review.
                                  </p>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Checkpoints */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Checkpoints</h4>
                        
                        {task.checkpoints && task.checkpoints.length > 0 ? (
                          <div className="space-y-2">
                            {task.checkpoints.map((checkpoint) => (
                              <div key={checkpoint._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                <div className="flex items-center">
                                  <div className={`h-4 w-4 mr-3 rounded-full flex items-center justify-center ${
                                    checkpoint.isCompleted ? 'bg-green-500' : 'bg-gray-300'
                                  }`}>
                                    {checkpoint.isCompleted && <CheckCircle className="h-3 w-3 text-white" />}
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-700">{checkpoint.title}</span>
                                    {checkpoint.description && (
                                      <p className="text-xs text-gray-500 mt-1">{checkpoint.description}</p>
                                    )}
                                    {checkpoint.isCompleted && checkpoint.completedAt && (
                                      <p className="text-xs text-green-600 mt-1">
                                        Completed on {formatDate(checkpoint.completedAt)}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {!checkpoint.isCompleted && task.status !== 'completed' && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedCheckpoint(checkpoint);
                                      setShowCheckpointModal(true);
                                    }}
                                    className="px-3 py-1 bg-primary-100 text-primary-600 rounded-md hover:bg-primary-200 text-xs flex items-center"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Complete
                                  </button>
                                )}
                                {checkpoint.isCompleted && (
                                  <span className="text-xs text-green-600 font-medium flex items-center">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Completed
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No checkpoints for this task</p>
                        )}
                      </div>
                      
                      {/* Task Actions - Now handled by status dropdown */}
                      <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                        <div className="text-sm text-gray-500">
                          Use the status dropdown above to update task progress
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Complete Checkpoint Modal */}
      {showCheckpointModal && selectedCheckpoint && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <form onSubmit={handleSubmitEvidence}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Complete Checkpoint</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Checkpoint: {selectedCheckpoint.title}</h4>
                    {selectedCheckpoint.description && (
                      <p className="text-sm text-gray-600 mb-4">{selectedCheckpoint.description}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="url"
                          checked={checkpointEvidence.verificationMethod === 'url'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        URL Link
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="verificationMethod"
                          value="screenshot"
                          checked={checkpointEvidence.verificationMethod === 'screenshot'}
                          onChange={handleEvidenceInputChange}
                          className="mr-2"
                        />
                        Screenshot
                      </label>
                    </div>
                  </div>
                  
                  {checkpointEvidence.verificationMethod === 'url' ? (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Verification URL
                      </label>
                      <div className="relative">
                        <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="url"
                          name="verificationUrl"
                          value={checkpointEvidence.verificationUrl}
                          onChange={handleEvidenceInputChange}
                          placeholder="https://example.com/proof"
                          className="pl-10 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          required
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload Screenshot
                      </label>
                      
                      {!previewUrl ? (
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                          <div className="space-y-1 text-center">
                            <Image className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                                <span>Upload a file</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleFileChange}
                                  className="sr-only"
                                />
                              </label>
                              <p className="pl-1">or drag and drop</p>
                            </div>
                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <img src={previewUrl} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                          <button
                            type="button"
                            onClick={clearFileSelection}
                            className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {previewUrl && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Caption (Optional)
                          </label>
                          <textarea
                            name="caption"
                            value={checkpointEvidence.caption}
                            onChange={handleEvidenceInputChange}
                            rows={2}
                            placeholder="Describe what this screenshot shows..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={
                      (checkpointEvidence.verificationMethod === 'url' && !checkpointEvidence.verificationUrl) ||
                      (checkpointEvidence.verificationMethod === 'screenshot' && !checkpointEvidence.screenshot)
                    }
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Checkpoint
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCheckpointModal(false);
                      setSelectedCheckpoint(null);
                      setCheckpointEvidence({
                        verificationUrl: '',
                        verificationMethod: 'url',
                        screenshot: null,
                        caption: ''
                      });
                      setPreviewUrl(null);
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Task Evidence Modal */}
      <TaskEvidenceModal 
        isOpen={showEvidenceModal}
        onClose={() => {
          setShowEvidenceModal(false);
          setSelectedTask(null);
          setPendingStatus(null);
        }}
        task={selectedTask}
        newStatus={pendingStatus}
        onSubmit={handleTaskEvidenceSubmit}
      />
    </DashboardLayout>
  );
};

export default MyTasks;

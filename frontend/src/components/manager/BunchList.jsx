import React, { useState, useEffect } from 'react';
import {
    Package,
    Users,
    User,
    ChevronDown,
    ChevronUp,
    UserPlus,
    CheckCircle,
    Clock,
    AlertCircle,
    Target
} from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';
import { formatDate } from '../../utils/helpers';
import AssignBunchModal from './AssignBunchModal';
import AssignTaskModal from './AssignTaskModal';

const BunchList = () => {
    const [bunches, setBunches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBunch, setExpandedBunch] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showTaskAssignModal, setShowTaskAssignModal] = useState(false);
    const [selectedBunch, setSelectedBunch] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);

    useEffect(() => {
        fetchAllBunches();
    }, []);

    const fetchAllBunches = async () => {
        try {
            setLoading(true);
            // Fetch all bunches for manager's projects
            const response = await api.get('/task-bunches/manager-bunches');
            if (response.data.success) {
                setBunches(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching bunches:', error);
            console.error('Error response:', error.response?.data);
            toast.error(error.response?.data?.message || 'Failed to load task bunches');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignBunch = (bunch) => {
        setSelectedBunch(bunch);
        setShowAssignModal(true);
    };

    const handleAssignTask = (bunch, task) => {
        setSelectedBunch(bunch);
        setSelectedTask(task);
        setShowTaskAssignModal(true);
    };

    const handleAssignmentComplete = () => {
        fetchAllBunches(); // Refresh the list after assignment
        setShowAssignModal(false); // Close bunch assignment modal
        setShowTaskAssignModal(false); // Close task assignment modal
        setSelectedBunch(null);
        setSelectedTask(null);
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending-assignment': 'bg-gray-500/10 text-gray-500',
            'assigned': 'bg-blue-500/10 text-blue-500',
            'in-progress': 'bg-primary/10 text-primary',
            'completed': 'bg-green-500/10 text-green-500',
            'blocked': 'bg-red-500/10 text-red-500'
        };
        return colors[status] || colors['pending-assignment'];
    };

    const getPhaseIcon = (phase) => {
        const icons = {
            'Frontend Development': '🎨',
            'Backend Development': '⚙️',
            'Full Stack Development': '💻',
            'AI Functionalities': '🤖',
            'Testing & QA': '🧪',
            'DevOps & Deployment': '🚀',
            'Integration': '🔗',
            'Database & Architecture': '🗄️',
            'Security & Performance': '🔒',
            'Documentation': '📚'
        };
        return icons[phase] || '📦';
    };

    if (loading) {
        return (
            <div className="dashboard-card p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    <p className="ml-3 text-muted-foreground">Loading bunches...</p>
                </div>
            </div>
        );
    }

    if (bunches.length === 0) {
        return (
            <div className="dashboard-card p-8 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Task Bunches</h3>
                <p className="text-sm text-muted-foreground">Create an AI-automated project to generate task bunches</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {bunches.map((bunch) => {
                const isExpanded = expandedBunch === bunch._id;

                return (
                    <div key={bunch._id} className="dashboard-card overflow-hidden">
                        {/* Bunch Header */}
                        <div
                            className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => setExpandedBunch(isExpanded ? null : bunch._id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <span className="text-2xl">{getPhaseIcon(bunch.name)}</span>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-base font-semibold text-foreground">{bunch.name}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(bunch.status)}`}>
                                                {bunch.status?.replace('-', ' ').toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {bunch.project?.name} • {bunch.tasks?.length || 0} tasks
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    {bunch.assignedTo ? (
                                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-lg">
                                            <Users className="h-4 w-4 text-primary" />
                                            <span className="text-sm font-medium text-primary">
                                                {bunch.assignedTo.firstName} {bunch.assignedTo.lastName}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-sm text-muted-foreground px-3 py-1 bg-muted rounded-lg">
                                            Unassigned
                                        </span>
                                    )}
                                    <button className="p-1 hover:bg-muted rounded-lg">
                                        {isExpanded ? (
                                            <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/30">
                                <div className="space-y-4 mt-4">
                                    {/* Tasks List */}
                                    {bunch.tasks && bunch.tasks.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                                                <Target className="h-4 w-4" />
                                                Microtasks ({bunch.tasks.length})
                                            </p>
                                            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                                {bunch.tasks.map((task, idx) => (
                                                    <div
                                                        key={task._id || idx}
                                                        className={`p-3 bg-card rounded-lg border transition-colors ${task.assignedTo
                                                            ? 'border-blue-500/50 hover:border-blue-500'
                                                            : 'border-border hover:border-primary/30'
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <p className="text-sm font-medium text-foreground mb-1">
                                                                    {task.title}
                                                                </p>
                                                                {task.description && (
                                                                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                                                        {task.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center flex-wrap gap-2">
                                                                    {task.priority && (
                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'high' || task.priority === 'urgent' ? 'bg-red-500/10 text-red-500' :
                                                                            task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                'bg-green-500/10 text-green-500'
                                                                            }`}>
                                                                            {task.priority}
                                                                        </span>
                                                                    )}
                                                                    {task.points && (
                                                                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                                                            {task.points} pts
                                                                        </span>
                                                                    )}

                                                                    {/* Status Badge - Shows "assigned" in blue if task is assigned */}
                                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.assignedTo
                                                                        ? 'bg-blue-500/10 text-blue-500'
                                                                        : task.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                                                                            task.status === 'in-progress' ? 'bg-yellow-500/10 text-yellow-500' :
                                                                                task.status === 'review' ? 'bg-purple-500/10 text-purple-500' :
                                                                                    'bg-gray-500/10 text-gray-500'
                                                                        }`}>
                                                                        {task.assignedTo ? 'assigned' : (task.status?.replace('-', ' ') || 'not started')}
                                                                    </span>

                                                                    {task.assignedTo && (
                                                                        <span className="text-xs text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded">
                                                                            <User className="h-3 w-3" />
                                                                            {task.assignedTo.firstName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleAssignTask(bunch, task);
                                                                }}
                                                                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors flex-shrink-0"
                                                            >
                                                                {task.assignedTo ? 'Reassign' : 'Assign'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Timeline */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Start Date</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDate(bunch.startDate)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">Deadline</p>
                                            <p className="text-sm font-medium text-foreground">
                                                {formatDate(bunch.deadline)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Required Skills */}
                                    {bunch.requiredSkills && bunch.requiredSkills.length > 0 && (
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-2">Required Skills:</p>
                                            <div className="flex flex-wrap gap-1">
                                                {bunch.requiredSkills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-md"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Assign Bunch Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssignBunch(bunch);
                                        }}
                                        className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                                    >
                                        <UserPlus className="h-4 w-4" />
                                        {bunch.assignedTo ? 'Reassign Bunch' : 'Assign Bunch'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Modals */}
            {showAssignModal && (
                <AssignBunchModal
                    bunch={selectedBunch}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={handleAssignmentComplete}
                />
            )}

            {showTaskAssignModal && (
                <AssignTaskModal
                    bunch={selectedBunch}
                    task={selectedTask}
                    onClose={() => setShowTaskAssignModal(false)}
                    onSuccess={handleAssignmentComplete}
                />
            )}
        </div>
    );
};

export default BunchList;

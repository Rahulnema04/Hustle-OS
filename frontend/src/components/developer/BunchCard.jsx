import React, { useState } from 'react';
import { Package, ChevronDown, ChevronUp, CheckCircle, Clock, Target, AlertCircle } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

const BunchCard = ({ bunch, onTaskUpdate, onAcceptTask, onSubmitTask }) => {
    const [expanded, setExpanded] = useState(false);

    const getStatusColor = (status) => {
        const colors = {
            'pending-assignment': 'bg-gray-100 text-gray-700',
            'assigned': 'bg-blue-100 text-blue-700',
            'in-progress': 'bg-yellow-100 text-yellow-700',
            'review': 'bg-purple-100 text-purple-700',
            'completed': 'bg-green-100 text-green-700',
            'blocked': 'bg-red-100 text-red-700'
        };
        return colors[status] || colors['pending-assignment'];
    };

    const getPhaseIcon = (phase) => {
        if (phase?.includes('Frontend')) return '🎨';
        if (phase?.includes('Backend')) return '⚙️';
        if (phase?.includes('Testing')) return '🧪';
        if (phase?.includes('DevOps')) return '🚀';
        if (phase?.includes('AI')) return '🤖';
        if (phase?.includes('Documentation')) return '📚';
        return '📦';
    };

    const getTaskStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-gray-100 text-gray-700',
            'in-progress': 'bg-blue-100 text-blue-700',
            'review': 'bg-purple-100 text-purple-700',
            'completed': 'bg-emerald-100 text-emerald-700',
            'cant-complete': 'bg-red-100 text-red-700'
        };
        return colors[status] || colors['not-started'];
    };

    const completedTasks = bunch.tasks?.filter(t => t.status === 'completed').length || 0;
    const totalTasks = bunch.tasks?.length || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
            {/* Bunch Header */}
            <div
                className="p-5 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        <span className="text-3xl">{getPhaseIcon(bunch.name)}</span>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{bunch.name}</h3>
                            <p className="text-sm text-gray-600">{bunch.project?.name}</p>

                            <div className="flex items-center gap-4 mt-2 text-sm">
                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <Target size={14} />
                                    <span>{totalTasks} tasks</span>
                                </div>

                                <div className="flex items-center gap-1.5 text-gray-600">
                                    <Clock size={14} />
                                    <span>Due {formatDate(bunch.deadline)}</span>
                                </div>

                                {bunch.estimatedDuration && (
                                    <div className="text-gray-600">
                                        <span>{bunch.estimatedDuration} days</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(bunch.status)}`}>
                            {bunch.status.replace('-', ' ').toUpperCase()}
                        </span>

                        <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                                e.stopPropagation();
                                setExpanded(!expanded);
                            }}
                        >
                            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1.5">
                        <span className="font-medium">Progress</span>
                        <span className="font-semibold">{progressPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{completedTasks} of {totalTasks} completed</span>
                        {totalTasks - completedTasks > 0 && (
                            <span>{totalTasks - completedTasks} remaining</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded Task List */}
            {expanded && bunch.tasks && bunch.tasks.length > 0 && (
                <div className="border-t border-gray-200 bg-gray-50 p-5">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Package size={16} />
                        Tasks in this bunch:
                    </h4>

                    <div className="space-y-2">
                        {bunch.tasks.map((task) => (
                            <div
                                key={task._id}
                                className="bg-white border border-gray-200 rounded-md p-3 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h5 className="font-medium text-gray-900">{task.title}</h5>
                                            {task.status === 'completed' && (
                                                <CheckCircle className="text-emerald-500 flex-shrink-0" size={16} />
                                            )}
                                        </div>

                                        {task.description && (
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
                                        )}

                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTaskStatusColor(task.status)}`}>
                                                {task.status.replace('-', ' ')}
                                            </span>

                                            {task.priority && (
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${task.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                                                    task.priority === 'high' ? 'bg-orange-100 text-orange-700' :
                                                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            )}

                                            {task.points && (
                                                <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                    {task.points} pts
                                                </span>
                                            )}

                                            {task.deadline && (
                                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDate(task.deadline)}
                                                </span>
                                            )}
                                        </div>

                                        {task.requiredSkills && task.requiredSkills.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {task.requiredSkills.map((skill, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                                                    >
                                                        {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Task Actions could go here */}
                                {task.status !== 'completed' && (
                                    <div className="mt-3 flex gap-2">
                                        {task.status === 'not-started' && (
                                            <button
                                                onClick={() => onAcceptTask && onAcceptTask(task._id)}
                                                className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                            >
                                                Accept Task
                                            </button>
                                        )}
                                        {task.status === 'in-progress' && (
                                            <button
                                                onClick={() => onSubmitTask && onSubmitTask(task._id)}
                                                className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                                            >
                                                Submit Evidence
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BunchCard;

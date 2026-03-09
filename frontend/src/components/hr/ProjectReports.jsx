import React, { useState, useEffect } from 'react';
import {
    FileText,
    BarChart3,
    Users,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Download,
    Filter
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProjectReports = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchProjects();

        // Auto-refresh every 60 seconds
        const refreshInterval = setInterval(fetchProjects, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');

            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            if (projects.length === 0) {
                toast.error('Failed to load projects');
            }
        } finally {
            setLoading(false);
        }
    };

    const getProjectStats = () => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        const overdue = projects.filter(p => {
            if (!p.deadline) return false;
            return new Date(p.deadline) < new Date() && p.status !== 'Completed';
        }).length;

        return { total, active, completed, overdue };
    };

    const stats = getProjectStats();

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
            case 'in progress':
            case 'active':
                return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
            case 'on hold':
                return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
            default:
                return 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/30';
        }
    };

    const getHealthIndicator = (project) => {
        if (project.status === 'Completed') {
            return { label: 'Completed', color: 'text-emerald-400', icon: CheckCircle };
        }

        if (!project.deadline) {
            return { label: 'On Track', color: 'text-blue-400', icon: Clock };
        }

        const deadline = new Date(project.deadline);
        const now = new Date();
        const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

        if (daysUntilDeadline < 0) {
            return { label: 'Overdue', color: 'text-red-400', icon: AlertCircle };
        } else if (daysUntilDeadline < 7) {
            return { label: 'At Risk', color: 'text-orange-400', icon: AlertCircle };
        } else {
            return { label: 'On Track', color: 'text-emerald-400', icon: CheckCircle };
        }
    };

    const filteredProjects = projects.filter(project => {
        if (filterStatus === 'all') return true;
        if (filterStatus === 'active') return project.status === 'In Progress' || project.status === 'Active';
        if (filterStatus === 'completed') return project.status === 'Completed';
        if (filterStatus === 'overdue') {
            if (!project.deadline) return false;
            return new Date(project.deadline) < new Date() && project.status !== 'Completed';
        }
        return true;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-black p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <FileText className="h-8 w-8 text-blue-500" />
                        Project Reports
                    </h1>
                    <p className="text-zinc-400 mt-1">Track project progress and resource allocation</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-white transition-all font-medium shadow-lg">
                    <Download className="h-5 w-5" />
                    Export Report
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Statistics - Dark Premium Style */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Total Projects */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Total Projects</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.total}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Active */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Active</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.active}</p>
                                </div>
                                <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <BarChart3 className="h-6 w-6 text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Completed</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.completed}</p>
                                </div>
                                <div className="h-12 w-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-purple-400" />
                                </div>
                            </div>
                        </div>

                        {/* Overdue */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Overdue</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.overdue}</p>
                                </div>
                                <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                                    <AlertCircle className="h-6 w-6 text-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-300 mr-2">Filter:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterStatus('active')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'active'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setFilterStatus('completed')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'completed'
                                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    Completed
                                </button>
                                <button
                                    onClick={() => setFilterStatus('overdue')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'overdue'
                                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    Overdue
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Project Cards */}
                    {filteredProjects.length === 0 ? (
                        <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl p-12 text-center border border-white/5">
                            <FileText className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No projects found</h3>
                            <p className="text-zinc-500">No projects match the selected filters</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredProjects.map((project) => {
                                const health = getHealthIndicator(project);
                                const HealthIcon = health.icon;
                                const isExpanded = expandedProject === project._id;

                                return (
                                    <div key={project._id} className="bg-zinc-900/30 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden hover:border-white/10 transition-all">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                            {project.status || 'N/A'}
                                                        </span>
                                                    </div>
                                                    <p className="text-zinc-400 text-sm mb-4">{project.description || 'No description'}</p>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-zinc-500" />
                                                            <span className="text-zinc-300">
                                                                Deadline: {formatDate(project.deadline)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-zinc-500" />
                                                            <span className="text-zinc-300">
                                                                Team: {project.teamMembers?.length || 0}
                                                            </span>
                                                        </div>
                                                        <div className={`flex items-center gap-2 ${health.color}`}>
                                                            <HealthIcon className="h-4 w-4" />
                                                            <span className="font-medium">{health.label}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setExpandedProject(isExpanded ? null : project._id)}
                                                    className="ml-4 p-2 hover:bg-white/5 rounded-xl transition-colors text-zinc-400 hover:text-white"
                                                    title={isExpanded ? "Minimize" : "Expand"}
                                                >
                                                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                                </button>
                                            </div>

                                            {isExpanded && (
                                                <div className="mt-6 pt-6 border-t border-zinc-800">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                            <p className="text-sm text-zinc-400 mb-1">Created By</p>
                                                            <p className="text-white font-medium">
                                                                {project.createdBy?.firstName} {project.createdBy?.lastName}
                                                            </p>
                                                        </div>
                                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                            <p className="text-sm text-zinc-400 mb-1">Created On</p>
                                                            <p className="text-white font-medium">{formatDate(project.createdAt)}</p>
                                                        </div>
                                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                            <p className="text-sm text-zinc-400 mb-1">Last Updated</p>
                                                            <p className="text-white font-medium">{formatDate(project.updatedAt)}</p>
                                                        </div>
                                                        <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                                            <p className="text-sm text-zinc-400 mb-1">Total Tasks</p>
                                                            <p className="text-white font-medium">{project.tasks?.length || 0}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ProjectReports;

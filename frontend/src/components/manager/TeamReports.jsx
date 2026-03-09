import React, { useState, useEffect } from 'react';
import {
    FileText,
    Download,
    Calendar,
    Filter,
    BarChart3,
    PieChart,
    TrendingUp,
    Users,
    CheckCircle,
    Clock,
    Target,
    Award
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { formatDate } from '../../utils/helpers';
import PerformanceMatrix from './PerformanceMatrix';

const TeamReports = () => {
    const [activeTab, setActiveTab] = useState('reports');
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('all');
    const [dateRange, setDateRange] = useState({
        startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedProject) {
            generateReport();
        }
    }, [selectedProject, dateRange]);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        }
    };

    const generateReport = async () => {
        try {
            setLoading(true);

            // For now, generate mock report data based on project selection
            // In production, this would call a backend endpoint
            const mockData = {
                summary: {
                    totalTasks: 45,
                    completedTasks: 32,
                    activeTasks: 10,
                    overdueTask: 3,
                    totalPoints: 248,
                    teamMembers: 8
                },
                taskDistribution: {
                    'Not Started': 5,
                    'In Progress': 10,
                    'Completed': 32,
                    'Review': 3
                },
                topPerformers: [
                    { name: 'Developer 1', points: 45, tasks: 12 },
                    { name: 'Developer 2', points: 38, tasks: 10 },
                    { name: 'Developer 3', points: 35, tasks: 9 }
                ]
            };

            setReportData(mockData);
        } catch (error) {
            console.error('Error generating report:', error);
            toast.error('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (format) => {
        // Implement export functionality
        toast.success(`Exporting report as ${format.toUpperCase()}...`);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Reports</h1>
                <p className="text-gray-600 mt-1">Generate comprehensive reports for team and project performance</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'reports'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Project Reports
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('performance')}
                        className={`px-4 py-3 text-sm font-bold transition-colors border-b-2 ${activeTab === 'performance'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Performance Matrix
                        </div>
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'performance' ? (
                <PerformanceMatrix />
            ) : (
                <>
                    {/* Report Filters */}
                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Report Filters
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Project Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Project
                                </label>
                                <select
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Projects</option>
                                    {projects.map((project) => (
                                        <option key={project._id} value={project._id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Start Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.startDate}
                                    onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={dateRange.endDate}
                                    onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                            <button
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export PDF
                            </button>
                            <button
                                onClick={() => handleExport('csv')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Export CSV
                            </button>
                        </div>
                    </div>

                    {/* Report Content */}
                    {
                        loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : reportData ? (
                            <>
                                {/* Summary Statistics */}
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="h-4 w-4 text-blue-600" />
                                            <p className="text-xs text-gray-600">Total Tasks</p>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{reportData.summary.totalTasks}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                            <p className="text-xs text-gray-600">Completed</p>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">{reportData.summary.completedTasks}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            <p className="text-xs text-gray-600">Active</p>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">{reportData.summary.activeTasks}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <TrendingUp className="h-4 w-4 text-red-600" />
                                            <p className="text-xs text-gray-600">Overdue</p>
                                        </div>
                                        <p className="text-2xl font-bold text-red-600">{reportData.summary.overdueTask}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BarChart3 className="h-4 w-4 text-purple-600" />
                                            <p className="text-xs text-gray-600">Total Points</p>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600">{reportData.summary.totalPoints}</p>
                                    </div>

                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Users className="h-4 w-4 text-orange-600" />
                                            <p className="text-xs text-gray-600">Team Size</p>
                                        </div>
                                        <p className="text-2xl font-bold text-orange-600">{reportData.summary.teamMembers}</p>
                                    </div>
                                </div>

                                {/* Charts Section */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Task Distribution */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <PieChart className="h-5 w-5" />
                                            Task Distribution
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.entries(reportData.taskDistribution).map(([status, count]) => (
                                                <div key={status}>
                                                    <div className="flex justify-between text-sm mb-1">
                                                        <span className="text-gray-700">{status}</span>
                                                        <span className="font-semibold text-gray-900">{count}</span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full ${status === 'Completed' ? 'bg-green-500' :
                                                                status === 'In Progress' ? 'bg-blue-500' :
                                                                    status === 'Review' ? 'bg-yellow-500' :
                                                                        'bg-gray-400'
                                                                }`}
                                                            style={{ width: `${(count / reportData.summary.totalTasks) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Top Performers */}
                                    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <TrendingUp className="h-5 w-5" />
                                            Top Performers
                                        </h3>
                                        <div className="space-y-3">
                                            {reportData.topPerformers.map((performer, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                            index === 1 ? 'bg-gray-200 text-gray-700' :
                                                                'bg-orange-100 text-orange-700'
                                                            }`}>
                                                            #{index + 1}
                                                        </div>
                                                        <span className="font-medium text-gray-900">{performer.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-semibold text-purple-600">{performer.points} pts</p>
                                                        <p className="text-xs text-gray-500">{performer.tasks} tasks</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Select filters to generate report</h3>
                                <p className="text-gray-600">Choose a project and date range to view detailed analytics</p>
                            </div>
                        )}
                </>
            )}
        </div>
    );
};

export default TeamReports;

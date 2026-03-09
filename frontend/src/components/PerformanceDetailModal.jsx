import React, { useState, useEffect } from 'react';
import {
    X,
    Trophy,
    Target,
    CheckCircle,
    Clock,
    Star,
    TrendingUp,
    Award,
    Activity,
    Zap,
    Users,
    Flame
} from 'lucide-react';
import api from '../utils/api';

const PerformanceDetailModal = ({ employee, isOpen, onClose }) => {
    const [performanceData, setPerformanceData] = useState(null);
    const [developerPerf, setDeveloperPerf] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isOpen && employee) {
            console.log('[PerformanceDetailModal] Opening modal for employee:', employee);
            fetchDetailedPerformance();
        } else {
            // Reset loading state when modal closes
            setIsLoading(true);
            setPerformanceData(null);
            setDeveloperPerf(null);
        }
    }, [isOpen, employee]);

    const fetchDetailedPerformance = async () => {
        console.log('[PerformanceDetailModal] Fetching detailed performance for:', employee);
        setIsLoading(true);
        setError(null);
        try {
            // Use the new HR performance endpoint if employee data is passed from HR view
            if (employee) {
                // If employee is the full data from HR endpoint, use it directly
                console.log('[PerformanceDetailModal] Using employee data directly');
                setPerformanceData(employee);
                setDeveloperPerf(employee);
                setIsLoading(false);
            }
        } catch (error) {
            console.error('[PerformanceDetailModal] Error fetching detailed performance:', error);
            setError(error.response?.data?.message || 'Failed to load performance data');
            setPerformanceData(null);
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderProductivityBreakdown = () => {
        if (!performanceData && !employee) return null;

        const data = performanceData || employee;
        const metrics = data.metrics || {};
        const completionRate = metrics.completionRate || data.completionRate || 0;
        const onTimeRate = metrics.onTimeDeliveryRate || data.onTimeDeliveryRate || 0;
        const productivityScore = metrics.productivityScore || data.productivityScore || 0;

        const components = [
            {
                label: 'Task Completion',
                value: completionRate,
                weight: 40,
                color: 'blue',
                icon: CheckCircle
            },
            {
                label: 'On-Time Delivery',
                value: onTimeRate,
                weight: 30,
                color: 'green',
                icon: Clock
            },
            {
                label: 'Productivity Score',
                value: productivityScore,
                weight: 100,
                color: 'purple',
                icon: Zap
            }
        ];

        return (
            <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium mb-1">Overall Productivity Score</p>
                            <p className="text-5xl font-bold">{productivityScore}%</p>
                        </div>
                        <Trophy className="h-16 w-16 opacity-50" />
                    </div>
                </div>

                {components.map((component, index) => {
                    const Icon = component.icon;
                    const contribution = Math.round((component.value * component.weight) / 100);

                    return (
                        <div key={index} className="bg-zinc-800/30 rounded-lg p-5 border border-white/5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className={`h-10 w-10 rounded-full bg-${component.color}-500/10 flex items-center justify-center border border-${component.color}-500/20`}>
                                        <Icon className={`h-5 w-5 text-${component.color}-400`} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-200">{component.label}</p>
                                        <p className="text-xs text-zinc-500">{component.weight}% weight</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-white">{component.value}%</p>
                                    <p className="text-xs text-zinc-400">+{contribution}pts</p>
                                </div>
                            </div>
                            <div className="relative w-full bg-zinc-700/50 rounded-full h-3">
                                <div
                                    className={`absolute top-0 left-0 h-3 rounded-full bg-gradient-to-r from-${component.color}-500 to-${component.color}-600 transition-all duration-500`}
                                    style={{ width: `${component.value}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderStreakSection = () => {
        const data = performanceData || employee;
        const streak = data?.streak;
        
        if (!streak || (!streak.current && !streak.currentStreak)) return null;

        const currentStreak = streak.current || streak.currentStreak || 0;
        const longestStreak = streak.longest || streak.longestStreak || 0;

        return (
            <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Flame className="h-6 w-6" />
                            <p className="text-sm font-medium opacity-90">Performance Streak</p>
                        </div>
                        <p className="text-6xl font-bold mb-1">{currentStreak}</p>
                        <p className="text-sm opacity-90">days in a row</p>
                    </div>
                    <div className="text-right">
                        <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                            <p className="text-xs font-medium opacity-75 mb-1">Best Streak</p>
                            <p className="text-3xl font-bold">{longestStreak}</p>
                            <p className="text-xs opacity-75">days</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderDailyTrend = () => {
        if (!developerPerf?.dailyHistory || developerPerf.dailyHistory.length === 0) return null;

        // Get last 7 days
        const last7Days = developerPerf.dailyHistory.slice(-7);
        const maxTasks = Math.max(...last7Days.map(d => d.tasksCompleted), 1);

        return (
            <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                <h4 className="text-md font-bold text-gray-900 mb-4">Last 7 Days Activity</h4>
                <div className="flex items-end justify-between gap-2 h-40">
                    {last7Days.map((day, i) => {
                        const height = (day.tasksCompleted / maxTasks) * 100;
                        const date = new Date(day.date);
                        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                        return (
                            <div key={i} className="flex-1 flex flex-col items-center gap-2">
                                <div className="relative w-full bg-gray-100 rounded-t-lg" style={{ height: `${Math.max(height, 10)}%` }}>
                                    <div className={`absolute bottom-0 left-0 right-0 rounded-t-lg transition-all ${day.tasksCompleted > 0 ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gray-300'
                                        }`} style={{ height: '100%' }} />
                                    {day.tasksCompleted > 0 && (
                                        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded font-bold">
                                            {day.tasksCompleted}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs font-medium text-gray-600">{dayName}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderTaskStatistics = () => {
        const data = performanceData || employee;
        const taskStats = data?.taskStats || {};
        const pointsStats = data?.pointsStats || {};

        const stats = [
            {
                label: 'Total Tasks',
                value: taskStats.total || data?.totalTasks || 0,
                icon: Target,
                color: 'blue',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
            },
            {
                label: 'Completed',
                value: taskStats.completed || data?.completedTasks || 0,
                icon: CheckCircle,
                color: 'green',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
            },
            {
                label: 'In Progress',
                value: taskStats.inProgress || data?.inProgressTasks || 0,
                icon: Activity,
                color: 'purple',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200'
            },
            {
                label: 'Points Earned',
                value: pointsStats.totalEarned || data?.totalPointsEarned || data?.totalPoints || 0,
                icon: Star,
                color: 'yellow',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200'
            }
        ];

        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="bg-zinc-800/50 backdrop-blur-md border border-white/5 rounded-xl p-4 hover:border-white/10 transition-all">
                            <Icon className={`h-8 w-8 text-${stat.color}-400 mb-2`} />
                            <p className="text-3xl font-bold text-white">{stat.value}</p>
                            <p className="text-xs font-medium text-zinc-400 mt-1">{stat.label}</p>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur-md border-b border-white/10 px-6 py-5 flex justify-between items-center rounded-t-2xl z-10">
                    <div className="flex items-center">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center shadow-lg mr-4">
                            <span className="text-2xl font-bold text-blue-400">
                                {employee?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{employee?.name}</h2>
                            <p className="text-zinc-400 text-sm">{employee?.email}</p>
                            {(performanceData?.metrics || employee?.metrics || employee?.productivityScore) && (
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="bg-blue-500/10 border border-blue-500/20 backdrop-blur-sm px-3 py-1 rounded-full">
                                        <p className="text-xs font-bold text-blue-400">
                                            Score: {performanceData?.metrics?.productivityScore || employee?.productivityScore || employee?.metrics?.productivityScore || 0}%
                                        </p>
                                    </div>
                                    {(performanceData?.streak?.current || performanceData?.streak?.currentStreak || employee?.currentStreak) > 0 && (
                                        <div className="bg-orange-500/10 border border-orange-500/20 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-1">
                                            <Flame className="h-3 w-3 text-orange-400" />
                                            <p className="text-xs font-bold text-orange-400">
                                                {performanceData?.streak?.current || performanceData?.streak?.currentStreak || employee?.currentStreak || 0} days
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-zinc-400 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-[104px] z-10">
                    <nav className="flex px-6">
                        {['overview', 'breakdown', 'trends'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-4 text-sm font-bold capitalize transition-colors border-b-2 ${activeTab === tab
                                        ? 'border-blue-500 text-blue-400'
                                        : 'border-transparent text-zinc-400 hover:text-zinc-200'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Content */}
                <div className="p-6">
                    {isLoading ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                            <p className="text-zinc-400">Loading performance data...</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col justify-center items-center py-20">
                            <div className="text-red-400 text-lg font-bold mb-2">Error Loading Data</div>
                            <p className="text-zinc-400">{error}</p>
                            <button
                                onClick={fetchDetailedPerformance}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                            >
                                Retry
                            </button>
                        </div>
                    ) : (
                        <>
                            {activeTab === 'overview' && (
                                <div className="space-y-6">
                                    {renderTaskStatistics()}

                                    {developerPerf?.streak && (
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Performance Streak</h3>
                                            {renderStreakSection()}
                                        </div>
                                    )}

                                    {(performanceData?.recentCompletedTasks || developerPerf?.recentTasks || performanceData?.recentTasks || performanceData?.tasks) && (
                                        performanceData?.recentCompletedTasks?.length > 0 || 
                                        developerPerf?.recentTasks?.length > 0 || 
                                        performanceData?.recentTasks?.length > 0 || 
                                        performanceData?.tasks?.length > 0
                                    ) && (
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-4">Recent Tasks</h3>
                                            <div className="space-y-2">
                                                {(performanceData?.recentCompletedTasks || developerPerf?.recentTasks || performanceData?.recentTasks || performanceData?.tasks?.slice(0, 5))?.slice(0, 5).map((task, i) => (
                                                    <div key={i} className="bg-zinc-800/30 rounded-lg p-4 border border-white/5 hover:border-white/10 transition-colors">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <p className="font-bold text-white">{task.title}</p>
                                                                <p className="text-sm text-zinc-400 mt-1">{task.project || 'No project'}</p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-medium text-zinc-400">{task.points || 0} pts</span>
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ml-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20`}>
                                                                    Completed
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'breakdown' && (
                                <div>
                                    <h3 className="text-lg font-bold text-white mb-4">Productivity Score Formula</h3>
                                    {renderProductivityBreakdown()}
                                </div>
                            )}

                            {activeTab === 'trends' && (
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold text-gray-900">Performance Trends</h3>
                                    {renderDailyTrend()}

                                    {developerPerf?.monthlyStats && (
                                        <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
                                            <h4 className="text-md font-bold text-gray-900 mb-4">This Month Statistics</h4>
                                            <dl className="grid grid-cols-3 gap-4">
                                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                                    <dt className="text-sm font-medium text-gray-600 mb-1">Tasks</dt>
                                                    <dd className="text-3xl font-bold text-blue-600">
                                                        {developerPerf.monthlyStats.tasksCompletedThisMonth}/{developerPerf.monthlyStats.tasksAssignedThisMonth}
                                                    </dd>
                                                </div>
                                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                                    <dt className="text-sm font-medium text-gray-600 mb-1">Points</dt>
                                                    <dd className="text-3xl font-bold text-purple-600">
                                                        {developerPerf.monthlyStats.pointsEarnedThisMonth}
                                                    </dd>
                                                </div>
                                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                                    <dt className="text-sm font-medium text-gray-600 mb-1">On-Time</dt>
                                                    <dd className="text-3xl font-bold text-green-600">
                                                        {developerPerf.monthlyStats.onTimeCompletionsThisMonth}
                                                    </dd>
                                                </div>
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-white/10 px-6 py-4 bg-zinc-900/95 rounded-b-2xl flex justify-end sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-all border border-white/10"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceDetailModal;

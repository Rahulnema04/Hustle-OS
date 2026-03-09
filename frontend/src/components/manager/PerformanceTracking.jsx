import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Award,
    Target,
    CheckCircle,
    Clock,
    BarChart3,
    Activity,
    User,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PerformanceDetailModal from '../PerformanceDetailModal';

const PerformanceTracking = () => {
    const navigate = useNavigate();
    const [teamPerformance, setTeamPerformance] = useState(null);
    const [individuals, setIndividuals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [sortBy, setSortBy] = useState('points'); // points, completion, name

    useEffect(() => {
        fetchPerformanceData();
    }, []);

    const fetchPerformanceData = async () => {
        try {
            setLoading(true);

            // Fetch team members performance data using the performance API
            // This will automatically filter by manager's team on the backend
            const performanceResponse = await api.get('/performance/individuals');
            if (performanceResponse.data.success) {
                // Map the performance data to match the expected format
                const membersWithPerformance = performanceResponse.data.data.map(member => ({
                    _id: member.id,
                    firstName: member.name.split(' ')[0],
                    lastName: member.name.split(' ').slice(1).join(' '),
                    email: member.email,
                    role: 'individual', // Default role, actual role would come from API
                    totalPoints: member.totalPoints,
                    activeTasks: member.totalTasks - member.completedTasks,
                    completedTasks: member.completedTasks,
                    completionRate: member.completionRate,
                    productivityScore: member.productivityScore
                }));
                
                setIndividuals(membersWithPerformance);

                // Calculate team performance
                calculateTeamPerformance(membersWithPerformance);
            }
        } catch (error) {
            console.error('Error fetching performance data:', error);
            toast.error('Failed to load performance data');
        } finally {
            setLoading(false);
        }
    };

    const calculateTeamPerformance = (members) => {
        const totalPoints = members.reduce((sum, m) => sum + (m.totalPoints || 0), 0);
        const avgPoints = members.length > 0 ? totalPoints / members.length : 0;

        setTeamPerformance({
            totalMembers: members.length,
            totalPoints,
            avgPoints: Math.round(avgPoints),
            topPerformer: members.reduce((top, m) =>
                (m.totalPoints || 0) > (top?.totalPoints || 0) ? m : top
                , members[0])
        });
    };

    const sortedIndividuals = [...individuals].sort((a, b) => {
        if (sortBy === 'points') return (b.totalPoints || 0) - (a.totalPoints || 0);
        if (sortBy === 'name') return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        return 0;
    });

    const getTrendIcon = (value) => {
        if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
        if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Performance Tracking</h1>
                <p className="text-gray-600 mt-1">Monitor team and individual performance metrics</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    {/* Team Performance Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-blue-100 text-sm font-medium">Team Members</p>
                                <Activity className="h-5 w-5 text-blue-100" />
                            </div>
                            <p className="text-3xl font-bold">{teamPerformance?.totalMembers || 0}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-purple-100 text-sm font-medium">Total Points</p>
                                <Award className="h-5 w-5 text-purple-100" />
                            </div>
                            <p className="text-3xl font-bold">{teamPerformance?.totalPoints || 0}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-green-100 text-sm font-medium">Avg Points/Member</p>
                                <BarChart3 className="h-5 w-5 text-green-100" />
                            </div>
                            <p className="text-3xl font-bold">{teamPerformance?.avgPoints || 0}</p>
                        </div>

                        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-orange-100 text-sm font-medium">Top Performer</p>
                                <Target className="h-5 w-5 text-orange-100" />
                            </div>
                            <p className="text-lg font-bold truncate">
                                {teamPerformance?.topPerformer
                                    ? `${teamPerformance.topPerformer.firstName} ${teamPerformance.topPerformer.lastName}`
                                    : 'N/A'}
                            </p>
                        </div>
                    </div>

                    {/* Sort Controls */}
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Individual Performance</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setSortBy('points')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'points'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    By Points
                                </button>
                                <button
                                    onClick={() => setSortBy('name')}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sortBy === 'name'
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    By Name
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Individual Performance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sortedIndividuals.map((member, index) => (
                            <div
                                key={member._id}
                                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                            >
                                {/* Rank Badge */}
                                {sortBy === 'points' && index < 3 && (
                                    <div className="absolute top-4 right-4">
                                        <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                            index === 1 ? 'bg-gray-100 text-gray-700' :
                                                'bg-orange-100 text-orange-700'
                                            }`}>
                                            #{index + 1}
                                        </div>
                                    </div>
                                )}

                                {/* Member Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-gray-900">
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {member.role?.replace('-', ' ')}
                                        </p>
                                    </div>
                                </div>

                                {/* Performance Metrics */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm text-gray-700">Points Earned</span>
                                        </div>
                                        <span className="text-lg font-bold text-purple-600">
                                            {member.totalPoints || 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm text-gray-700">Active Tasks</span>
                                        </div>
                                        <span className="text-lg font-bold text-blue-600">
                                            {member.activeTasks || 0}
                                        </span>
                                    </div>

                                    {/* Performance Indicator */}
                                    <div className="pt-3 border-t border-gray-200">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-600">Performance</span>
                                            <div className="flex items-center gap-1">
                                                <span className={`font-medium ${(member.totalPoints || 0) >= teamPerformance?.avgPoints
                                                    ? 'text-green-600'
                                                    : 'text-orange-600'
                                                    }`}>
                                                    {(member.totalPoints || 0) >= teamPerformance?.avgPoints
                                                        ? 'Above Average'
                                                        : 'Below Average'}
                                                </span>
                                                {getTrendIcon(
                                                    (member.totalPoints || 0) - (teamPerformance?.avgPoints || 0)
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* View Details Button */}
                                <button
                                    onClick={() => {
                                        setSelectedMember({
                                            id: member._id,
                                            name: `${member.firstName} ${member.lastName}`,
                                            email: member.email,
                                            totalPoints: member.totalPoints || 0,
                                            completedTasks: 0, // Will be fetched by modal
                                            totalTasks: member.activeTasks || 0,
                                            completionRate: 0 // Will be calculated by modal
                                        });
                                        setShowDetailModal(true);
                                    }}
                                    className="w-full mt-4 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    View Detailed Performance
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Empty State */}
                    {sortedIndividuals.length === 0 && (
                        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                            <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                            <p className="text-gray-600">Team member performance data will appear here</p>
                        </div>
                    )}
                </>
            )}

            {/* Performance Detail Modal */}
            <PerformanceDetailModal
                employee={selectedMember}
                isOpen={showDetailModal}
                onClose={() => {
                    setShowDetailModal(false);
                    setSelectedMember(null);
                }}
            />
        </div>
    );
};

export default PerformanceTracking;

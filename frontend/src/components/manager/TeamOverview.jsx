import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Users,
    UserCheck,
    UserX,
    Search,
    Mail,
    Phone,
    Calendar,
    Award,
    TrendingUp,
    TrendingDown,
    CheckCircle,
    Target,
    Activity,
    Clock,
    MessageCircle
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TeamOverview = () => {
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, on-leave, available
    const [teamStats, setTeamStats] = useState({
        total: 0,
        active: 0,
        onLeave: 0,
        available: 0
    });

    useEffect(() => {
        fetchTeamData();

        // Auto-refresh every 30 seconds for real-time updates
        const refreshInterval = setInterval(() => {
            fetchTeamData();
        }, 30000); // 30 seconds

        // Cleanup interval on unmount
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchTeamData = async () => {
        try {
            setLoading(true);
            // Fetch team members
            const response = await api.get('/users/individuals');

            if (response.data.success) {
                const members = response.data.data;
                setTeamMembers(members);

                // Calculate statistics
                calculateStats(members);
            }
        } catch (error) {
            console.error('Error fetching team data:', error);
            toast.error('Failed to load team data');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (members) => {
        const stats = {
            total: members.length,
            active: 0,
            onLeave: 0,
            available: members.length
        };

        // You can enhance this with actual status from backend
        stats.active = members.length;

        setTeamStats(stats);
    };

    const getStatusBadge = (member) => {
        // This is a placeholder - you can enhance with actual status from backend
        const isActive = member.isActive !== false;

        if (isActive) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Activity className="h-3 w-3 mr-1" />
                    Active
                </span>
            );
        }

        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                <Clock className="h-3 w-3 mr-1" />
                Offline
            </span>
        );
    };

    const filteredMembers = teamMembers.filter(member => {
        const matchesSearch =
            `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterStatus === 'all') return matchesSearch;
        if (filterStatus === 'active') return matchesSearch && member.isActive !== false;
        if (filterStatus === 'available') return matchesSearch && member.isActive !== false;

        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Team Overview</h1>
                <p className="text-gray-600 mt-1">Manage and monitor your team members' performance and availability</p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Team Members</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Users className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Active Members</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.active}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <UserCheck className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-sm font-medium">On Leave</p>
                            <p className="text-3xl font-bold mt-2">{teamStats.onLeave}</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <UserX className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Capacity</p>
                            <p className="text-3xl font-bold mt-2">{Math.round((teamStats.available / teamStats.total) * 100) || 0}%</p>
                        </div>
                        <div className="h-12 w-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                            <Activity className="h-6 w-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, or employee ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setFilterStatus('all')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setFilterStatus('active')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'active'
                                ? 'bg-green-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Active
                        </button>
                        <button
                            onClick={() => setFilterStatus('available')}
                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${filterStatus === 'available'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            Available
                        </button>
                    </div>
                </div>
            </div>

            {/* Team Members Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredMembers.length === 0 ? (
                <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
                    <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No team members found</h3>
                    <p className="text-gray-600">
                        {searchTerm ? 'Try adjusting your search terms' : 'Team members will appear here once assigned'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredMembers.map((member) => (
                        <div
                            key={member._id}
                            className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            {/* Member Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                        {member.firstName?.charAt(0)}{member.lastName?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {member.firstName} {member.lastName}
                                        </h3>
                                        <p className="text-sm text-gray-500 capitalize">
                                            {member.role?.replace('-', ' ')}
                                        </p>
                                    </div>
                                </div>
                                {getStatusBadge(member)}
                            </div>

                            {/* Member Details */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center text-sm text-gray-600">
                                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="truncate">{member.email}</span>
                                </div>
                                {member.phoneNumber && (
                                    <div className="flex items-center text-sm text-gray-600">
                                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                        <span>{member.phoneNumber}</span>
                                    </div>
                                )}
                                <div className="flex items-center text-sm text-gray-600">
                                    <Award className="h-4 w-4 mr-2 text-gray-400" />
                                    <span>Employee ID: {member.employeeId || 'N/A'}</span>
                                </div>
                            </div>

                            {/* Performance Indicators */}
                            <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Tasks This Month</p>
                                    <p className="text-lg font-bold text-gray-900">{member.activeTasks || 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">Points Earned</p>
                                    <p className="text-lg font-bold text-gray-900">{member.totalPoints || 0}</p>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                                <button
                                    onClick={() => navigate(`/profile?userId=${member._id}`)}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                                >
                                    View Profile
                                </button>
                                <button
                                    className="px-3 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                                    title="Message"
                                >
                                    <MessageCircle className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Summary */}
            {!loading && filteredMembers.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                    Showing {filteredMembers.length} of {teamMembers.length} team members
                </div>
            )}
        </div>
    );
};

export default TeamOverview;

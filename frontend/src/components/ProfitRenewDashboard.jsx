import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Target,
    Calendar,
    DollarSign,
    RefreshCw,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import api from '../utils/api';

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                <p className="text-muted-foreground text-xs">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} className="text-foreground font-semibold text-sm">
                        ₹{entry.value?.toLocaleString()}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const ProfitRenewDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({});

    // Initialize edit data when targets change
    useEffect(() => {
        if (data?.targets) {
            const initialEditData = {};
            data.targets.forEach(t => {
                initialEditData[t._id] = {
                    targetAmount: t.targetAmount,
                    achievedAmount: t.achievedAmount,
                    status: t.status
                };
            });
            setEditData(initialEditData);
        }
    }, [data]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch Head of Sales dashboard data
                const response = await api.get('/revenue/dashboard/hos');
                if (response.data.success) {
                    const apiData = response.data.data;

                    // Inject mock data if no targets exist (User Request)
                    const hasData = apiData.targets && apiData.targets.length > 0;

                    if (!hasData) {
                        const mockData = {
                            overview: {
                                totalRevenue: 1250000 // Mock: 12.5 Lakhs
                            },
                            targets: [
                                {
                                    _id: 'mock-1',
                                    targetPeriod: 'monthly',
                                    startDate: new Date().toISOString(),
                                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
                                    targetAmount: 2000000,
                                    achievedAmount: 1250000,
                                    progressPercentage: 62.5,
                                    status: 'in-progress'
                                },
                                {
                                    _id: 'mock-2',
                                    targetPeriod: 'quarterly',
                                    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
                                    endDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
                                    targetAmount: 5000000,
                                    achievedAmount: 1500000,
                                    progressPercentage: 30,
                                    status: 'in-progress'
                                }
                            ]
                        };
                        setData(mockData);
                    } else {
                        setData(apiData);
                    }
                }
            } catch (err) {
                console.error('Error fetching profit/renew data:', err);
                setError('Failed to load details.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Generate chart data
    const generateChartData = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
        const baseValue = data?.targets?.[0]?.achievedAmount || 500000;
        return months.map((month, index) => ({
            month,
            value: Math.round(baseValue * (0.5 + (index * 0.15) + Math.random() * 0.1)),
        }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px] text-destructive">
                <p>{error}</p>
            </div>
        );
    }

    const { targets, overview } = data || {};

    const handleEditChange = (id, field, value) => {
        setEditData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const handleSave = async () => {
        try {
            // Process both mock and real data updates
            const updatedTargets = [...(data.targets || [])];

            for (const target of updatedTargets) {
                const updates = editData[target._id];
                if (!updates) continue;

                // Update local state helpers
                target.targetAmount = Number(updates.targetAmount);
                target.achievedAmount = Number(updates.achievedAmount);
                target.status = updates.status;

                // If real data (not starting with mock-), save to backend
                if (!target._id.toString().startsWith('mock-')) {
                    await api.put(`/revenue/targets/${target._id}`, {
                        targetAmount: Number(updates.targetAmount),
                        achievedAmount: Number(updates.achievedAmount),
                        status: updates.status
                    });
                }
            }

            // Update parent state to reflect changes immediately
            setData(prev => ({
                ...prev,
                targets: updatedTargets
            }));

            setIsEditing(false);
        } catch (error) {
            console.error('Error saving changes:', error);
            setError('Failed to save changes');
        }
    };

    // Calculate "Monthly Profit"
    const monthlyProfit = overview?.totalRevenue || 0;

    // "Renew Details" -> Active Targets
    const renewDetails = targets || [];
    const chartData = generateChartData();

    const getStatusStyle = (status) => {
        switch (status) {
            case 'completed':
                return 'status-success';
            case 'in-progress':
                return 'status-info';
            case 'expired':
                return 'status-danger';
            default:
                return 'status-pending';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="dashboard-card">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <TrendingUp className="text-primary" />
                    Profit & Renew
                </h1>
                <p className="text-muted-foreground mt-1">
                    Monthly profit overview and renewal details from Sales
                </p>
            </div>

            {/* Stats & Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Monthly Profit Card */}
                <div className="dashboard-card relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500 opacity-80" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-emerald-500 font-medium text-lg">Monthly Profit</div>
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-foreground mb-2">
                        ₹{(renewDetails.reduce((sum, t) => sum + (t.achievedAmount || 0), 0)).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-emerald-500">
                        <ArrowUpRight className="h-4 w-4 mr-1" />
                        Total Revenue Generated
                    </div>
                </div>

                {/* Active Renewals Card */}
                <div className="dashboard-card relative overflow-hidden group">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500 opacity-80" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-blue-500 font-medium text-lg">Active Renewals</div>
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <RefreshCw className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                    <div className="text-4xl font-bold text-foreground mb-2">
                        {renewDetails.length}
                    </div>
                    <div className="text-sm text-blue-500">
                        Active Revenue Targets
                    </div>
                </div>

                {/* Mini Chart */}
                <div className="dashboard-card">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-muted-foreground font-medium">Revenue Trend</div>
                        <div className="flex items-center text-emerald-500 text-sm">
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            +15.3%
                        </div>
                    </div>
                    <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="value"
                                    stroke="var(--primary)"
                                    strokeWidth={2}
                                    fill="url(#profitGradient)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Renew Details (Revenue Targets) */}
            <div className="dashboard-card">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Target className="text-primary" size={20} />
                        Renew Details
                    </h2>

                    <div className="flex gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="btn-secondary text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="btn-primary text-sm"
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 border border-primary/20 transition-colors"
                            >
                                Edit Details
                            </button>
                        )}
                    </div>
                </div>

                {renewDetails.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="dark-table">
                            <thead>
                                <tr>
                                    <th>Period</th>
                                    <th>Target Amount</th>
                                    <th>Achieved</th>
                                    <th>Progress</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {renewDetails.map((target) => (
                                    <tr key={target._id}>
                                        <td>
                                            <div className="text-sm font-medium text-foreground capitalize">{target.targetPeriod}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {target.startDate && new Date(target.startDate).toLocaleDateString()} - {target.endDate && new Date(target.endDate).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={editData[target._id]?.targetAmount || target.targetAmount}
                                                        onChange={(e) => handleEditChange(target._id, 'targetAmount', e.target.value)}
                                                        className="input-modern pl-7 py-1.5 text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-sm font-semibold text-foreground">₹{target.targetAmount?.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                                                    <input
                                                        type="number"
                                                        value={editData[target._id]?.achievedAmount || target.achievedAmount}
                                                        onChange={(e) => handleEditChange(target._id, 'achievedAmount', e.target.value)}
                                                        className="input-modern pl-7 py-1.5 text-sm"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="text-sm font-semibold text-emerald-500">₹{target.achievedAmount?.toLocaleString()}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 bg-muted rounded-full h-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(target.progressPercentage || 0, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-muted-foreground">{target.progressPercentage || 0}%</span>
                                            </div>
                                        </td>
                                        <td>
                                            {isEditing ? (
                                                <select
                                                    value={editData[target._id]?.status || target.status}
                                                    onChange={(e) => handleEditChange(target._id, 'status', e.target.value)}
                                                    className="input-modern py-1.5 text-sm"
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="in-progress">In Progress</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="expired">Expired</option>
                                                </select>
                                            ) : (
                                                <span className={`status-pill ${getStatusStyle(target.status)}`}>
                                                    {target.status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-12 text-center text-muted-foreground">
                        <Target className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                        <p>No active renewal details found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfitRenewDashboard;

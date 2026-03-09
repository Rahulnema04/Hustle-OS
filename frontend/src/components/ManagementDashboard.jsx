import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import {
    Users,
    Search,
    Mail,
    Phone,
    Briefcase,
    UserCheck,
    Shield,
    Clock
} from 'lucide-react';
import api from '../utils/api';

const ManagementDashboard = () => {
    const [employees, setEmployees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeDepartment, setActiveDepartment] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');
    const [departmentStats, setDepartmentStats] = useState({});
    const [attendanceData, setAttendanceData] = useState({ percentage: 0, present: 0, total: 0 });

    // Generate Sparkline Data
    const generateSparkline = (trend = 'neutral', points = 15) => {
        const data = [];
        let current = 50;
        for (let i = 0; i < points; i++) {
            let change = (Math.random() - 0.5) * 10;
            if (trend === 'up') change += 2;
            if (trend === 'down') change -= 2;
            current = Math.max(10, current + change);
            data.push({ value: current });
        }
        return data;
    };

    useEffect(() => {
        fetchEmployees();
        fetchTodayAttendance();
    }, []);

    const fetchEmployees = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/users/all');
            const data = response.data.data || [];
            setEmployees(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTodayAttendance = async () => {
        try {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const response = await api.get(`/attendance/all?date=${dateStr}`);

            if (response.data && response.data.success && response.data.data.summary) {
                const summary = response.data.data.summary;
                const total = summary.totalEmployees || 0;
                const present = summary.present || 0;
                const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                setAttendanceData({
                    percentage,
                    present,
                    total,
                    absent: summary.absent || 0,
                    late: summary.late || 0
                });
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
        }
    };

    const calculateStats = (data) => {
        const stats = data.reduce((acc, curr) => {
            const dept = curr.department || 'Unassigned';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});
        setDepartmentStats(stats);
    };

    const getDepartments = () => {
        return ['All', ...Object.keys(departmentStats).sort()];
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = (
            emp.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.role?.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const matchesDept = activeDepartment === 'All' || (emp.department || 'Unassigned') === activeDepartment;

        return matchesSearch && matchesDept;
    });

    const getRoleBadgeStyle = (role) => {
        const styles = {
            'ceo': 'bg-violet-500/20 text-violet-400 border border-violet-500/30',
            'co-founder': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
            'head-of-sales': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            'manager': 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
            'team-lead': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
            'developer': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
            'intern': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
            'hr': 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
            'individual': 'bg-gray-800 text-gray-400 border border-gray-700'
        };
        return styles[role?.toLowerCase()] || 'bg-muted text-muted-foreground border border-border';
    };

    const getRoleDisplay = (role) => {
        if (!role) return 'Unknown';
        return role.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    title="Total Team Size"
                    value={employees.length}
                    icon={Users}
                    color="primary"
                    trend="Employees"
                    chartData={generateSparkline('up')}
                />

                <StatCard
                    title="Departments"
                    value={Object.keys(departmentStats).length}
                    icon={Briefcase}
                    color="success"
                    trend="Active Departments"
                    chartData={generateSparkline('neutral')}
                />

                <StatCard
                    title="Active Users"
                    value={employees.filter(e => e.isActive !== false).length}
                    icon={UserCheck}
                    color="info"
                    trend="Currently Active"
                    chartData={generateSparkline('up')}
                />

                <StatCard
                    title="Management"
                    value={employees.filter(e => ['ceo', 'co-founder', 'manager', 'head-of-sales'].includes(e.role)).length}
                    icon={Shield}
                    color="purple"
                    trend="Leadership Team"
                    chartData={generateSparkline('neutral')}
                />

                <StatCard
                    title="Today's Attendance"
                    value={`${attendanceData.percentage}%`}
                    icon={Clock}
                    color="success"
                    trend={`${attendanceData.present}/${attendanceData.total} Present`}
                    trendUp={attendanceData.percentage >= 85}
                    chartData={generateSparkline(attendanceData.percentage >= 85 ? 'up' : 'neutral')}
                />
            </div>

            {/* Main Content */}
            <div className="dashboard-card">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-foreground">Employee Directory</h2>
                    {/* Filters & Search */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative min-w-[240px]">
                            <input
                                type="text"
                                placeholder="Search employees..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="input-modern pl-10"
                            />
                            <Search className="absolute left-3 top-2.5 text-muted-foreground" size={18} />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar mb-4">
                    {getDepartments().map(dept => (
                        <button
                            key={dept}
                            onClick={() => setActiveDepartment(dept)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeDepartment === dept
                                ? 'bg-primary text-primary-foreground shadow-lg'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                                }`}
                        >
                            {dept}
                            {dept !== 'All' && (
                                <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${activeDepartment === dept ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background/50 text-muted-foreground'
                                    }`}>
                                    {departmentStats[dept]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Employee List */}
                <div className="overflow-x-auto">
                    <table className="dark-table">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Role & Designation</th>
                                <th>Team</th>
                                <th>Contact</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        Loading employees...
                                    </td>
                                </tr>
                            ) : filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp._id}>
                                        <td>
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold text-lg shadow-md">
                                                    {emp.firstName?.charAt(0)}{emp.lastName?.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-foreground">
                                                        {emp.firstName} {emp.lastName}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Joined {new Date(emp.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col items-start gap-1">
                                                <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-lg ${getRoleBadgeStyle(emp.role)}`}>
                                                    {getRoleDisplay(emp.role)}
                                                </span>
                                                {emp.designation && (
                                                    <span className="text-xs text-muted-foreground">{emp.designation}</span>
                                                )}
                                                <span className="text-xs text-muted-foreground font-mono">{emp.employeeId || 'ID Pending'}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="text-sm text-foreground">{emp.department || 'Unassigned'}</div>
                                                {emp.reportingToName && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Reports to: {emp.reportingToName}
                                                    </div>
                                                )}
                                                {emp.specializations && emp.specializations.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {emp.specializations.map((spec, idx) => (
                                                            <span key={idx} className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded">
                                                                {spec}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                    <Mail size={14} className="text-muted-foreground" />
                                                    {emp.email}
                                                </div>
                                                {emp.phoneNumber && (
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Phone size={14} className="text-muted-foreground" />
                                                        {emp.phoneNumber}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {emp.isActive !== false ? (
                                                <span className="status-pill status-success">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="status-pill status-danger">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-muted-foreground">
                                        No employees found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManagementDashboard;

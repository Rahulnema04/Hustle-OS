import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Users,
  Trophy,
  Clock,
  Briefcase,
  Calendar,
  CreditCard,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  CheckCircle,
  XCircle,
  Activity,
  Star,
  AlertCircle,
  TrendingUp,
  FileText,
  DollarSign,
  ClipboardCheck,
  BarChart3,
  Award,
  MoreHorizontal,
  UserPlus,
  Minus,
  Plus
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import HRPerformance from './HRPerformance';
import PayrollManagement from '../components/PayrollManagement';
import HRPayroll from './HRPayroll';
import PayrollReminderPopup from '../components/PayrollReminderPopup';
import LeaveManagement from '../components/LeaveManagement';
import AttendanceManagement from '../components/AttendanceManagement';
import AttendancePunch from '../components/AttendancePunch';
import EmployeeRecords from '../components/hr/EmployeeRecords';
import PerformanceAnalytics from '../components/hr/PerformanceAnalytics';
import ProjectReports from '../components/hr/ProjectReports';
import TeamReviews from '../components/hr/TeamReviews';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { filterEmployees } from '../utils/employeeFilter';
import { showToast } from '../utils/toast';

// --- Minimalist Chart Customization ---

const MinimalTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-zinc-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 shadow-2xl">
        {label && (
          <p className="text-zinc-400 text-xs font-medium tracking-wide mb-2">
            {label}
          </p>
        )}
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: item.color || item.fill }}
            />
            <span className="text-white font-semibold text-sm">
              {item.name || 'Value'}: {typeof item.value === 'number' ? item.value.toLocaleString() : item.value}
              {item.unit && <span className="text-zinc-500 text-xs ml-1">{item.unit}</span>}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Widget Component (Premium Dark Aesthetic) ---

const WidgetHeader = ({ title, subtitle }) => (
  <div className="flex items-start justify-between mb-3 z-10 relative">
    <div>
      <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide">{title}</h3>
      {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
    </div>
  </div>
);

const Widget = ({
  id,
  title,
  subtitle,
  size,
  onSizeChange,
  children,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialSize, setInitialSize] = useState(size);

  const getGridClass = () => {
    switch (size) {
      case 'small': return 'col-span-1 row-span-1 h-[220px]';
      case 'medium': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-1 h-[220px]';
      case 'large': return 'col-span-1 md:col-span-2 lg:col-span-2 row-span-2 h-[464px]';
      default: return 'col-span-1 h-[220px]';
    }
  };

  const handleDragStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartY(e.clientY || e.touches?.[0]?.clientY || 0);
    setInitialSize(size);
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
  };

  const handleDragMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
    const deltaY = currentY - dragStartY;

    // Threshold for size change (50px drag distance)
    if (deltaY > 50 && initialSize === 'small') {
      onSizeChange(id, 'medium');
      setInitialSize('medium');
      setDragStartY(currentY);
    } else if (deltaY > 50 && initialSize === 'medium') {
      onSizeChange(id, 'large');
      setInitialSize('large');
      setDragStartY(currentY);
    } else if (deltaY < -50 && initialSize === 'large') {
      onSizeChange(id, 'medium');
      setInitialSize('medium');
      setDragStartY(currentY);
    } else if (deltaY < -50 && initialSize === 'medium') {
      onSizeChange(id, 'small');
      setInitialSize('small');
      setDragStartY(currentY);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    // Re-enable text selection
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);

      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, dragStartY, initialSize]);

  return (
    <motion.div
      layout
      className={`relative rounded-[24px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Subtle Gradient Glow on Hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      <motion.div layout className="relative p-6 h-full flex flex-col">
        <WidgetHeader title={title} subtitle={subtitle} />
        <div className="flex-1 min-h-0 relative flex flex-col z-0">
          {children}
        </div>
      </motion.div>

      {/* Draggable Handle at Bottom-Right Corner */}
      <div
        className={`absolute bottom-1 right-1 w-8 h-8 flex items-center justify-center cursor-ns-resize z-20 opacity-0 hover:opacity-100 transition-all duration-200 ${isDragging ? 'opacity-100 scale-110' : ''} select-none`}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
      >
        <div className="flex flex-col gap-[2px] items-end justify-center p-1">
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
          </div>
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
          </div>
          <div className="flex gap-[2px]">
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
            <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-blue-400' : 'bg-white/50'}`} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// --- Helper Functions for Dynamic Data ---

// Helper function to calculate next payday (6th of current or next month)
const calculateNextPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const payDay = 6;

  let nextPayDate;
  if (currentDay < payDay) {
    // Payday is this month
    nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  } else {
    // Payday is next month
    nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  }

  return nextPayDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to calculate days until next payday
const calculateDaysUntilPayday = () => {
  const today = new Date();
  const currentDay = today.getDate();
  const payDay = 6;

  let nextPayDate;
  if (currentDay < payDay) {
    nextPayDate = new Date(today.getFullYear(), today.getMonth(), payDay);
  } else {
    nextPayDate = new Date(today.getFullYear(), today.getMonth() + 1, payDay);
  }

  const diffTime = nextPayDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Helper function to generate performance trend data based on actual avg
const generatePerformanceTrend = (avgScore) => {
  const baseScore = avgScore || 85;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return days.map((day, index) => {
    // Create a realistic weekly trend: lower on Monday, peak mid-week, dip on weekend
    const variance = index === 0 ? -5 : // Monday (lower)
      index === 2 ? 5 :   // Wednesday (peak)
        index === 4 ? 3 :   // Friday (good)
          index >= 5 ? -10 :  // Weekend (lower)
            0;
    const randomVariance = (Math.random() - 0.5) * 4; // Small random variation
    const currentScore = Math.round(Math.max(0, Math.min(100, baseScore + variance + randomVariance)));

    // Previous week score (slightly lower, flowing pattern)
    const prevVariance = index === 0 ? -3 :
      index === 2 ? 3 :
        index === 4 ? 2 :
          index >= 5 ? -8 :
            0;
    const prevScore = Math.round(Math.max(0, Math.min(100, (baseScore - 5) + prevVariance + (Math.random() - 0.5) * 3)));

    return {
      day,
      score: currentScore,
      previous: prevScore
    };
  });
};

// Helper function to generate attendance trend based on actual percentage
const generateAttendanceTrend = (avgPercentage) => {
  const basePercentage = avgPercentage || 90;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return days.map((day, index) => {
    // Realistic attendance pattern: high weekdays, low weekends
    const variance = index >= 5 ? -50 : // Weekend (very low)
      index === 0 ? -5 : // Monday (slightly lower)
        index === 4 ? -3 : // Friday (slightly lower)
          2; // Mid-week (slightly higher)
    const randomVariance = (Math.random() - 0.5) * 5;
    return {
      day,
      val: Math.round(Math.max(0, Math.min(100, basePercentage + variance + randomVariance)))
    };
  });
};

const HRDashboard = () => {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  // Real Data States
  const [performanceData, setPerformanceData] = useState([]);
  const [projectsData, setProjectsData] = useState([]);
  const [leavesData, setLeavesData] = useState({ pending: 0, approved: 0 });
  const [pendingLeaveRequests, setPendingLeaveRequests] = useState([]);
  const [attendanceData, setAttendanceData] = useState({ percentage: 92, present: 0, total: 0 });
  const [payrollData, setPayrollData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Widget States with localStorage persistence
  const [widgetStates, setWidgetStates] = useState(() => {
    // Try to load saved sizes from localStorage
    const saved = localStorage.getItem('hrDashboardWidgetSizes');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved widget sizes:', e);
      }
    }
    // Default sizes
    return {
      performance: 'large',
      employees: 'medium',
      attendance: 'large',
      projects: 'medium',
      leaves: 'medium',
      payroll: 'small'
    };
  });

  // Save widget sizes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hrDashboardWidgetSizes', JSON.stringify(widgetStates));
  }, [widgetStates]);

  // Fetch real performance data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Get today's date for attendance
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        // Get current month/year for payroll
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();

        // Fetch all data from real APIs
        const [performanceRes, projectsRes, leavesRes, attendanceRes, payrollRes, pendingLeavesRes] = await Promise.all([
          api.get('/performance/individuals?period=all-time'),
          api.get('/projects'),
          api.get('/leave/stats'),
          api.get(`/attendance/all?date=${dateStr}`),
          api.get(`/payroll/summary?month=${currentMonth}&year=${currentYear}`),
          api.get('/leave/pending-approvals')
        ]);

        // Performance data
        const employees = performanceRes.data.data || [];
        const filteredEmployees = filterEmployees(employees);
        setPerformanceData(filteredEmployees);

        // Projects data
        if (projectsRes.data.success) {
          const allProjects = projectsRes.data.data || [];
          const activeProjects = allProjects.filter(p => p.status !== 'Completed');
          setProjectsData(activeProjects);
        }

        // Leaves data
        if (leavesRes.data.success) {
          const stats = leavesRes.data.data.overview || {};
          setLeavesData({
            pending: stats.pendingRequests || 0,
            approved: stats.approvedRequests || 0,
            total: stats.totalRequests || 0
          });
        }

        // Pending leave requests for widget
        if (pendingLeavesRes.data.success) {
          const leaves = pendingLeavesRes.data.data || [];
          setPendingLeaveRequests(leaves.slice(0, 3)); // Take first 3
        }

        // Attendance data
        if (attendanceRes.data.success) {
          const summary = attendanceRes.data.data.summary || {};
          const total = summary.totalEmployees || 1;
          const present = summary.present || 0;
          const percentage = Math.round((present / total) * 100);
          setAttendanceData({
            percentage: percentage || 0,
            present,
            total,
            absent: summary.absent || 0,
            late: summary.late || 0
          });
        }

        // Payroll data
        if (payrollRes.data.success) {
          const summary = payrollRes.data.data || {};
          setPayrollData({
            totalPayout: summary.netSalary || 0,
            employeeCount: summary.totalEmployees || 0,
            nextPayday: calculateNextPayday(),
            daysUntilPayday: calculateDaysUntilPayday()
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        const errorMessage = error.response?.data?.message || 'Failed to load dashboard data. Please refresh the page.';
        showToast.error(errorMessage);
        setPerformanceData([]);
        setProjectsData([]);
        setLeavesData({ pending: 0, approved: 0, total: 0 });
        setPendingLeaveRequests([]);
        setAttendanceData({ percentage: 0, present: 0, total: 0 });
        setPayrollData(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (currentView === 'dashboard') {
      fetchDashboardData();
    }
  }, [currentView]);

  // Calculate metrics from real data
  const metrics = {
    totalEmployees: performanceData.length,
    avgCompletionRate: performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, emp) => sum + emp.completionRate, 0) / performanceData.length)
      : 0,
    totalPoints: performanceData.reduce((sum, emp) => sum + emp.totalPoints, 0),
    completedTasks: performanceData.reduce((sum, emp) => sum + emp.completedTasks, 0),
    // Department distribution (calculate from real data)
    deptDistribution: performanceData.length > 0
      ? calculateDepartmentDistribution(performanceData)
      : [],
    // Dynamic performance trend based on actual avg
    performanceTrend: generatePerformanceTrend(
      performanceData.length > 0
        ? Math.round(performanceData.reduce((sum, emp) => sum + emp.completionRate, 0) / performanceData.length)
        : 85
    ),
    // Dynamic attendance trend based on today's percentage
    attendanceTrend: generateAttendanceTrend(attendanceData.percentage)
  };

  // Helper function to calculate department distribution
  function calculateDepartmentDistribution(employees) {
    const deptCounts = {};
    employees.forEach(emp => {
      const dept = emp.department || 'Other';
      const shortDept = dept.substring(0, 3);
      deptCounts[shortDept] = (deptCounts[shortDept] || 0) + 1;
    });

    return Object.entries(deptCounts).map(([name, value]) => ({ name, value }));
  }

  const handleWidgetSizeChange = (id, newSize) => {
    setWidgetStates(prev => ({ ...prev, [id]: newSize }));
  };

  const sidebarActions = [
    { label: 'Dashboard', icon: Users, onClick: () => setCurrentView('dashboard'), active: currentView === 'dashboard', themeColor: '34, 197, 94' },
    { label: 'My Attendance', icon: Clock, onClick: () => setCurrentView('my-attendance'), active: currentView === 'my-attendance', themeColor: '59, 130, 246' },
    { label: 'Attendance Mgmt', icon: ClipboardCheck, onClick: () => setCurrentView('attendance'), active: currentView === 'attendance', themeColor: '139, 92, 246' },
    { label: 'Performance', icon: Trophy, onClick: () => setCurrentView('performance'), active: currentView === 'performance', themeColor: '251, 191, 36' },
    { label: 'Employee Records', icon: FileText, onClick: () => setCurrentView('employees'), active: currentView === 'employees', themeColor: '236, 72, 153' },
    { label: 'Payroll', icon: DollarSign, onClick: () => setCurrentView('payroll'), active: currentView === 'payroll', themeColor: '16, 185, 129' },
    { label: 'Leave Management', icon: Calendar, onClick: () => setCurrentView('leave'), active: currentView === 'leave', themeColor: '239, 68, 68' },
    { label: 'Project Reports', icon: BarChart3, onClick: () => setCurrentView('projects'), active: currentView === 'projects', themeColor: '99, 102, 241' },
    { label: 'Team Reviews', icon: Award, onClick: () => setCurrentView('reviews'), active: currentView === 'reviews', themeColor: '249, 115, 22' }
  ];

  if (currentView !== 'dashboard') {
    const ComponentMap = {
      employees: EmployeeRecords,
      analytics: PerformanceAnalytics,
      projects: ProjectReports,
      reviews: TeamReviews,
      performance: HRPerformance,
      attendance: AttendanceManagement,
      'my-attendance': AttendancePunch,
      payroll: HRPayroll,
      leave: LeaveManagement
    };
    const Component = ComponentMap[currentView];
    return <DashboardLayout sidebarActions={sidebarActions} onBack={() => setCurrentView('dashboard')} showBackButtonOverride={true}><Component /></DashboardLayout>;
  }

  return (
    <>
      <PayrollReminderPopup userRole={user?.role} />
      <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={false}>
        <div className="p-2">
          <div className="mb-8 flex justify-between items-center px-2">
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-lg">Summary</h1>
              <p className="text-zinc-500 text-sm mt-1">{formatDate(new Date())}</p>
            </div>
            <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-zinc-300 font-medium tracking-wide">LIVE UPDATES</span>
            </div>
          </div>

          <LayoutGroup>
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min grid-flow-dense pb-10">

              {/* --- Widget 1: PERFORMANCE (Area Chart - Sky Blue Glow - More Faded) --- */}
              <Widget id="performance" title="Performance" subtitle="Weekly Team Score" size={widgetStates.performance} onSizeChange={handleWidgetSizeChange}>

                {/* Gradients - Wrapped in SVG to prevent <defs> warning */}
                <svg width={0} height={0} style={{ position: 'absolute' }}>
                  <defs>
                    <linearGradient id="skyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.4} /> {/* Reduced opacity start */}
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="skyStroke" x1="0%" y1="0" x2="100%" y2="0">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.3} />
                      <stop offset="20%" stopColor="#0ea5e9" stopOpacity={0.5} />
                      <stop offset="40%" stopColor="#0ea5e9" stopOpacity={0.7} />
                      <stop offset="60%" stopColor="#0ea5e9" stopOpacity={0.85} />
                      <stop offset="80%" stopColor="#0ea5e9" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="#0ea5e9" stopOpacity={1} />
                    </linearGradient>
                    <filter id="sky-glow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                </svg>

                {widgetStates.performance === 'small' && (
                  <div className="flex flex-col justify-between h-full">
                    {/* Added min-h to prevent Recharts warning */}
                    <div className="flex-1 flex items-end pb-2 min-h-[60px]">
                      <ResponsiveContainer width="100%" height="90%">
                        <AreaChart data={metrics.performanceTrend}>
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            fill="url(#skyGradient)"
                            isAnimationActive={true}
                            animationDuration={1500}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="text-white text-4xl font-bold tracking-tighter drop-shadow-md">{metrics.avgCompletionRate}<span className="text-zinc-500 text-sm font-normal ml-1 tracking-normal">avg</span></div>
                  </div>
                )}
                {(widgetStates.performance === 'medium' || widgetStates.performance === 'large') && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className="text-zinc-400 text-xs font-medium leading-relaxed max-w-[180px]">Your team's performance is <span className="text-sky-400">ahead</span> of where they normally are.</div>
                      <div className="flex gap-2">
                        <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-2 py-1">
                          <div className="text-[9px] text-sky-400 font-medium uppercase tracking-wider">Avg</div>
                          <div className="text-lg font-bold text-white">{metrics.avgCompletionRate}</div>
                        </div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1">
                          <div className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">Peak</div>
                          <div className="text-lg font-bold text-white">95</div>
                        </div>
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-lg px-2 py-1 flex flex-col items-center justify-center">
                          <div className="text-[9px] text-violet-400 font-medium uppercase tracking-wider">Trend</div>
                          <div className="text-xs font-bold text-emerald-400 flex items-center">
                            <TrendingUp size={12} className="mr-0.5" />
                            5.2%
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Added min-h to prevent Recharts warning */}
                    <div className="flex-1 w-full relative min-h-[100px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.performanceTrend}>
                          <CartesianGrid vertical={false} horizontal={true} stroke="#27272a" strokeDasharray="3 3" />
                          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 10 }} dy={10} />
                          <Tooltip content={<MinimalTooltip />} cursor={{ stroke: '#333' }} />

                          {/* Previous Week Line (Subtle Purple) */}
                          <Line
                            type="monotone"
                            dataKey="previous"
                            stroke="#a78bfa"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                            opacity={0.5}
                            isAnimationActive={true}
                            animationDuration={2000}
                            name="Last Week"
                          />

                          {/* Current Performance Area (Sky Blue) */}
                          <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            fill="url(#skyGradient)"
                            activeDot={{ r: 6, fill: '#0ea5e9', stroke: '#fff', strokeWidth: 2 }}
                            isAnimationActive={true}
                            animationDuration={2000}
                            filter="url(#sky-glow)"
                            name="This Week"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </Widget>

              {/* --- Widget 2: EMPLOYEES (Bar Graph - Vibrant Violet) --- */}
              <Widget id="employees" title="Total Employees" subtitle="Active Workforce" size={widgetStates.employees} onSizeChange={handleWidgetSizeChange}>

                {widgetStates.employees === 'small' && (
                  <div className="flex flex-col items-center justify-center h-full relative">
                    <div className="flex flex-col items-center mb-3">
                      <span className="text-5xl font-bold text-white tracking-tighter drop-shadow-[0_0_15px_rgba(139,92,246,0.3)]">{metrics.totalEmployees}</span>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mt-1">Onboarded</p>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 h-10 flex items-end justify-between px-2 gap-1.5 opacity-80">
                      {metrics.deptDistribution.slice(0, 8).map((d, i) => (
                        <div key={i} className="w-full bg-zinc-800/30 rounded-t-sm relative" style={{ height: `${d.value}%` }}>
                          <div className="absolute inset-0 bg-gradient-to-t from-violet-600 to-fuchsia-500 rounded-t-sm"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(widgetStates.employees === 'medium' || widgetStates.employees === 'large') && (
                  <div className="flex flex-col h-full">
                    <div className="flex justify-center items-end mb-6 mt-2">
                      <span className="text-6xl font-bold text-white tracking-tighter drop-shadow-xl">{metrics.totalEmployees}</span>
                      <span className="text-xs text-zinc-500 mb-3 ml-3 font-medium tracking-wide">ACTIVE USERS</span>
                    </div>
                    <div className="flex-1 w-full min-h-[100px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.deptDistribution} barCategoryGap="8%">
                          <defs>
                            <linearGradient id="violetToPink" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#d946ef" stopOpacity={1} />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                            </linearGradient>
                          </defs>
                          <Tooltip content={<MinimalTooltip />} cursor={{ fill: 'transparent' }} />
                          <Bar
                            dataKey="value"
                            radius={[4, 4, 4, 4]}
                            barSize={30}
                            fill="url(#violetToPink)"
                            animationDuration={1200}
                          >
                            {metrics.deptDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fillOpacity={0.3 + (index * 0.1)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 text-center text-[10px] text-zinc-500 uppercase tracking-widest font-medium">Department Distribution</div>
                  </div>
                )}
              </Widget>

              {/* --- Widget 3: ATTENDANCE (Clean Layout - No Boxes) --- */}
              <Widget id="attendance" title="Attendance" subtitle="Activity & Trends" size={widgetStates.attendance} onSizeChange={handleWidgetSizeChange}>

                {/* SMALL VIEW */}
                {widgetStates.attendance === 'small' && (
                  <div className="h-full flex flex-col items-center justify-center relative pb-2">
                    <div className="relative h-20 w-20 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="6" />
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="283" strokeDashoffset={283 - (283 * (attendanceData.percentage / 100))} strokeLinecap="round" className="drop-shadow-[0_0_4px_rgba(16,185,129,0.3)]" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-xl font-bold text-white tracking-tight">{attendanceData.percentage}%</span>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-4 text-[10px] font-medium uppercase tracking-wide">
                      <div className="text-white flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>{attendanceData.present} In</div>
                      <div className="text-zinc-500 flex items-center"><span className="w-1.5 h-1.5 rounded-full bg-zinc-700 mr-1.5"></span>{attendanceData.late} Late</div>
                    </div>
                  </div>
                )}

                {/* MEDIUM & LARGE VIEWS */}
                {widgetStates.attendance !== 'small' && (
                  <div className="h-full flex flex-col">
                    {/* Top Section */}
                    <div className={`flex items-center justify-between ${widgetStates.attendance === 'large' ? 'h-1/2 border-b border-zinc-800/50 mb-4 pb-4' : 'h-full'}`}>

                      {/* Left: Ring */}
                      <div className="relative h-28 w-28 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="h-full w-full rotate-[-90deg]">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="5" />
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#10b981" strokeWidth="5" strokeDasharray="283" strokeDashoffset={283 - (283 * (attendanceData.percentage / 100))} strokeLinecap="round" className="drop-shadow-[0_0_6px_rgba(16,185,129,0.25)]" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xs text-zinc-500 font-medium mb-1">TODAY</span>
                          <span className="text-3xl font-bold text-white tracking-tighter drop-shadow-lg">{attendanceData.percentage}%</span>
                        </div>
                      </div>

                      {/* Right: Stats (Clean - No Boxes) */}
                      <div className="flex flex-col justify-center space-y-4 pl-4 flex-1">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-0.5">On Time</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-3xl font-bold text-white tracking-tight">{attendanceData.present}</span>
                            <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]">+{Math.max(0, attendanceData.present - Math.floor(attendanceData.total * 0.9))}</span>
                          </div>
                        </div>
                        <div className="flex space-x-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Late</span>
                            <span className="text-xl font-bold text-zinc-300 tracking-tight">{String(attendanceData.late).padStart(2, '0')}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Absent</span>
                            <span className="text-xl font-bold text-zinc-300 tracking-tight">{String(attendanceData.absent).padStart(2, '0')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Section: Weekly History */}
                    {widgetStates.attendance === 'large' && (
                      <div className="h-1/2 flex flex-col pt-2">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-xs text-zinc-300 font-medium">Weekly Trends</span>
                          <span className="text-[10px] text-zinc-500 font-mono">Avg: 09:12 AM</span>
                        </div>
                        <div className="flex-1 w-full min-h-[100px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.attendanceTrend} barSize={36} barCategoryGap="10%">
                              <defs>
                                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.8} />
                                  <stop offset="100%" stopColor="#059669" stopOpacity={0.2} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid vertical={false} horizontal={true} stroke="#27272a" strokeDasharray="3 3" />
                              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#52525b', fontSize: 10 }} dy={8} />
                              <Tooltip cursor={{ fill: 'transparent' }} content={<MinimalTooltip />} />
                              <Bar dataKey="val" radius={[4, 4, 4, 4]} animationDuration={1500}>
                                {metrics.attendanceTrend.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.val < 80 ? '#27272a' : 'url(#emeraldGradient)'}
                                    fillOpacity={entry.val < 80 ? 0.5 : (0.4 + (index * 0.1))}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </Widget>

              {/* --- Widget 4: ACTIVE PROJECTS (Multi-Color Gradients) --- */}
              <Widget id="projects" title="Projects" subtitle="Active Pipelines" size={widgetStates.projects} onSizeChange={handleWidgetSizeChange}>
                {widgetStates.projects === 'small' && (
                  <div className="h-full flex flex-col justify-center">
                    {projectsData.slice(0, 2).map((project, i) => (
                      <div key={project._id} className="mb-4 last:mb-0">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-zinc-300 text-xs font-medium truncate mr-2">{project.name}</span>
                          <span className="text-white text-xs font-mono">
                            {project.progress !== undefined ? `${project.progress}%` : '0%'}
                          </span>
                        </div>
                        <div className="w-full bg-zinc-900 h-2 rounded-full shadow-inner border border-white/5">
                          <div
                            className={`h-full rounded-full ${i === 0 ? 'bg-gradient-to-r from-cyan-400 to-blue-500' : 'bg-gradient-to-r from-fuchsia-400 to-purple-500'} shadow-[0_0_10px_rgba(34,211,238,0.4)]`}
                            style={{ width: `${project.progress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                    {projectsData.length === 0 && (
                      <div className="text-center text-zinc-500 text-xs">No active projects</div>
                    )}
                  </div>
                )}
                {widgetStates.projects !== 'small' && (
                  <div className="h-full flex flex-col">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <span className="text-4xl font-bold text-white tracking-tighter drop-shadow-md">{projectsData.length}</span>
                        <span className="text-xs text-zinc-500 ml-2 font-medium tracking-wide">ACTIVE</span>
                      </div>
                      <button className="text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-full transition-all">View All</button>
                    </div>

                    <div className="flex-1 space-y-5 overflow-auto pr-1 custom-scrollbar">
                      {projectsData.slice(0, 4).map((project, i) => {
                        const gradients = [
                          { gradient: 'from-cyan-400 to-blue-600', hoverColor: 'group-hover:text-cyan-400' },
                          { gradient: 'from-fuchsia-400 to-purple-600', hoverColor: 'group-hover:text-fuchsia-400' },
                          { gradient: 'from-emerald-400 to-green-600', hoverColor: 'group-hover:text-emerald-400' },
                          { gradient: 'from-rose-400 to-red-600', hoverColor: 'group-hover:text-rose-400' },
                        ];
                        const proj = gradients[i % gradients.length];
                        const progress = project.progress || 0;
                        const deadline = project.deadline ? new Date(project.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No deadline';

                        return (
                          <div key={project._id} className="group">
                            <div className="flex justify-between items-center mb-1.5">
                              <div>
                                <div className={`text-sm text-white font-medium transition-colors duration-300 ${proj.hoverColor}`}>{project.name}</div>
                                <div className="text-[10px] text-zinc-500">Due {deadline}</div>
                              </div>
                              <span className="text-xs font-mono text-white opacity-80">{progress}%</span>
                            </div>
                            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden shadow-inner border border-white/5">
                              <div
                                className={`h-full rounded-full transition-all duration-1000 bg-gradient-to-r ${proj.gradient} shadow-[0_0_12px_rgba(255,255,255,0.2)]`}
                                style={{ width: `${progress}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                      {projectsData.length === 0 && (
                        <div className="text-center text-zinc-500 text-sm py-8">No active projects found</div>
                      )}
                    </div>
                  </div>
                )}
              </Widget>

              {/* --- Widget 5: Payroll (Timeline Countdown) --- */}
              <Widget id="payroll" title="Payroll" subtitle="Next Payout" size={widgetStates.payroll} onSizeChange={handleWidgetSizeChange}>
                {widgetStates.payroll === 'small' ? (
                  // SMALL VIEW - Simplified
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="text-center mb-3">
                      <div className="text-xs text-zinc-500 mb-1">Total Payout</div>
                      <div className="text-4xl font-bold text-white tracking-tight">
                        {payrollData ? `₹${(payrollData.totalPayout / 100000).toFixed(1)}L` : '₹0'}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-5xl font-bold text-orange-500 tracking-tighter mb-1">
                        {payrollData ? payrollData.daysUntilPayday : 0}
                      </div>
                      <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Days Until Payday</div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                      <div className="text-[9px] text-orange-400 font-medium">
                        {payrollData ? payrollData.nextPayday : 'N/A'}
                      </div>
                    </div>
                  </div>
                ) : (
                  // MEDIUM/LARGE VIEW - Full Details
                  <div className="h-full flex flex-col justify-between">
                    {/* Top Section - Amount & Date */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs text-zinc-500 mb-1">Total Payout</div>
                        <div className="text-3xl font-bold text-white tracking-tight">
                          {payrollData ? `₹${(payrollData.totalPayout / 100000).toFixed(1)}L` : '₹0'}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
                          <div className="text-[9px] text-orange-400 font-medium">
                            {payrollData ? payrollData.nextPayday : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-4xl font-bold text-orange-500 tracking-tighter">
                          {payrollData ? payrollData.daysUntilPayday : 0}
                        </div>
                        <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Days Left</div>
                      </div>
                    </div>

                    {/* Middle Section - Timeline Dots */}
                    <div className="flex items-center justify-between px-1 my-3">
                      {[...Array(Math.min(payrollData?.daysUntilPayday || 5, 7))].map((_, index) => (
                        <div key={index} className="flex flex-col items-center gap-1">
                          <div className={`w-2 h-2 rounded-full transition-all ${index < ((payrollData?.daysUntilPayday || 5) - 3)
                            ? 'bg-zinc-700'
                            : 'bg-orange-500 shadow-[0_0_8px_rgba(251,146,60,0.6)]'
                            }`}></div>
                          <div className="text-[7px] text-zinc-600 font-medium">{index + 1}</div>
                        </div>
                      ))}
                    </div>

                    {/* Bottom Section - Details */}
                    <div className="grid grid-cols-2 gap-2">
                      {/* Employee Count */}
                      <div className="p-2 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Users className="w-3 h-3 text-orange-400" />
                          <span className="text-[9px] text-zinc-500">Employees</span>
                        </div>
                        <div className="text-lg font-bold text-white">
                          {payrollData ? payrollData.employeeCount : 0}
                        </div>
                      </div>

                      {/* Payment Method */}
                      <div className="p-2 bg-zinc-900/30 rounded-lg border border-zinc-800/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CreditCard className="w-3 h-3 text-orange-400" />
                          <span className="text-[9px] text-zinc-500">Method</span>
                        </div>
                        <div className="text-[10px] font-semibold text-emerald-400">Bank Auto</div>
                      </div>
                    </div>
                  </div>
                )}
              </Widget>

              {/* --- Widget 6: Leave Requests (List) --- */}
              <Widget id="leaves" title="Leaves" subtitle="Approvals" size={widgetStates.leaves} onSizeChange={handleWidgetSizeChange}>
                <div className="h-full flex flex-col">
                  {/* Stats Summary */}
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5">
                      <div className="text-[9px] text-orange-400 font-medium uppercase tracking-wider">Pending</div>
                      <div className="text-lg font-bold text-white">{leavesData.pending}</div>
                    </div>
                    <div className="flex-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5">
                      <div className="text-[9px] text-emerald-400 font-medium uppercase tracking-wider">Approved</div>
                      <div className="text-lg font-bold text-white">{leavesData.approved}</div>
                    </div>
                  </div>

                  {/* List of pending requests */}
                  <div className="flex-1 space-y-3 overflow-auto custom-scrollbar">
                    {pendingLeaveRequests.length > 0 ? (
                      pendingLeaveRequests.map((leave, index) => {
                        const employee = leave.employee || {};
                        const firstName = employee.firstName || '';
                        const lastName = employee.lastName || '';
                        const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                        const leaveType = leave.leaveType || 'Leave';
                        const startDate = leave.startDate ? new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';

                        const gradients = [
                          'from-indigo-500 to-violet-600',
                          'from-pink-500 to-rose-600',
                          'from-cyan-500 to-blue-600',
                          'from-emerald-500 to-green-600',
                        ];

                        return (
                          <div key={leave._id || index} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 hover:border-zinc-700 transition-all hover:bg-zinc-900 group cursor-pointer">
                            <div className="flex items-center space-x-3">
                              <div className={`h-9 w-9 rounded-full bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center text-xs text-white font-bold shadow-lg`}>
                                {initials}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                  {firstName} {lastName.charAt(0)}.
                                </div>
                                <div className="text-[10px] text-zinc-500">
                                  {leaveType} • {startDate}
                                </div>
                              </div>
                            </div>
                            <button
                              className="h-7 w-7 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all"
                              onClick={() => {/* Add approval handler */ }}
                            >
                              <CheckCircle size={14} />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full text-zinc-500 text-sm">
                        No pending leave requests
                      </div>
                    )}
                  </div>
                </div>
              </Widget>

            </motion.div>
          </LayoutGroup>
        </div>
      </DashboardLayout>
    </>
  );
};

export default HRDashboard;
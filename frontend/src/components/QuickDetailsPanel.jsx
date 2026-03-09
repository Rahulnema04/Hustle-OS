import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
    X,
    ArrowUpRight,
    ArrowUp,
    User,
    Mail,
    Shield,
    Briefcase,
    Calendar,
    MapPin,
    Phone,
    FileText,
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    Hash,
    TrendingUp,
    DollarSign,
    BarChart2,
    Target,
    FolderKanban
} from 'lucide-react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
    CartesianGrid
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

// Minimal Tooltip Component - CoFounder Dashboard Style
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
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// Widget Header Component - CoFounder Dashboard Style
const WidgetHeader = ({ title, subtitle, icon: Icon }) => (
    <div className="flex items-start justify-between mb-3 z-10 relative">
        <div>
            <h3 className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 font-bold text-sm tracking-wide flex items-center gap-2">
                {Icon && <Icon size={14} className="text-cyan-400" />}
                {title}
            </h3>
            {subtitle && <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">{subtitle}</p>}
        </div>
    </div>
);

// Resizable Widget Component with Drag Handle - Exact CoFounder Dashboard Style
const AnalyticsWidget = ({
    id,
    title,
    subtitle,
    icon,
    size,
    onSizeChange,
    children,
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartY, setDragStartY] = useState(0);
    const [initialSize, setInitialSize] = useState(size);

    useEffect(() => {
        setInitialSize(size);
    }, [size]);

    const getGridClass = () => {
        switch (size) {
            case 'small': return 'col-span-1 row-span-1 h-[200px]';
            case 'medium': return 'col-span-2 row-span-1 h-[200px]';
            case 'large': return 'col-span-2 row-span-2 h-[424px]';
            default: return 'col-span-1 h-[200px]';
        }
    };

    const handleDragStart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        setDragStartY(e.clientY || e.touches?.[0]?.clientY || 0);
        setInitialSize(size);
        document.body.style.userSelect = 'none';
        document.body.style.webkitUserSelect = 'none';
    };

    const handleDragMove = (e) => {
        if (!isDragging) return;

        e.preventDefault();
        const currentY = e.clientY || e.touches?.[0]?.clientY || 0;
        const deltaY = currentY - dragStartY;

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
            className={`relative rounded-[20px] bg-gradient-to-b from-[#18181b] to-[#09090b] border border-white/5 shadow-2xl overflow-hidden group outline-none focus:outline-none ${getGridClass()}`}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

            <motion.div layout className="relative p-4 h-full flex flex-col">
                <WidgetHeader title={title} subtitle={subtitle} icon={icon} />
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
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                    <div className="flex gap-[2px]">
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                        <div className={`w-[3px] h-[3px] rounded-full transition-all ${isDragging ? 'bg-cyan-400' : 'bg-white/50'}`} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const QuickDetailsPanel = ({ item, onClose }) => {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    // Widget Sizes State with localStorage persistence - CoFounder Dashboard Style
    const [widgetSizes, setWidgetSizes] = useState(() => {
        const defaults = {
            attendance: 'small',
            tasks: 'small',
            projects: 'small',
            progress: 'small',
            payroll: 'small'
        };
        const saved = localStorage.getItem('employeeAnalyticsWidgetSizes_v1');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return { ...defaults, ...parsed };
            } catch (e) {
                // Silently fail and use defaults
            }
        }
        return defaults;
    });

    // Save widget sizes to localStorage
    useEffect(() => {
        localStorage.setItem('employeeAnalyticsWidgetSizes_v1', JSON.stringify(widgetSizes));
    }, [widgetSizes]);

    // Handle widget size change
    const handleWidgetSizeChange = (id, newSize) => {
        setWidgetSizes(prev => ({ ...prev, [id]: newSize }));
    };

    useEffect(() => {
        if (item) {
            setIsClosing(false);
            setIsExpanded(false); // Reset expansion state when opening new item
        }
    }, [item]);

    useEffect(() => {
        if (item?.id) {
            fetchDetails();
        } else {
            setData(null);
            setError(null);
        }
    }, [item]);

    // Lock body scroll when panel is open
    useEffect(() => {
        if (item) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [item]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = item.type === 'user' ? `/users/${item.id}` : `/projects/${item.id}`;
            const response = await api.get(endpoint);

            if (response.data?.success && response.data?.data) {
                // Handle both user and project data structures
                const details = response.data.data.user || response.data.data;
                setData(details);
            } else {
                throw new Error('Failed to fetch details');
            }
        } catch (err) {
            console.error('Fetch details error:', err);
            setError('Could not load details. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleViewFullRecord = () => {
        if (!item) return;

        // Navigate based on type
        if (item.type === 'user') {
            navigate('/users');
        } else if (item.type === 'project') {
            navigate('/hr/performance');
        }

        onClose(); // Close the panel after navigation
    };

    if (!item) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[70] flex items-center justify-end p-6 pointer-events-none">
                {/* Backdrop - Blocks background clicks */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={isClosing ? { opacity: 0 } : { opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsClosing(true)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md cursor-pointer pointer-events-auto"
                />

                {/* Panel - Floating content on blur backdrop */}
                <motion.div
                    initial={{ x: '110%', opacity: 0 }}
                    animate={isClosing ? { x: '120%', opacity: 0 } : { x: 0, opacity: 1 }}
                    exit={{ x: '110%', opacity: 0 }}
                    onAnimationComplete={(definition) => {
                        // If we just finished the closing animation, call the actual onClose prop
                        if (isClosing) {
                            onClose();
                        }
                    }}
                    transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                    className={`relative w-full ${isExpanded ? 'max-w-full h-full' : 'max-w-sm h-[85vh]'} flex flex-col overflow-visible pointer-events-auto transition-all duration-500 ease-in-out ${isExpanded ? 'bg-transparent' : 'bg-black rounded-[24px] shadow-2xl'}`}
                >


                    {/* Content - No scroll here, let inner sections handle it */}
                    <div className="flex-1 flex flex-row overflow-visible min-h-0">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full gap-5">
                                <div className="w-12 h-12 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin shadow-glow-sm" />
                                <p className="text-gray-400 text-xs font-medium tracking-wide animate-pulse">Synchronizing Data...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center h-full p-10 text-center">
                                <div className="p-5 bg-red-500/10 rounded-full text-red-400 mb-5 shadow-inner">
                                    <AlertCircle size={32} />
                                </div>
                                <h3 className="text-white font-bold text-lg mb-2">Sync Failed</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">{error}</p>
                                <button
                                    onClick={fetchDetails}
                                    className="px-8 py-3 gradient-primary text-white rounded-2xl text-sm font-bold shadow-glow-sm active:scale-95 transition-transform"
                                >
                                    Try Again
                                </button>
                            </div>
                        ) : data && (

                            <div className="h-full flex flex-row w-full">
                                {item.type === 'user' ? (
                                    <>
                                        {/* Left Panel: Full Details - HORIZONTAL LAYOUT */}
                                        <div className={`flex-1 overflow-x-auto overflow-y-auto custom-scrollbar transition-all duration-500 ${isExpanded ? 'w-auto opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                                            {/* Header */}
                                            <div className="px-6 pt-6 pb-4">
                                                <h2 className="text-xl font-black text-white tracking-tight">Personal File</h2>
                                                <p className="text-gray-500 text-xs mt-1">Comprehensive employee records</p>
                                            </div>

                                            {/* Horizontal Scrollable Sections */}
                                            <div className="flex flex-row gap-3 px-6 pb-6 w-full justify-between">

                                                {/* Column 1: Personal Details */}
                                                <div className="flex-1 min-w-[220px] max-w-[260px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <User size={12} /> Personal
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">First Name</span>
                                                            <span className="text-sm font-semibold text-white">{data.firstName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Last Name</span>
                                                            <span className="text-sm font-semibold text-white">{data.lastName}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Email</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[150px]" title={data.email}>{data.email}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Phone</span>
                                                            <span className="text-sm font-semibold text-white">{data.phoneNumber || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">DOB</span>
                                                            <span className="text-sm font-semibold text-white">{data.dateOfBirth ? new Date(data.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Address</span>
                                                            <span className="text-sm font-semibold text-white truncate max-w-[150px]" title={typeof data.address === 'string' ? data.address : ''}>
                                                                {typeof data.address === 'string' ? data.address : data.address ? `${data.address.city || 'N/A'}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 2: Employment */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Briefcase size={12} /> Employment
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Department</span>
                                                            <span className="text-sm font-semibold text-white">{data.department || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Designation</span>
                                                            <span className="text-sm font-semibold text-white">{data.roleDisplay || data.role || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Joined</span>
                                                            <span className="text-sm font-semibold text-white">{new Date(data.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Reports To</span>
                                                            <span className="text-sm font-semibold text-white">Management</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Status</span>
                                                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${data.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                {data.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Column 3: Education */}
                                                <div className="flex-1 min-w-[180px] max-w-[220px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <FileText size={12} /> Education
                                                    </h3>
                                                    {data.education && (data.education.instituteName || data.education.highestQualification) ? (
                                                        <div className="space-y-3">
                                                            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                                                <p className="text-sm font-semibold text-white">{data.education.instituteName || 'N/A'}</p>
                                                                <p className="text-xs text-gray-400 mt-1">{data.education.highestQualification || 'Degree not specified'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-gray-500 text-sm italic">No records</p>
                                                    )}
                                                </div>

                                                {/* Column 4: Documents & Bank */}
                                                <div className="flex-1 min-w-[200px] max-w-[240px] space-y-2">
                                                    <h3 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <Shield size={12} /> Documents
                                                    </h3>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">PAN</span>
                                                            <span className="text-sm font-semibold text-white font-mono">{data.panDetails?.number || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Aadhaar</span>
                                                            <span className="text-sm font-semibold text-white font-mono">
                                                                {data.aadhaarDetails?.number ? `XXXX-XXXX-${data.aadhaarDetails.number.slice(-4)}` : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1 border-b border-white/5">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Bank</span>
                                                            <span className="text-sm font-semibold text-white">{data.bankDetails?.bankName || 'N/A'}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center py-1">
                                                            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Account</span>
                                                            <span className="text-sm font-semibold text-white font-mono">{data.bankDetails?.accountNumber || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                            </div>

                                            {/* ========== EMPLOYEE ANALYTICS GRAPHS - CoFounder Dashboard Style ========== */}
                                            <div className="px-6 pb-6 mt-4">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <h2 className="text-lg font-bold text-white tracking-tight">Analytics Overview</h2>
                                                        <p className="text-zinc-500 text-[10px] mt-0.5 font-medium tracking-wider uppercase">Performance Metrics</p>
                                                    </div>
                                                    <div className="flex items-center space-x-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5 backdrop-blur-sm">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                        </span>
                                                        <span className="text-[9px] font-mono text-zinc-300 font-medium tracking-wide">LIVE</span>
                                                    </div>
                                                </div>

                                                {/* Resizable Widgets Grid with LayoutGroup */}
                                                <LayoutGroup>
                                                    <motion.div layout className="grid grid-cols-4 gap-4 auto-rows-min">

                                                        {/* Widget 1: Attendance & Leave */}
                                                        <AnalyticsWidget
                                                            id="attendance"
                                                            title="Attendance"
                                                            subtitle="This Month"
                                                            icon={Calendar}
                                                            size={widgetSizes.attendance}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            <div className="flex flex-col h-full overflow-hidden relative">
                                                                {/* Header Stat Area - Moved Layout Up */}
                                                                <div className="flex flex-col items-center mt-1 z-20 relative">
                                                                    <div className="flex items-start">
                                                                        <ArrowUp size={14} className="text-white mt-1.5 mr-1" />
                                                                        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]" style={{ fontFamily: 'Inter, sans-serif' }}>
                                                                            85<span className="text-2xl text-zinc-400 font-bold ml-1">%</span>
                                                                        </span>
                                                                    </div>
                                                                    <span className="text-white font-bold text-[10px] uppercase tracking-widest mt-0.5 opacity-90">Consistency Rate</span>
                                                                    <span className="text-zinc-500 text-[9px] font-medium tracking-wider mt-0.5">High in Q1</span>
                                                                </div>

                                                                {/* Tide Curve Graph - Reduced Height to avoid overlap */}
                                                                <div className="absolute inset-x-0 bottom-0 h-[45%] w-full z-10 pointer-events-none">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={[
                                                                            { time: '06:00', value: 10 },
                                                                            { time: '08:00', value: 30 },
                                                                            { time: '10:00', value: 60 },
                                                                            { time: '12:00', value: 85 },
                                                                            { time: '14:00', value: 65 },
                                                                            { time: '16:00', value: 45 },
                                                                            { time: '18:00', value: 25 },
                                                                            { time: '20:00', value: 10 },
                                                                        ]}>
                                                                            <defs>
                                                                                <linearGradient id="tideGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="0%" stopColor="#ffffff" stopOpacity={0.3} />
                                                                                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.0} />
                                                                                </linearGradient>
                                                                            </defs>
                                                                            <Area
                                                                                type="monotone"
                                                                                dataKey="value"
                                                                                stroke="#ffffff"
                                                                                strokeWidth={2.5}
                                                                                fill="url(#tideGradient)"
                                                                                animationDuration={1500}
                                                                            />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>

                                                                    {/* Fake 'Current' Indicator Overlay - Adjusted Position */}
                                                                    <div className="absolute top-[18%] left-1/2 -translate-x-1/2 flex flex-col items-center">
                                                                        <div className="w-2.5 h-2.5 bg-zinc-900 border-[2px] border-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)] z-20"></div>
                                                                        <div className="w-px h-24 bg-gradient-to-b from-white/40 to-transparent -mt-0.5"></div>
                                                                    </div>
                                                                </div>

                                                                {/* Time Labels Overlay */}
                                                                <div className="absolute bottom-1.5 left-0 right-0 flex justify-between px-5 text-[9px] text-zinc-600 font-bold z-20">
                                                                    <span>09:00</span>
                                                                    <span className="text-white/80">12:00</span>
                                                                    <span>18:00</span>
                                                                </div>
                                                            </div>
                                                        </AnalyticsWidget>

                                                        {/* Widget 2: Tasks */}
                                                        <AnalyticsWidget
                                                            id="tasks"
                                                            title="Tasks"
                                                            subtitle="Weekly Stats"
                                                            icon={CheckCircle2}
                                                            size={widgetSizes.tasks}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.tasks === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full">
                                                                    <div className="text-3xl font-bold text-white">22</div>
                                                                    <div className="text-[9px] text-zinc-500 mt-1">Completed</div>
                                                                    <div className="text-[9px] text-rose-400 mt-1">6 Pending</div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1">
                                                                    <ResponsiveContainer width="100%" height={widgetSizes.tasks === 'large' ? 300 : 130}>
                                                                        <BarChart data={[{ day: 'M', completed: 3, pending: 1 }, { day: 'T', completed: 5, pending: 2 }, { day: 'W', completed: 4, pending: 1 }, { day: 'T', completed: 6, pending: 0 }, { day: 'F', completed: 4, pending: 2 }]} barSize={widgetSizes.tasks === 'large' ? 24 : 14}>
                                                                            <CartesianGrid vertical={false} stroke="#ffffff" strokeOpacity={0.05} />
                                                                            <XAxis dataKey="day" tick={{ fill: '#71717a', fontSize: 9 }} axisLine={false} tickLine={false} />
                                                                            <Tooltip content={<MinimalTooltip />} />
                                                                            <Bar dataKey="completed" radius={[3, 3, 0, 0]} fill="#ffffff" />
                                                                            <Bar dataKey="pending" radius={[3, 3, 0, 0]} fill="#f43f5e" fillOpacity={0.6} />
                                                                        </BarChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 3: Projects */}
                                                        <AnalyticsWidget
                                                            id="projects"
                                                            title="Projects"
                                                            subtitle="Assigned"
                                                            icon={FolderKanban}
                                                            size={widgetSizes.projects}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            <div className="flex flex-col justify-center h-full text-center">
                                                                <div className="text-4xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">4</div>
                                                                <div className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">Active</div>
                                                                {widgetSizes.projects !== 'small' && (
                                                                    <div className="grid grid-cols-3 gap-2 mt-4">
                                                                        <div className="bg-zinc-900/60 rounded-lg p-2 border border-white/5"><div className="text-sm font-bold text-white">2</div><div className="text-[7px] text-zinc-500">In Prog</div></div>
                                                                        <div className="bg-zinc-900/60 rounded-lg p-2 border border-emerald-500/20"><div className="text-sm font-bold text-emerald-400">1</div><div className="text-[7px] text-zinc-500">Done</div></div>
                                                                        <div className="bg-zinc-900/60 rounded-lg p-2 border border-amber-500/20"><div className="text-sm font-bold text-amber-400">1</div><div className="text-[7px] text-zinc-500">Hold</div></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </AnalyticsWidget>

                                                        {/* Widget 4: Progress */}
                                                        <AnalyticsWidget
                                                            id="progress"
                                                            title="Progress"
                                                            subtitle="6 Months"
                                                            icon={TrendingUp}
                                                            size={widgetSizes.progress}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            {widgetSizes.progress === 'small' ? (
                                                                <div className="flex flex-col justify-center h-full text-center">
                                                                    <div className="text-3xl font-bold text-white">87%</div>
                                                                    <div className="text-emerald-400 text-[9px] mt-1">+12%</div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1">
                                                                    <ResponsiveContainer width="100%" height={widgetSizes.progress === 'large' ? 300 : 120}>
                                                                        <AreaChart data={[{ month: 'Jul', score: 72 }, { month: 'Aug', score: 78 }, { month: 'Sep', score: 75 }, { month: 'Oct', score: 82 }, { month: 'Nov', score: 85 }, { month: 'Dec', score: 87 }]}>
                                                                            <defs><linearGradient id="progressGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ffffff" stopOpacity={0.4} /><stop offset="95%" stopColor="#ffffff" stopOpacity={0} /></linearGradient></defs>
                                                                            <XAxis dataKey="month" tick={{ fill: '#52525b', fontSize: 8 }} axisLine={false} tickLine={false} />
                                                                            <Tooltip content={<MinimalTooltip />} />
                                                                            <Area type="monotone" dataKey="score" stroke="#ffffff" strokeWidth={2} fill="url(#progressGrad)" />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            )}
                                                        </AnalyticsWidget>

                                                        {/* Widget 5: Payroll */}
                                                        <AnalyticsWidget
                                                            id="payroll"
                                                            title="Payroll"
                                                            subtitle="This Month"
                                                            icon={DollarSign}
                                                            size={widgetSizes.payroll}
                                                            onSizeChange={handleWidgetSizeChange}
                                                        >
                                                            <div className="flex flex-col justify-center h-full text-center">
                                                                <div className="text-2xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">₹{((data.salaryTemplate?.basicSalary || 45000) / 1000).toFixed(0)}K</div>
                                                                <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-bold">Net Salary</div>
                                                                {widgetSizes.payroll !== 'small' && (
                                                                    <div className="mt-4 space-y-2 text-left">
                                                                        <div className="flex justify-between text-[9px]"><span className="text-zinc-500">Basic</span><span className="text-white">₹35K</span></div>
                                                                        <div className="flex justify-between text-[9px]"><span className="text-zinc-500">Allowances</span><span className="text-emerald-400">+₹7K</span></div>
                                                                        <div className="flex justify-between text-[9px]"><span className="text-zinc-500">Deductions</span><span className="text-rose-400">-₹3.5K</span></div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </AnalyticsWidget>

                                                    </motion.div>
                                                </LayoutGroup>
                                            </div>
                                        </div>

                                        {/* Right Panel: Original Profile Card */}
                                        <div className="relative w-[384px] h-full shrink-0">
                                            {/* Toggle Button - Fixed to Left Edge of Profile Card (Outside overflow-hidden) */}
                                            <motion.button
                                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="absolute -left-5 top-1/2 -translate-y-1/2 z-[100] w-10 h-10 rounded-full bg-zinc-900 border border-white/10 shadow-2xl flex items-center justify-center cursor-pointer hover:bg-zinc-800 hover:border-cyan-500/30 transition-all duration-300 group"
                                                title={isExpanded ? "Collapse Details" : "Expand Details"}
                                            >
                                                <motion.div
                                                    animate={{ rotate: isExpanded ? 45 : -135 }}
                                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                                >
                                                    <ArrowUpRight
                                                        size={18}
                                                        className={`transition-colors duration-300 ${isExpanded ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'}`}
                                                    />
                                                </motion.div>
                                                {/* Pulse ring */}
                                                <div className="absolute inset-0 rounded-full border-2 border-cyan-400/0 group-hover:border-cyan-400/30 group-hover:animate-ping" />
                                            </motion.button>

                                            {/* Actual Right Panel Content (Inner Div with overflow-hidden) */}
                                            <div className="relative w-full h-full bg-black rounded-[24px] overflow-hidden shadow-2xl">
                                                {/* 1. Fixed Hero Image Layer (z-0) */}
                                                <div className="absolute top-0 left-0 right-0 h-[500px] z-0 pointer-events-none">
                                                    {data.profilePhoto ? (
                                                        <img
                                                            src={data.profilePhoto.startsWith('http')
                                                                ? data.profilePhoto
                                                                : `http://localhost:5001${data.profilePhoto.startsWith('/') ? '' : '/'}${data.profilePhoto}`}
                                                            alt={`${data.firstName} ${data.lastName}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                                                            <span className="text-8xl font-black text-white/30">
                                                                {data.firstName?.[0]}{data.lastName?.[0]}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {/* Base gradient for text readability */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                                </div>

                                                {/* 2. Fixed Top Fade Mask (z-20) */}
                                                <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-black via-black/60 to-transparent z-20 pointer-events-none" />

                                                {/* 3. Close Button (z-50) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsClosing(true);
                                                    }}
                                                    className="absolute top-6 right-6 z-50 p-3 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white/80 hover:text-white transition-all active:scale-90 border border-white/5"
                                                    title="Close"
                                                >
                                                    <X size={20} />
                                                </button>



                                                {/* 4. Scrollable Content Layer (z-10) */}
                                                <div className="absolute inset-0 z-10 overflow-y-auto custom-scrollbar pointer-events-auto">
                                                    {/* Spacer to push content down - transparent */}
                                                    <div className="h-[340px] w-full bg-transparent pointer-events-none" />

                                                    {/* Scrolling Content Wrapper */}
                                                    <div className="relative z-10 flex flex-col bg-gradient-to-b from-transparent via-black/80 to-black/90 -mt-32 pt-32 px-6">

                                                        {/* Name Section - Scrolls with content */}
                                                        <div className="pb-8 pl-2">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <h1 className="text-4xl font-black text-white leading-tight tracking-tight shadow-black drop-shadow-lg">
                                                                    {data.firstName} {data.lastName}
                                                                </h1>
                                                                {/* Role Badge */}
                                                                <span className="px-3 py-1 bg-cyan-500/20 backdrop-blur-md border border-cyan-400/30 text-cyan-300 rounded-lg text-[10px] font-black uppercase tracking-wider shadow-lg shadow-cyan-900/20">
                                                                    {data.roleDisplay || data.role}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Stats Row - Clean, No Backgrounds */}
                                                        <div className="grid grid-cols-3 gap-2 pb-8 border-b border-white/5 mb-8 mx-2">
                                                            {/* Employee ID */}
                                                            <div className="text-center group">
                                                                <Hash size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">ID</p>
                                                                <p className="text-xs font-bold text-white tracking-wide truncate px-1">{data.employeeId || 'N/A'}</p>
                                                            </div>

                                                            {/* Live Status */}
                                                            <div className="text-center group">
                                                                <div className={`w-2.5 h-2.5 rounded-full mx-auto mb-2.5 ${data.isActive ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'bg-red-400'} transition-all`} />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Status</p>
                                                                <p className={`text-sm font-bold ${data.isActive ? 'text-green-400' : 'text-red-400'} tracking-wide`}>
                                                                    {data.isActive ? 'Active' : 'Locked'}
                                                                </p>
                                                            </div>

                                                            {/* Join Date */}
                                                            <div className="text-center group">
                                                                <Calendar size={14} className="text-cyan-400 mx-auto mb-2 opacity-80 group-hover:opacity-100 transition-opacity" />
                                                                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Joined</p>
                                                                <p className="text-sm font-bold text-white tracking-wide">
                                                                    {new Date(data.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        {/* Info Section - Glass Card */}
                                                        <div className="space-y-6 p-8 pb-12 bg-black/60 backdrop-blur-2xl rounded-[40px] border border-white/5 shadow-2xl min-h-[300px]">
                                                            {/* Email Pill - Clean Text */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <Mail size={16} />
                                                                </div>
                                                                <span className="text-sm text-gray-300 font-medium truncate group-hover:text-white transition-colors">{data.email}</span>
                                                            </div>

                                                            {/* Division Card - Clean Text */}
                                                            <div className="flex items-center gap-4 px-2 hover:translate-x-1 transition-transform group cursor-default">
                                                                <div className="p-2 bg-white/5 rounded-full text-gray-400 group-hover:text-cyan-400 transition-colors">
                                                                    <Briefcase size={16} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-0.5">Division</p>
                                                                    <p className="text-base font-bold text-white truncate">{data.department || 'General Management'}</p>
                                                                </div>
                                                            </div>

                                                            {/* Permissions Section - Clean Grid */}
                                                            <div className="pt-2 px-2">
                                                                <div className="flex items-center gap-2 mb-4">
                                                                    <Shield size={14} className="text-cyan-500" />
                                                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
                                                                        Access Privileges
                                                                    </h3>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                                                    {data.permissions?.length > 0 ? data.permissions.map(perm => (
                                                                        <div
                                                                            key={perm}
                                                                            className="py-2.5 border-b border-white/10 text-[11px] text-gray-400 font-bold uppercase tracking-wide flex items-center gap-2 hover:text-cyan-300 transition-colors"
                                                                        >
                                                                            <div className="w-1 h-1 bg-cyan-500/50 rounded-full" />
                                                                            {perm.replace(/_/g, ' ')}
                                                                        </div>
                                                                    )) : (
                                                                        <p className="col-span-2 text-xs text-gray-500 italic text-center py-4">
                                                                            No specialized privileges
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Project Detail Section */}
                                        <div className="space-y-6">
                                            <div className="p-6 bg-white/[0.03] border border-white/10 rounded-[24px] shadow-inner">
                                                <h1 className="text-2xl font-black text-white mb-3 leading-tight tracking-tight">{data.name}</h1>
                                                <p className="text-gray-400 text-sm leading-relaxed font-medium">
                                                    {data.description}
                                                </p>
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <InfoCard
                                                        icon={Clock}
                                                        label="Current Phase"
                                                        value={data.status?.replace(/-/g, ' ')}
                                                        statusColor={data.status === 'completed' ? 'text-green-400' : 'text-primary-400'}
                                                    />
                                                    <InfoCard
                                                        icon={Calendar}
                                                        label="Deadline"
                                                        value={new Date(data.deadline).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                    />
                                                </div>
                                                <InfoCard
                                                    icon={User}
                                                    label="Project Lead"
                                                    value={data.assignedManager ? `${data.assignedManager.firstName} ${data.assignedManager.lastName}` : 'Direct Management'}
                                                />
                                                <InfoCard
                                                    icon={Hash}
                                                    label="Active Deliverables"
                                                    value={`${data.tasks?.length || 0} Registered Tasks`}
                                                />
                                            </div>

                                            {/* Documentation */}
                                            {data.documentation && (
                                                <div className="space-y-3 pt-2">
                                                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Briefing Documents</h3>
                                                    <div className="p-5 bg-black/40 rounded-[20px] border border-white/5 text-[12px] text-gray-400 whitespace-pre-line leading-relaxed font-medium shadow-inner">
                                                        {data.documentation}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>


                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const InfoCard = ({ icon: Icon, label, value, status, statusColor }) => (
    <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-3">
        <div className="p-2 bg-gray-800 rounded-lg text-gray-400">
            <Icon size={16} />
        </div>
        <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">{label}</p>
            <p className={`text-sm font-semibold truncate ${status !== undefined ? (status ? 'text-green-400' : 'text-red-400') :
                (statusColor || 'text-white')
                }`}>
                {value}
            </p>
        </div>
    </div>
);

export default QuickDetailsPanel;

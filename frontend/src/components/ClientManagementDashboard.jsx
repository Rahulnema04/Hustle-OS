import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    ChevronDown,
    Star,
    Zap,
    MessageSquare,
    Calendar,
    Target,
    Activity,
    ThumbsUp,
    AlertCircle,
    Bell,
    FileText,
    MoreHorizontal,
    ExternalLink,
    Filter,
    Search
} from 'lucide-react';
import api from '../utils/api';

// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM REUSABLE COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// Smart Card Component with glassmorphism
const SmartCard = ({ children, className = '', onClick, expandable = false }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <motion.div
            layout
            onClick={() => expandable && setIsExpanded(!isExpanded)}
            className={`
                relative bg-zinc-900/80 backdrop-blur-xl 
                border border-white/5 rounded-2xl 
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                hover:border-white/10 hover:shadow-[0_12px_40px_rgba(0,0,0,0.5)]
                transition-all duration-300
                ${expandable ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
            {expandable && (
                <motion.div
                    className="absolute top-4 right-4 text-zinc-500"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                >
                    <ChevronDown size={16} />
                </motion.div>
            )}
        </motion.div>
    );
};

// Progress Ring Component
const ProgressRing = ({ progress, size = 80, strokeWidth = 6, color = '#22d3ee' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: 'stroke-dashoffset 1s ease-out',
                        filter: `drop-shadow(0 0 8px ${color}50)`
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-black text-white">{progress}%</span>
            </div>
        </div>
    );
};

// Health Indicator Badge
const HealthBadge = ({ status }) => {
    const config = {
        good: { color: 'emerald', label: 'Healthy', icon: CheckCircle },
        warning: { color: 'amber', label: 'At Risk', icon: AlertCircle },
        critical: { color: 'rose', label: 'Critical', icon: AlertTriangle }
    };

    const { color, label, icon: Icon } = config[status] || config.good;

    return (
        <div className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
            bg-${color}-500/10 border border-${color}-500/20
        `}>
            <Icon size={14} className={`text-${color}-400`} />
            <span className={`text-xs font-bold uppercase tracking-wider text-${color}-400`}>
                {label}
            </span>
        </div>
    );
};

// Activity Item Component
const ActivityItem = ({ icon: Icon, title, description, time, type = 'default' }) => {
    const typeColors = {
        success: 'text-emerald-400 bg-emerald-500/10',
        warning: 'text-amber-400 bg-amber-500/10',
        info: 'text-cyan-400 bg-cyan-500/10',
        default: 'text-zinc-400 bg-zinc-500/10'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
        >
            <div className={`p-2 rounded-lg ${typeColors[type]}`}>
                <Icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{title}</p>
                <p className="text-xs text-zinc-500 mt-0.5">{description}</p>
            </div>
            <span className="text-[10px] text-zinc-600 font-medium whitespace-nowrap">{time}</span>
        </motion.div>
    );
};

// Alert Card Component
const AlertCard = ({ title, description, severity = 'warning', action }) => {
    const severityConfig = {
        warning: { bg: 'bg-amber-500/5', border: 'border-amber-500/20', icon: AlertCircle, color: 'amber' },
        critical: { bg: 'bg-rose-500/5', border: 'border-rose-500/20', icon: AlertTriangle, color: 'rose' },
        info: { bg: 'bg-cyan-500/5', border: 'border-cyan-500/20', icon: Bell, color: 'cyan' }
    };

    const config = severityConfig[severity];
    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl ${config.bg} border ${config.border}`}
        >
            <div className="flex items-start gap-3">
                <Icon size={18} className={`text-${config.color}-400 mt-0.5`} />
                <div className="flex-1">
                    <h4 className={`text-sm font-semibold text-${config.color}-400`}>{title}</h4>
                    <p className="text-xs text-zinc-500 mt-1">{description}</p>
                    {action && (
                        <button className={`mt-2 text-xs font-semibold text-${config.color}-400 hover:underline flex items-center gap-1`}>
                            {action} <ChevronRight size={12} />
                        </button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ClientManagementDashboard = () => {
    const [selectedClient, setSelectedClient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Mock data for demonstration
    const mockClients = [
        {
            id: 1,
            name: 'TechCorp Industries',
            project: 'Enterprise CRM System',
            status: 'active',
            health: 'good',
            progress: 78,
            satisfaction: 92,
            manager: 'Sarah Chen',
            startDate: '2024-01-15',
            deadline: '2024-06-30',
            budget: '₹45,00,000',
            spent: '₹35,00,000',
            phase: 'Development',
            highlights: [
                { id: 1, title: 'Sprint 8 completed successfully', type: 'success', time: '2 hours ago' },
                { id: 2, title: 'Client approved new wireframes', type: 'success', time: '1 day ago' },
                { id: 3, title: 'Integration milestone reached', type: 'info', time: '3 days ago' }
            ],
            recentUpdates: [
                { id: 1, icon: CheckCircle, title: 'API Integration Complete', description: 'All 12 endpoints tested and deployed', time: '2h ago', type: 'success' },
                { id: 2, icon: MessageSquare, title: 'Client Feedback Received', description: 'Positive feedback on dashboard UX', time: '5h ago', type: 'info' },
                { id: 3, icon: Clock, title: 'Sprint Planning Done', description: 'Sprint 9 stories finalized', time: '1d ago', type: 'default' },
                { id: 4, icon: FileText, title: 'Documentation Updated', description: 'API docs v2.3 published', time: '2d ago', type: 'default' }
            ],
            keyUpdates: [
                'User authentication module deployed to staging',
                'Performance optimization reduced load time by 40%',
                'Mobile responsive design approved',
                'Database migration scheduled for next week'
            ],
            alerts: [
                { id: 1, title: 'Budget Threshold Warning', description: '78% of allocated budget utilized. Review pending tasks.', severity: 'warning', action: 'Review Budget' },
                { id: 2, title: 'Deadline Approaching', description: 'Phase 3 deadline in 12 days. 3 tasks pending.', severity: 'info', action: 'View Tasks' }
            ]
        },
        {
            id: 2,
            name: 'FinanceHub Ltd',
            project: 'Payment Gateway Integration',
            status: 'active',
            health: 'warning',
            progress: 45,
            satisfaction: 78,
            manager: 'Mike Johnson',
            startDate: '2024-02-01',
            deadline: '2024-05-15',
            budget: '₹28,00,000',
            spent: '₹18,00,000',
            phase: 'Testing',
            highlights: [
                { id: 1, title: 'Security audit passed', type: 'success', time: '1 day ago' },
                { id: 2, title: 'Scope change requested', type: 'warning', time: '2 days ago' }
            ],
            recentUpdates: [
                { id: 1, icon: AlertCircle, title: 'Scope Change Request', description: 'Client requested additional features', time: '1d ago', type: 'warning' },
                { id: 2, icon: CheckCircle, title: 'Security Audit Passed', description: 'PCI DSS compliance verified', time: '2d ago', type: 'success' }
            ],
            keyUpdates: [
                'Payment processing module in QA',
                'Fraud detection algorithm implemented',
                'Waiting for sandbox credentials from client'
            ],
            alerts: [
                { id: 1, title: 'Scope Creep Risk', description: 'New feature requests may impact timeline.', severity: 'warning', action: 'Evaluate Impact' },
                { id: 2, title: 'Resource Constraint', description: '1 developer reassigned. May need backup.', severity: 'critical', action: 'Request Resources' }
            ]
        },
        {
            id: 3,
            name: 'HealthPlus Medical',
            project: 'Patient Management Portal',
            status: 'active',
            health: 'critical',
            progress: 32,
            satisfaction: 65,
            manager: 'Emma Wilson',
            startDate: '2024-03-01',
            deadline: '2024-07-30',
            budget: '₹62,00,000',
            spent: '₹15,00,000',
            phase: 'Design',
            highlights: [
                { id: 1, title: 'Requirements finalization delayed', type: 'warning', time: '3 days ago' }
            ],
            recentUpdates: [
                { id: 1, icon: AlertTriangle, title: 'Stakeholder Availability Issue', description: 'Key decision maker unavailable', time: '1d ago', type: 'warning' }
            ],
            keyUpdates: [
                'Wireframes pending client approval',
                'HIPAA compliance review scheduled',
                'Third-party API evaluation ongoing'
            ],
            alerts: [
                { id: 1, title: 'Project At Risk', description: 'Client responsiveness affecting timeline significantly.', severity: 'critical', action: 'Escalate Issue' },
                { id: 2, title: 'Approval Pending', description: 'Design phase blocked. 5 pending approvals.', severity: 'critical', action: 'Send Reminder' }
            ]
        }
    ];

    useEffect(() => {
        // Simulate API fetch
        setTimeout(() => {
            setClients(mockClients);
            setSelectedClient(mockClients[0]);
            setLoading(false);
        }, 500);
    }, []);

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.project.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
                    <p className="text-zinc-500 text-sm">Loading Client Data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6">
            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* HEADER SECTION */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-3xl font-black text-white tracking-tight">
                            Client Management
                        </h1>
                        <p className="text-zinc-500 text-sm mt-1">
                            Smart insights for ongoing projects
                        </p>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-64 pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>
                        <button className="p-2.5 bg-zinc-900/80 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/20 transition-all">
                            <Filter size={18} />
                        </button>
                    </div>
                </motion.div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════ */}
            {/* CLIENT SELECTOR TABS */}
            {/* ══════════════════════════════════════════════════════════════════ */}
            <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                {filteredClients.map((client) => (
                    <motion.button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`
                            flex items-center gap-3 px-5 py-3 rounded-xl border transition-all whitespace-nowrap
                            ${selectedClient?.id === client.id
                                ? 'bg-white/10 border-white/20 shadow-lg'
                                : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900/80'
                            }
                        `}
                    >
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm
                            ${client.health === 'good' ? 'bg-emerald-500/20 text-emerald-400' :
                                client.health === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                                    'bg-rose-500/20 text-rose-400'}
                        `}>
                            {client.name.charAt(0)}
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-semibold text-white">{client.name}</p>
                            <p className="text-xs text-zinc-500">{client.project}</p>
                        </div>
                        <div className={`
                            w-2 h-2 rounded-full ml-2
                            ${client.health === 'good' ? 'bg-emerald-400' :
                                client.health === 'warning' ? 'bg-amber-400' :
                                    'bg-rose-400'}
                        `} />
                    </motion.button>
                ))}
            </div>

            {selectedClient && (
                <AnimatePresence mode="wait">
                    <motion.div
                        key={selectedClient.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                    >
                        {/* ══════════════════════════════════════════════════════════════════ */}
                        {/* OVERVIEW HEADER CARD */}
                        {/* ══════════════════════════════════════════════════════════════════ */}
                        <SmartCard className="p-6 mb-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black
                                        ${selectedClient.health === 'good' ? 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 text-emerald-400' :
                                            selectedClient.health === 'warning' ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/10 text-amber-400' :
                                                'bg-gradient-to-br from-rose-500/30 to-rose-600/10 text-rose-400'}
                                    `}>
                                        {selectedClient.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">{selectedClient.name}</h2>
                                        <p className="text-zinc-400 text-sm flex items-center gap-2 mt-1">
                                            <Briefcase size={14} />
                                            {selectedClient.project}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Users size={12} /> {selectedClient.manager}
                                            </span>
                                            <span className="text-xs text-zinc-500 flex items-center gap-1">
                                                <Calendar size={12} /> Due: {new Date(selectedClient.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <HealthBadge status={selectedClient.health} />
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all">
                                        <MoreHorizontal size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Quick Stats Row */}
                            <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/5">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{selectedClient.progress}%</p>
                                    <p className="text-xs text-zinc-500 mt-1">Completion</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-cyan-400">{selectedClient.phase}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Current Phase</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-white">{selectedClient.budget}</p>
                                    <p className="text-xs text-zinc-500 mt-1">Total Budget</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-emerald-400">{selectedClient.satisfaction}%</p>
                                    <p className="text-xs text-zinc-500 mt-1">Satisfaction</p>
                                </div>
                            </div>
                        </SmartCard>

                        {/* ══════════════════════════════════════════════════════════════════ */}
                        {/* SMART LAYERS SECTION */}
                        {/* ══════════════════════════════════════════════════════════════════ */}
                        <div className="grid grid-cols-12 gap-6">

                            {/* LEFT COLUMN - Highlights & Updates */}
                            <div className="col-span-5 space-y-6">

                                {/* Latest Highlights */}
                                <SmartCard className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Zap size={16} className="text-amber-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Latest Highlights</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedClient.highlights.map((highlight, idx) => (
                                            <motion.div
                                                key={highlight.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`
                                                    flex items-center gap-3 p-3 rounded-xl
                                                    ${highlight.type === 'success' ? 'bg-emerald-500/5 border border-emerald-500/20' :
                                                        highlight.type === 'warning' ? 'bg-amber-500/5 border border-amber-500/20' :
                                                            'bg-cyan-500/5 border border-cyan-500/20'}
                                                `}
                                            >
                                                <Star size={14} className={
                                                    highlight.type === 'success' ? 'text-emerald-400' :
                                                        highlight.type === 'warning' ? 'text-amber-400' : 'text-cyan-400'
                                                } />
                                                <div className="flex-1">
                                                    <p className="text-sm text-white font-medium">{highlight.title}</p>
                                                    <p className="text-[10px] text-zinc-500 mt-0.5">{highlight.time}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </SmartCard>

                                {/* Recent Updates */}
                                <SmartCard className="p-5">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity size={16} className="text-cyan-400" />
                                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent Updates</h3>
                                    </div>
                                    <div className="space-y-1">
                                        {selectedClient.recentUpdates.map((update, idx) => (
                                            <ActivityItem
                                                key={update.id}
                                                icon={update.icon}
                                                title={update.title}
                                                description={update.description}
                                                time={update.time}
                                                type={update.type}
                                            />
                                        ))}
                                    </div>
                                </SmartCard>
                            </div>

                            {/* RIGHT COLUMN - Structured Analysis */}
                            <div className="col-span-7 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Target size={16} className="text-violet-400" />
                                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">Structured Analysis</h3>
                                </div>

                                {/* Analysis Grid - 2x2 */}
                                <div className="grid grid-cols-2 gap-4">

                                    {/* 1. Progress Update */}
                                    <SmartCard className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp size={14} className="text-emerald-400" />
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress Update</h4>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-4xl font-black text-white">{selectedClient.progress}%</p>
                                                <p className="text-xs text-zinc-500 mt-1">Overall Completion</p>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <span className="px-2 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-lg text-[10px] font-bold text-cyan-400">
                                                        {selectedClient.phase}
                                                    </span>
                                                </div>
                                            </div>
                                            <ProgressRing progress={selectedClient.progress} size={90} strokeWidth={8} />
                                        </div>
                                        {/* Progress Bar */}
                                        <div className="mt-4 pt-4 border-t border-white/5">
                                            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${selectedClient.progress}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
                                                    style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}
                                                />
                                            </div>
                                        </div>
                                    </SmartCard>

                                    {/* 2. Satisfaction Level */}
                                    <SmartCard className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ThumbsUp size={14} className="text-violet-400" />
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Satisfaction Level</h4>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-4xl font-black ${selectedClient.satisfaction >= 80 ? 'text-emerald-400' :
                                                        selectedClient.satisfaction >= 60 ? 'text-amber-400' : 'text-rose-400'
                                                    }`}>
                                                    {selectedClient.satisfaction}%
                                                </p>
                                                <p className="text-xs text-zinc-500 mt-1">Client Happiness</p>
                                                <HealthBadge status={selectedClient.health} />
                                            </div>
                                            <ProgressRing
                                                progress={selectedClient.satisfaction}
                                                size={90}
                                                strokeWidth={8}
                                                color={
                                                    selectedClient.satisfaction >= 80 ? '#34d399' :
                                                        selectedClient.satisfaction >= 60 ? '#fbbf24' : '#f87171'
                                                }
                                            />
                                        </div>
                                        {/* Satisfaction Indicators */}
                                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-2">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    size={18}
                                                    className={star <= Math.round(selectedClient.satisfaction / 20)
                                                        ? 'text-amber-400 fill-amber-400'
                                                        : 'text-zinc-700'
                                                    }
                                                />
                                            ))}
                                        </div>
                                    </SmartCard>

                                    {/* 3. Key Updates */}
                                    <SmartCard className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <FileText size={14} className="text-cyan-400" />
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Key Updates</h4>
                                        </div>
                                        <ul className="space-y-2">
                                            {selectedClient.keyUpdates.map((update, idx) => (
                                                <motion.li
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className="flex items-start gap-2 text-sm text-zinc-300"
                                                >
                                                    <CheckCircle size={14} className="text-cyan-400 mt-0.5 shrink-0" />
                                                    <span>{update}</span>
                                                </motion.li>
                                            ))}
                                        </ul>
                                    </SmartCard>

                                    {/* 4. Alerts */}
                                    <SmartCard className="p-5">
                                        <div className="flex items-center gap-2 mb-4">
                                            <AlertTriangle size={14} className="text-rose-400" />
                                            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alerts</h4>
                                            {selectedClient.alerts.length > 0 && (
                                                <span className="ml-auto px-2 py-0.5 bg-rose-500/20 rounded-full text-[10px] font-bold text-rose-400">
                                                    {selectedClient.alerts.length}
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            {selectedClient.alerts.map((alert) => (
                                                <AlertCard
                                                    key={alert.id}
                                                    title={alert.title}
                                                    description={alert.description}
                                                    severity={alert.severity}
                                                    action={alert.action}
                                                />
                                            ))}
                                        </div>
                                    </SmartCard>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            )}
        </div>
    );
};

export default ClientManagementDashboard;

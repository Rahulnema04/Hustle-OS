import React, { useState, useEffect } from 'react';
import {
    Award,
    CheckCircle,
    XCircle,
    Edit2,
    Eye,
    Send,
    Clock,
    TrendingUp,
    AlertTriangle,
    FileText,
    Lock
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import PerformanceEditModal from './PerformanceEditModal';
import PerformanceAuditModal from './PerformanceAuditModal';

const PerformanceMatrix = () => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvaluation, setSelectedEvaluation] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAuditModal, setShowAuditModal] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterPeriod, setFilterPeriod] = useState('current-month');

    useEffect(() => {
        fetchEvaluations();
    }, [filterStatus, filterPeriod]);

    const fetchEvaluations = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.append('status', filterStatus);
            if (filterPeriod !== 'all') params.append('period', filterPeriod);

            const response = await api.get(`/performance-evaluations?${params.toString()}`);
            setEvaluations(response.data.data || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Failed to load performance evaluations');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (evaluationId) => {
        const comments = prompt('Add approval comments (optional):');

        try {
            await api.post(`/performance-evaluations/${evaluationId}/approve`, { comments });
            toast.success('Evaluation approved successfully!');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve evaluation');
        }
    };

    const handleReject = async (evaluationId) => {
        const reason = prompt('Please provide a reason for rejection:');

        if (!reason) {
            toast.error('Rejection reason is required');
            return;
        }

        try {
            await api.post(`/performance-evaluations/${evaluationId}/reject`, { reason });
            toast.success('Evaluation rejected and sent back to draft');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to reject evaluation');
        }
    };

    const handleSendToHR = async (evaluationId) => {
        if (!confirm('Send this approved evaluation to HR?')) return;

        try {
            await api.post(`/performance-evaluations/${evaluationId}/send-to-hr`);
            toast.success('Evaluation sent to HR successfully!');
            fetchEvaluations();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send to HR');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            'draft': { color: 'bg-gray-100 text-gray-700', icon: Clock, label: 'Draft' },
            'edited': { color: 'bg-blue-100 text-blue-700', icon: Edit2, label: 'Edited' },
            'approved': { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Approved' },
            'locked': { color: 'bg-purple-100 text-purple-700', icon: Lock, label: 'Locked' },
            'sent_to_hr': { color: 'bg-orange-100 text-orange-700', icon: Send, label: 'Sent to HR' },
            'payroll_generated': { color: 'bg-teal-100 text-teal-700', icon: Award, label: 'Payroll Done' }
        };

        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${badge.color}`}>
                <Icon className="h-3 w-3" />
                {badge.label}
            </span>
        );
    };

    const getGradeBadge = (grade) => {
        const colors = {
            'A': 'bg-green-500',
            'B': 'bg-blue-500',
            'C': 'bg-yellow-500',
            'D': 'bg-orange-500',
            'F': 'bg-red-500'
        };

        return (
            <div className={`h-8 w-8 rounded-full ${colors[grade] || 'bg-gray-500'} flex items-center justify-center text-white font-bold`}>
                {grade}
            </div>
        );
    };

    const canEdit = (evaluation) => {
        return !['approved', 'locked', 'sent_to_hr', 'payroll_generated'].includes(evaluation.status);
    };

    const canApprove = (evaluation) => {
        return ['draft', 'edited'].includes(evaluation.status);
    };

    const canSendToHR = (evaluation) => {
        return evaluation.status === 'approved';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Employee Performance Matrix</h2>
                    <p className="text-gray-600 mt-1">Manage team performance evaluations and approvals</p>
                </div>
                <button
                    onClick={() => {/* Create new evaluation */ }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Create Evaluation
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
                        <select
                            value={filterPeriod}
                            onChange={(e) => setFilterPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="current-month">Current Month</option>
                            <option value="current-quarter">Current Quarter</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Statuses</option>
                            <option value="draft">Draft</option>
                            <option value="edited">Edited</option>
                            <option value="approved">Approved</option>
                            <option value="sent_to_hr">Sent to HR</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Evaluations Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Total Score</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Grade</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Multiplier</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {evaluations.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                                        No performance evaluations found. Create one to get started.
                                    </td>
                                </tr>
                            ) : (
                                evaluations.map((evaluation) => (
                                    <tr key={evaluation._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                                                    {evaluation.employee.firstName[0]}{evaluation.employee.lastName[0]}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {evaluation.employee.firstName} {evaluation.employee.lastName}
                                                    </div>
                                                    <div className="text-xs text-gray-500">{evaluation.employee.role}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(evaluation.evaluationPeriod.startDate).toLocaleDateString()} -
                                            {new Date(evaluation.evaluationPeriod.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-2xl font-bold text-gray-900">{evaluation.derivedFields.totalScore}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getGradeBadge(evaluation.derivedFields.grade)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-blue-600">
                                                {evaluation.derivedFields.payrollMultiplier}x
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(evaluation.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex items-center gap-2">
                                                {canEdit(evaluation) && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedEvaluation(evaluation);
                                                            setShowEditModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Edit Metrics"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => {
                                                        setSelectedEvaluation(evaluation);
                                                        setShowAuditModal(true);
                                                    }}
                                                    className="text-gray-600 hover:text-gray-800"
                                                    title="View Audit Log"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </button>

                                                {canApprove(evaluation) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleApprove(evaluation._id)}
                                                            className="text-green-600 hover:text-green-800"
                                                            title="Approve"
                                                        >
                                                            <CheckCircle className="h-4 w-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(evaluation._id)}
                                                            className="text-red-600 hover:text-red-800"
                                                            title="Reject"
                                                        >
                                                            <XCircle className="h-4 w-4" />
                                                        </button>
                                                    </>
                                                )}

                                                {canSendToHR(evaluation) && (
                                                    <button
                                                        onClick={() => handleSendToHR(evaluation._id)}
                                                        className="text-orange-600 hover:text-orange-800"
                                                        title="Send to HR"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showEditModal && selectedEvaluation && (
                <PerformanceEditModal
                    evaluation={selectedEvaluation}
                    onClose={() => {
                        setShowEditModal(false);
                        setSelectedEvaluation(null);
                    }}
                    onSave={() => {
                        fetchEvaluations();
                        setShowEditModal(false);
                        setSelectedEvaluation(null);
                    }}
                />
            )}

            {showAuditModal && selectedEvaluation && (
                <PerformanceAuditModal
                    evaluationId={selectedEvaluation._id}
                    employeeName={`${selectedEvaluation.employee.firstName} ${selectedEvaluation.employee.lastName}`}
                    onClose={() => {
                        setShowAuditModal(false);
                        setSelectedEvaluation(null);
                    }}
                />
            )}
        </div>
    );
};

export default PerformanceMatrix;

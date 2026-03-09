import React, { useState, useEffect } from 'react';
import {
    Briefcase,
    Users,
    Search,
    Filter,
    ArrowUpRight,
    Clock,
    CheckCircle,
    AlertCircle,
    MoreVertical,
    Building2,
    Calendar,
    Eye,
    X,
    Save
} from 'lucide-react';
import api from '../utils/api';

const ClientsProjectsDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [clients, setClients] = useState([]);
    const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'clients'
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [modalType, setModalType] = useState(null); // 'project' or 'client'
    const [formData, setFormData] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch Projects (shared with Co-founder/Manager)
                const projectsRes = await api.get('/projects');
                setProjects(projectsRes.data.data || []);

                // Fetch Clients (from Companies List)
                const companiesRes = await api.get('/companies');
                setClients(companiesRes.data.data || []);

            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleEditClick = (item, type) => {
        setEditingItem(item);
        setModalType(type);

        if (type === 'project') {
            setFormData({
                name: item.name || '',
                status: item.status || 'active',
                deadline: item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : ''
            });
        } else {
            setFormData({
                companyName: item.companyName || '',
                industry: item.industry || '',
                website: item.website || '',
                city: item.location?.city || '',
                country: item.location?.country || '',
                status: item.status || 'identified'
            });
        }
        setIsEditModalOpen(true);
    };

    const handleModalClose = () => {
        setIsEditModalOpen(false);
        setEditingItem(null);
        setFormData({});
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            if (modalType === 'project') {
                const response = await api.put(`/projects/${editingItem._id || editingItem.id}`, formData);
                if (response.data.success) {
                    setProjects(prev => prev.map(p => (p._id === editingItem._id || p.id === editingItem.id) ? response.data.data : p));
                }
            } else {
                // Construct location object for company update
                const updateData = {
                    ...formData,
                    location: {
                        city: formData.city,
                        country: formData.country
                    }
                };
                const response = await api.put(`/companies/${editingItem._id || editingItem.id}`, updateData);
                if (response.data.success) {
                    setClients(prev => prev.map(c => (c._id === editingItem._id || c.id === editingItem.id) ? response.data.data : c));
                }
            }
            handleModalClose();
        } catch (err) {
            console.error('Error updating item:', err);
            // Optionally set an error state to show in modal
            alert('Failed to save changes. Please try again.');
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'active':
            case 'approved':
                return 'status-success';
            case 'in-progress':
            case 'pending':
                return 'status-info';
            case 'on-hold':
                return 'status-warning';
            case 'cancelled':
            case 'rejected':
                return 'status-danger';
            default:
                return 'status-pending';
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="dashboard-card mb-6">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="text-primary" />
                    Clients & Projects
                </h1>
                <p className="text-muted-foreground mt-1">
                    Overview of all active projects and client relationships
                </p>
            </div>

            {/* Main Content */}
            <div className="dashboard-card overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-border">
                    <nav className="-mb-px flex">
                        <button
                            onClick={() => setActiveTab('projects')}
                            className={`${activeTab === 'projects'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors`}
                        >
                            <Briefcase size={18} />
                            Active Projects
                            <span className="bg-muted text-foreground py-0.5 px-2.5 rounded-full text-xs">
                                {projects.length}
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`${activeTab === 'clients'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                } w-1/2 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 transition-colors`}
                        >
                            <Users size={18} />
                            Client List
                            <span className="bg-muted text-foreground py-0.5 px-2.5 rounded-full text-xs">
                                {clients.length}
                            </span>
                        </button>
                    </nav>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-border bg-muted/20 flex justify-between items-center">
                    <div className="relative w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <input
                            type="text"
                            placeholder={`Search ${activeTab}...`}
                            className="input-modern pl-10 py-2 sm:text-sm"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-md text-sm font-medium text-foreground hover:bg-muted transition-colors">
                        <Filter className="h-4 w-4" />
                        Filter
                    </button>
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {isLoading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                    ) : activeTab === 'projects' ? (
                        <div className="overflow-x-auto">
                            <table className="dark-table">
                                <thead>
                                    <tr>
                                        <th>Project Name</th>
                                        <th>Manager</th>
                                        <th>Deadline</th>
                                        <th>Progress</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {projects.length > 0 ? (
                                        projects.map((project) => (
                                            <tr key={project._id || project.id}>
                                                <td>
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                                                                <Briefcase size={20} />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-foreground">{project.name}</div>
                                                            <div className="text-xs text-muted-foreground">{project.description?.substring(0, 30)}...</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="text-sm text-foreground">
                                                    {project.assignedManager?.firstName || project.managerName || 'Unassigned'}
                                                </td>
                                                <td>
                                                    <div className="flex items-center text-sm text-muted-foreground">
                                                        <Calendar size={14} className="mr-1.5" />
                                                        {formatDate(project.deadline)}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="w-full bg-muted rounded-full h-2.5 max-w-[100px]">
                                                        <div
                                                            className="bg-primary h-2.5 rounded-full"
                                                            style={{ width: `${project.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-1 inline-block">{project.progress || 0}%</span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${getStatusColor(project.status)}`}>
                                                        {project.status || 'Active'}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-muted-foreground">
                                                    <button
                                                        onClick={() => handleEditClick(project, 'project')}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground">
                                                No active projects found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="dark-table">
                                <thead>
                                    <tr>
                                        <th>Company</th>
                                        <th>Industry</th>
                                        <th>Location</th>
                                        <th>Added By</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {clients.length > 0 ? (
                                        clients.map((client) => (
                                            <tr key={client._id || client.id}>
                                                <td>
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-10 w-10">
                                                            <div className="h-10 w-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                                                <Building2 size={20} />
                                                            </div>
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-foreground">{client.companyName}</div>
                                                            <div className="text-xs text-muted-foreground">{client.website || 'No website'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-sm text-foreground">{client.industry || 'Not Specified'}</div>
                                                </td>
                                                <td>
                                                    <div className="text-sm text-muted-foreground">
                                                        {[client.location?.city, client.location?.country].filter(Boolean).join(', ') || 'N/A'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="text-sm text-muted-foreground">
                                                        {client.identifiedBy?.firstName ? `${client.identifiedBy.firstName} ${client.identifiedBy.lastName || ''}` : 'Unknown'}
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className={`status-pill ${getStatusColor(client.status || client.approvalStatus)}`}>
                                                        {client.status || client.approvalStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="text-sm text-muted-foreground">
                                                    <button
                                                        onClick={() => handleEditClick(client, 'client')}
                                                        className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-muted"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-10 text-center text-muted-foreground">
                                                No clients available.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-lg mx-4">
                        <div className="flex justify-between items-center p-6 border-b border-border">
                            <h3 className="text-lg font-semibold text-foreground">
                                Edit {modalType === 'project' ? 'Project' : 'Client'} Details
                            </h3>
                            <button
                                onClick={handleModalClose}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {modalType === 'project' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Project Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name || ''}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Deadline</label>
                                        <input
                                            type="date"
                                            name="deadline"
                                            value={formData.deadline || ''}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status || 'not-started'}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        >
                                            <option value="not-started">Not Started</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Company Name</label>
                                        <input
                                            type="text"
                                            name="companyName"
                                            value={formData.companyName || ''}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Industry</label>
                                        <input
                                            type="text"
                                            name="industry"
                                            value={formData.industry || ''}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Website</label>
                                        <input
                                            type="text"
                                            name="website"
                                            value={formData.website || ''}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">City</label>
                                            <input
                                                type="text"
                                                name="city"
                                                value={formData.city || ''}
                                                onChange={handleInputChange}
                                                className="input-modern w-full"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-foreground mb-1">Country</label>
                                            <input
                                                type="text"
                                                name="country"
                                                value={formData.country || ''}
                                                onChange={handleInputChange}
                                                className="input-modern w-full"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status || 'identified'}
                                            onChange={handleInputChange}
                                            className="input-modern w-full"
                                        >
                                            <option value="identified">Identified</option>
                                            <option value="researching">Researching</option>
                                            <option value="in-contact">In Contact</option>
                                            <option value="approved">Approved</option>
                                            <option value="on-hold">On Hold</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-6 border-t border-border flex justify-end gap-3">
                            <button
                                onClick={handleModalClose}
                                className="btn-secondary text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="btn-primary text-sm flex items-center gap-2"
                            >
                                <Save size={16} />
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsProjectsDashboard;

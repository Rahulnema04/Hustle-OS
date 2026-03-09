import React, { useState, useEffect } from 'react';
import StatCard from './StatCard';
import api from '../utils/api';
import {
    CreditCard,
    Plus,
    DollarSign,
    Tag,
    Search,
    FileText,
    Eye,
    TrendingUp
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend
} from 'recharts';

const ExpensesDashboard = () => {
    // State for expenses data
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selectedExpenseId, setSelectedExpenseId] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: 'Office Supplies',
        amount: '',
        status: 'Paid',
        paymentMethod: 'Credit Card'
    });

    // Fetch expenses from API
    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const response = await api.get('/expenses');
            setExpenses(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching expenses:', err);
            setError('Failed to load expenses. Using demo data.');
            // Fallback to mock data if API fails
            setExpenses([
                {
                    _id: '1',
                    date: '2024-12-25',
                    description: 'OpenAI API Subscription',
                    category: 'AI Services',
                    amount: 2500,
                    status: 'Paid',
                    paymentMethod: 'Credit Card'
                },
                {
                    _id: '2',
                    date: '2024-12-20',
                    description: 'AWS Cloud Hosting',
                    category: 'Infrastructure',
                    amount: 8500,
                    status: 'Paid',
                    paymentMethod: 'Bank Transfer'
                },
                {
                    _id: '3',
                    date: '2024-12-15',
                    description: 'Jira Software License',
                    category: 'Software Licenses',
                    amount: 12000,
                    status: 'Paid',
                    paymentMethod: 'Credit Card'
                },
                {
                    _id: '4',
                    date: '2024-12-10',
                    description: 'Slack Enterprise Grid',
                    category: 'Communication',
                    amount: 4500,
                    status: 'Pending',
                    paymentMethod: 'Invoice'
                },
                {
                    _id: '5',
                    date: '2024-12-05',
                    description: 'Midjourney Subscription',
                    category: 'AI Services',
                    amount: 2400,
                    status: 'Paid',
                    paymentMethod: 'Credit Card'
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddClick = () => {
        setIsEdit(false);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            description: '',
            category: 'Office Supplies',
            amount: '',
            status: 'Paid',
            paymentMethod: 'Credit Card'
        });
        setIsModalOpen(true);
    };

    const handleEditClick = (expense) => {
        setIsEdit(true);
        setSelectedExpenseId(expense._id);
        setFormData({
            date: expense.date,
            description: expense.description,
            category: expense.category,
            amount: expense.amount,
            status: expense.status,
            paymentMethod: expense.paymentMethod
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEdit) {
                // Update existing expense
                const response = await api.put(`/expenses/${selectedExpenseId}`, {
                    ...formData,
                    amount: Number(formData.amount)
                });
                setExpenses(prev => prev.map(exp =>
                    exp._id === selectedExpenseId ? response.data : exp
                ));
            } else {
                // Create new expense
                const response = await api.post('/expenses', {
                    ...formData,
                    amount: Number(formData.amount)
                });
                setExpenses([response.data, ...expenses]);
            }

            setIsModalOpen(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                category: 'Office Supplies',
                amount: '',
                status: 'Paid',
                paymentMethod: 'Credit Card'
            });
            setIsEdit(false);
            setSelectedExpenseId(null);

            // Refresh data from server
            await fetchExpenses();
        } catch (error) {
            console.error('Error saving expense:', error);
            alert('Failed to save expense. Please try again.');
        }
    };

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Prepare chart data
    const categoryData = expenses.reduce((acc, curr) => {
        const existing = acc.find(item => item.name === curr.category);
        if (existing) {
            existing.value += curr.amount;
        } else {
            acc.push({ name: curr.category, value: curr.amount });
        }
        return acc;
    }, []);

    const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="dashboard-card">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                            <CreditCard className="text-primary" />
                            Expenses & Purchases
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Track all company expenses, subscriptions, and purchase history
                        </p>
                    </div>
                    <button
                        onClick={handleAddClick}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add New Expense
                    </button>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Monthly Expenses */}
                <div className="dashboard-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 opacity-80" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-red-500 font-medium text-lg">Total Expenses</div>
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <DollarSign className="h-6 w-6 text-red-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        ₹{totalExpenses.toLocaleString()}
                    </div>
                    <div className="text-xs text-red-500 flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Current Month
                    </div>
                </div>

                {/* AI Subscriptions */}
                <div className="dashboard-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-violet-500 opacity-80" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-violet-500 font-medium text-lg">AI Subscriptions</div>
                        <div className="p-3 bg-violet-500/10 rounded-xl">
                            <Tag className="h-6 w-6 text-violet-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        ₹{expenses.filter(e => e.category === 'AI Services').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-violet-500">
                        Active Services
                    </div>
                </div>

                {/* Pending Payments */}
                <div className="dashboard-card relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-orange-500 opacity-80" />
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-orange-500 font-medium text-lg">Pending Payments</div>
                        <div className="p-3 bg-orange-500/10 rounded-xl">
                            <FileText className="h-6 w-6 text-orange-500" />
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-foreground mb-1">
                        {expenses.filter(e => e.status === 'Pending').length}
                    </div>
                    <div className="text-xs text-orange-500">
                        Invoices to clear
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expenses List */}
                <div className="lg:col-span-2 dashboard-card">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="input-modern pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="dark-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense._id}>
                                        <td className="text-muted-foreground text-sm">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium text-foreground">{expense.description}</div>
                                            <div className="text-xs text-muted-foreground">{expense.paymentMethod}</div>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs border border-border">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="text-sm font-semibold text-foreground">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${expense.status === 'Paid' ? 'status-success' : 'status-warning'}`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(expense)}
                                                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-lg"
                                                title="Edit Expense"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Medium Size Expense Breakdown Widget */}
                <div className="dashboard-card">
                    <h2 className="text-lg font-bold text-foreground mb-4">Breakdown</h2>
                    <div className="h-[32rem] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={90}
                                    outerRadius={150}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--popover-foreground)' }}
                                    itemStyle={{ color: 'var(--popover-foreground)' }}
                                    formatter={(value) => `₹${value.toLocaleString()}`}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Category List */}
                    <div className="mt-4 space-y-2">
                        {categoryData.map((category, index) => {
                            const percentage = ((category.value / totalExpenses) * 100).toFixed(0);
                            return (
                                <div key={category.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-muted-foreground truncate">{category.name}</span>
                                    </div>
                                    <span className="font-semibold text-foreground">{percentage}%</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Monthly Expenses */}
                <StatCard
                    title="Total Expenses"
                    value={`₹${totalExpenses.toLocaleString()}`}
                    icon={DollarSign}
                    color="danger"
                    trend="Current Month"
                    chartData={generateSparkline('up')}
                />

                {/* AI Subscriptions */}
                <StatCard
                    title="AI Subscriptions"
                    value={`₹${expenses.filter(e => e.category === 'AI Services').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}`}
                    icon={Tag}
                    color="purple"
                    trend="Active Services"
                    chartData={generateSparkline('neutral')}
                />

                {/* Pending Payments */}
                <StatCard
                    title="Pending Payments"
                    value={expenses.filter(e => e.status === 'Pending').length}
                    icon={FileText}
                    color="warning"
                    trend="Invoices to clear"
                    chartData={generateSparkline('neutral')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Expenses List */}
                <div className="lg:col-span-2 dashboard-card">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
                        <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
                        <div className="relative w-full md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search expenses..."
                                className="input-modern pl-10 w-full"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="dark-table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                    <th>Amount</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((expense) => (
                                    <tr key={expense.id}>
                                        <td className="text-muted-foreground text-sm">
                                            {new Date(expense.date).toLocaleDateString()}
                                        </td>
                                        <td>
                                            <div className="text-sm font-medium text-foreground">{expense.description}</div>
                                            <div className="text-xs text-muted-foreground">{expense.paymentMethod}</div>
                                        </td>
                                        <td>
                                            <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs border border-border">
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td className="text-sm font-semibold text-foreground">
                                            ₹{expense.amount.toLocaleString()}
                                        </td>
                                        <td>
                                            <span className={`status-pill ${expense.status === 'Paid' ? 'status-success' : 'status-warning'}`}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                onClick={() => handleEditClick(expense)}
                                                className="text-muted-foreground hover:text-primary transition-colors p-2 hover:bg-muted rounded-lg"
                                                title="Edit Expense"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>


            {/* Full-Size Expenses Widget with Large Chart */}
            <div className="dashboard-card">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Side - Large Pie Chart */}
                    <div className="lg:col-span-2 flex items-center justify-center">
                        <div className="w-full h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={140}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'var(--popover)', borderColor: 'var(--border)', borderRadius: '12px', color: 'var(--popover-foreground)' }}
                                        itemStyle={{ color: 'var(--popover-foreground)' }}
                                        formatter={(value) => `₹${value.toLocaleString()}`}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Side - Breakdown Info */}
                    <div className="flex flex-col justify-between">
                        {/* Title Section */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground mb-1">Expenses</h2>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">MONTHLY BREAKDOWN</p>
                            <div className="mt-4">
                                <div className="text-4xl font-bold text-foreground">₹{totalExpenses.toLocaleString()}</div>
                                <p className="text-sm text-muted-foreground mt-1">Monthly Expenses</p>
                            </div>
                        </div>

                        {/* Category Breakdown */}
                        <div className="space-y-3 mb-6">
                            {categoryData.map((category, index) => {
                                const percentage = ((category.value / totalExpenses) * 100).toFixed(0);
                                return (
                                    <div key={category.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="text-sm text-muted-foreground">{category.name}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{percentage}%</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-muted/30 rounded-xl p-3 border border-border">
                                <p className="text-xs text-muted-foreground uppercase mb-1">PAID</p>
                                <p className="text-lg font-bold text-foreground">
                                    ₹{expenses.filter(e => e.status === 'Paid').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3 border border-border">
                                <p className="text-xs text-red-500 uppercase mb-1">PENDING</p>
                                <p className="text-lg font-bold text-red-500">
                                    ₹{expenses.filter(e => e.status === 'Pending').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-muted/30 rounded-xl p-3 border border-border">
                                <p className="text-xs text-purple-500 uppercase mb-1">TOP: AI</p>
                                <p className="text-lg font-bold text-purple-500">
                                    ₹{expenses.filter(e => e.category === 'AI Services').reduce((sum, i) => sum + i.amount, 0).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            {/* Add Expense Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
                            </div>

                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                            <div className="inline-block align-bottom bg-card border border-border rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <form onSubmit={handleSubmit}>
                                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h3 className="text-lg font-bold text-foreground mb-4">{isEdit ? 'Edit Expense' : 'Add New Expense'}</h3>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                                                <input
                                                    type="text"
                                                    name="description"
                                                    required
                                                    value={formData.description}
                                                    onChange={handleInputChange}
                                                    className="input-modern w-full"
                                                    placeholder="e.g. New Laptop"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Amount (₹)</label>
                                                    <input
                                                        type="number"
                                                        name="amount"
                                                        required
                                                        value={formData.amount}
                                                        onChange={handleInputChange}
                                                        className="input-modern w-full"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Date</label>
                                                    <input
                                                        type="date"
                                                        name="date"
                                                        required
                                                        value={formData.date}
                                                        onChange={handleInputChange}
                                                        className="input-modern w-full"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
                                                    <select
                                                        name="category"
                                                        value={formData.category}
                                                        onChange={handleInputChange}
                                                        className="input-modern w-full"
                                                    >
                                                        <option>Office Supplies</option>
                                                        <option>AI Services</option>
                                                        <option>Software Licenses</option>
                                                        <option>Infrastructure</option>
                                                        <option>Marketing</option>
                                                        <option>Travel</option>
                                                        <option>Other</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                                                    <select
                                                        name="status"
                                                        value={formData.status}
                                                        onChange={handleInputChange}
                                                        className="input-modern w-full"
                                                    >
                                                        <option>Paid</option>
                                                        <option>Pending</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-muted/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-border">
                                        <button
                                            type="submit"
                                            className="btn-primary w-full sm:ml-3 sm:w-auto"
                                        >
                                            {isEdit ? 'Save Changes' : 'Add Expense'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsModalOpen(false)}
                                            className="btn-secondary w-full sm:mt-0 sm:ml-3 sm:w-auto mt-3"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ExpensesDashboard;

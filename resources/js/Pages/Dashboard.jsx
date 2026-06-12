import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AttendanceFab from '@/Components/AttendanceFab';

export default function Dashboard({ stats = [], activities = [], branches = [], activeAttendance = null, filters = {}, salaryReport = null }) {
    const user = usePage().props.auth.user;
    const role = user?.role || 'EMPLOYEE';
    const activitiesData = Array.isArray(activities) ? activities : (activities?.data || []);

    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');

    useEffect(() => {
        setFromDate(filters.from_date || '');
        setToDate(filters.to_date || '');
    }, [filters]);

    const handleFromDateChange = (e) => {
        const val = e.target.value;
        setFromDate(val);
        router.get('/dashboard', {
            from_date: val,
            to_date: toDate,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleToDateChange = (e) => {
        const val = e.target.value;
        setToDate(val);
        router.get('/dashboard', {
            from_date: fromDate,
            to_date: val,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    // State for selected branch (clock-in)
    const [selectedBranchId, setSelectedBranchId] = useState('');

    useEffect(() => {
        if (branches.length > 0) {
            setSelectedBranchId(branches[0].id.toString());
        }
    }, [branches]);

    // Active shift timer state
    const [elapsedTime, setElapsedTime] = useState('00:00:00');

    useEffect(() => {
        if (!activeAttendance) return;
        
        const startTime = new Date(activeAttendance.clock_in_at).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = now - startTime;
            if (diff < 0) {
                setElapsedTime('00:00:00');
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
            
            const pad = (n) => String(n).padStart(2, '0');
            setElapsedTime(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [activeAttendance]);

    const handleClockIn = (e) => {
        e.preventDefault();
        if (!selectedBranchId) {
            Swal.fire({
                title: 'Select Branch',
                text: 'Please choose a branch to clock in.',
                icon: 'warning',
                background: '#1E1E1E',
                color: '#ffffff',
                confirmButtonColor: '#4f46e5',
                customClass: {
                    title: 'tracking-widest uppercase text-sm font-bold',
                    confirmButton: 'rounded-none font-bold tracking-widest text-xs uppercase'
                }
            });
            return;
        }

        router.post('/attendance/clock-in', {
            branch_id: selectedBranchId
        }, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success',
                    title: 'Clocked in successfully!',
                    background: '#1E1E1E',
                    color: '#ffffff'
                });
            }
        });
    };

    const handleClockOut = (e) => {
        e.preventDefault();
        router.post('/attendance/clock-out', {}, {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success',
                    title: 'Clocked out successfully!',
                    background: '#1E1E1E',
                    color: '#ffffff'
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Dashboard Overview
                </h2>
            }
        >
            <Head title="Dashboard" />

            <div className="py-4 sm:py-6">
                <div className="mb-6 sm:mb-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">WELCOME BACK, {user.name.toUpperCase()}</h3>
                        <p className="text-[10px] sm:text-xs text-[#A0A0A0] uppercase tracking-widest">Here is what's happening today.</p>
                    </div>

                    {/* Date Range Filters */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 w-full lg:w-auto bg-[#1E1E1E] border border-[#2C2C2C] p-3 sm:p-4">
                        <div className="w-full sm:w-40">
                            <label className="block text-[9px] text-[#A0A0A0] uppercase tracking-widest font-bold mb-1.5">From Date</label>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={handleFromDateChange}
                                className="w-full rounded-none border-[#2C2C2C] bg-[#121212] text-white text-xs py-3 px-4 focus:border-indigo-500 focus:ring-0 uppercase tracking-wider font-bold font-mono"
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <label className="block text-[9px] text-[#A0A0A0] uppercase tracking-widest font-bold mb-1.5">To Date</label>
                            <input
                                type="date"
                                value={toDate}
                                onChange={handleToDateChange}
                                className="w-full rounded-none border-[#2C2C2C] bg-[#121212] text-white text-xs py-3 px-4 focus:border-indigo-500 focus:ring-0 uppercase tracking-wider font-bold font-mono"
                            />
                        </div>
                        <button
                            onClick={() => {
                                router.get('/dashboard', {}, {
                                    preserveState: false,
                                    preserveScroll: true,
                                });
                            }}
                            className="bg-[#121212] hover:bg-[#2C2C2C] text-gray-400 hover:text-white font-bold text-xs tracking-widest uppercase py-3 px-6 border border-[#2C2C2C] transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                </div>

                {/* Clock In / Out Container for Employee */}
                {role === 'EMPLOYEE' && (
                    <div className="mb-6 sm:mb-8 bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <h4 className="text-xs text-[#A0A0A0] font-bold tracking-widest uppercase mb-1">Shift Controller</h4>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest">Mark your attendance at your working branch</p>
                            </div>
                            
                            {activeAttendance ? (
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full md:w-auto">
                                    <div className="border-l-2 border-green-500 pl-4 py-1">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">ACTIVE SHIFT AT {activeAttendance.branch?.name?.toUpperCase()}</div>
                                        <div className="text-2xl font-black text-white font-mono tracking-wider mt-1">{elapsedTime}</div>
                                    </div>
                                    <button
                                        onClick={handleClockOut}
                                        className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 px-8 transition-colors rounded-none"
                                    >
                                        Clock Out
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleClockIn} className="flex flex-col sm:flex-row gap-4 w-full md:w-auto items-end">
                                    <div className="w-full sm:w-64">
                                        <label className="block text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-2">Select Branch</label>
                                        <select
                                            value={selectedBranchId}
                                            onChange={(e) => setSelectedBranchId(e.target.value)}
                                            className="w-full rounded-none border-[#2C2C2C] bg-[#121212] text-white text-xs py-3 px-4 focus:border-indigo-500 focus:ring-0 uppercase tracking-wider font-bold"
                                        >
                                            {branches.map((b) => (
                                                <option key={b.id} value={b.id}>
                                                    {b.name}
                                                </option>
                                            ))}
                                            {branches.length === 0 && (
                                                <option value="">No Active Branches Available</option>
                                            )}
                                        </select>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={branches.length === 0}
                                        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 px-8 transition-colors rounded-none disabled:opacity-50"
                                    >
                                        Clock In
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6 flex flex-col justify-between hover:border-[#4A4A4A] transition-colors cursor-default">
                            <h4 className="text-[10px] sm:text-xs text-[#A0A0A0] font-bold tracking-widest uppercase mb-4">{stat.label}</h4>
                            <div className="text-4xl sm:text-5xl font-black text-white mb-4 sm:mb-6">{stat.value}</div>
                            <div className={`text-[9px] sm:text-[10px] font-bold tracking-widest uppercase ${stat.trendUp ? 'text-indigo-400' : 'text-red-400'}`}>
                                {stat.trend}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Recent Activity & Salary Spend Report Container */}
                <div className={role === 'SHOP_OWNER' && salaryReport ? "grid grid-cols-1 lg:grid-cols-3 gap-6" : ""}>
                    <div className={role === 'SHOP_OWNER' && salaryReport ? "lg:col-span-2 bg-[#1E1E1E] border border-[#2C2C2C] flex flex-col" : "bg-[#1E1E1E] border border-[#2C2C2C]"}>
                        <div className="p-4 sm:p-6 border-b border-[#2C2C2C]">
                            <h4 className="text-xs text-white font-bold tracking-widest uppercase">Recent Activity</h4>
                        </div>

                        {activitiesData && activitiesData.length > 0 ? (
                            <>
                                {/* Mobile View: Cards */}
                                <div className="sm:hidden grid grid-cols-1 divide-y divide-[#2C2C2C] flex-1">
                                    {activitiesData.map((activity, i) => (
                                        <div key={i} className="p-4 bg-[#1E1E1E]">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{activity.date}</span>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${activity.statusColor}`}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">{activity.event}</h4>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Table */}
                                <div className="hidden sm:block overflow-x-auto flex-1">
                                    <table className="min-w-full divide-y divide-[#2C2C2C]">
                                        <thead className="bg-[#121212]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Event</th>
                                                <th className="px-6 py-4 text-left text-[10px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C2C2C] bg-[#1E1E1E]">
                                            {activitiesData.map((activity, i) => (
                                                <tr key={i} className="hover:bg-[#2C2C2C] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs tracking-widest uppercase">{activity.date}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-white text-sm font-bold tracking-wide uppercase">{activity.event}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border ${activity.statusColor}`}>
                                                            {activity.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Links */}
                                {activities.links && activities.total > activities.per_page && (
                                    <div className="p-4 border-t border-[#2C2C2C] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1E1E1E]">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                                            Showing {activities.from} to {activities.to} of {activities.total} entries
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {activities.links.map((link, idx) => {
                                                let label = link.label;
                                                if (label.includes('Previous')) {
                                                    label = 'Previous';
                                                } else if (label.includes('Next')) {
                                                    label = 'Next';
                                                }

                                                if (!link.url) {
                                                    return (
                                                        <span
                                                            key={idx}
                                                            className="text-gray-600 font-bold uppercase tracking-widest text-[10px] border border-gray-800/10 px-3 py-2 cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: label }}
                                                        />
                                                    );
                                                }

                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                        disabled={link.active}
                                                        className={`font-bold uppercase tracking-widest text-[10px] px-3 py-2 transition-colors border ${
                                                            link.active
                                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                                : 'text-gray-400 hover:text-white border-gray-500/30 hover:bg-[#2C2C2C]'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: label }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest flex-1 flex items-center justify-center">
                                No shift activity recorded yet.
                            </div>
                        )}
                    </div>

                    {role === 'SHOP_OWNER' && salaryReport && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] flex flex-col">
                            <div className="p-4 sm:p-6 border-b border-[#2C2C2C] flex justify-between items-center">
                                <h4 className="text-xs text-white font-bold tracking-widest uppercase">Salary Spend Report</h4>
                                <span className="text-[9px] text-indigo-400 uppercase tracking-widest font-bold border border-indigo-500/30 px-2 py-0.5">Filtered</span>
                            </div>
                            <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="mb-6">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Total Business Spend</div>
                                        <div className="text-3xl font-black text-white">£{salaryReport.total_business_spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                    </div>

                                    <div className="border-t border-[#2C2C2C] pt-6">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Branch-wise Breakdown</div>
                                        {salaryReport.branch_spends && salaryReport.branch_spends.length > 0 ? (
                                            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                                                {salaryReport.branch_spends.map((branch, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#2C2C2C]/30 last:border-b-0">
                                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{branch.name}</span>
                                                        <span className="text-xs font-mono font-bold text-indigo-400">£{branch.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-[10px] text-gray-500 uppercase tracking-widest">
                                                No branch spends recorded.
                                            </div>
                                        )}
                                    </div>

                                    <div className="border-t border-[#2C2C2C] pt-6 mt-6">
                                        <div className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-4">Employee-wise Breakdown</div>
                                        {salaryReport.employee_spends && salaryReport.employee_spends.length > 0 ? (
                                            <div className="space-y-4 max-h-[160px] overflow-y-auto pr-1">
                                                {salaryReport.employee_spends.map((employee, i) => (
                                                    <div key={i} className="flex justify-between items-center py-2 border-b border-[#2C2C2C]/30 last:border-b-0">
                                                        <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">{employee.name}</span>
                                                        <span className="text-xs font-mono font-bold text-indigo-400">£{employee.spend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-6 text-[10px] text-gray-500 uppercase tracking-widest">
                                                No employee spends recorded.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {role === 'EMPLOYEE' && (
                <AttendanceFab branches={branches} activeAttendance={activeAttendance} />
            )}
        </AuthenticatedLayout>
    );
}

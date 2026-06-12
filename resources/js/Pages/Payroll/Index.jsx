import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';

export default function Index({ 
    role, 
    filters = {}, 
    dailyBreakdown = [], 
    weeklyBreakdown = [], 
    hourlyRate = 0,
    employeeSummaries = [],
    generatePayslip = true
}) {
    const user = usePage().props.auth.user;
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [selectedEmpForShifts, setSelectedEmpForShifts] = useState(null);
    const [selectedEmpIds, setSelectedEmpIds] = useState([]);
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('All');

    // Filtering logic
    const filteredWeeklyBreakdown = weeklyBreakdown.filter(week => {
        if (paymentStatusFilter === 'Paid') {
            return week.status === 'Cleared';
        }
        if (paymentStatusFilter === 'Unpaid') {
            return week.status === 'Unpaid' || week.status === 'Pending';
        }
        return true;
    });

    const filteredDailyBreakdown = dailyBreakdown.filter(day => {
        if (paymentStatusFilter === 'Paid') {
            return day.is_cleared;
        }
        if (paymentStatusFilter === 'Unpaid') {
            return !day.is_cleared;
        }
        return true;
    });

    const filteredEmployeeSummaries = employeeSummaries.filter(emp => {
        if (paymentStatusFilter === 'Paid') {
            return emp.owed_earnings === 0;
        }
        if (paymentStatusFilter === 'Unpaid') {
            return emp.owed_earnings > 0;
        }
        return true;
    });

    const filteredModalShifts = (selectedEmpForShifts?.shifts || []).filter(shift => {
        if (paymentStatusFilter === 'Paid') {
            return shift.is_cleared;
        }
        if (paymentStatusFilter === 'Unpaid') {
            return !shift.is_cleared;
        }
        return true;
    });

    const handleFilter = (e) => {
        e.preventDefault();
        router.get(route('payroll.index'), {
            start_date: startDate,
            end_date: endDate
        }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleClearPayments = (employeeIds = null) => {
        const ids = employeeIds || selectedEmpIds;
        if (!ids || ids.length === 0) {
            alert('Please select at least one employee.');
            return;
        }

        if (!confirm(`Are you sure you want to mark these payments as cleared for the selected ${ids.length} employee(s)?`)) {
            return;
        }

        router.post(route('payroll.clear'), {
            start_date: startDate,
            end_date: endDate,
            employee_ids: ids
        }, {
            preserveState: false,
            preserveScroll: true,
            onSuccess: () => {
                setSelectedEmpIds([]);
                if (selectedEmpForShifts && ids.includes(selectedEmpForShifts.employee_id)) {
                    setSelectedEmpForShifts(prev => {
                        if (!prev) return null;
                        return {
                            ...prev,
                            shifts: prev.shifts.map(s => ({ ...s, is_cleared: true })),
                            owed_earnings: 0,
                            cleared_earnings: prev.total_earnings
                        };
                    });
                }
            }
        });
    };

    const toggleSelectEmp = (id) => {
        setSelectedEmpIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const unclearedEmps = filteredEmployeeSummaries.filter(emp => emp.owed_earnings > 0);
    const toggleSelectAll = () => {
        if (selectedEmpIds.length === unclearedEmps.length) {
            setSelectedEmpIds([]);
        } else {
            setSelectedEmpIds(unclearedEmps.map(emp => emp.employee_id));
        }
    };

    const handleReset = () => {
        const today = new Date();
        const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
        const mondayDiff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
        const monday = new Date(today.setDate(mondayDiff));
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const pad = (n) => String(n).padStart(2, '0');
        const start = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
        const end = `${sunday.getFullYear()}-${pad(sunday.getMonth() + 1)}-${pad(sunday.getDate())}`;

        setStartDate(start);
        setEndDate(end);
        setPaymentStatusFilter('All');

        router.get(route('payroll.index'), {
            start_date: start,
            end_date: end
        });
    };

    const totalHours = filteredDailyBreakdown.reduce((sum, item) => sum + item.hours, 0);
    const totalEarnings = filteredDailyBreakdown.reduce((sum, item) => sum + item.earnings, 0);

    const ownerTotalPayout = filteredEmployeeSummaries.reduce((sum, item) => sum + item.total_earnings, 0);
    const ownerTotalHours = filteredEmployeeSummaries.reduce((sum, item) => sum + item.total_hours, 0);

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Payroll Dashboard
                </h2>
            }
        >
            <Head title="Payroll" />

            <div className="py-4 sm:py-6 space-y-6">
                
                {/* Date Filter Panel */}
                <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 sm:p-6">
                    <form onSubmit={handleFilter} className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
                            <div>
                                <InputLabel value="From Date" className="mb-2" />
                                <TextInput
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full font-mono uppercase tracking-wider text-xs"
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="To Date" className="mb-2" />
                                <TextInput
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full font-mono uppercase tracking-wider text-xs"
                                    required
                                />
                            </div>
                            <div>
                                <InputLabel value="Payment Status" className="mb-2" />
                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                    className="w-full rounded-none border-[#2C2C2C] bg-[#121212] text-white text-xs py-3 px-4 focus:border-indigo-500 focus:ring-0 uppercase tracking-wider font-bold"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Paid">Cleared / Paid</option>
                                    <option value="Unpaid">Unpaid / Owed</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex gap-4 w-full lg:w-auto">
                            <button
                                type="submit"
                                className="flex-1 lg:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-widest uppercase py-3 px-6 transition-colors rounded-none"
                            >
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="flex-1 lg:flex-initial border border-[#2C2C2C] hover:bg-[#2C2C2C] text-white font-bold text-xs tracking-widest uppercase py-3 px-6 transition-colors rounded-none"
                            >
                                Reset
                            </button>
                        </div>
                    </form>
                </div>

                {role === 'EMPLOYEE' ? (
                    /* EMPLOYEE VIEW */
                    <div className="space-y-6">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                                <h4 className="text-[10px] text-[#A0A0A0] font-bold tracking-widest uppercase mb-2 sm:mb-4">Hourly Rate</h4>
                                <div className="text-3xl font-black text-white">£{Number(hourlyRate).toFixed(2)}</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Default Hourly Pay</div>
                            </div>
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                                <h4 className="text-[10px] text-[#A0A0A0] font-bold tracking-widest uppercase mb-2 sm:mb-4">Total Worked Hours</h4>
                                <div className="text-3xl font-black text-white">{totalHours.toFixed(2)}h</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">In selected period</div>
                            </div>
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                                <h4 className="text-[10px] text-[#A0A0A0] font-bold tracking-widest uppercase mb-2 sm:mb-4">Estimated Earnings</h4>
                                <div className="text-3xl font-black text-indigo-400">£{totalEarnings.toFixed(2)}</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Gross Pay Estimate</div>
                            </div>
                        </div>

                        {/* Weekly Earnings (Sunday Clearing) */}
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                            <div className="p-4 sm:p-6 border-b border-[#2C2C2C]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Weekly Earnings Summary</h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-1">Payments resolve and clear every Sunday</p>
                            </div>

                            {filteredWeeklyBreakdown.length > 0 ? (
                                <>
                                    {/* Mobile View: Cards */}
                                    <div className="sm:hidden divide-y divide-[#2C2C2C]">
                                        {filteredWeeklyBreakdown.map((week, idx) => (
                                            <div key={idx} className="p-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Week Ending Sunday</span>
                                                    <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
                                                        week.status === 'Cleared' 
                                                            ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                            : week.status === 'Unpaid'
                                                                ? 'text-red-400 border-red-500/30 bg-red-950/10'
                                                                : 'text-yellow-400 border-yellow-500/30 bg-yellow-950/10'
                                                    }`}>
                                                        {week.status}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-white uppercase font-bold tracking-wider">
                                                    {new Date(week.week_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(week.week_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </div>
                                                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2C2C2C]/50">
                                                    <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Hours: {week.hours.toFixed(2)}h</span>
                                                    <span className="text-white font-black">£{week.earnings.toFixed(2)}</span>
                                                </div>
                                                {week.status === 'Cleared' && generatePayslip && (
                                                    <div className="pt-2">
                                                        <a
                                                            href={route('payroll.payslip', {
                                                                employee_id: user.id,
                                                                start_date: week.week_start,
                                                                end_date: week.week_end
                                                            })}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="block w-full text-center bg-[#1E1E1E] hover:bg-[#2C2C2C] text-indigo-400 font-bold py-2 border border-[#2C2C2C] text-[10px] uppercase tracking-widest transition-colors"
                                                        >
                                                            Download Payslip PDF
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#121212] border-b border-[#2C2C2C]">
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Week Starting</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Week Ending (Sunday)</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Worked Hours</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Earnings</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Status</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#2C2C2C] text-gray-300">
                                                {filteredWeeklyBreakdown.map((week, idx) => (
                                                    <tr key={idx} className="hover:bg-[#252525] transition-colors">
                                                        <td className="p-4 text-xs font-mono uppercase tracking-wider">
                                                            {new Date(week.week_start).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="p-4 text-xs font-mono uppercase tracking-wider font-bold text-white">
                                                            {new Date(week.week_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="p-4 text-xs uppercase tracking-wider">{week.hours.toFixed(2)}h</td>
                                                        <td className="p-4 text-xs font-bold text-white tracking-wider">£{week.earnings.toFixed(2)}</td>
                                                        <td className="p-4 text-xs font-bold tracking-wider">
                                                            <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border ${
                                                                week.status === 'Cleared' 
                                                                    ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                                    : week.status === 'Unpaid'
                                                                        ? 'text-red-400 border-red-500/30 bg-red-950/10'
                                                                        : 'text-yellow-400 border-yellow-500/30 bg-yellow-950/10'
                                                            }`}>
                                                                {week.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-right tracking-wider">
                                                            {week.status === 'Cleared' ? (
                                                                generatePayslip ? (
                                                                    <a
                                                                        href={route('payroll.payslip', {
                                                                            employee_id: user.id,
                                                                            start_date: week.week_start,
                                                                            end_date: week.week_end
                                                                        })}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-indigo-400 hover:text-indigo-300 hover:underline text-[10px] font-bold uppercase tracking-widest border border-indigo-500/30 px-3 py-1.5 hover:bg-indigo-950/10 transition-colors"
                                                                    >
                                                                        Paysheet PDF
                                                                    </a>
                                                                ) : (
                                                                    <span className="text-gray-600 text-[10px] uppercase tracking-widest">Unavailable</span>
                                                                )
                                                            ) : (
                                                                <span className="text-gray-600 text-[10px] uppercase tracking-widest">Not Cleared</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                                    No weekly records found in range.
                                </div>
                            )}
                        </div>

                        {/* Daily Breakdown */}
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                            <div className="p-4 sm:p-6 border-b border-[#2C2C2C]">
                                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Daily Shift Log & Earnings</h3>
                                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-1">Detailed list of shifts and dynamic daily pay calculations</p>
                            </div>

                            {filteredDailyBreakdown.length > 0 ? (
                                <>
                                    {/* Mobile View: Cards */}
                                    <div className="sm:hidden divide-y divide-[#2C2C2C]">
                                        {filteredDailyBreakdown.map((day) => (
                                            <div key={day.id} className={`p-4 space-y-2 ${
                                                !day.is_cleared
                                                    ? 'bg-rose-950/10 border-l-4 border-rose-500 text-rose-200'
                                                    : 'text-gray-300'
                                            }`}>
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] text-white font-black uppercase tracking-wider">{day.branch_name}</span>
                                                        <span className={`px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase border ${
                                                            day.is_cleared 
                                                                ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                                : 'text-red-400 border-red-500/30 bg-red-950/10'
                                                        }`}>
                                                            {day.is_cleared ? 'Cleared' : 'Unpaid'}
                                                        </span>
                                                    </div>
                                                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                                        {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                                                    Hours: {day.clock_in} - {day.clock_out} ({day.hours.toFixed(2)}h)
                                                </div>
                                                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#2C2C2C]/50">
                                                    <span className="text-gray-500 uppercase font-bold tracking-widest text-[9px]">Shift Earnings</span>
                                                    <span className="text-indigo-400 font-black">£{day.earnings.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#121212] border-b border-[#2C2C2C]">
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Branch</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Date</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Clock In</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Clock Out</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Hours</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-right">Daily Earnings</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#2C2C2C] text-gray-300">
                                                {filteredDailyBreakdown.map((day) => (
                                                    <tr key={day.id} className={`transition-colors ${
                                                        !day.is_cleared
                                                            ? 'bg-rose-950/10 hover:bg-rose-950/20 border-l-2 border-rose-500/50 text-rose-200'
                                                            : 'hover:bg-[#252525]'
                                                    }`}>
                                                        <td className="p-4 text-xs font-bold text-white uppercase tracking-wider">
                                                            {day.branch_name}
                                                        </td>
                                                        <td className="p-4 text-xs font-mono uppercase tracking-wider">
                                                            {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </td>
                                                        <td className="p-4 text-xs font-mono uppercase tracking-wider">{day.clock_in}</td>
                                                        <td className="p-4 text-xs font-mono uppercase tracking-wider">{day.clock_out}</td>
                                                        <td className="p-4 text-xs uppercase tracking-wider">{day.hours.toFixed(2)}h</td>
                                                        <td className="p-4 text-xs font-bold text-right text-indigo-400 tracking-wider flex items-center justify-end gap-3">
                                                            <span>£{day.earnings.toFixed(2)}</span>
                                                            <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
                                                                day.is_cleared 
                                                                    ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                                    : 'text-red-400 border-red-500/30 bg-red-950/10'
                                                            }`}>
                                                                {day.is_cleared ? 'Cleared' : 'Unpaid'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                                    No shifts found in range.
                                </div>
                            )}
                        </div>

                    </div>
                ) : (
                    /* SHOP OWNER VIEW */
                    <div className="space-y-6">
                        
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                                <h4 className="text-[10px] text-[#A0A0A0] font-bold tracking-widest uppercase mb-2 sm:mb-4">Total Combined Hours</h4>
                                <div className="text-3xl font-black text-white">{ownerTotalHours.toFixed(2)}h</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Combined employee hours in range</div>
                            </div>
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-5 sm:p-6">
                                <h4 className="text-[10px] text-[#A0A0A0] font-bold tracking-widest uppercase mb-2 sm:mb-4">Total Estimated Payroll</h4>
                                <div className="text-3xl font-black text-indigo-400">£{ownerTotalPayout.toFixed(2)}</div>
                                <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Combined gross payout in range</div>
                            </div>
                        </div>

                        {/* Selected Employees Sticky Clearance Banner */}
                        {selectedEmpIds.length > 0 && (
                            <div className="sticky top-[72px] z-30 bg-[#1E1E1E] border border-emerald-500/30 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div className="text-white text-xs sm:text-sm font-black uppercase tracking-widest">
                                            Clear Selected Payments
                                        </div>
                                        <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-0.5">
                                            Selected: <span className="text-white font-bold">{selectedEmpIds.length}</span> employee(s) • Total Owed: <span className="text-emerald-400 font-bold">£{filteredEmployeeSummaries
                                                .filter(emp => selectedEmpIds.includes(emp.employee_id))
                                                .reduce((sum, emp) => sum + emp.owed_earnings, 0)
                                                .toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleClearPayments()}
                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase py-3 px-6 tracking-widest transition-colors rounded-none shadow-md"
                                >
                                    Issue Money & Mark Cleared
                                </button>
                            </div>
                        )}

                        {/* All Employees Payroll Summary */}
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                            <div className="p-4 sm:p-6 border-b border-[#2C2C2C] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-sm font-bold text-white uppercase tracking-widest">Staff Payroll Ledger</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-1">Overall calculated salaries by staff member</p>
                                </div>
                            </div>

                            {filteredEmployeeSummaries.length > 0 ? (
                                <>
                                    {/* Mobile View: Cards */}
                                    <div className="sm:hidden divide-y divide-[#2C2C2C]">
                                        {filteredEmployeeSummaries.map((emp) => {
                                            const isSelected = selectedEmpIds.includes(emp.employee_id);
                                            const isUncleared = emp.owed_earnings > 0;
                                            return (
                                                <div key={emp.employee_id} className={`p-4 space-y-3 transition-colors ${isSelected ? 'bg-emerald-950/5' : ''}`}>
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex items-center gap-3">
                                                            {isUncleared ? (
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={isSelected}
                                                                    onChange={() => toggleSelectEmp(emp.employee_id)}
                                                                    className="rounded bg-[#1E1E1E] border-[#2C2C2C] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-[#1E1E1E]"
                                                                />
                                                            ) : (
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Fully Cleared">
                                                                    ✓
                                                                 </span>
                                                            )}
                                                            <div>
                                                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">{emp.name}</h4>
                                                                <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">{emp.designation}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest block">Rate</span>
                                                            <span className="text-xs text-white font-mono">£{Number(emp.hourly_rate).toFixed(2)}/h</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-2 border-t border-[#2C2C2C]/50">
                                                        <div>
                                                            <span className="block text-gray-500 uppercase tracking-widest text-[8px]">Shifts / Hours</span>
                                                            <span className="text-white font-bold">{emp.shifts_count} ({emp.total_hours.toFixed(2)}h)</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-gray-500 uppercase tracking-widest text-[8px]">Total Earnings</span>
                                                            <span className="text-white font-mono font-bold">£{emp.total_earnings.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-[#2C2C2C]/20">
                                                        <div>
                                                            <span className="block text-gray-500 uppercase tracking-widest text-[8px]">Owed Amount</span>
                                                            <span className={emp.owed_earnings > 0 ? "text-rose-400 font-bold font-mono" : "text-gray-500 font-mono"}>
                                                                £{emp.owed_earnings.toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="block text-gray-500 uppercase tracking-widest text-[8px]">Cleared Amount</span>
                                                            <span className="text-emerald-400 font-bold font-mono">£{emp.cleared_earnings.toFixed(2)}</span>
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedEmpForShifts(emp)}
                                                            className="w-full text-center bg-[#1E1E1E] hover:bg-[#2C2C2C] text-indigo-400 font-bold py-2 border border-[#2C2C2C] text-[10px] uppercase tracking-widest transition-colors"
                                                        >
                                                            View Shifts Breakdown
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop View: Table */}
                                    <div className="hidden sm:block overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-[#121212] border-b border-[#2C2C2C]">
                                                    <th className="p-4 w-12 text-left">
                                                        {unclearedEmps.length > 0 ? (
                                                            <input 
                                                                type="checkbox" 
                                                                checked={selectedEmpIds.length > 0 && selectedEmpIds.length === unclearedEmps.length}
                                                                onChange={toggleSelectAll}
                                                                className="rounded bg-[#1E1E1E] border-[#2C2C2C] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-[#1E1E1E]"
                                                            />
                                                        ) : (
                                                            <input 
                                                                type="checkbox" 
                                                                disabled
                                                                className="rounded bg-[#1E1E1E] border-[#2C2C2C]/50 opacity-30 cursor-not-allowed"
                                                            />
                                                        )}
                                                    </th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Employee</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Designation</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Hourly Rate</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Shifts Logged</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Total Hours</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Total Earnings</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Owed / Cleared</th>
                                                    <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#2C2C2C] text-gray-300">
                                                {filteredEmployeeSummaries.map((emp) => {
                                                    const isSelected = selectedEmpIds.includes(emp.employee_id);
                                                    const isUncleared = emp.owed_earnings > 0;
                                                    return (
                                                        <tr key={emp.employee_id} className={`transition-colors ${isSelected ? 'bg-emerald-950/5 hover:bg-emerald-950/10' : 'hover:bg-[#252525]'}`}>
                                                            <td className="p-4">
                                                                {isUncleared ? (
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={isSelected}
                                                                        onChange={() => toggleSelectEmp(emp.employee_id)}
                                                                        className="rounded bg-[#1E1E1E] border-[#2C2C2C] text-emerald-600 focus:ring-emerald-500 focus:ring-offset-[#1E1E1E]"
                                                                    />
                                                                ) : (
                                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" title="Fully Cleared">
                                                                        ✓
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="p-4 text-xs font-bold text-white uppercase tracking-wider">
                                                                {emp.name}
                                                            </td>
                                                            <td className="p-4 text-xs uppercase tracking-wider text-gray-400">{emp.designation}</td>
                                                            <td className="p-4 text-xs uppercase tracking-wider">£{Number(emp.hourly_rate).toFixed(2)}/h</td>
                                                            <td className="p-4 text-xs uppercase tracking-wider">{emp.shifts_count}</td>
                                                            <td className="p-4 text-xs uppercase tracking-wider">{emp.total_hours.toFixed(2)}h</td>
                                                            <td className="p-4 text-xs font-bold text-white tracking-wider">
                                                                £{emp.total_earnings.toFixed(2)}
                                                            </td>
                                                            <td className="p-4 text-xs tracking-wider">
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className={emp.owed_earnings > 0 ? "text-rose-400 font-bold font-mono" : "text-gray-500 font-mono"}>
                                                                        Owed: £{emp.owed_earnings.toFixed(2)}
                                                                    </span>
                                                                    <span className="text-emerald-400 text-[10px] font-mono">
                                                                        Paid: £{emp.cleared_earnings.toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-xs font-bold text-right tracking-wider">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedEmpForShifts(emp)}
                                                                    className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] border border-indigo-500/30 px-3 py-1.5 hover:bg-indigo-950/10 transition-colors"
                                                                >
                                                                    View Shifts
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            ) : (
                                <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                                    No employee records found.
                                </div>
                            )}
                        </div>

                    </div>
                )}

            </div>

            {/* Shifts Breakdown Modal */}
            <Modal show={!!selectedEmpForShifts} onClose={() => setSelectedEmpForShifts(null)} maxWidth="6xl">
                <div className="p-6 sm:p-8 bg-[#1E1E1E] text-white">
                    <div className="flex justify-between items-center mb-6 border-b border-[#2C2C2C] pb-3">
                        <div>
                            <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400">
                                {selectedEmpForShifts?.name}'s Shift Breakdown
                            </h2>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">
                                Designation: {selectedEmpForShifts?.designation} • Rate: £{Number(selectedEmpForShifts?.hourly_rate).toFixed(2)}/hr
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {filteredModalShifts.some(s => s.is_cleared) && selectedEmpForShifts?.generate_payslip && (
                                <a
                                    href={route('payroll.payslip', {
                                        employee_id: selectedEmpForShifts.employee_id,
                                        start_date: startDate || (filteredModalShifts.length > 0 ? filteredModalShifts[filteredModalShifts.length - 1].date : ''),
                                        end_date: endDate || (filteredModalShifts.length > 0 ? filteredModalShifts[0].date : '')
                                    })}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] tracking-widest uppercase py-1.5 px-3 transition-colors rounded-none"
                                >
                                    Download Paysheet PDF
                                </a>
                            )}
                            {filteredModalShifts.some(s => !s.is_cleared) && (
                                <button
                                    type="button"
                                    onClick={() => handleClearPayments([selectedEmpForShifts.employee_id])}
                                    className="bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[10px] tracking-widest uppercase py-1.5 px-3 transition-colors rounded-none"
                                >
                                    Clear Payments For Range (Owed: £{Number(selectedEmpForShifts.owed_earnings).toFixed(2)})
                                </button>
                            )}
                            <button 
                                onClick={() => setSelectedEmpForShifts(null)}
                                className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {filteredModalShifts.length > 0 ? (
                        <div className="bg-[#121212] border border-[#2C2C2C] max-h-[68vh] overflow-y-auto">
                            {/* Mobile list */}
                            <div className="block sm:hidden divide-y divide-[#2C2C2C]">
                                {filteredModalShifts.map((shift) => (
                                    <div 
                                        key={shift.id} 
                                        className={`p-4 space-y-2 ${
                                            !shift.is_cleared
                                                ? 'bg-rose-950/10 border-l-4 border-rose-500 text-rose-200'
                                                : shift.is_sunday 
                                                    ? 'bg-amber-950/15 border-l-4 border-amber-500 text-amber-300' 
                                                    : 'text-gray-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center text-[10px]">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold uppercase tracking-wider">{shift.branch_name}</span>
                                                <span className={`px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase border ${
                                                    shift.is_cleared 
                                                        ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                        : 'text-red-400 border-red-500/30 bg-red-950/10'
                                                }`}>
                                                    {shift.is_cleared ? 'Cleared' : 'Unpaid'}
                                                </span>
                                            </div>
                                            <span className="font-mono">{new Date(shift.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {shift.is_sunday && '(Sunday)'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span>{shift.clock_in} - {shift.clock_out} ({shift.hours.toFixed(2)}h)</span>
                                            <span className="font-bold">£{shift.earnings.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden sm:block">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0 bg-[#121212] z-10 shadow-[0_1px_0_0_#2C2C2C]">
                                        <tr className="bg-[#121212] text-[#A0A0A0] text-[10px] font-bold uppercase tracking-widest">
                                            <th className="p-3">Branch</th>
                                            <th className="p-3">Date</th>
                                            <th className="p-3">Clock In</th>
                                            <th className="p-3">Clock Out</th>
                                            <th className="p-3">Hours</th>
                                            <th className="p-3 text-right">Earnings</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C2C2C] text-xs">
                                        {filteredModalShifts.map((shift) => (
                                            <tr 
                                                key={shift.id} 
                                                className={`transition-colors ${
                                                    !shift.is_cleared
                                                        ? 'bg-rose-950/10 text-rose-200 hover:bg-rose-950/20 border-l-2 border-rose-500/50'
                                                        : shift.is_sunday 
                                                            ? 'bg-amber-950/15 text-amber-300 font-bold hover:bg-amber-950/25 border-l-2 border-amber-500/50' 
                                                            : 'text-gray-300 hover:bg-[#202020]'
                                                }`}
                                            >
                                                <td className="p-3 uppercase tracking-wider">{shift.branch_name}</td>
                                                <td className="p-3 font-mono">
                                                    {new Date(shift.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    {shift.is_sunday && <span className="text-[9px] uppercase tracking-widest font-black ml-2 text-amber-500 bg-amber-500/10 px-1.5 py-0.5 border border-amber-500/20">Sunday</span>}
                                                </td>
                                                <td className="p-3 font-mono">{shift.clock_in}</td>
                                                <td className="p-3 font-mono">{shift.clock_out}</td>
                                                <td className="p-3">{shift.hours.toFixed(2)}h</td>
                                                <td className="p-3 text-right font-mono font-bold flex items-center justify-end gap-3">
                                                    <span>£{shift.earnings.toFixed(2)}</span>
                                                    <span className={`px-1.5 py-0.5 text-[8px] font-bold tracking-widest uppercase border ${
                                                        shift.is_cleared 
                                                            ? 'text-green-400 border-green-500/30 bg-green-950/10' 
                                                            : 'text-red-400 border-red-500/30 bg-red-950/10'
                                                    }`}>
                                                        {shift.is_cleared ? 'Cleared' : 'Unpaid'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 border border-[#2C2C2C] bg-[#121212] text-center text-gray-500 uppercase tracking-widest text-xs">
                            No shift records found for this employee in the selected period.
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            type="button"
                            onClick={() => setSelectedEmpForShifts(null)}
                            className="bg-transparent hover:bg-[#2C2C2C] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors border border-[#2C2C2C]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

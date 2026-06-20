import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';
import AttendanceFab from '@/Components/AttendanceFab';

export default function Index({ attendances = [], branches = [], activeAttendance = null }) {
    const formatDuration = (mins) => {
        if (mins === null || mins === undefined) return 'Active Shift';
        return `${Number(mins / 60).toFixed(2)}h`;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Worked Hours Log
                </h2>
            }
        >
            <Head title="Worked Hours Log" />

            <div className="py-4 sm:py-6">
                <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-4 sm:p-6 border-b border-[#2C2C2C]">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Attendance History</h3>
                        <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-widest mt-1">Review your registered shifts and total hours</p>
                    </div>

                    {attendances && attendances.length > 0 ? (
                        <>
                            {/* Mobile View: Cards */}
                            <div className="sm:hidden divide-y divide-[#2C2C2C]">
                                {attendances.map((att) => {
                                    const dateStr = new Date(att.clock_in_at).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    });
                                    const clockInStr = new Date(att.clock_in_at).toLocaleTimeString('en-GB', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                    const clockOutStr = att.clock_out_at
                                        ? new Date(att.clock_out_at).toLocaleTimeString('en-GB', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        : '--:--';

                                    return (
                                        <div key={att.id} className="p-4 space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] text-white font-black uppercase tracking-wider">
                                                    {att.branch?.name || 'Unknown'}
                                                </span>
                                                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">
                                                    {dateStr}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center pt-1 border-t border-[#2C2C2C]/50 text-xs">
                                                <span className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">
                                                    Time: {clockInStr} - {clockOutStr}
                                                </span>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${
                                                    att.clock_out_at 
                                                        ? 'text-indigo-400 border-indigo-500/30 bg-indigo-950/10' 
                                                        : 'text-green-400 border-green-500/30 bg-green-950/10'
                                                }`}>
                                                    {formatDuration(att.duration_minutes)}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop View: Table */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#2C2C2C] bg-[#121212]">
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Branch</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Date</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Clock In</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Clock Out</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-right">Duration</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C2C2C] text-gray-300">
                                        {attendances.map((att) => {
                                            const dateStr = new Date(att.clock_in_at).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            });
                                            const clockInStr = new Date(att.clock_in_at).toLocaleTimeString('en-GB', {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            });
                                            const clockOutStr = att.clock_out_at
                                                ? new Date(att.clock_out_at).toLocaleTimeString('en-GB', {
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })
                                                : '--:--';

                                            return (
                                                <tr key={att.id} className="hover:bg-[#252525] transition-colors">
                                                    <td className="p-4 text-xs font-bold text-white uppercase tracking-wider">
                                                        {att.branch?.name || 'Unknown'}
                                                    </td>
                                                    <td className="p-4 text-xs uppercase tracking-wider">{dateStr}</td>
                                                    <td className="p-4 text-xs uppercase tracking-wider">{clockInStr}</td>
                                                    <td className="p-4 text-xs uppercase tracking-wider">{clockOutStr}</td>
                                                    <td className="p-4 text-xs font-bold text-right tracking-wider">
                                                        <span className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase border ${att.clock_out_at ? 'text-indigo-400 border-indigo-500/30 bg-indigo-950/10' : 'text-green-400 border-green-500/30 bg-green-950/10'}`}>
                                                            {formatDuration(att.duration_minutes)}
                                                        </span>
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
                            No shift logs found.
                        </div>
                    )}
                </div>
            </div>
            
            <AttendanceFab branches={branches} activeAttendance={activeAttendance} />
        </AuthenticatedLayout>
    );
}

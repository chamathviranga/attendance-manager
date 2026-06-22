import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Swal from 'sweetalert2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import TimePicker12 from '@/Components/TimePicker12';

export default function AttendanceFab({ branches = [], activeAttendance = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('live'); // 'live' or 'manual'

    // Live Clock In Form state
    const [selectedBranchId, setSelectedBranchId] = useState('');
    
    // Manual shift form state
    const [manualForm, setManualForm] = useState({
        branch_id: '',
        date: new Date().toISOString().split('T')[0],
        clock_in_time: '09:00 AM',
        clock_out_time: '05:00 PM'
    });

    useEffect(() => {
        if (branches.length > 0) {
            setSelectedBranchId(branches[0].id.toString());
            setManualForm(prev => ({ ...prev, branch_id: branches[0].id.toString() }));
        }
    }, [branches]);

    useEffect(() => {
        const handleOpenModal = () => setIsOpen(true);
        window.addEventListener('open-attendance-modal', handleOpenModal);
        return () => window.removeEventListener('open-attendance-modal', handleOpenModal);
    }, []);

    // Timer calculation for active shift
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
        if (!selectedBranchId) return;

        router.post('/attendance/clock-in', {
            branch_id: selectedBranchId
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
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
                setIsOpen(false);
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

    const handleManualSubmit = (e) => {
        e.preventDefault();
        if (!manualForm.branch_id) return;

        router.post('/attendance/manual', manualForm, {
            preserveScroll: true,
            onSuccess: () => {
                setIsOpen(false);
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    icon: 'success',
                    title: 'Manual entry saved!',
                    background: '#1E1E1E',
                    color: '#ffffff'
                });
            }
        });
    };

    const isClockedIn = !!activeAttendance;

    return (
        <>
            {/* Floating Action Button */}
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-2xl text-white transition-all transform hover:scale-110 active:scale-95 border-none focus:outline-none ${
                    isClockedIn 
                        ? 'bg-green-600 hover:bg-green-500 ring-4 ring-green-500/20' 
                        : 'bg-indigo-600 hover:bg-indigo-500 ring-4 ring-indigo-500/20'
                }`}
                title={isClockedIn ? 'Active Shift Timer / Clock Out' : 'Clock In / Log Shift'}
            >
                <div className="relative">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    {isClockedIn && (
                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white animate-ping" />
                    )}
                </div>
            </button>

            {/* Attendance Modal */}
            <Modal show={isOpen} onClose={() => setIsOpen(false)} maxWidth="md">
                <div className="bg-[#1E1E1E] text-white p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-[#A0A0A0] mb-6 pb-3 border-b border-[#2C2C2C]">
                        Shift & Attendance Manager
                    </h2>

                    {/* Tabs */}
                    <div className="flex border-b border-[#2C2C2C] mb-6">
                        <button
                            type="button"
                            onClick={() => setActiveTab('live')}
                            className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase border-b-2 text-center transition-all ${
                                activeTab === 'live' 
                                    ? 'border-indigo-500 text-white' 
                                    : 'border-transparent text-gray-500 hover:text-white'
                            }`}
                        >
                            Live Shift
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('manual')}
                            className={`flex-1 py-3 text-xs font-bold tracking-widest uppercase border-b-2 text-center transition-all ${
                                activeTab === 'manual' 
                                    ? 'border-indigo-500 text-white' 
                                    : 'border-transparent text-gray-500 hover:text-white'
                            }`}
                        >
                            Log Missed Shift
                        </button>
                    </div>

                    {activeTab === 'live' ? (
                        /* Live Shift Tab */
                        <div>
                            {isClockedIn ? (
                                <div className="space-y-6 text-center py-4">
                                    <div className="inline-flex items-center justify-center p-3 bg-green-950/20 border border-green-500/30 text-green-400 text-xs font-bold uppercase tracking-widest mb-2">
                                        Active Shift: {activeAttendance.branch?.name}
                                    </div>
                                    <div className="text-5xl font-black font-mono tracking-widest text-white mt-2">
                                        {elapsedTime}
                                    </div>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                        Clocked in at {new Date(activeAttendance.clock_in_at).toLocaleTimeString('en-US', { timeZone: 'Europe/London', hour: '2-digit', minute: '2-digit', hour12: true })}
                                    </p>
                                    <button
                                        onClick={handleClockOut}
                                        className="w-full bg-red-600 hover:bg-red-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 transition-colors rounded-none mt-4"
                                    >
                                        Clock Out Now
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleClockIn} className="space-y-6">
                                    <div>
                                        <InputLabel value="Select Working Branch" className="mb-2" />
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
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 transition-colors rounded-none disabled:opacity-50"
                                    >
                                        Clock In Now
                                    </button>
                                </form>
                            )}
                        </div>
                    ) : (
                        /* Manual Shift Entry Tab */
                        <form onSubmit={handleManualSubmit} className="space-y-6">
                            <div>
                                <InputLabel value="Select Branch" className="mb-2" />
                                <select
                                    value={manualForm.branch_id}
                                    onChange={(e) => setManualForm(prev => ({ ...prev, branch_id: e.target.value }))}
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

                            <div>
                                <InputLabel value="Select Date" className="mb-2" />
                                <DatePicker
                                    selected={new Date(manualForm.date)}
                                    onChange={(date) => setManualForm(prev => ({ ...prev, date: date.toISOString().split('T')[0] }))}
                                    maxDate={new Date()}
                                    dateFormat="yyyy-MM-dd"
                                    required
                                    className="w-full rounded-none border-[#2C2C2C] bg-[#121212] text-white text-xs py-3 px-4 focus:border-indigo-500 focus:ring-0 uppercase tracking-wider font-mono"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <InputLabel value="Clock In Time" className="mb-2" />
                                    <TimePicker12 
                                        value={manualForm.clock_in_time}
                                        onChange={(val) => setManualForm(prev => ({ ...prev, clock_in_time: val }))}
                                        className="h-[42px]"
                                    />
                                </div>
                                <div>
                                    <InputLabel value="Clock Out Time" className="mb-2" />
                                    <TimePicker12 
                                        value={manualForm.clock_out_time}
                                        onChange={(val) => setManualForm(prev => ({ ...prev, clock_out_time: val }))}
                                        className="h-[42px]"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={branches.length === 0}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 transition-colors rounded-none disabled:opacity-50"
                            >
                                Save Manual Entry
                            </button>
                        </form>
                    )}
                </div>
            </Modal>
        </>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

const Toast = Swal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#1E1E1E',
    color: '#ffffff',
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

export default function Index({ schedules = [], employees = [], branches = [], role }) {
    const isOwner = role === 'SHOP_OWNER';

    const { data, setData, post, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        employee_id: '',
        exchanged_with_employee_id: '',
        branch_id: '',
        date: '',
        start_time: '09:00',
        end_time: '17:00',
        status: 'Scheduled',
        repeat_type: 'None',
        repeat_until: '',
    });

    const editForm = useForm({
        employee_id: '',
        exchanged_with_employee_id: '',
        branch_id: '',
        date: '',
        start_time: '',
        end_time: '',
        status: '',
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);

    // Filters state
    const [filterEmployee, setFilterEmployee] = useState('');
    const [filterBranch, setFilterBranch] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDate, setFilterDate] = useState('');

    const openCreateModal = () => {
        setData({
            employee_id: employees[0]?.id.toString() || '',
            exchanged_with_employee_id: '',
            branch_id: branches[0]?.id.toString() || '',
            date: '',
            start_time: '09:00',
            end_time: '17:00',
            status: 'Scheduled',
            repeat_type: 'None',
            repeat_until: '',
        });
        setIsCreating(true);
    };

    const closeCreateModal = () => {
        setIsCreating(false);
        clearErrors();
        reset();
    };

    const openEditModal = (schedule) => {
        setEditingSchedule(schedule);
        editForm.setData({
            employee_id: schedule.employee_id.toString(),
            exchanged_with_employee_id: schedule.exchanged_with_employee_id ? schedule.exchanged_with_employee_id.toString() : '',
            branch_id: schedule.branch_id.toString(),
            date: schedule.date.split('T')[0],
            start_time: schedule.start_time.substring(0, 5),
            end_time: schedule.end_time.substring(0, 5),
            status: schedule.status,
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setEditingSchedule(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post('/schedules', {
            onSuccess: () => {
                closeCreateModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Shift scheduled successfully!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Please check the form errors.'
                });
            }
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        editForm.put(`/schedules/${editingSchedule.id}`, {
            onSuccess: () => {
                closeEditModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Shift schedule updated successfully!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Please check the form errors.'
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Cancel this shift schedule?',
            text: "This shift will be removed from the schedule calendar.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#2C2C2C',
            confirmButtonText: 'YES, REMOVE',
            cancelButtonText: 'CANCEL',
            background: '#1E1E1E',
            color: '#ffffff',
            customClass: {
                title: 'tracking-widest uppercase text-lg',
                confirmButton: 'rounded-none font-bold tracking-widest text-xs',
                cancelButton: 'rounded-none font-bold tracking-widest text-xs border border-[#2C2C2C]'
            }
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(`/schedules/${id}`, {
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Schedule removed.'
                        });
                    }
                });
            }
        });
    };

    // Filter schedules
    const filteredSchedules = schedules.filter(schedule => {
        const matchEmp = !filterEmployee || schedule.employee_id.toString() === filterEmployee;
        const matchBranch = !filterBranch || schedule.branch_id.toString() === filterBranch;
        const matchStatus = !filterStatus || schedule.status === filterStatus;
        const matchDate = !filterDate || schedule.date.startsWith(filterDate);
        return matchEmp && matchBranch && matchStatus && matchDate;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Scheduled':
                return 'text-green-400 border-green-500/50 bg-green-950/10';
            case 'Absent':
                return 'text-red-400 border-red-500/50 bg-red-950/10';
            case 'On Leave':
                return 'text-yellow-400 border-yellow-500/50 bg-yellow-950/10';
            case 'Exchanged':
                return 'text-purple-400 border-purple-500/50 bg-purple-950/10';
            default:
                return 'text-gray-400 border-gray-500/50 bg-gray-950/10';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Shift Scheduling
                </h2>
            }
        >
            <Head title="Shift Schedule" />

            <div className="py-6">
                {/* Header & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <p className="text-xs text-gray-400 uppercase tracking-widest">
                        {isOwner ? 'Plan, update and reassign shifts for your staff.' : 'View your upcoming scheduled work shifts.'}
                    </p>
                    {isOwner && (
                        <button
                            onClick={openCreateModal}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                        >
                            + Schedule Shift
                        </button>
                    )}
                </div>

                {/* Filters Board */}
                <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-4">
                    {isOwner && (
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1.5">Filter Employee</label>
                            <select
                                value={filterEmployee}
                                onChange={(e) => setFilterEmployee(e.target.value)}
                                className="w-full bg-[#121212] border border-[#2C2C2C] text-white text-xs rounded-none focus:border-indigo-500 focus:ring-0 py-2 px-3 h-[38px] uppercase tracking-wider"
                            >
                                <option value="">All Employees</option>
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1.5">Filter Branch</label>
                        <select
                            value={filterBranch}
                            onChange={(e) => setFilterBranch(e.target.value)}
                            className="w-full bg-[#121212] border border-[#2C2C2C] text-white text-xs rounded-none focus:border-indigo-500 focus:ring-0 py-2 px-3 h-[38px] uppercase tracking-wider"
                        >
                            <option value="">All Branches</option>
                            {branches.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1.5">Filter Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full bg-[#121212] border border-[#2C2C2C] text-white text-xs rounded-none focus:border-indigo-500 focus:ring-0 py-2 px-3 h-[38px] uppercase tracking-wider"
                        >
                            <option value="">All Statuses</option>
                            <option value="Scheduled">Scheduled</option>
                            <option value="Absent">Absent</option>
                            <option value="On Leave">On Leave</option>
                            <option value="Exchanged">Exchanged</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block mb-1.5">Filter Date</label>
                        <input
                            type="date"
                            value={filterDate}
                            onChange={(e) => setFilterDate(e.target.value)}
                            className="w-full bg-[#121212] border border-[#2C2C2C] text-white text-xs rounded-none focus:border-indigo-500 focus:ring-0 py-2 px-3 h-[38px]"
                        />
                    </div>
                </div>

                {/* Schedules Board */}
                <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-0 sm:p-6 text-gray-200">
                        {filteredSchedules.length > 0 ? (
                            <>
                                {/* Mobile View: Flat Cards */}
                                <div className="sm:hidden grid grid-cols-1 divide-y divide-[#2C2C2C]">
                                    {filteredSchedules.map((schedule) => (
                                        <div key={schedule.id} className="p-5 bg-[#1E1E1E]">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-white uppercase text-xs tracking-wider">{schedule.employee?.name}</h3>
                                                    {schedule.status === 'Exchanged' && schedule.exchanged_with && (
                                                        <p className="text-[10px] text-purple-400 font-bold uppercase tracking-widest mt-0.5">
                                                            → Exchanged with: {schedule.exchanged_with.name}
                                                        </p>
                                                    )}
                                                    <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Branch: {schedule.branch?.name}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase border ${getStatusBadge(schedule.status)}`}>
                                                    {schedule.status}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-2 text-xs text-gray-400">
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Date</span>
                                                    <span className="text-white">{new Date(schedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Time</span>
                                                    <span className="text-white font-bold">{schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}</span>
                                                </p>
                                            </div>
                                            {isOwner && (
                                                <div className="mt-5 flex gap-0 border border-[#2C2C2C]">
                                                    <button
                                                        onClick={() => openEditModal(schedule)}
                                                        className="flex-1 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-indigo-400 font-bold py-3 text-xs tracking-widest uppercase transition-colors border-r border-[#2C2C2C]"
                                                    >
                                                        Edit / Resolve
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(schedule.id)}
                                                        className="flex-1 bg-[#1E1E1E] hover:bg-red-500 text-red-500 hover:text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
 
                                {/* Desktop View: Flat Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#2C2C2C]">
                                        <thead className="bg-[#121212]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Employee</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Branch</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Shift Hours</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                {isOwner && <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C2C2C] bg-[#1E1E1E]">
                                            {filteredSchedules.map((schedule) => (
                                                <tr key={schedule.id} className="hover:bg-[#2C2C2C] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-white font-medium">{schedule.employee?.name}</div>
                                                        {schedule.status === 'Exchanged' && schedule.exchanged_with && (
                                                            <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mt-0.5">
                                                                → Exchanged with: {schedule.exchanged_with.name}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-indigo-400 font-bold text-xs uppercase tracking-wider">{schedule.branch?.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">
                                                        {new Date(schedule.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 font-bold">
                                                        {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${getStatusBadge(schedule.status)}`}>
                                                            {schedule.status}
                                                        </span>
                                                    </td>
                                                    {isOwner && (
                                                        <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                                            <button
                                                                onClick={() => openEditModal(schedule)}
                                                                className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                                                            >
                                                                Edit / Resolve
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(schedule.id)}
                                                                className="text-red-500 hover:text-red-400 font-bold text-xs tracking-widest uppercase transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 mb-6 uppercase tracking-widest text-sm">No scheduled shifts found.</p>
                                {isOwner && (
                                    <button
                                        onClick={openCreateModal}
                                        className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase"
                                    >
                                        Click here to schedule the first shift
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Schedule Modal */}
            <Modal show={isCreating} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate} className="p-4 sm:p-8 bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Schedule Shift details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="employee_id" value="Select Employee *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="employee_id"
                                value={data.employee_id}
                                onChange={(e) => setData('employee_id', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.employee_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="branch_id" value="Select Branch (Brand) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="branch_id"
                                value={data.branch_id}
                                onChange={(e) => setData('branch_id', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <InputError message={errors.branch_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="date" value="Shift Date *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="date"
                                id="date"
                                value={data.date}
                                onChange={(e) => setData('date', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={errors.date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="status" value="Initial Status *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="status"
                                value={data.status}
                                onChange={(e) => setData('status', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Exchanged">Exchanged</option>
                            </select>
                            <InputError message={errors.status} className="mt-1" />
                        </div>

                        {data.status === 'Exchanged' && (
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="exchanged_with_employee_id" value="Exchanged With Employee *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <select
                                    id="exchanged_with_employee_id"
                                    value={data.exchanged_with_employee_id}
                                    onChange={(e) => setData('exchanged_with_employee_id', e.target.value)}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                    required
                                >
                                    <option value="">-- Select Employee --</option>
                                    {employees.filter(emp => emp.id.toString() !== data.employee_id).map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                <InputError message={errors.exchanged_with_employee_id} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="start_time" value="Start Time *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="time"
                                id="start_time"
                                value={data.start_time}
                                onChange={(e) => setData('start_time', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={errors.start_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="end_time" value="End Time *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="time"
                                id="end_time"
                                value={data.end_time}
                                onChange={(e) => setData('end_time', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={errors.end_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="repeat_type" value="Repeat Schedule *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="repeat_type"
                                value={data.repeat_type}
                                onChange={(e) => setData('repeat_type', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                <option value="None">Does not repeat</option>
                                <option value="Daily">Daily</option>
                                <option value="Weekly">Weekly</option>
                                <option value="Monthly">Monthly</option>
                            </select>
                            <InputError message={errors.repeat_type} className="mt-1" />
                        </div>

                        {data.repeat_type !== 'None' && (
                            <div>
                                <InputLabel htmlFor="repeat_until" value="Repeat Until *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <input
                                    type="date"
                                    id="repeat_until"
                                    value={data.repeat_until}
                                    onChange={(e) => setData('repeat_until', e.target.value)}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                    required
                                    min={data.date || undefined}
                                />
                                <InputError message={errors.repeat_until} className="mt-1" />
                            </div>
                        )}
                    </div>

                    <div className="mt-10 pt-6 border-t border-[#2C2C2C] flex justify-end">
                        <button
                            type="button"
                            onClick={closeCreateModal}
                            className="bg-transparent hover:bg-[#2C2C2C] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors border border-[#2C2C2C]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="ms-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors disabled:opacity-50"
                        >
                            Create Schedule
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Schedule Modal */}
            <Modal show={isEditing} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={submitEdit} className="p-4 sm:p-8 bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit / Resolve Shift schedule
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="edit_employee_id" value="Select Employee *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="edit_employee_id"
                                value={editForm.data.employee_id}
                                onChange={(e) => editForm.setData('employee_id', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.employee_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_branch_id" value="Select Branch (Brand) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="edit_branch_id"
                                value={editForm.data.branch_id}
                                onChange={(e) => editForm.setData('branch_id', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                {branches.map(b => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                            <InputError message={editForm.errors.branch_id} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_date" value="Shift Date *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="date"
                                id="edit_date"
                                value={editForm.data.date}
                                onChange={(e) => editForm.setData('date', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={editForm.errors.date} className="mt-1" />
                        </div>
                        <div>
                            <InputLabel htmlFor="edit_status" value="Shift Status *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <select
                                id="edit_status"
                                value={editForm.data.status}
                                onChange={(e) => editForm.setData('status', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                required
                            >
                                <option value="Scheduled">Scheduled</option>
                                <option value="Absent">Absent</option>
                                <option value="On Leave">On Leave</option>
                                <option value="Exchanged">Exchanged</option>
                            </select>
                            <InputError message={editForm.errors.status} className="mt-1" />
                        </div>

                        {editForm.data.status === 'Exchanged' && (
                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="edit_exchanged_with_employee_id" value="Exchanged With Employee *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <select
                                    id="edit_exchanged_with_employee_id"
                                    value={editForm.data.exchanged_with_employee_id}
                                    onChange={(e) => editForm.setData('exchanged_with_employee_id', e.target.value)}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] uppercase tracking-wider text-xs"
                                    required
                                >
                                    <option value="">-- Select Employee --</option>
                                    {employees.filter(emp => emp.id.toString() !== editForm.data.employee_id).map(e => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                <InputError message={editForm.errors.exchanged_with_employee_id} className="mt-1" />
                            </div>
                        )}

                        <div>
                            <InputLabel htmlFor="edit_start_time" value="Start Time *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="time"
                                id="edit_start_time"
                                value={editForm.data.start_time}
                                onChange={(e) => editForm.setData('start_time', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={editForm.errors.start_time} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_end_time" value="End Time *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <input
                                type="time"
                                id="edit_end_time"
                                value={editForm.data.end_time}
                                onChange={(e) => editForm.setData('end_time', e.target.value)}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 py-2.5 px-3 h-[42px] text-xs"
                                required
                            />
                            <InputError message={editForm.errors.end_time} className="mt-1" />
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-[#2C2C2C] flex justify-end">
                        <button
                            type="button"
                            onClick={closeEditModal}
                            className="bg-transparent hover:bg-[#2C2C2C] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors border border-[#2C2C2C]"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={editForm.processing}
                            className="ms-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors disabled:opacity-50"
                        >
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}

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

export default function Index({ employees, businessId, defaultHourlyRate }) {
    const { data, setData, post, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        email: '',
        password: '',
        mobile: '',
        designation: '',
        salary: defaultHourlyRate || '',
        leave_balance: 12,
        address: '',
        is_active: true,
        is_paying_tax: true,
        generate_payslip: true,
        unbranded_payslip: false,
    });

    const editForm = useForm({
        name: '',
        email: '',
        password: '',
        mobile: '',
        designation: '',
        salary: '',
        leave_balance: 12,
        address: '',
        is_active: true,
        is_paying_tax: true,
        generate_payslip: true,
        unbranded_payslip: false,
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isViewingDocs, setIsViewingDocs] = useState(false);
    const [selectedEmployeeForDocs, setSelectedEmployeeForDocs] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);

    const openDocsModal = (employee) => {
        setSelectedEmployeeForDocs(employee);
        setIsViewingDocs(true);
    };

    const closeDocsModal = () => {
        setIsViewingDocs(false);
        setSelectedEmployeeForDocs(null);
    };

    const openCreateModal = () => {
        reset();
        setData({
            name: '',
            email: '',
            password: '',
            mobile: '',
            designation: '',
            salary: defaultHourlyRate || '',
            leave_balance: 12,
            address: '',
            is_active: true,
        });
        setIsCreating(true);
    };

    const closeCreateModal = () => {
        setIsCreating(false);
        clearErrors();
        reset();
    };

    const openEditModal = (employee) => {
        setEditingEmployee(employee);
        editForm.setData({
            name: employee.name || '',
            email: employee.user?.email || '',
            password: '',
            mobile: employee.mobile || '',
            designation: employee.designation || '',
            salary: employee.salary || '',
            leave_balance: employee.leave_balance !== undefined && employee.leave_balance !== null ? employee.leave_balance : 12,
            address: employee.address || '',
            is_active: !!employee.is_active,
            is_paying_tax: employee.is_paying_tax !== undefined && employee.is_paying_tax !== null ? !!employee.is_paying_tax : true,
            generate_payslip: employee.generate_payslip !== undefined && employee.generate_payslip !== null ? !!employee.generate_payslip : true,
            unbranded_payslip: employee.unbranded_payslip !== undefined && employee.unbranded_payslip !== null ? !!employee.unbranded_payslip : false,
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setEditingEmployee(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post('/employees', {
            onSuccess: () => {
                closeCreateModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Employee added successfully!'
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
        editForm.put(`/employees/${editingEmployee.id}`, {
            onSuccess: () => {
                closeEditModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Employee updated successfully!'
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
            title: 'Remove this employee?',
            text: "This action cannot be undone!",
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
                destroy(`/employees/${id}`, {
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Employee removed.'
                        });
                    }
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Employees Management
                </h2>
            }
        >
            <Head title="Employees" />

            <div className="py-6">
                <div className="mb-6 flex justify-end">
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                    >
                        + Add New Employee
                    </button>
                </div>

                <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-0 sm:p-6 text-gray-200">
                        {employees && employees.length > 0 ? (
                            <>
                                {/* Mobile View: Flat Cards */}
                                <div className="sm:hidden grid grid-cols-1 divide-y divide-[#2C2C2C]">
                                    {employees.map((employee) => (
                                        <div key={employee.id} className="p-5 bg-[#1E1E1E]">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{employee.name}</h3>
                                                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider">{employee.designation}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{employee.user?.email || 'No Account'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${employee.is_active ? 'text-indigo-400 border-indigo-500/50' : 'text-red-400 border-red-500/50'}`}>
                                                    {employee.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-2 text-xs text-gray-400">
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Mobile</span> 
                                                    <span className="text-white">{employee.mobile}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Hourly Rate</span> 
                                                    <span className="text-white">{employee.salary ? `£${employee.salary}/hr` : 'N/A'}</span>
                                                </p>
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Leave Balance</span> 
                                                    <span className="text-white">{employee.leave_balance !== null && employee.leave_balance !== undefined ? `${employee.leave_balance} Days` : '12 Days'}</span>
                                                </p>

                                            </div>
                                            <div className="mt-5 flex gap-0 border border-[#2C2C2C]">
                                                <button 
                                                    onClick={() => openDocsModal(employee)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-indigo-400 font-bold py-3 text-xs tracking-widest uppercase transition-colors border-r border-[#2C2C2C]"
                                                >
                                                    Docs
                                                </button>
                                                <button 
                                                    onClick={() => openEditModal(employee)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors border-r border-[#2C2C2C]"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(employee.id)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-red-500 text-red-500 hover:text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop View: Flat Table */}
                                <div className="hidden sm:block overflow-x-auto">
                                    <table className="min-w-full divide-y divide-[#2C2C2C]">
                                        <thead className="bg-[#121212]">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Designation</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Mobile</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Hourly Rate</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Leave Balance</th>

                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C2C2C] bg-[#1E1E1E]">
                                            {employees.map((employee) => (
                                                <tr key={employee.id} className="hover:bg-[#2C2C2C] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{employee.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-indigo-400 font-bold text-xs uppercase tracking-wider">{employee.designation}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{employee.user?.email || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{employee.mobile}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{employee.salary ? `£${employee.salary}/hr` : 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{employee.leave_balance !== null && employee.leave_balance !== undefined ? `${employee.leave_balance} Days` : '12 Days'}</td>

                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${employee.is_active ? 'text-indigo-400 border-indigo-500/50' : 'text-red-400 border-red-500/50'}`}>
                                                            {employee.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                                        <button 
                                                            onClick={() => openDocsModal(employee)}
                                                            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Documents
                                                        </button>
                                                        <button 
                                                            onClick={() => openEditModal(employee)}
                                                            className="text-gray-400 hover:text-white font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(employee.id)}
                                                            className="text-red-500 hover:text-red-400 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Remove
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-400 mb-6 uppercase tracking-widest text-sm">No employees found.</p>
                                <button 
                                    onClick={openCreateModal}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase"
                                >
                                    Click here to add the first employee
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Employee Modal */}
            <Modal show={isCreating} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Employee Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="name" value="Full Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="name"
                                value={data.name}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                isFocused
                                onChange={(e) => setData('name', e.target.value)}
                                required
                            />
                            <InputError message={errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="mobile" value="Mobile *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="mobile"
                                value={data.mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('mobile', e.target.value)}
                                required
                            />
                            <InputError message={errors.mobile} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="designation" value="Designation / Role *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="designation"
                                value={data.designation}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('designation', e.target.value)}
                                required
                            />
                            <InputError message={errors.designation} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="salary" value="Hourly Rate (£/hr) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="salary"
                                type="number"
                                step="0.01"
                                value={data.salary}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('salary', e.target.value)}
                            />
                            <InputError message={errors.salary} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="leave_balance" value="Leave Balance (Days)" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="leave_balance"
                                type="number"
                                value={data.leave_balance}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('leave_balance', e.target.value)}
                            />
                            <InputError message={errors.leave_balance} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="address" value="Home Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="address"
                                value={data.address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('address', e.target.value)}
                            />
                            <InputError message={errors.address} className="mt-1" />
                        </div>
                    </div>

                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mt-10 mb-6 border-b border-[#2C2C2C] pb-3">
                        Payroll & Tax Settings
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_paying_tax"
                                    checked={data.is_paying_tax}
                                    onChange={(e) => setData('is_paying_tax', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                />
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold font-sans">Paying Tax</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">Unchecked means Cash in Hand</span>
                            <InputError message={errors.is_paying_tax} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="generate_payslip"
                                    checked={data.generate_payslip}
                                    onChange={(e) => setData('generate_payslip', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                />
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold font-sans">Generate Payslip</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">Enables PDF generation</span>
                            <InputError message={errors.generate_payslip} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="unbranded_payslip"
                                    checked={data.unbranded_payslip}
                                    onChange={(e) => setData('unbranded_payslip', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                    disabled={!data.generate_payslip}
                                />
                                <span className={`ms-2 text-xs uppercase tracking-widest font-bold font-sans ${data.generate_payslip ? 'text-[#A0A0A0]' : 'text-gray-600'}`}>Unbranded Payslip</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">No shop details or identity</span>
                            <InputError message={errors.unbranded_payslip} className="mt-1" />
                        </div>
                    </div>

                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mt-10 mb-6 border-b border-[#2C2C2C] pb-3">
                        Portal Account Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="email" value="Login ID (Email) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="email"
                                type="email"
                                value={data.email}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('email', e.target.value)}
                                required
                            />
                            <InputError message={errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="password" value="Portal Password *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="password"
                                type="password"
                                value={data.password}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('password', e.target.value)}
                                required
                            />
                            <InputError message={errors.password} className="mt-1" />
                        </div>
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
                            Add Employee
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Employee Modal */}
            <Modal show={isEditing} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={submitEdit} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Employee Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="edit_name" value="Full Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_name"
                                value={editForm.data.name}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                isFocused
                                onChange={(e) => editForm.setData('name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_mobile" value="Mobile *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_mobile"
                                value={editForm.data.mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('mobile', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.mobile} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_designation" value="Designation / Role *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_designation"
                                value={editForm.data.designation}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('designation', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.designation} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_salary" value="Hourly Rate (£/hr) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_salary"
                                type="number"
                                step="0.01"
                                value={editForm.data.salary}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('salary', e.target.value)}
                            />
                            <InputError message={editForm.errors.salary} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_leave_balance" value="Leave Balance (Days)" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_leave_balance"
                                type="number"
                                value={editForm.data.leave_balance}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('leave_balance', e.target.value)}
                            />
                            <InputError message={editForm.errors.leave_balance} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit_address" value="Home Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_address"
                                value={editForm.data.address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('address', e.target.value)}
                            />
                            <InputError message={editForm.errors.address} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    checked={editForm.data.is_active}
                                    onChange={(e) => editForm.setData('is_active', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                />
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold">Employee is Active</span>
                            </label>
                            <InputError message={editForm.errors.is_active} className="mt-1" />
                        </div>
                    </div>

                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mt-10 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Payroll & Tax Settings
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_paying_tax"
                                    checked={editForm.data.is_paying_tax}
                                    onChange={(e) => editForm.setData('is_paying_tax', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                />
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold font-sans">Paying Tax</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">Unchecked means Cash in Hand</span>
                            <InputError message={editForm.errors.is_paying_tax} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="generate_payslip"
                                    checked={editForm.data.generate_payslip}
                                    onChange={(e) => editForm.setData('generate_payslip', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                />
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold font-sans">Generate Payslip</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">Enables PDF generation</span>
                            <InputError message={editForm.errors.generate_payslip} className="mt-1" />
                        </div>

                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="unbranded_payslip"
                                    checked={editForm.data.unbranded_payslip}
                                    onChange={(e) => editForm.setData('unbranded_payslip', e.target.checked)}
                                    className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                    disabled={!editForm.data.generate_payslip}
                                />
                                <span className={`ms-2 text-xs uppercase tracking-widest font-bold font-sans ${editForm.data.generate_payslip ? 'text-[#A0A0A0]' : 'text-gray-600'}`}>Unbranded Payslip</span>
                            </label>
                            <span className="block mt-1 text-[10px] text-gray-500 uppercase">No shop details or identity</span>
                            <InputError message={editForm.errors.unbranded_payslip} className="mt-1" />
                        </div>
                    </div>

                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mt-10 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Portal Account Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="edit_email" value="Login ID (Email) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_email"
                                type="email"
                                value={editForm.data.email}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('email', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_password" value="Reset Password (Leave blank to keep current)" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_password"
                                type="password"
                                value={editForm.data.password}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('password', e.target.value)}
                            />
                            <InputError message={editForm.errors.password} className="mt-1" />
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

            {/* View Compliance Documents Modal */}
            <Modal show={isViewingDocs} onClose={closeDocsModal} maxWidth="xl">
                <div className="p-6 sm:p-8 bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        {selectedEmployeeForDocs?.name}'s Legal Documents
                    </h2>

                    {selectedEmployeeForDocs?.documents && selectedEmployeeForDocs.documents.length > 0 ? (
                        <div className="bg-[#121212] border border-[#2C2C2C] divide-y divide-[#2C2C2C]">
                            {selectedEmployeeForDocs.documents.map((doc) => (
                                <div key={doc.id} className="p-4 flex items-center justify-between text-xs">
                                    <div>
                                        <h4 className="font-bold text-white uppercase tracking-wider">{doc.document_name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                                            Uploaded on {new Date(doc.uploaded_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <button
                                            type="button"
                                            onClick={() => setPreviewDoc(doc)}
                                            className="text-indigo-400 hover:text-indigo-300 font-bold uppercase tracking-widest text-[10px] border border-indigo-500/30 px-3 py-1.5 hover:bg-indigo-950/10 transition-colors"
                                        >
                                            Preview
                                        </button>
                                        <a
                                            href={route('legal-documents.download', doc.id)}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-white font-bold uppercase tracking-widest text-[10px] border border-gray-500/30 px-3 py-1.5 hover:bg-[#2C2C2C]/35 transition-colors"
                                        >
                                            Download
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-12 border border-[#2C2C2C] bg-[#121212] text-center text-gray-500 uppercase tracking-widest text-xs">
                            No legal documents uploaded yet.
                        </div>
                    )}

                    <div className="mt-8 flex justify-end">
                        <button 
                            type="button" 
                            onClick={closeDocsModal}
                            className="bg-transparent hover:bg-[#2C2C2C] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors border border-[#2C2C2C]"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Preview Modal for Shop Owner */}
            <Modal show={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="3xl">
                <div className="p-6 bg-[#1E1E1E] text-white">
                    <div className="flex justify-between items-center mb-6 border-b border-[#2C2C2C] pb-3">
                        <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-widest">
                            Preview: {previewDoc?.document_name}
                        </h3>
                        <button
                            type="button"
                            onClick={() => setPreviewDoc(null)}
                            className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                        >
                            Close Preview
                        </button>
                    </div>

                    <div className="bg-[#121212] border border-[#2C2C2C] p-2 flex justify-center items-center h-[82vh] overflow-hidden">
                        {previewDoc?.file_type === 'pdf' ? (
                            <iframe
                                src={route('legal-documents.view', previewDoc.id) + '#toolbar=0&navpanes=0'}
                                className="w-full h-full border-0"
                                title={previewDoc?.document_name}
                            />
                        ) : ['jpg', 'jpeg', 'png'].includes(previewDoc?.file_type) ? (
                            <img
                                src={route('legal-documents.view', previewDoc.id)}
                                alt={previewDoc?.document_name}
                                className="max-w-full max-h-full object-contain"
                            />
                        ) : (
                            <div className="text-center text-gray-400 text-xs uppercase tracking-widest">
                                Preview not supported for this file type. Please download the file instead.
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

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

export default function Index({ branches, businessId }) {
    const { data, setData, post, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        name: '',
        address: '',
        mobile: '',
        is_active: true,
    });

    const editForm = useForm({
        name: '',
        address: '',
        mobile: '',
        is_active: true,
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBranch, setEditingBranch] = useState(null);

    const openCreateModal = () => setIsCreating(true);

    const closeCreateModal = () => {
        setIsCreating(false);
        clearErrors();
        reset();
    };

    const openEditModal = (branch) => {
        setEditingBranch(branch);
        editForm.setData({
            name: branch.name || '',
            address: branch.address || '',
            mobile: branch.mobile || '',
            is_active: !!branch.is_active,
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setEditingBranch(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post('/branches', {
            onSuccess: () => {
                closeCreateModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Branch created successfully!'
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
        editForm.put(`/branches/${editingBranch.id}`, {
            onSuccess: () => {
                closeEditModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Branch updated successfully!'
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
            title: 'Delete this branch?',
            text: "All associated records will be lost!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#2C2C2C',
            confirmButtonText: 'YES, DELETE',
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
                destroy(`/branches/${id}`, {
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Branch deleted.'
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
                    Branches Management
                </h2>
            }
        >
            <Head title="Branches" />

            <div className="py-6">
                <div className="mb-6 flex justify-end">
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                    >
                        + Add New Branch
                    </button>
                </div>

                <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-0 sm:p-6 text-gray-200">
                        {branches && branches.length > 0 ? (
                            <>
                                {/* Mobile View: Flat Cards */}
                                <div className="sm:hidden grid grid-cols-1 divide-y divide-[#2C2C2C]">
                                    {branches.map((branch) => (
                                        <div key={branch.id} className="p-5 bg-[#1E1E1E]">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{branch.name}</h3>
                                                    <p className="text-xs text-gray-400 mt-1">{branch.address || 'No Address'}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${branch.is_active ? 'text-indigo-400 border-indigo-500/50' : 'text-red-400 border-red-500/50'}`}>
                                                    {branch.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-2 text-xs text-gray-400">
                                                <p className="flex justify-between">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Mobile</span> 
                                                    <span className="text-white">{branch.mobile || 'N/A'}</span>
                                                </p>
                                            </div>
                                            <div className="mt-5 flex gap-0 border border-[#2C2C2C]">
                                                <button 
                                                    onClick={() => openEditModal(branch)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors border-r border-[#2C2C2C]"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(branch.id)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-red-500 text-red-500 hover:text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors"
                                                >
                                                    Delete
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
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Address</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Mobile</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C2C2C] bg-[#1E1E1E]">
                                            {branches.map((branch) => (
                                                <tr key={branch.id} className="hover:bg-[#2C2C2C] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{branch.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{branch.address || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{branch.mobile || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border ${branch.is_active ? 'text-indigo-400 border-indigo-500/50' : 'text-red-400 border-red-500/50'}`}>
                                                            {branch.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                                        <button 
                                                            onClick={() => openEditModal(branch)}
                                                            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(branch.id)}
                                                            className="text-red-500 hover:text-red-400 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Delete
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
                                <p className="text-gray-400 mb-6 uppercase tracking-widest text-sm">No branches found.</p>
                                <button 
                                    onClick={openCreateModal}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase"
                                >
                                    Click here to add the first branch
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Create Branch Modal */}
            <Modal show={isCreating} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate} className="p-4 sm:p-8 bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Branch Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="name" value="Branch Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
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
                            <InputLabel htmlFor="mobile" value="Contact Mobile" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="mobile"
                                value={data.mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('mobile', e.target.value)}
                            />
                            <InputError message={errors.mobile} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="address" value="Branch Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="address"
                                value={data.address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('address', e.target.value)}
                            />
                            <InputError message={errors.address} className="mt-1" />
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
                            Add Branch
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Branch Modal */}
            <Modal show={isEditing} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={submitEdit} className="p-4 sm:p-8 bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Branch Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit_name" value="Branch Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
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
                            <InputLabel htmlFor="edit_mobile" value="Contact Mobile" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_mobile"
                                value={editForm.data.mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('mobile', e.target.value)}
                            />
                            <InputError message={editForm.errors.mobile} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit_address" value="Branch Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
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
                                <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold">Branch is Active</span>
                            </label>
                            <InputError message={editForm.errors.is_active} className="mt-1" />
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

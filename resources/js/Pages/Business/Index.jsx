import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';
import PrimaryButton from '@/Components/PrimaryButton';
import SecondaryButton from '@/Components/SecondaryButton';
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

export default function Index({ businesses }) {
    const { data, setData, post, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        business_name: '',
        business_mobile: '',
        business_address: '',
        owner_name: '',
        owner_email: '',
        owner_password: '',
        owner_mobile: '',
        owner_address: '',
    });

    const editForm = useForm({
        business_name: '',
        business_mobile: '',
        business_address: '',
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingBusiness, setEditingBusiness] = useState(null);

    const openCreateModal = () => setIsCreating(true);

    const closeCreateModal = () => {
        setIsCreating(false);
        clearErrors();
        reset();
    };

    const openEditModal = (business) => {
        setEditingBusiness(business);
        editForm.setData({
            business_name: business.name || '',
            business_mobile: business.mobile || '',
            business_address: business.address || '',
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setEditingBusiness(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post('/businesses', {
            onSuccess: () => {
                closeCreateModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Successfully created!'
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
        editForm.put(`/businesses/${editingBusiness.id}`, {
            onSuccess: () => {
                closeEditModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Business updated successfully!'
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
            title: 'Delete this business?',
            text: "This action cannot be undone!",
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
                destroy(`/businesses/${id}`, {
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Business deleted.'
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
                    Businesses
                </h2>
            }
        >
            <Head title="Businesses" />

            <div className="py-6">
                <div className="mb-6 flex justify-end">
                    <button 
                        onClick={openCreateModal}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                    >
                        + Add New Business
                    </button>
                </div>

                <div className="bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-0 sm:p-6 text-gray-200">
                        {businesses && businesses.length > 0 ? (
                            <>
                                {/* Mobile View: Flat Cards */}
                                <div className="sm:hidden grid grid-cols-1 divide-y divide-[#2C2C2C]">
                                    {businesses.map((business) => (
                                        <div key={business.id} className="p-5 bg-[#1E1E1E]">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h3 className="font-bold text-lg text-white">{business.name}</h3>
                                                    <p className="text-sm text-gray-400">{business.user?.email || 'No Email'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 text-sm text-gray-400">
                                                <p className="flex items-center gap-2">
                                                    <span className="font-bold text-gray-500 tracking-widest uppercase text-[10px]">Mobile</span> 
                                                    <span className="text-white">{business.mobile}</span>
                                                </p>
                                            </div>
                                            <div className="mt-5 flex gap-0 border border-[#2C2C2C]">
                                                <button 
                                                    onClick={() => openEditModal(business)}
                                                    className="flex-1 bg-[#1E1E1E] hover:bg-[#2C2C2C] text-white font-bold py-3 text-xs tracking-widest uppercase transition-colors border-r border-[#2C2C2C]"
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(business.id)}
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
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Owner Email</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Mobile</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#2C2C2C] bg-[#1E1E1E]">
                                            {businesses.map((business) => (
                                                <tr key={business.id} className="hover:bg-[#2C2C2C] transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-white font-medium">{business.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{business.user?.email || 'N/A'}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-gray-400">{business.mobile}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap space-x-4">
                                                        <button 
                                                            onClick={() => openEditModal(business)}
                                                            className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(business.id)}
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
                                <p className="text-gray-400 mb-6 uppercase tracking-widest text-sm">No businesses found.</p>
                                <button 
                                    onClick={openCreateModal}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase"
                                >
                                    Click here to create the first business
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Flat Modal Styling relies on Breeze defaults being in dark mode, but we can override padding */}
            <Modal show={isCreating} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Business Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="business_name" value="Business Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="business_name"
                                name="business_name"
                                value={data.business_name}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                isFocused
                                onChange={(e) => setData('business_name', e.target.value)}
                                required
                            />
                            <InputError message={errors.business_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="business_mobile" value="Business Mobile *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="business_mobile"
                                name="business_mobile"
                                value={data.business_mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('business_mobile', e.target.value)}
                                required
                            />
                            <InputError message={errors.business_mobile} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="business_address" value="Business Address *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="business_address"
                                name="business_address"
                                value={data.business_address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('business_address', e.target.value)}
                                required
                            />
                            <InputError message={errors.business_address} className="mt-1" />
                        </div>
                    </div>

                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mt-10 mb-6 border-b border-[#2C2C2C] pb-3">
                        Owner Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="owner_name" value="Owner Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="owner_name"
                                name="owner_name"
                                value={data.owner_name}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('owner_name', e.target.value)}
                                required
                            />
                            <InputError message={errors.owner_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="owner_email" value="Login ID (Email) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="owner_email"
                                type="email"
                                name="owner_email"
                                value={data.owner_email}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('owner_email', e.target.value)}
                                required
                            />
                            <InputError message={errors.owner_email} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="owner_password" value="Owner Password *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="owner_password"
                                type="password"
                                name="owner_password"
                                value={data.owner_password}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('owner_password', e.target.value)}
                                required
                            />
                            <InputError message={errors.owner_password} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="owner_mobile" value="Owner Mobile" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="owner_mobile"
                                name="owner_mobile"
                                value={data.owner_mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('owner_mobile', e.target.value)}
                            />
                            <InputError message={errors.owner_mobile} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="owner_address" value="Owner Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="owner_address"
                                name="owner_address"
                                value={data.owner_address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('owner_address', e.target.value)}
                            />
                            <InputError message={errors.owner_address} className="mt-1" />
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
                            Create Account
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Business Modal */}
            <Modal show={isEditing} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={submitEdit} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Business Details
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <InputLabel htmlFor="edit_business_name" value="Business Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_business_name"
                                name="business_name"
                                value={editForm.data.business_name}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                isFocused
                                onChange={(e) => editForm.setData('business_name', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.business_name} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_business_mobile" value="Business Mobile *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_business_mobile"
                                name="business_mobile"
                                value={editForm.data.business_mobile}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('business_mobile', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.business_mobile} className="mt-1" />
                        </div>

                        <div className="sm:col-span-2">
                            <InputLabel htmlFor="edit_business_address" value="Business Address *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_business_address"
                                name="business_address"
                                value={editForm.data.business_address}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => editForm.setData('business_address', e.target.value)}
                                required
                            />
                            <InputError message={editForm.errors.business_address} className="mt-1" />
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

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
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

export default function Index({ business }) {
    const { data, setData, post, processing, errors } = useForm({
        name: business.name || '',
        mobile: business.mobile || '',
        address: business.address || '',
        default_hourly_rate: business.default_hourly_rate || '10.00',
        apply_to_all_employees: false,
        logo: null,
        _method: 'PUT',
    });

    const submit = (e) => {
        e.preventDefault();
        post('/configurations', {
            onSuccess: () => {
                setData('apply_to_all_employees', false);
                Toast.fire({
                    icon: 'success',
                    title: 'Configurations updated successfully!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Failed to update configurations.'
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Configurations
                </h2>
            }
        >
            <Head title="Configurations" />

            <div className="py-6">
                <div className="max-w-3xl bg-[#1E1E1E] border border-[#2C2C2C]">
                    <div className="p-4 sm:p-6 border-b border-[#2C2C2C]">
                        <h3 className="text-xs text-white font-bold tracking-widest uppercase">Business Settings</h3>
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Configure your business defaults and contact details</p>
                    </div>

                    <form onSubmit={submit} className="p-6 space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <InputLabel htmlFor="name" value="Business Name *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <TextInput
                                    id="name"
                                    value={data.name}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
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
                                <InputLabel htmlFor="address" value="Business Address" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <TextInput
                                    id="address"
                                    value={data.address}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                    onChange={(e) => setData('address', e.target.value)}
                                />
                                <InputError message={errors.address} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <InputLabel htmlFor="logo" value="Business Logo" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <div className="mt-2 flex items-center gap-6 p-4 bg-[#121212] border border-[#2C2C2C]">
                                    {business.logo && !data.logo && (
                                        <div className="w-16 h-16 border border-[#2C2C2C] flex items-center justify-center bg-[#1E1E1E] overflow-hidden">
                                            <img src={business.logo} alt="Business Logo" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                    {data.logo && (
                                        <div className="w-16 h-16 border border-[#2C2C2C] flex items-center justify-center bg-[#1E1E1E] overflow-hidden">
                                            <img src={URL.createObjectURL(data.logo)} alt="Selected Logo Preview" className="max-w-full max-h-full object-contain" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input
                                            id="logo"
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => setData('logo', e.target.files[0])}
                                            className="text-xs text-[#A0A0A0] file:mr-4 file:py-2 file:px-4 file:rounded-none file:border file:border-[#2C2C2C] file:bg-[#1E1E1E] file:text-white file:text-xs file:font-bold file:uppercase file:tracking-widest hover:file:bg-[#2C2C2C] cursor-pointer"
                                        />
                                        <span className="block text-[8px] text-gray-500 uppercase tracking-widest mt-1">Accepts PNG, JPG (Max 2MB). Fits on payslip headers.</span>
                                    </div>
                                </div>
                                <InputError message={errors.logo} className="mt-1" />
                            </div>

                            <div>
                                <InputLabel htmlFor="default_hourly_rate" value="Default Employee Hourly Rate (£/hr) *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                                <TextInput
                                    id="default_hourly_rate"
                                    type="number"
                                    step="0.01"
                                    value={data.default_hourly_rate}
                                    className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                    onChange={(e) => setData('default_hourly_rate', e.target.value)}
                                    required
                                />
                                <InputError message={errors.default_hourly_rate} className="mt-1" />
                            </div>

                            <div className="sm:col-span-2">
                                <label className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="apply_to_all_employees"
                                        checked={data.apply_to_all_employees}
                                        onChange={(e) => setData('apply_to_all_employees', e.target.checked)}
                                        className="bg-[#121212] border-[#2C2C2C] text-indigo-600 focus:ring-0 rounded-none w-5 h-5"
                                    />
                                    <span className="ms-2 text-xs text-[#A0A0A0] uppercase tracking-widest font-bold">Apply this default hourly rate to all current employees</span>
                                </label>
                                <InputError message={errors.apply_to_all_employees} className="mt-1" />
                            </div>
                        </div>

                        <div className="pt-6 border-t border-[#2C2C2C] flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors disabled:opacity-50"
                            >
                                Save Configurations
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, usePage } from '@inertiajs/react';
import DeleteUserForm from './Partials/DeleteUserForm';
import UpdatePasswordForm from './Partials/UpdatePasswordForm';
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm';
import LegalDocumentsForm from './Partials/LegalDocumentsForm';

export default function Edit({ mustVerifyEmail, status, documents = [] }) {
    const user = usePage().props.auth.user;

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                    Profile
                </h2>
            }
        >
            <Head title="Profile" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {user.role !== 'EMPLOYEE' && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 sm:p-8">
                            <UpdateProfileInformationForm
                                mustVerifyEmail={mustVerifyEmail}
                                status={status}
                                className="max-w-xl"
                            />
                        </div>
                    )}

                    {user.role !== 'EMPLOYEE' && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 sm:p-8">
                            <UpdatePasswordForm className="max-w-xl" />
                        </div>
                    )}

                    {user.role === 'EMPLOYEE' && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 sm:p-8">
                            <LegalDocumentsForm documents={documents} className="max-w-3xl" />
                        </div>
                    )}

                    {user.role !== 'EMPLOYEE' && (
                        <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-4 sm:p-8">
                            <DeleteUserForm className="max-w-xl" />
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

import { useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import Modal from '@/Components/Modal';
import Swal from 'sweetalert2';

export default function LegalDocumentsForm({ documents = [], className = '' }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        document_name: '',
        file: null,
    });

    const [previewDoc, setPreviewDoc] = useState(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#1E1E1E',
        color: '#ffffff'
    });

    const submit = (e) => {
        e.preventDefault();
        post('/legal-documents', {
            forceFormData: true,
            onSuccess: () => {
                reset();
                Toast.fire({
                    icon: 'success',
                    title: 'Document uploaded successfully!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Document upload failed. Ensure file is PDF/Image under 10MB.'
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete this document?',
            text: "This file will be permanently removed.",
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
                router.delete(`/legal-documents/${id}`, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Document deleted successfully.'
                        });
                    }
                });
            }
        });
    };

    const openPreview = (doc) => {
        setPreviewDoc(doc);
    };

    const closePreview = () => {
        setPreviewDoc(null);
    };

    return (
        <section className={`space-y-6 ${className}`}>
            <header>
                <h3 className="text-sm font-bold uppercase text-white tracking-widest">Legal & Compliance Documents</h3>
                <p className="mt-1 text-xs text-gray-400 uppercase tracking-widest">
                    Upload and manage your required employment documents (Passport, Visa, ID, etc.)
                </p>
            </header>

            {/* Document list */}
            {documents.length > 0 ? (
                <div className="bg-[#121212] border border-[#2C2C2C] overflow-hidden">
                    <div className="divide-y divide-[#2C2C2C]">
                        {documents.map((doc) => (
                            <div key={doc.id} className="p-4 flex items-center justify-between text-xs">
                                <div className="space-y-1">
                                    <h4 className="font-bold text-white uppercase tracking-wider">{doc.document_name}</h4>
                                    <p className="text-[10px] text-gray-500 uppercase tracking-widest">Uploaded on {doc.uploaded_at}</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <button
                                        type="button"
                                        onClick={() => openPreview(doc)}
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
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-500 hover:text-red-400 font-bold uppercase tracking-widest text-[10px] border border-red-500/30 px-3 py-1.5 hover:bg-red-950/10 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-6 border border-[#2C2C2C] bg-[#121212] text-center text-gray-500 uppercase tracking-widest text-xs">
                    No documents uploaded yet.
                </div>
            )}

            {/* Document Upload Form */}
            <form onSubmit={submit} className="space-y-6 pt-6 border-t border-[#2C2C2C]/50">
                <h4 className="text-xs font-bold uppercase text-indigo-400 tracking-wider">Upload New Document</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <InputLabel htmlFor="document_name" value="Document Name (e.g. Passport, Biometric Card)" className="text-xs uppercase tracking-widest text-gray-400 mb-2" />
                        <TextInput
                            id="document_name"
                            value={data.document_name}
                            onChange={(e) => setData('document_name', e.target.value)}
                            className="w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none"
                            placeholder="Enter document name"
                            required
                        />
                        <InputError message={errors.document_name} className="mt-1" />
                    </div>

                    <div>
                        <InputLabel htmlFor="file" value="Select Document (PDF, PNG, JPG - Max 10MB)" className="text-xs uppercase tracking-widest text-gray-400 mb-2" />
                        <input
                            id="file"
                            type="file"
                            onChange={(e) => setData('file', e.target.files[0])}
                            className="w-full bg-[#121212] border border-[#2C2C2C] text-gray-400 text-xs py-[9px] px-3 focus:outline-none focus:border-indigo-500 focus:ring-0 font-mono"
                            required
                            accept=".pdf,image/png,image/jpeg,image/jpg"
                        />
                        <InputError message={errors.file} className="mt-1" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={processing}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs tracking-widest uppercase py-3.5 px-8 transition-colors rounded-none disabled:opacity-50"
                    >
                        Upload Document
                    </button>
                </div>
            </form>

            {/* Preview Modal */}
            <Modal show={!!previewDoc} onClose={closePreview} maxWidth="3xl">
                <div className="p-6 bg-[#1E1E1E] text-white">
                    <div className="flex justify-between items-center mb-6 border-b border-[#2C2C2C] pb-3">
                        <h3 className="text-xs font-bold uppercase text-indigo-400 tracking-widest">
                            Preview: {previewDoc?.document_name}
                        </h3>
                        <button
                            type="button"
                            onClick={closePreview}
                            className="text-xs font-bold text-gray-500 hover:text-white uppercase tracking-widest"
                        >
                            Close
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
        </section>
    );
}

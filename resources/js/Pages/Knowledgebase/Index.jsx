import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, Link } from '@inertiajs/react';
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

export default function Index({ lessons, completions = [], businessId, authRole }) {
    const isOwner = authRole === 'SHOP_OWNER';

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        title: '',
        content: '',
        questions: [],
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState(null);
    const [activeTab, setActiveTab] = useState('lessons'); // 'lessons' or 'progress'

    const openCreateModal = () => {
        reset();
        setIsCreating(true);
    };

    const closeCreateModal = () => {
        setIsCreating(false);
        clearErrors();
        reset();
    };

    const startEditing = (lesson) => {
        setEditingLessonId(lesson.id);
        setData({
            title: lesson.title || '',
            content: lesson.content || '',
            questions: lesson.questions ? lesson.questions.map(q => ({
                question_text: q.question_text || '',
                options: q.options || ['', '', '', ''],
                correct_answer_index: q.correct_answer_index ?? 0
            })) : []
        });
        setIsEditing(true);
    };

    const closeEditModal = () => {
        setIsEditing(false);
        setEditingLessonId(null);
        clearErrors();
        reset();
    };

    const addQuestion = () => {
        setData('questions', [
            ...data.questions,
            {
                question_text: '',
                options: ['', '', '', ''],
                correct_answer_index: 0
            }
        ]);
    };

    const removeQuestion = (qIndex) => {
        setData('questions', data.questions.filter((_, i) => i !== qIndex));
    };

    const handleQuestionTextChange = (qIndex, text) => {
        const updated = [...data.questions];
        updated[qIndex].question_text = text;
        setData('questions', updated);
    };

    const handleOptionChange = (qIndex, oIndex, val) => {
        const updated = [...data.questions];
        updated[qIndex].options[oIndex] = val;
        setData('questions', updated);
    };

    const handleCorrectOptionChange = (qIndex, idx) => {
        const updated = [...data.questions];
        updated[qIndex].correct_answer_index = parseInt(idx);
        setData('questions', updated);
    };

    const submitCreate = (e) => {
        e.preventDefault();
        post('/knowledgebase', {
            onSuccess: () => {
                closeCreateModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Lesson and questions created!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Check for validation errors.'
                });
            }
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        put(`/knowledgebase/${editingLessonId}`, {
            onSuccess: () => {
                closeEditModal();
                Toast.fire({
                    icon: 'success',
                    title: 'Lesson and questions updated!'
                });
            },
            onError: () => {
                Toast.fire({
                    icon: 'error',
                    title: 'Check for validation errors.'
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete this lesson?',
            text: "This will remove the lesson and all associated questions!",
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
                destroy(`/knowledgebase/${id}`, {
                    onSuccess: () => {
                        Toast.fire({
                            icon: 'success',
                            title: 'Lesson deleted.'
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
                    Knowledgebase
                </h2>
            }
        >
            <Head title="Knowledgebase" />

            <div className="py-6">
                {/* Shop Owner Tabs */}
                {isOwner && (
                    <div className="flex border-b border-[#2C2C2C] mb-6">
                        <button
                            onClick={() => setActiveTab('lessons')}
                            className={`py-3 px-6 text-xs font-bold tracking-widest uppercase border-b-2 transition-all ${activeTab === 'lessons' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            Lessons
                        </button>
                        <button
                            onClick={() => setActiveTab('progress')}
                            className={`py-3 px-6 text-xs font-bold tracking-widest uppercase border-b-2 transition-all ${activeTab === 'progress' ? 'border-indigo-500 text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
                        >
                            Employee Progress
                        </button>
                    </div>
                )}

                {activeTab === 'lessons' ? (
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <p className="text-xs text-gray-400 uppercase tracking-widest">
                                {isOwner ? 'Manage employee learning materials' : 'Study lessons and test your knowledge'}
                            </p>
                            {isOwner && (
                                <button
                                    onClick={openCreateModal}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                                >
                                    + Add New Lesson
                                </button>
                            )}
                        </div>

                        {lessons && lessons.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {lessons.map((lesson) => {
                                    const userComp = lesson.completions && lesson.completions[0];
                                    return (
                                        <div key={lesson.id} className="bg-[#1E1E1E] border border-[#2C2C2C] flex flex-col justify-between p-6">
                                            <div>
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col">
                                                        <h3 className="font-bold text-lg text-white uppercase tracking-wider">{lesson.title}</h3>
                                                        {userComp && (
                                                            <span className="text-[10px] text-green-400 font-bold tracking-widest uppercase mt-1">
                                                                ✓ COMPLETED (SCORE: {userComp.score}/{userComp.total_questions})
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase border border-indigo-500/50 text-indigo-400">
                                                        {lesson.questions_count ?? (lesson.questions ? lesson.questions.length : 0)} QUESTIONS
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-400 mb-6 line-clamp-3 leading-relaxed">
                                                    {lesson.content}
                                                </p>
                                            </div>
                                            <div className="pt-4 border-t border-[#2C2C2C] flex justify-between items-center">
                                                <Link
                                                    href={`/knowledgebase/${lesson.id}`}
                                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                                                >
                                                    Study Lesson &rarr;
                                                </Link>
                                                {isOwner && (
                                                    <div className="flex gap-4">
                                                        <button
                                                            onClick={() => startEditing(lesson)}
                                                            className="text-gray-400 hover:text-white font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(lesson.id)}
                                                            className="text-red-500 hover:text-red-400 font-bold text-xs tracking-widest uppercase transition-colors"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="bg-[#1E1E1E] border border-[#2C2C2C] text-center py-12">
                                <p className="text-gray-400 mb-6 uppercase tracking-widest text-sm">No lessons found.</p>
                                {isOwner && (
                                    <button
                                        onClick={openCreateModal}
                                        className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase"
                                    >
                                        Click here to add the first lesson
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    /* Employee Progress View for Owner */
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] overflow-hidden">
                        <div className="p-6 border-b border-[#2C2C2C]">
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Employee Quiz Results</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">Track which employees have completed quizzes</p>
                        </div>
                        
                        {completions && completions.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#2C2C2C] bg-[#121212]">
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Employee</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Lesson</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest text-center">Score</th>
                                            <th className="p-4 text-xs font-bold text-[#A0A0A0] uppercase tracking-widest">Completed At</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2C2C2C] text-gray-300">
                                        {completions.map((comp) => (
                                            <tr key={comp.id} className="hover:bg-[#252525] transition-colors">
                                                <td className="p-4 text-xs font-bold text-white uppercase tracking-wider">{comp.user?.name}</td>
                                                <td className="p-4 text-xs uppercase tracking-wider">{comp.lesson?.title}</td>
                                                <td className="p-4 text-xs font-bold text-center">
                                                    <span className={`px-2.5 py-1 text-[10px] font-bold tracking-widest uppercase border ${comp.score === comp.total_questions ? 'text-green-400 border-green-500/30 bg-green-950/10' : 'text-indigo-400 border-indigo-500/30 bg-indigo-950/10'}`}>
                                                        {comp.score} / {comp.total_questions}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-xs text-gray-400 uppercase tracking-wider">
                                                    {new Date(comp.completed_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-12 text-center text-gray-400 text-xs uppercase tracking-widest">
                                No completions recorded yet.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Create Lesson Modal */}
            <Modal show={isCreating} onClose={closeCreateModal} maxWidth="2xl">
                <form onSubmit={submitCreate} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Create Lesson
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <InputLabel htmlFor="title" value="Lesson Title *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="title"
                                value={data.title}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="content" value="Lesson Content *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <textarea
                                id="content"
                                value={data.content}
                                rows="6"
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-sm p-3"
                                onChange={(e) => setData('content', e.target.value)}
                                required
                            ></textarea>
                            <InputError message={errors.content} className="mt-1" />
                        </div>

                        {/* Questions Editor */}
                        <div className="pt-6 border-t border-[#2C2C2C]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs tracking-widest uppercase font-bold text-white">Quiz Questions</h3>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="bg-[#2C2C2C] hover:bg-indigo-600 text-white font-bold text-xs tracking-widest uppercase py-2 px-4 border border-[#2C2C2C] transition-colors"
                                >
                                    + Add Question
                                </button>
                            </div>

                            <div className="space-y-6">
                                {data.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-[#121212] border border-[#2C2C2C] p-4 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIdx)}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest"
                                        >
                                            Remove
                                        </button>

                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel value={`Question ${qIdx + 1} *`} className="text-[#A0A0A0] text-[10px] uppercase tracking-widest" />
                                                <TextInput
                                                    value={q.question_text}
                                                    className="mt-2 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx}>
                                                        <InputLabel value={`Option ${oIdx + 1} *`} className="text-[#808080] text-[9px] uppercase tracking-widest" />
                                                        <TextInput
                                                            value={opt}
                                                            className="mt-1 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-xs py-1.5"
                                                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div>
                                                <InputLabel value="Correct Answer *" className="text-[#A0A0A0] text-[10px] uppercase tracking-widest" />
                                                <select
                                                    value={q.correct_answer_index}
                                                    className="mt-2 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-xs py-2 px-3"
                                                    onChange={(e) => handleCorrectOptionChange(qIdx, e.target.value)}
                                                    required
                                                >
                                                    {q.options.map((opt, oIdx) => (
                                                        <option key={oIdx} value={oIdx}>
                                                            Option {oIdx + 1}: {opt || `(Empty option ${oIdx + 1})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                            Create Lesson
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Edit Lesson Modal */}
            <Modal show={isEditing} onClose={closeEditModal} maxWidth="2xl">
                <form onSubmit={submitEdit} className="p-4 sm:p-8 max-h-[90vh] overflow-y-auto bg-[#1E1E1E] text-white">
                    <h2 className="text-xs tracking-widest uppercase font-bold text-indigo-400 mb-6 border-b border-[#2C2C2C] pb-3">
                        Edit Lesson
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <InputLabel htmlFor="edit_title" value="Lesson Title *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <TextInput
                                id="edit_title"
                                value={data.title}
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                onChange={(e) => setData('title', e.target.value)}
                                required
                            />
                            <InputError message={errors.title} className="mt-1" />
                        </div>

                        <div>
                            <InputLabel htmlFor="edit_content" value="Lesson Content *" className="text-[#A0A0A0] text-xs uppercase tracking-widest" />
                            <textarea
                                id="edit_content"
                                value={data.content}
                                rows="6"
                                className="mt-2 block w-full bg-[#121212] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-sm p-3"
                                onChange={(e) => setData('content', e.target.value)}
                                required
                            ></textarea>
                            <InputError message={errors.content} className="mt-1" />
                        </div>

                        {/* Questions Editor */}
                        <div className="pt-6 border-t border-[#2C2C2C]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xs tracking-widest uppercase font-bold text-white">Quiz Questions</h3>
                                <button
                                    type="button"
                                    onClick={addQuestion}
                                    className="bg-[#2C2C2C] hover:bg-indigo-600 text-white font-bold text-xs tracking-widest uppercase py-2 px-4 border border-[#2C2C2C] transition-colors"
                                >
                                    + Add Question
                                </button>
                            </div>

                            <div className="space-y-6">
                                {data.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="bg-[#121212] border border-[#2C2C2C] p-4 relative">
                                        <button
                                            type="button"
                                            onClick={() => removeQuestion(qIdx)}
                                            className="absolute top-4 right-4 text-red-500 hover:text-red-400 text-xs font-bold uppercase tracking-widest"
                                        >
                                            Remove
                                        </button>

                                        <div className="space-y-4">
                                            <div>
                                                <InputLabel value={`Question ${qIdx + 1} *`} className="text-[#A0A0A0] text-[10px] uppercase tracking-widest" />
                                                <TextInput
                                                    value={q.question_text}
                                                    className="mt-2 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0"
                                                    onChange={(e) => handleQuestionTextChange(qIdx, e.target.value)}
                                                    required
                                                />
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx}>
                                                        <InputLabel value={`Option ${oIdx + 1} *`} className="text-[#808080] text-[9px] uppercase tracking-widest" />
                                                        <TextInput
                                                            value={opt}
                                                            className="mt-1 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-xs py-1.5"
                                                            onChange={(e) => handleOptionChange(qIdx, oIdx, e.target.value)}
                                                            required
                                                        />
                                                    </div>
                                                ))}
                                            </div>

                                            <div>
                                                <InputLabel value="Correct Answer *" className="text-[#A0A0A0] text-[10px] uppercase tracking-widest" />
                                                <select
                                                    value={q.correct_answer_index}
                                                    className="mt-2 block w-full bg-[#1E1E1E] border border-[#2C2C2C] text-white rounded-none focus:border-indigo-500 focus:ring-0 text-xs py-2 px-3"
                                                    onChange={(e) => handleCorrectOptionChange(qIdx, e.target.value)}
                                                    required
                                                >
                                                    {q.options.map((opt, oIdx) => (
                                                        <option key={oIdx} value={oIdx}>
                                                            Option {oIdx + 1}: {opt || `(Empty option ${oIdx + 1})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
                            disabled={processing}
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

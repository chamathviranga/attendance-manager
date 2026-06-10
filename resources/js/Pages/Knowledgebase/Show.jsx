import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import Swal from 'sweetalert2';

export default function Show({ lesson, authRole }) {
    const questions = lesson.questions || [];
    const userCompletion = lesson.completions && lesson.completions[0];
    
    // States for interactive quiz
    const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionIdx: optionIdx }
    const [quizSubmitted, setQuizSubmitted] = useState(!!userCompletion);
    const [score, setScore] = useState(userCompletion ? userCompletion.score : 0);

    const handleSelectOption = (qIdx, oIdx) => {
        if (quizSubmitted) return; // disable selection after submission
        setSelectedAnswers({
            ...selectedAnswers,
            [qIdx]: oIdx
        });
    };

    const handleSubmitQuiz = (e) => {
        e.preventDefault();
        
        // Ensure all questions are answered
        if (Object.keys(selectedAnswers).length < questions.length) {
            Swal.fire({
                title: 'Incomplete Quiz',
                text: 'Please answer all questions before submitting!',
                icon: 'warning',
                background: '#1E1E1E',
                color: '#ffffff',
                confirmButtonColor: '#4f46e5',
                customClass: {
                    title: 'tracking-widest uppercase text-sm font-bold',
                    confirmButton: 'rounded-none font-bold tracking-widest text-xs uppercase'
                }
            });
            return;
        }

        // Calculate score
        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (selectedAnswers[idx] === q.correct_answer_index) {
                correctCount++;
            }
        });

        // Submit to database via Inertia POST
        router.post(`/knowledgebase/${lesson.id}/complete`, {
            score: correctCount,
            total_questions: questions.length
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setScore(correctCount);
                setQuizSubmitted(true);

                const pct = (correctCount / questions.length) * 100;
                let resultTitle = 'Quiz Complete!';
                let resultText = `You scored ${correctCount} out of ${questions.length} (${pct.toFixed(0)}%).`;
                let resultIcon = 'info';

                if (pct === 100) {
                    resultTitle = 'Perfect Score!';
                    resultIcon = 'success';
                } else if (pct >= 70) {
                    resultTitle = 'Well Done!';
                    resultIcon = 'success';
                } else {
                    resultTitle = 'Keep Studying!';
                    resultIcon = 'error';
                }

                Swal.fire({
                    title: resultTitle,
                    text: resultText,
                    icon: resultIcon,
                    background: '#1E1E1E',
                    color: '#ffffff',
                    confirmButtonColor: '#4f46e5',
                    customClass: {
                        title: 'tracking-widest uppercase text-sm font-bold',
                        confirmButton: 'rounded-none font-bold tracking-widest text-xs uppercase'
                    }
                });
            }
        });
    };

    const handleResetQuiz = () => {
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setScore(0);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center w-full">
                    <h2 className="text-sm tracking-widest font-bold uppercase text-white">
                        {lesson.title}
                    </h2>
                    <Link
                        href="/knowledgebase"
                        className="text-indigo-400 hover:text-indigo-300 font-bold text-xs tracking-widest uppercase transition-colors"
                    >
                        &larr; Back to Lessons
                    </Link>
                </div>
            }
        >
            <Head title={lesson.title} />

            <div className="py-6 max-w-4xl space-y-8">
                {/* Lesson Material */}
                <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-6 sm:p-8">
                    <h1 className="text-xl sm:text-2xl font-bold text-white uppercase tracking-wider mb-6 border-b border-[#2C2C2C] pb-4">
                        {lesson.title}
                    </h1>
                    <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {lesson.content}
                    </div>
                </div>

                {/* Lesson Quiz */}
                {questions.length > 0 ? (
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-[#2C2C2C] pb-4">
                            <div>
                                <h2 className="text-xs text-indigo-400 font-bold tracking-widest uppercase">Lesson Quiz</h2>
                                <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Test your understanding of the lesson material</p>
                            </div>
                            {quizSubmitted && (
                                <span className={`px-3 py-1 text-xs font-bold tracking-widest uppercase border ${score === questions.length ? 'text-green-400 border-green-500/50' : 'text-indigo-400 border-indigo-500/50'}`}>
                                    SCORE: {score} / {questions.length}
                                </span>
                            )}
                        </div>

                        {userCompletion && (
                            <div className="mb-6 p-4 bg-indigo-950/20 border border-indigo-500/30 text-indigo-300 text-xs uppercase tracking-wider font-bold">
                                You previously completed this lesson scoring {userCompletion.score} / {userCompletion.total_questions} on {new Date(userCompletion.completed_at).toLocaleDateString()}
                            </div>
                        )}

                        <form onSubmit={handleSubmitQuiz} className="space-y-8">
                            {questions.map((q, qIdx) => (
                                <div key={q.id || qIdx} className="bg-[#121212] border border-[#2C2C2C] p-5">
                                    <h3 className="font-bold text-sm text-white leading-relaxed mb-4">
                                        <span className="text-indigo-400 mr-2">Q{qIdx + 1}.</span>
                                        {q.question_text}
                                    </h3>

                                    <div className="grid grid-cols-1 gap-3">
                                        {q.options.map((option, oIdx) => {
                                            const isSelected = selectedAnswers[qIdx] === oIdx;
                                            const isCorrect = q.correct_answer_index === oIdx;
                                            
                                            // Dynamic option style based on state
                                            let optionClass = "border-[#2C2C2C] bg-[#1E1E1E] text-gray-300 hover:border-gray-500";
                                            if (isSelected) {
                                                optionClass = "border-indigo-500 bg-indigo-950/20 text-indigo-300";
                                            }
                                            
                                            if (quizSubmitted) {
                                                if (isCorrect) {
                                                    optionClass = "border-green-600 bg-green-950/20 text-green-400 font-bold";
                                                } else if (isSelected) {
                                                    optionClass = "border-red-600 bg-red-950/20 text-red-400 line-through";
                                                } else {
                                                    optionClass = "border-[#2c2c2c] bg-[#1e1e1e] text-gray-600 opacity-60";
                                                }
                                            }

                                            return (
                                                <button
                                                    key={oIdx}
                                                    type="button"
                                                    disabled={quizSubmitted}
                                                    onClick={() => handleSelectOption(qIdx, oIdx)}
                                                    className={`w-full text-left p-4 border text-xs tracking-wider uppercase transition-all flex items-center justify-between ${optionClass}`}
                                                >
                                                    <span>{option}</span>
                                                    {quizSubmitted && isCorrect && (
                                                        <span className="text-[10px] font-bold tracking-widest text-green-400">CORRECT</span>
                                                    )}
                                                    {quizSubmitted && isSelected && !isCorrect && (
                                                        <span className="text-[10px] font-bold tracking-widest text-red-400">INCORRECT</span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            <div className="pt-6 border-t border-[#2C2C2C] flex justify-end gap-4">
                                {quizSubmitted ? (
                                    <button
                                        type="button"
                                        onClick={handleResetQuiz}
                                        className="bg-[#2C2C2C] hover:bg-[#3C3C3C] text-white text-xs font-bold tracking-widest uppercase py-3 px-6 border border-[#2C2C2C] transition-colors"
                                    >
                                        Retake Quiz
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold tracking-widest uppercase py-3 px-6 transition-colors"
                                    >
                                        Submit Answers
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="bg-[#1E1E1E] border border-[#2C2C2C] p-6 text-center text-gray-400 text-xs uppercase tracking-widest">
                        No quiz questions available for this lesson.
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

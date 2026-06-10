<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Employee;
use App\Models\Lesson;
use App\Services\KnowledgebaseService;
use Illuminate\Http\Request;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class KnowledgebaseController extends Controller implements HasMiddleware
{
    protected KnowledgebaseService $kbService;

    public function __construct(KnowledgebaseService $kbService)
    {
        $this->kbService = $kbService;
    }

    public static function middleware(): array
    {
        return [
            new Middleware('role:SHOP_OWNER', only: ['store', 'update', 'destroy']),
            new Middleware('role:SHOP_OWNER,EMPLOYEE', only: ['index', 'show', 'complete']),
        ];
    }

    public function index(Request $request): Response
    {
        $role = $request->user()->role;
        $businessId = null;

        if ($role === 'SHOP_OWNER') {
            $businessId = Business::where('user_id', $request->user()->id)->value('id');
        } elseif ($role === 'EMPLOYEE') {
            $businessId = Employee::where('user_id', $request->user()->id)->value('business_id');
        }

        $lessons = $businessId 
            ? $this->kbService->getLessonsByBusinessWithUserCompletion($businessId, $request->user()->id) 
            : collect();

        $completions = [];
        if ($role === 'SHOP_OWNER' && $businessId) {
            $completions = \App\Models\LessonCompletion::with(['user', 'lesson'])
                ->whereHas('lesson', function ($q) use ($businessId) {
                    $q->where('business_id', $businessId);
                })
                ->get();
        }

        return Inertia::render('Knowledgebase/Index', [
            'lessons' => $lessons,
            'completions' => $completions,
            'businessId' => $businessId,
            'authRole' => $role,
        ]);
    }

    public function show(Request $request, int|string $id): Response
    {
        $role = $request->user()->role;
        $businessId = null;

        if ($role === 'SHOP_OWNER') {
            $businessId = Business::where('user_id', $request->user()->id)->value('id');
        } elseif ($role === 'EMPLOYEE') {
            $businessId = Employee::where('user_id', $request->user()->id)->value('business_id');
        }

        $lesson = $this->kbService->getLessonWithQuestionsAndUserCompletion($id, $request->user()->id);

        if ($lesson->business_id != $businessId) {
            abort(403, 'Unauthorized access to this lesson.');
        }

        return Inertia::render('Knowledgebase/Show', [
            'lesson' => $lesson,
            'authRole' => $role,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $businessId = Business::where('user_id', $request->user()->id)->value('id');

        if (!$businessId) {
            abort(403, 'No associated business found.');
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'questions' => 'nullable|array',
            'questions.*.question_text' => 'required|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*' => 'required|string',
            'questions.*.correct_answer_index' => 'required|integer',
        ]);

        $this->kbService->createLesson($data, $businessId);

        return redirect()->route('knowledgebase.index')->with('success', 'Lesson and questions created successfully.');
    }

    public function update(Request $request, int|string $id): RedirectResponse
    {
        $businessId = Business::where('user_id', $request->user()->id)->value('id');
        $lesson = $this->kbService->getLessonWithQuestions($id);

        if ($lesson->business_id != $businessId) {
            abort(403, 'Unauthorized access.');
        }

        $data = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'questions' => 'nullable|array',
            'questions.*.question_text' => 'required|string',
            'questions.*.options' => 'required|array|min:2',
            'questions.*.options.*' => 'required|string',
            'questions.*.correct_answer_index' => 'required|integer',
        ]);

        $this->kbService->updateLesson($id, $data);

        return redirect()->route('knowledgebase.index')->with('success', 'Lesson and questions updated successfully.');
    }

    public function destroy(Request $request, int|string $id): RedirectResponse
    {
        $businessId = Business::where('user_id', $request->user()->id)->value('id');
        $lesson = $this->kbService->getLessonWithQuestions($id);

        if ($lesson->business_id != $businessId) {
            abort(403, 'Unauthorized access.');
        }

        $this->kbService->deleteLesson($id);

        return redirect()->route('knowledgebase.index')->with('success', 'Lesson deleted.');
    }

    public function complete(Request $request, int|string $id): RedirectResponse
    {
        $role = $request->user()->role;
        if ($role !== 'EMPLOYEE' && $role !== 'SHOP_OWNER') {
            abort(403, 'Unauthorized.');
        }

        $businessId = null;
        if ($role === 'SHOP_OWNER') {
            $businessId = Business::where('user_id', $request->user()->id)->value('id');
        } elseif ($role === 'EMPLOYEE') {
            $businessId = Employee::where('user_id', $request->user()->id)->value('business_id');
        }

        $lesson = Lesson::findOrFail($id);

        if ($lesson->business_id != $businessId) {
            abort(403, 'Unauthorized access.');
        }

        $data = $request->validate([
            'score' => 'required|integer|min:0',
            'total_questions' => 'required|integer|min:0',
        ]);

        $this->kbService->completeQuiz($id, $request->user()->id, (int) $data['score'], (int) $data['total_questions']);

        return redirect()->back()->with('success', 'Progress tracked successfully.');
    }
}

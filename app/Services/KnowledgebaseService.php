<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Lesson;
use App\Models\Question;
use App\Models\LessonCompletion;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class KnowledgebaseService
{
    public function getLessonsByBusiness(int|string $businessId): Collection
    {
        return Lesson::with('questions')
            ->withCount('questions')
            ->where('business_id', $businessId)
            ->get();
    }

    public function getLessonsByBusinessWithUserCompletion(int|string $businessId, int|string $userId): Collection
    {
        return Lesson::with(['questions', 'completions' => function ($query) use ($userId) {
                $query->where('user_id', $userId);
            }])
            ->withCount('questions')
            ->where('business_id', $businessId)
            ->get();
      }

    public function getLessonWithQuestions(int|string $id): Lesson
    {
        return Lesson::with('questions')->findOrFail($id);
    }

    public function getLessonWithQuestionsAndUserCompletion(int|string $id, int|string $userId): Lesson
    {
        return Lesson::with(['questions', 'completions' => function ($query) use ($userId) {
            $query->where('user_id', $userId);
        }])->findOrFail($id);
    }

    public function createLesson(array $data, int|string $businessId): Lesson
    {
        return DB::transaction(function () use ($data, $businessId) {
            $lesson = Lesson::create([
                'business_id' => $businessId,
                'title' => $data['title'],
                'content' => $data['content'],
            ]);

            if (!empty($data['questions'])) {
                foreach ($data['questions'] as $qData) {
                    Question::create([
                        'lesson_id' => $lesson->id,
                        'question_text' => $qData['question_text'],
                        'options' => $qData['options'],
                        'correct_answer_index' => (int) $qData['correct_answer_index'],
                    ]);
                }
            }

            return $lesson;
        });
    }

    public function updateLesson(int|string $id, array $data): Lesson
    {
        return DB::transaction(function () use ($id, $data) {
            $lesson = Lesson::findOrFail($id);
            $lesson->update([
                'title' => $data['title'] ?? $lesson->title,
                'content' => $data['content'] ?? $lesson->content,
            ]);

            if (isset($data['questions'])) {
                // To keep it simple, we replace the questions
                $lesson->questions()->delete();

                foreach ($data['questions'] as $qData) {
                    Question::create([
                        'lesson_id' => $lesson->id,
                        'question_text' => $qData['question_text'],
                        'options' => $qData['options'],
                        'correct_answer_index' => (int) $qData['correct_answer_index'],
                    ]);
                }
            }

            return $lesson;
        });
    }

    public function deleteLesson(int|string $id): void
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->delete();
    }

    public function completeQuiz(int|string $lessonId, int|string $userId, int $score, int $totalQuestions): LessonCompletion
    {
        return LessonCompletion::updateOrCreate(
            [
                'user_id' => $userId,
                'lesson_id' => $lessonId,
            ],
            [
                'score' => $score,
                'total_questions' => $totalQuestions,
                'completed_at' => now(),
            ]
        );
    }
}

<?php

use App\Http\Controllers\BusinessController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\ConfigurationController;
use App\Http\Controllers\BranchesController;
use App\Http\Controllers\KnowledgebaseController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\LegalDocumentController;
use App\Http\Controllers\ShiftScheduleController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AttendanceController;

Route::get('/dashboard', DashboardController::class)->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::post('/attendance/clock-in', [AttendanceController::class, 'clockIn'])->name('attendance.clock-in');
    Route::post('/attendance/clock-out', [AttendanceController::class, 'clockOut'])->name('attendance.clock-out');
    Route::post('/attendance/manual', [AttendanceController::class, 'storeManual'])->name('attendance.manual');
    Route::delete('/attendance/{id}', [AttendanceController::class, 'destroy'])->name('attendance.destroy');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::resource('businesses', BusinessController::class);

    Route::resource('employees', EmployeeController::class);

    Route::resource('branches', BranchesController::class);

    Route::resource('schedules', ShiftScheduleController::class);

    Route::get('/configurations', [ConfigurationController::class, 'index'])->name('configurations.index');
    Route::put('/configurations', [ConfigurationController::class, 'update'])->name('configurations.update');

    Route::get('/payroll', [PayrollController::class, 'index'])->name('payroll.index');
    Route::post('/payroll/clear', [PayrollController::class, 'clear'])->name('payroll.clear');
    Route::get('/payroll/payslip', [PayrollController::class, 'payslip'])->name('payroll.payslip');

    Route::post('/legal-documents', [LegalDocumentController::class, 'store'])->name('legal-documents.store');
    Route::get('/legal-documents/{id}/view', [LegalDocumentController::class, 'view'])->name('legal-documents.view');
    Route::get('/legal-documents/{id}/download', [LegalDocumentController::class, 'download'])->name('legal-documents.download');
    Route::delete('/legal-documents/{id}', [LegalDocumentController::class, 'destroy'])->name('legal-documents.destroy');

    Route::post('/knowledgebase/{lesson}/complete', [KnowledgebaseController::class, 'complete'])->name('knowledgebase.complete');
    Route::resource('knowledgebase', KnowledgebaseController::class);

    Route::get('/worked-hours', function () {
        $user = auth()->user();
        if ($user->role !== 'EMPLOYEE') {
            abort(403, 'Unauthorized.');
        }

        $attendances = \App\Models\Attendance::with('branch')
            ->where('user_id', $user->id)
            ->orderBy('clock_in_at', 'desc')
            ->get();

        return Inertia::render('WorkedHours/Index', [
            'attendances' => $attendances
        ]);
    })->name('worked-hours.index');
});

require __DIR__.'/auth.php';

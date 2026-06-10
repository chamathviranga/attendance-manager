<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Attendance;
use Carbon\Carbon;

class MayAttendanceSeeder extends Seeder
{
    public function run(): void
    {
        Attendance::where('user_id', 3)
            ->whereBetween('clock_in_at', ['2026-05-01 00:00:00', '2026-05-31 23:59:59'])
            ->delete();

        $userId = 3;
        $branches = [1, 2];

        for ($day = 1; $day <= 31; $day++) {
            $date = Carbon::create(2026, 5, $day);

            if ($date->isWeekend()) {
                // Let's work 1 weekend day occasionally (e.g. Sunday 10th and 24th)
                if ($day !== 10 && $day !== 24) {
                    continue;
                }
            }

            $branchId = $branches[($day % 2)];
            $startMin = rand(-8, 8);
            $endMin = rand(-8, 12);

            $clockIn = $date->copy()->setTime(9, 0, 0)->addMinutes($startMin);
            $clockOut = $date->copy()->setTime(17, 0, 0)->addMinutes($endMin);

            $duration = $clockIn->diffInMinutes($clockOut);

            Attendance::create([
                'user_id' => $userId,
                'branch_id' => $branchId,
                'clock_in_at' => $clockIn,
                'clock_out_at' => $clockOut,
                'duration_minutes' => $duration,
            ]);
        }
    }
}

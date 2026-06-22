<?php

namespace App\Http\Controllers;

abstract class Controller
{
    protected function getPayrollDateRange(?\App\Models\Business $business): array
    {
        // Default to the current month for all user roles
        return [
            \Carbon\Carbon::now()->startOfMonth(),
            \Carbon\Carbon::now()->endOfMonth()
        ];
    }

    protected function getPayrollPeriodForDate(\Carbon\Carbon $date, ?\App\Models\Business $business): array
    {
        if (!$business) {
            return [
                $date->copy()->startOfWeek(\Carbon\Carbon::MONDAY),
                $date->copy()->endOfWeek(\Carbon\Carbon::SUNDAY)
            ];
        }

        $cycle = $business->payroll_cycle ?? 'weekly';
        $payDay = $business->payroll_pay_day ?? 'Sunday';

        if ($cycle === 'weekly') {
            if ($date->format('l') === $payDay) {
                $startDate = $date->copy()->startOfDay();
            } else {
                $startDate = $date->copy()->previous($payDay)->startOfDay();
            }
            $endDate = $startDate->copy()->addDays(6)->endOfDay();
        } elseif ($cycle === 'monthly') {
            $payDayDom = (int)$payDay;
            $dateDay = $date->day;

            if ($dateDay >= $payDayDom) {
                $startDate = $date->copy()->day(min($payDayDom, $date->daysInMonth))->startOfDay();
                $nextMonth = $date->copy()->addMonth();
                $endDay = $payDayDom - 1;
                if ($endDay < 1) {
                    $endDate = $date->copy()->endOfMonth();
                } else {
                    $endDate = $nextMonth->day(min($endDay, $nextMonth->daysInMonth))->endOfDay();
                }
            } else {
                $prevMonth = $date->copy()->subMonth();
                $startDate = $prevMonth->day(min($payDayDom, $prevMonth->daysInMonth))->startOfDay();
                $endDay = $payDayDom - 1;
                if ($endDay < 1) {
                    $endDate = $prevMonth->copy()->endOfMonth();
                } else {
                    $endDate = $date->copy()->day(min($endDay, $date->daysInMonth))->endOfDay();
                }
            }
        } else {
            // daily
            $startDate = $date->copy()->startOfDay();
            $endDate = $date->copy()->endOfDay();
        }

        return [$startDate, $endDate];
    }
}

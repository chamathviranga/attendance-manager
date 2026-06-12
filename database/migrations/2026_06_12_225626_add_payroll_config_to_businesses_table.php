<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->string('payroll_cycle')->default('weekly'); // 'weekly', 'monthly', 'daily'
            $table->string('payroll_pay_day')->nullable()->default('Sunday'); // Sunday-Saturday for weekly, 1-31 for monthly, null for daily
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('businesses', function (Blueprint $table) {
            $table->dropColumn(['payroll_cycle', 'payroll_pay_day']);
        });
    }
};

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $unbranded ? 'Payment Receipt' : 'Payslip' }} - {{ $employee->name }}</title>
    <style>
        body {
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #333333;
            margin: 0;
            padding: 0;
            font-size: 13px;
            line-height: 1.5;
        }
        .header {
            border-bottom: 2px solid #1E1E1E;
            padding-bottom: 20px;
            margin-bottom: 25px;
        }
        .header-title {
            font-size: 24px;
            font-weight: bold;
            color: #121212;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            margin: 0;
        }
        .header-subtitle {
            font-size: 10px;
            color: #777777;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-top: 5px;
        }
        .company-details {
            float: right;
            text-align: right;
            font-size: 11px;
            color: #555555;
            margin-top: -45px;
        }
        .meta-container {
            margin-bottom: 30px;
            background-color: #F9F9F9;
            border: 1px solid #EAEAEA;
            padding: 15px;
        }
        .meta-table {
            width: 100%;
            border-collapse: collapse;
        }
        .meta-table td {
            padding: 4px 0;
            vertical-align: top;
        }
        .meta-label {
            font-weight: bold;
            color: #555555;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            width: 120px;
        }
        .meta-value {
            color: #121212;
            font-weight: bold;
        }
        .table-title {
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #121212;
            margin-bottom: 10px;
            border-left: 3px solid #6366F1;
            padding-left: 8px;
        }
        .shifts-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        .shifts-table th {
            background-color: #1E1E1E;
            color: #FFFFFF;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding: 10px;
            text-align: left;
        }
        .shifts-table td {
            padding: 10px;
            border-bottom: 1px solid #EAEAEA;
            font-size: 12px;
        }
        .shifts-table tr:nth-child(even) {
            background-color: #FAFAFA;
        }
        .shifts-table tr.sunday-row {
            background-color: #FFFDF5;
        }
        .shifts-table tr.sunday-row td {
            color: #B45309;
            font-weight: bold;
        }
        .badge {
            display: inline-block;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            padding: 3px 6px;
            border-radius: 2px;
        }
        .badge-success {
            background-color: #DEF7EC;
            color: #03543F;
            border: 1px solid #BCF0DA;
        }
        .badge-danger {
            background-color: #FDE8E8;
            color: #9B1C1C;
            border: 1px solid #FBD5D5;
        }
        .summary-container {
            float: right;
            width: 300px;
            background-color: #1E1E1E;
            color: #FFFFFF;
            padding: 20px;
            margin-top: 10px;
        }
        .summary-row {
            width: 100%;
            display: table;
            margin-bottom: 8px;
        }
        .summary-row:last-child {
            margin-bottom: 0;
            border-top: 1px solid #333333;
            padding-top: 10px;
            margin-top: 10px;
        }
        .summary-label {
            display: table-cell;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #A0A0A0;
        }
        .summary-value {
            display: table-cell;
            text-align: right;
            font-size: 14px;
            font-weight: bold;
        }
        .summary-value.grand-total {
            font-size: 20px;
            color: #818CF8;
        }
        .footer {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #999999;
            border-top: 1px solid #EAEAEA;
            padding-top: 15px;
        }
        .text-right {
            text-align: right;
        }
        .clear-fix {
            clear: both;
        }
    </style>
</head>
<body>

    <div class="header">
        @if(!$unbranded && $logoBase64)
            <div style="float: left; margin-right: 15px; margin-top: -5px;">
                <img src="{{ $logoBase64 }}" style="max-height: 45px; max-width: 140px;" alt="Logo">
            </div>
        @endif
        <div style="float: left;">
            <h1 class="header-title">{{ $unbranded ? 'Payment Receipt' : 'Paysheet Slip' }}</h1>
            <div class="header-subtitle">{{ $unbranded ? 'Statement of Earnings' : 'Official Statement of Earnings' }}</div>
        </div>
        <div class="company-details">
            @if(!$unbranded)
                <strong>{{ $businessName }}</strong><br>
                UK Retail Partner<br>
            @endif
            Date Issued: {{ date('d M Y') }}
        </div>
        <div class="clear-fix"></div>
    </div>

    <div class="meta-container">
        <table class="meta-table">
            <tr>
                <td class="meta-label">Employee Name:</td>
                <td class="meta-value" style="font-size: 14px;">{{ $employee->name }}</td>
                <td class="meta-label" style="text-align: right; width: 150px;">Payroll Period:</td>
                <td class="meta-value" style="text-align: right;">{{ $startDate }} - {{ $endDate }}</td>
            </tr>
            <tr>
                <td class="meta-label">Role Designation:</td>
                <td class="meta-value">{{ $employee->designation }}</td>
                <td class="meta-label" style="text-align: right;">Hourly Base Rate:</td>
                <td class="meta-value" style="text-align: right;">£{{ $hourlyRate }}/hr</td>
            </tr>
        </table>
    </div>

    <div class="table-title">Shift & Hourly Breakdown</div>
    <table class="shifts-table">
        <thead>
            <tr>
                <th>Date</th>
                <th>{{ $unbranded ? 'Location' : 'Branch' }}</th>
                <th>Clock In</th>
                <th>Clock Out</th>
                <th style="text-align: right;">Hours Worked</th>
                <th style="text-align: right;">Earnings</th>
                <th style="text-align: center; width: 80px;">Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($shifts as $shift)
                <tr class="{{ $shift['is_sunday'] ? 'sunday-row' : '' }}">
                    <td>{{ $shift['date'] }} {!! $shift['is_sunday'] ? '<span style="font-size: 8px; font-weight: bold;">(SUN)</span>' : '' !!}</td>
                    <td>{{ $shift['branch'] }}</td>
                    <td>{{ $shift['clock_in'] }}</td>
                    <td>{{ $shift['clock_out'] }}</td>
                    <td style="text-align: right;">{{ number_format($shift['hours'], 2) }}h</td>
                    <td style="text-align: right; font-weight: bold;">£{{ number_format($shift['earnings'], 2) }}</td>
                    <td style="text-align: center;">
                        <span class="badge {{ $shift['is_cleared'] ? 'badge-success' : 'badge-danger' }}">
                            {{ $shift['is_cleared'] ? 'Cleared' : 'Unpaid' }}
                        </span>
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="summary-container">
        <div class="summary-row">
            <div class="summary-label">Hourly Base Rate</div>
            <div class="summary-value">£{{ $hourlyRate }}/hr</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Total Hours Worked</div>
            <div class="summary-value">{{ number_format($totalHours, 2) }}h</div>
        </div>
        <div class="summary-row">
            <div class="summary-label">Gross Net Earnings</div>
            <div class="summary-value grand-total">£{{ number_format($totalEarnings, 2) }}</div>
        </div>
    </div>

    <div class="clear-fix"></div>

    <div class="footer">
        @if($unbranded)
            This document serves as proof of earnings for hours worked.<br>
            Generated on {{ date('d M Y H:i:s') }}.
        @else
            This document serves as an official proof of earnings for hours worked on behalf of {{ $businessName }}.<br>
            Generated by Attendance Mark Payroll System on {{ date('d M Y H:i:s') }}.
        @endif
    </div>

</body>
</html>

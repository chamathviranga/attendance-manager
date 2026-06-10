<?php

namespace App\Http\Controllers;

use App\Models\LegalDocument;
use App\Models\Employee;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LegalDocumentController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if ($user->role !== 'EMPLOYEE') {
            abort(403, 'Only employees can upload legal documents.');
        }

        $employee = Employee::where('user_id', $user->id)->first();
        if (!$employee) {
            abort(403, 'Employee profile not found.');
        }

        $request->validate([
            'document_name' => 'required|string|max:255',
            'file' => 'required|file|mimes:pdf,jpeg,png,jpg|max:10240', // Max 10MB
        ]);

        $file = $request->file('file');
        // Store in private local directory (non-public storage)
        $path = $file->store('legal_documents');

        LegalDocument::create([
            'employee_id' => $employee->id,
            'document_name' => $request->input('document_name'),
            'file_path' => $path,
        ]);

        return redirect()->back()->with('success', 'Document uploaded successfully.');
    }

    public function download(Request $request, int|string $id): StreamedResponse|BinaryFileResponse
    {
        $doc = LegalDocument::findOrFail($id);
        $user = $request->user();

        // Security check
        $authorized = false;

        if ($user->role === 'ADMIN') {
            $authorized = true;
        } elseif ($user->role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            $employee = Employee::find($doc->employee_id);
            if ($business && $employee && $employee->business_id === $business->id) {
                $authorized = true;
            }
        } elseif ($user->role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $doc->employee_id === $employee->id) {
                $authorized = true;
            }
        }

        if (!$authorized) {
            abort(403, 'Unauthorized access to this document.');
        }

        if (!Storage::exists($doc->file_path)) {
            abort(404, 'File not found on storage.');
        }

        $extension = pathinfo($doc->file_path, PATHINFO_EXTENSION);
        $downloadName = str_replace(' ', '_', $doc->document_name) . '.' . $extension;

        return Storage::download($doc->file_path, $downloadName);
    }

    public function view(Request $request, int|string $id)
    {
        $doc = LegalDocument::findOrFail($id);
        $user = $request->user();

        // Security check
        $authorized = false;

        if ($user->role === 'ADMIN') {
            $authorized = true;
        } elseif ($user->role === 'SHOP_OWNER') {
            $business = Business::where('user_id', $user->id)->first();
            $employee = Employee::find($doc->employee_id);
            if ($business && $employee && $employee->business_id === $business->id) {
                $authorized = true;
            }
        } elseif ($user->role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $doc->employee_id === $employee->id) {
                $authorized = true;
            }
        }

        if (!$authorized) {
            abort(403, 'Unauthorized access to this document.');
        }

        if (!Storage::exists($doc->file_path)) {
            abort(404, 'File not found on storage.');
        }

        $contentType = Storage::mimeType($doc->file_path);

        return response()->file(Storage::path($doc->file_path), [
            'Content-Type' => $contentType,
            'Content-Disposition' => 'inline',
        ]);
    }

    public function destroy(Request $request, int|string $id): RedirectResponse
    {
        $doc = LegalDocument::findOrFail($id);
        $user = $request->user();

        // Security check: Only the employee who uploaded it or admin can delete it
        $authorized = false;

        if ($user->role === 'ADMIN') {
            $authorized = true;
        } elseif ($user->role === 'EMPLOYEE') {
            $employee = Employee::where('user_id', $user->id)->first();
            if ($employee && $doc->employee_id === $employee->id) {
                $authorized = true;
            }
        }

        if (!$authorized) {
            abort(403, 'Unauthorized to delete this document.');
        }

        // Delete from storage
        if (Storage::exists($doc->file_path)) {
            Storage::delete($doc->file_path);
        }

        $doc->delete();

        return redirect()->back()->with('success', 'Document deleted successfully.');
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_issues', function (Blueprint $table) {
            if (!Schema::hasColumn('audit_issues', 'assigned_to_user_id')) {
                $table->foreignId('assigned_to_user_id')->nullable()->after('status')->constrained('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('audit_issues', 'assigned_to_name')) {
                $table->string('assigned_to_name')->nullable()->after('assigned_to_user_id');
            }
            if (!Schema::hasColumn('audit_issues', 'resolved_at')) {
                $table->timestamp('resolved_at')->nullable()->after('assigned_to_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('audit_issues', function (Blueprint $table) {
            if (Schema::hasColumn('audit_issues', 'assigned_to_user_id')) {
                $table->dropConstrainedForeignId('assigned_to_user_id');
            }
            if (Schema::hasColumn('audit_issues', 'assigned_to_name')) {
                $table->dropColumn('assigned_to_name');
            }
            if (Schema::hasColumn('audit_issues', 'resolved_at')) {
                $table->dropColumn('resolved_at');
            }
        });
    }
};


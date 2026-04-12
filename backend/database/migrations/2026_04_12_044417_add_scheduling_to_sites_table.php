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
        Schema::table('sites', function (Blueprint $table) {
            if (!Schema::hasColumn('sites', 'audit_frequency')) {
                $table->string('audit_frequency')->nullable(); // daily, weekly, monthly
            }
            if (!Schema::hasColumn('sites', 'next_audit_at')) {
                $table->timestamp('next_audit_at')->nullable();
            }
            if (!Schema::hasColumn('sites', 'slack_webhook_url')) {
                $table->string('slack_webhook_url')->nullable();
            }
            if (!Schema::hasColumn('sites', 'notifications_enabled')) {
                $table->boolean('notifications_enabled')->default(true);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sites', function (Blueprint $table) {
            $table->dropColumn(['audit_frequency', 'next_audit_at', 'slack_webhook_url', 'notifications_enabled']);
        });
    }
};

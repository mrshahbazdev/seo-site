<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'google_access_token')) {
                $table->text('google_access_token')->nullable();
            }
            if (!Schema::hasColumn('users', 'google_refresh_token')) {
                $table->text('google_refresh_token')->nullable();
            }
            if (!Schema::hasColumn('users', 'google_token_expiry')) {
                $table->timestamp('google_token_expiry')->nullable();
            }
            if (!Schema::hasColumn('users', 'google_email')) {
                $table->string('google_email')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['google_access_token', 'google_refresh_token', 'google_token_expiry', 'google_email']);
        });
    }
};

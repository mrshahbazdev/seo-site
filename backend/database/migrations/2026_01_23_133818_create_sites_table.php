<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sites', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('domain'); // e.g., "example.com"
            $table->string('url'); // e.g., "https://example.com"
            $table->string('name'); // User-friendly name
            $table->enum('status', ['active', 'paused', 'deleted'])->default('active');
            $table->timestamp('last_audit_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('domain');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sites');
    }
};

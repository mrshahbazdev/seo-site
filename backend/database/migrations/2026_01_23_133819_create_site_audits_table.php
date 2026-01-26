<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('site_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('audit_type', ['full_crawl', 'lighthouse', 'duplicate_content', 'indexation'])->default('full_crawl');
            $table->enum('status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('task_id')->nullable(); // DataForSEO task ID
            $table->json('results')->nullable(); // Full audit data
            $table->json('summary')->nullable(); // Key metrics
            $table->integer('score')->default(0); // Health score 0-100
            $table->integer('pages_crawled')->default(0);
            $table->integer('issues_found')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index('site_id');
            $table->index('user_id');
            $table->index('status');
            $table->index('audit_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('site_audits');
    }
};

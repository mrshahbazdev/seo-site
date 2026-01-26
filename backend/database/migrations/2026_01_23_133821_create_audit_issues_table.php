<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('audit_issues', function (Blueprint $table) {
            $table->id();
            $table->foreignId('audit_id')->constrained('site_audits')->onDelete('cascade');
            $table->foreignId('site_id')->constrained()->onDelete('cascade');
            $table->enum('category', ['technical', 'content', 'seo', 'performance'])->default('technical');
            $table->enum('severity', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->string('issue_type'); // e.g., "duplicate_title", "broken_link", "slow_page"
            $table->text('page_url')->nullable();
            $table->text('description');
            $table->text('recommendation')->nullable();
            $table->enum('status', ['open', 'fixed', 'ignored'])->default('open');
            $table->timestamps();

            $table->index('audit_id');
            $table->index('site_id');
            $table->index('severity');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_issues');
    }
};

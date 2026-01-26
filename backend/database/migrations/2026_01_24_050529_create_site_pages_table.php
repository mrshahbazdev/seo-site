<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('site_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->onDelete('cascade');
            $table->string('url')->index();
            $table->boolean('is_crawled')->default(false);
            $table->enum('audit_status', ['pending', 'processing', 'completed', 'failed'])->default('pending');
            $table->string('audit_task_id')->nullable();
            $table->integer('lighthouse_score')->nullable();
            $table->json('lighthouse_data')->nullable();
            $table->timestamp('found_at')->useCurrent();
            $table->timestamps();

            $table->unique(['site_id', 'url']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_pages');
    }
};

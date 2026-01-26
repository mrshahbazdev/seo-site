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
        Schema::create('site_crawled_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained()->cascadeOnDelete();
            $table->text('url');
            $table->integer('status_code')->default(0);
            $table->decimal('onpage_score', 5, 2)->nullable();
            $table->string('title')->nullable();
            $table->json('meta')->nullable();
            $table->json('checks')->nullable();
            $table->json('content')->nullable();
            $table->json('page_timing')->nullable();
            $table->json('resource_errors')->nullable();
            $table->timestamps();

            // Index for faster lookups
            $table->index(['site_id', 'status_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('site_crawled_pages');
    }
};

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
        Schema::create('keyword_analyses', function (Blueprint $table) {
            $table->id();
            $table->string('keyword')->unique()->index();
            $table->json('serp_data')->nullable(); // Full Top 20 results
            $table->float('difficulty_score')->default(0); // 0-100
            $table->float('opportunity_score')->default(0); // 100 - difficulty (approx)
            $table->integer('title_matches')->default(0); // Sites with exact keyword in title
            $table->float('avg_da')->default(0); // Average DA of Top 10
            $table->string('intent')->nullable(); // Informational, Transactional
            $table->integer('forum_count')->default(0); // Count of Quora/Reddit/Forums
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keyword_analyses');
    }
};

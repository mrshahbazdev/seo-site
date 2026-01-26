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
        Schema::create('competitors', function (Blueprint $table) {
            $table->id();
            $table->foreignId('site_id')->constrained('sites')->onDelete('cascade');
            $table->string('domain');
            $table->string('name')->nullable(); // Friendly name
            $table->json('metrics_data')->nullable(); // Cached metrics from DataForSEO
            $table->timestamp('last_analyzed')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('site_id');
            $table->unique(['site_id', 'domain']); // One competitor per site
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('competitors');
    }
};

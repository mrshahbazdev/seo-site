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
        Schema::create('keyword_searches', function (Blueprint $table) {
            $table->id();
            $table->string('keyword')->index();
            $table->integer('location_code')->default(2840);
            $table->string('language_code')->default('en');
            $table->json('results')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('keyword_searches');
    }
};

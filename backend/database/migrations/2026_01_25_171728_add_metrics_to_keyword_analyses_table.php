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
        Schema::table('keyword_analyses', function (Blueprint $table) {
            $table->integer('search_volume')->nullable()->after('keyword');
            $table->float('cpc')->nullable()->after('search_volume');
            $table->float('competition')->nullable()->after('cpc');
            $table->json('paa_data')->nullable()->after('serp_data'); // Store extracted PAA separately for easy access
            $table->json('related_data')->nullable()->after('paa_data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('keyword_analyses', function (Blueprint $table) {
            $table->dropColumn(['search_volume', 'cpc', 'competition', 'paa_data', 'related_data']);
        });
    }
};

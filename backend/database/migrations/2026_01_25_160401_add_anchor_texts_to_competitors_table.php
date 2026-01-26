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
        Schema::table('competitors', function (Blueprint $table) {
            $table->json('anchor_texts_data')->nullable()->after('metrics_data');
            $table->timestamp('anchor_texts_analyzed')->nullable()->after('last_analyzed');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('competitors', function (Blueprint $table) {
            $table->dropColumn(['anchor_texts_data', 'anchor_texts_analyzed']);
        });
    }
};

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KeywordAnalysis extends Model
{
    protected $fillable = [
        'keyword',
        'serp_data',
        'difficulty_score',
        'opportunity_score',
        'title_matches',
        'avg_da',
        'intent',
        'forum_count',
        'search_volume',
        'cpc',
        'competition',
        'paa_data',
        'related_data'
    ];

    protected $casts = [
        'serp_data' => 'array',
        'paa_data' => 'array',
        'related_data' => 'array',
        'difficulty_score' => 'float',
        'opportunity_score' => 'float',
        'avg_da' => 'float',
        'title_matches' => 'integer',
        'forum_count' => 'integer',
        'search_volume' => 'integer',
        'cpc' => 'float',
        'competition' => 'float'
    ];
}

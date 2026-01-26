<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApiCost extends Model
{
    protected $fillable = ['site_id', 'endpoint', 'cost', 'metadata'];

    protected $casts = [
        'metadata' => 'array',
        'cost' => 'decimal:6'
    ];

    public function site()
    {
        return $this->belongsTo(Site::class);
    }
}

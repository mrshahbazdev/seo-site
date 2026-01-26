<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect('/dashboard');
});

// Catch-all route for React (SPA)
// Any route not defined above will load the React app
Route::any('/{any}', function () {
    return file_get_contents(public_path('index.html'));
})->where('any', '.*');

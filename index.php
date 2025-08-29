<?php

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$basePath = '/pw2425';

// Handle API routes
if (preg_match('#^' . preg_quote($basePath, '#') . '/api/#', $path)) {
    require __DIR__ . '/backend/api/index.php';
    exit();
}

require __DIR__ . '/frontend/index.html';

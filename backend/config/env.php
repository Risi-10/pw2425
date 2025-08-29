<?php
// backend/config/env.php

/**
 * Ngarkon variablat nga .env në $_ENV dhe në getenv().
 * - Vendose .env në root të projektit (p.sh. /pw2425/.env)
 * - Mos e commito: shtoje në .gitignore
 */
function load_env($env_path)
{
    if (!file_exists($env_path)) {
        return;
    }
    $lines = file($env_path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue; // komente
        if (!str_contains($line, '=')) continue;

        list($name, $value) = array_map('trim', explode('=', $line, 2));

        // Hiq thonjëzat nëse ka
        $value = trim($value, "\"'");

        // Vendos në mjedis
        putenv("$name=$value");
        $_ENV[$name] = $value;
        $_SERVER[$name] = $value;
    }
}

/**
 * Merr variablën e mjedisit me fallback në $_ENV.
 */
function env($key, $default = null)
{
    $v = getenv($key);
    if ($v !== false) return $v;
    return $_ENV[$key] ?? $default;
}

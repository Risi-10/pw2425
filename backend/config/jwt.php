<?php

// Secret key for signing/verifying tokens
define('JWT_SECRET', 'gQGvhQyFhktP2NjeVufQ34N3FvzElRC8Jwt6IRvBJrU=');
define('JWT_ALG_HEADER', 'HS256');
define('PHP_HASH_ALGO', 'sha256');
define('JWT_EXPIRE_SECONDS', 3600); // 1 ore skadence


function now()
{
    return time();
}

<?php

require_once __DIR__ . '/../config/jwt.php';

class AuthMiddleware
{
    //Gjeneron tokenin
    public static function generateToken($userId, $role)
    {
        $header = json_encode(['typ' => 'JWT', 'alg' => JWT_ALG_HEADER]);
        $payload = json_encode([
            'user_id' => $userId,
            'role' => $role,
            'iat' => now(),
            'exp' => now() + JWT_EXPIRE_SECONDS
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        // Perdor PHP_HASH_ALGO for the hash_hmac function
        $signature = hash_hmac(
            PHP_HASH_ALGO,
            "$base64Header.$base64Payload",
            JWT_SECRET,
            true
        );
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return "$base64Header.$base64Payload.$base64Signature";
    }

    public static function getBearerToken()
    {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            return $matches[1]; // Return the token string
        }

        return null; // Return null if no Bearer token found
    }

    public static function verifyToken()
    {
        // Merr tokenin nga headeri
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? '';

        if (!preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
            throw new Exception('Missing Token');
        }

        $token = $matches[1];
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            throw new Exception('Invalid token');
        }

        // Verifikon signature
        $signature = hash_hmac(
            PHP_HASH_ALGO,
            "$parts[0].$parts[1]",
            JWT_SECRET,
            true
        );

        // Krahason signature-t e tokenave
        $tokenSignature = base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[2]));
        if (!hash_equals($tokenSignature, $signature)) {
            throw new Exception('Invalid signature');
        }

        //Decode payload
        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $parts[1])), true);

        // Check for JSON decoding errors
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid payload encoding');
        }


        $currentTime = now();
        if (!isset($payload['exp']) || $payload['exp'] < $currentTime) {
            throw new Exception('Token expired');
        }
        if (!isset($payload['iat']) || $payload['iat'] > $currentTime) {
            throw new Exception('Invalid time');
        }

        return $payload;
    }
}

<?php
require __DIR__ . '/../config/env.php';

// 1) Ngarko .env nga root i projektit
$projectRoot = realpath(__DIR__ . '/../../..'); // përshtate nëse rruga ndryshon
load_env($projectRoot . '/.env');

// 2) Vendos çelësin nga mjedisi
$secret = env('STRIPE_SECRET');
if (!$secret) {
    http_response_code(500);
    die('Missing STRIPE_SECRET environment variable');
}

require __DIR__ . '/../vendor/autoload.php'; // nëse përdor Composer/vendor
\Stripe\Stripe::setApiKey($secret);

// === pjesa tjetër e kodit tënd ekzistues vazhdon këtu ===
// p.sh. krijimi i session-it, pagesa, etj.


header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);

// Validate input
if (
    !isset($input['price']) ||
    !isset($input['program_id']) ||
    !isset($input['program_name'])
) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameters']);
    exit;
}

// Create a new Checkout Session
try {
    $customer_email = $input['user_email'] ?? null;
    $user_id = $input['user_id'] ?? null;

    $session = \Stripe\Checkout\Session::create([
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'eur',
                'product_data' => [
                    'name' => $input['program_name'],
                ],
                'unit_amount' => intval($input['price'] * 100),
            ],
            'quantity' => 1,
        ]],
        'mode' => 'payment',
        'success_url' => 'http://localhost/pw2425/payment-success.php?session_id={CHECKOUT_SESSION_ID}&program_id=' . $input['program_id'],
        'cancel_url' => 'http://localhost/pw2425/?payment=cancel',
        'customer_email' => $customer_email,
        'client_reference_id' => $user_id,
        'metadata' => [
            'program_id' => $input['program_id'],
            'user_id' => $user_id,
        ],
    ]);
    echo json_encode(['id' => $session->id, 'url' => $session->url]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}

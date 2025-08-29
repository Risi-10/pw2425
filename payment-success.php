<?php
require __DIR__ . '/backend/config/env.php';

// 1) Ngarko .env
$projectRoot = __DIR__; // nëse ky skedar është në root
load_env($projectRoot . '/.env');

// 2) Vendos çelësin
$secret = env('STRIPE_SECRET');
if (!$secret) {
    http_response_code(500);
    die('Missing STRIPE_SECRET environment variable');
}

require __DIR__ . '/backend/vendor/autoload.php'; // përshtate rrugën sipas projektit
\Stripe\Stripe::setApiKey($secret);

// === pjesa jote ekzistuese e suksesit të pagesës ===


$session_id = $_GET['session_id'] ?? null;
$program_id = $_GET['program_id'] ?? null;

if (!$session_id || !$program_id) {
    die('Missing session or program.');
}

try {
    $session = \Stripe\Checkout\Session::retrieve($session_id);
    $customer_email = $session->customer_email ?? null;
    $user_id = $session->client_reference_id ?? null;

    // 1. Find the user (fetch role and id)
    if ($user_id) {
        $stmt = $pdo->prepare("SELECT user_id, role FROM users WHERE user_id = ?");
        $stmt->execute([$user_id]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } elseif ($customer_email) {
        $stmt = $pdo->prepare("SELECT user_id, role FROM users WHERE email = ?");
        $stmt->execute([$customer_email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
    } else {
        $user = false;
    }

    if (!$user) {
        die('User not found.');
    }

    // 2. Find the trainer_user_id per programin
    $stmt = $pdo->prepare("SELECT trainer_user_id FROM training_programs WHERE program_id = ?");
    $stmt->execute([$program_id]);
    $program = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$program) {
        die('Program not found.');
    }

    $trainer_user_id = $program['trainer_user_id'];

    $stmt = $pdo->prepare("INSERT INTO payments (client_user_id, gateway_transaction_id, amount, currency, payment_date, method, status) VALUES (?, ?, ?, ?, NOW(), ?, ?)");
    $stmt->execute([
        $user['user_id'],
        $session->id,
        $session->amount_total / 100,
        $session->currency ?? 'eur',
        'stripe',
        'completed'
    ]);
    $payment_id = $pdo->lastInsertId();

    // 3. Insert purchase record
    $stmt = $pdo->prepare("INSERT INTO program_purchases (payment_id, client_user_id, program_id, trainer_user_id, purchase_date, access_status) VALUES (?, ?, ?, ?, NOW(), 'active')");
    $stmt->execute([$payment_id, $user['user_id'], $program_id, $trainer_user_id]);


    $role = $user['role'];
    $userId = $user['user_id'];
    switch ($role) {
        case 'admin':
            $dashboardUrl = "/pw2425/dashboard/admin?user_id=$userId";
            break;
        case 'trainer':
            $dashboardUrl = "/pw2425/dashboard/trainer?user_id=$userId";
            break;
        default:
            $dashboardUrl = "/pw2425/dashboard/client?user_id=$userId";
            break;
    }

    echo "<script>
      setTimeout(function() {
        window.location.href = '$dashboardUrl';
      }, 2000);
    </script>";
    echo "Pagesa u krye me sukses! Po ju ridrejtojme...";
    exit;
} catch (Exception $e) {
    die('Error: ' . $e->getMessage());
}

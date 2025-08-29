<?php

require_once __DIR__ . '/config/database.php';

// account per admin
$email = 'admin@admin';
$password = 'admin';
$role = 'admin';
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

try {
    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)");
    $stmt->execute([$email, $hashedPassword, $role]);
    echo "Ok!";
} catch (PDOException $e) {
    echo "error: " . $e->getMessage();
}

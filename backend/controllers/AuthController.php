<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../helpers/mailer.php';

// Handles all authentication related actions
class AuthController
{
    private $pdo;

    // requires a database connection.
    public function __construct($dbConnection)
    {
        if (!$dbConnection) {
            error_log("AuthController fail: Database not connected.");

        }
        $this->pdo = $dbConnection;
    }

    // Processes a user login attempt.
    public function login($data)
    {
        if (empty($data['email']) || empty($data['password'])) {
            $this->respondError('Email and password are required.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("SELECT user_id, email, password_hash, role FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$data['email']]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            // Check if user exists and password is correct.
            if (!$user || !isset($user['password_hash']) || !password_verify($data['password'], $user['password_hash'])) {
                $this->respondError('Invalid credentials.', 401);
                return;
            }

            // Ensure necessary user data is present before generating token.
            if (!isset($user['user_id']) || !isset($user['role'])) {
                error_log("Login CRITICAL ERROR: Missing id or role for email: " . $data['email']);
                $this->respondError('Internal server error during authentication.', 500);
                return;
            }

            $token = AuthMiddleware::generateToken($user['user_id'], $user['role']);
            $this->respondSuccess(['token' => $token]);

        } catch (PDOException $e) {
            error_log("Login PDOException for email " . ($data['email'] ?? 'N/A') . ": " . $e->getMessage());
            $this->respondError('A database error occurred. Please try again later.', 500);
        } catch (Exception $e) {
            error_log("Login General Exception for email " . ($data['email'] ?? 'N/A') . ": " . $e->getMessage());
            $this->respondError('An internal server error occurred. Please try again later.', 500);
        }
    }

    // Processes a new user registration.
    public function signup($data)
    {
        if (empty($data['first_name']) || empty($data['last_name']) || empty($data['email']) || empty($data['password'])) {
            $this->respondError('First name, last name, email, and password are required.', 400);
            return;
        }
        $role = $data['role'] ?? 'client'; // Default role
        $firstName = trim($data['first_name']);
        $lastName = trim($data['last_name']);
        $email = trim($data['email']);

        // Basic validation for name fields (e.g., not too long, allowed characters)
        if (strlen($firstName) > 50 || strlen($lastName) > 50) {
            $this->respondError('First name and last name must be less than 50 characters.', 400);
            return;
        }
        // Add more validation as needed (e.g., preg_match for allowed characters)


        try {
            // Prevent duplicate email registration.
            $stmtCheck = $this->pdo->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
            $stmtCheck->execute([$email]);
            if ($stmtCheck->fetch()) {
                $this->respondError('An account with this email already exists.', 409); // Conflict
                return;
            }

            $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
            // $verificationToken = bin2hex(random_bytes(32)); // Removed: No email verification

            // If you decide to keep the verification_token column but not use it for email verification,
            // you can set it to NULL or a default value if your DB schema requires it.
            // For simplicity, if the column allows NULL, we can omit it from the INSERT
            // or explicitly set it to NULL.
            // Assuming verification_token column allows NULLs:
            $stmt = $this->pdo->prepare(
                "INSERT INTO users (first_name, last_name, email, password_hash, role, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, NOW(), NOW())"
            );
            // If verification_token column must have a value (e.g. NOT NULL without default),
            // you might need to pass NULL explicitly:
            // $stmt = $this->pdo->prepare(
            //     "INSERT INTO users (first_name, last_name, email, password_hash, role, verification_token, created_at, updated_at)
            //      VALUES (?, ?, ?, ?, ?, NULL, NOW(), NOW())"
            // );
            // $stmt->execute([$firstName, $lastName, $email, $hashedPassword, $role]);

            // Simpler version if verification_token column allows NULL and is not part of the query:
            $stmt->execute([$firstName, $lastName, $email, $hashedPassword, $role]);
            $userId = $this->pdo->lastInsertId();

            // $this->sendVerificationEmail($email, $verificationToken); // Remains commented out or removed

            $responseData = [
                'user_id' => $userId,
                'email' => $email,
                'role' => $role,
                'message' => 'Signup successful!' // Add message to the data payload
            ];
            $this->respondSuccess($responseData, 201);

        } catch (PDOException $e) {
            error_log("Signup PDOException for email " . $email . ": " . $e->getMessage());
            $this->respondError('Database error during signup. Please try again later.', 500);
        } catch (Exception $e) {
            error_log("Signup General Exception for email " . $email . ": " . $e->getMessage());
            $this->respondError('An internal server error occurred. Please try again later.', 500);
        }
    }

    public function getUserProfile($userId)
    {
        try {
            $stmt = $this->pdo->prepare("SELECT user_id, first_name, last_name, email, role, bio, profile_picture_url FROM users WHERE user_id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $this->respondError('User not found.', 404);
                return;
            }
            // Remove sensitive data if any before sending (password_hash is not selected here)
            $this->respondSuccess($user);

        } catch (PDOException $e) {
            error_log("GetUserProfile PDOException for user_id " . $userId . ": " . $e->getMessage());
            $this->respondError('Database error fetching user profile.', 500);
        }
    }

    public function updateProfile($userId, $data)
    {
        // Basic validation
        $firstName = isset($data['first_name']) ? trim($data['first_name']) : null;
        $lastName = isset($data['last_name']) ? trim($data['last_name']) : null;
        $bio = isset($data['bio']) ? trim($data['bio']) : null;
        // Potentially add profile_picture_url update here if you implement it

        if ($firstName !== null && (empty($firstName) || strlen($firstName) > 50)) {
            $this->respondError('First name must be between 1 and 50 characters if provided.', 400);
            return;
        }
        if ($lastName !== null && (empty($lastName) || strlen($lastName) > 50)) {
            $this->respondError('Last name must be between 1 and 50 characters if provided.', 400);
            return;
        }
        if ($bio !== null && strlen($bio) > 1000) { // Example max length for bio
            $this->respondError('Bio must be less than 1000 characters if provided.', 400);
            return;
        }

        // Check if user exists (though AuthMiddleware and route check should handle this)
        $stmtCheck = $this->pdo->prepare("SELECT user_id FROM users WHERE user_id = ?");
        $stmtCheck->execute([$userId]);
        if (!$stmtCheck->fetch()) {
            $this->respondError('User not found.', 404);
            return;
        }

        $fieldsToUpdate = [];
        $params = [];

        if ($firstName !== null) {
            $fieldsToUpdate[] = "first_name = ?";
            $params[] = $firstName;
        }
        if ($lastName !== null) {
            $fieldsToUpdate[] = "last_name = ?";
            $params[] = $lastName;
        }
        if ($bio !== null) {
            $fieldsToUpdate[] = "bio = ?";
            $params[] = $bio;
        }
        // Add profile_picture_url to $fieldsToUpdate and $params if implementing

        if (empty($fieldsToUpdate)) {
            $this->respondSuccess(['message' => 'No changes provided.'], 200);
            return;
        }

        $fieldsToUpdate[] = "updated_at = NOW()";
        $sql = "UPDATE users SET " . implode(', ', $fieldsToUpdate) . " WHERE user_id = ?";
        $params[] = $userId;

        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);

            if ($stmt->rowCount() > 0) {
                // Fetch updated user data to return (optional, but good practice)
                $stmtFetch = $this->pdo->prepare("SELECT user_id, first_name, last_name, email, role, bio, profile_picture_url FROM users WHERE user_id = ?");
                $stmtFetch->execute([$userId]);
                $updatedUser = $stmtFetch->fetch(PDO::FETCH_ASSOC);
                $this->respondSuccess(['message' => 'Profile updated successfully.', 'user' => $updatedUser], 200);
            } else {
                // This might happen if the data submitted is the same as current data
                // Fetch current user data to confirm no change or if an issue occurred
                $stmtFetch = $this->pdo->prepare("SELECT user_id, first_name, last_name, email, role, bio, profile_picture_url FROM users WHERE user_id = ?");
                $stmtFetch->execute([$userId]);
                $currentUser = $stmtFetch->fetch(PDO::FETCH_ASSOC);
                $this->respondSuccess(['message' => 'Profile data is current (no new data to change).', 'user' => $currentUser], 200);
            }
        } catch (PDOException $e) {
            error_log("UpdateProfile PDOException for user_id " . $userId . ": " . $e->getMessage());
            $this->respondError('Database error updating profile.', 500);
        }
    }

    // Changes a user's password.
    public function changePassword($userId, $data)
    {
        if (empty($data['current_password']) || empty($data['new_password'])) {
            $this->respondError('Current password and new password are required.', 400);
            return;
        }

        $currentPassword = $data['current_password'];
        $newPassword = $data['new_password'];

        if (strlen($newPassword) < 8) {
            $this->respondError('New password must be at least 8 characters long.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                $this->respondError('User not found.', 404); // Should not happen if token is valid for this userId
                return;
            }

            if (!password_verify($currentPassword, $user['password_hash'])) {
                $this->respondError('Incorrect current password.', 401); // Unauthorized or Bad Request
                return;
            }

            $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
            $updateStmt = $this->pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE user_id = ?");
            $updateStmt->execute([$newPasswordHash, $userId]);

            if ($updateStmt->rowCount() > 0) {
                $this->respondSuccess(['message' => 'Password changed successfully.'], 200);
            } else {
                // This case should ideally not be reached if all previous checks pass and DB is responsive.
                // It might indicate an issue or that the new password hash is identical to the old one (highly unlikely).
                $this->respondError('Failed to change password. Please try again or contact support if the issue persists.', 500);
            }
        } catch (PDOException $e) {
            error_log("ChangePassword PDOException for user_id " . $userId . ": " . $e->getMessage());
            $this->respondError('Database error changing password.', 500);
        }
    }

    public function updateProfilePicture($userId, $filesData)
    {
        if (empty($filesData['profile_picture'])) {
            $this->respondError('No profile picture file uploaded.', 400);
            return;
        }

        $file = $filesData['profile_picture'];

        // Basic validation (size, type)
        if ($file['error'] !== UPLOAD_ERR_OK) {
            $this->respondError('File upload error: ' . $file['error'], 400);
            return;
        }
        if ($file['size'] > 2 * 1024 * 1024) { // Max 2MB
            $this->respondError('File is too large (max 2MB).', 400);
            return;
        }
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!in_array($file['type'], $allowedTypes)) {
            $this->respondError('Invalid file type. Only JPG, PNG, GIF allowed.', 400);
            return;
        }

        // Generate unique filename and path
        $uploadDir = __DIR__ . '/../../frontend/assets/profile_pictures/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $newFileName = 'user_' . $userId . '_' . time() . '.' . $extension;
        $uploadPath = $uploadDir . $newFileName;
        $publicUrl = '/pw2425/frontend/assets/profile_pictures/' . $newFileName;

        // Delete old profile picture if exists
        $stmtOldPic = $this->pdo->prepare("SELECT profile_picture_url FROM users WHERE user_id = ?");
        $stmtOldPic->execute([$userId]);
        $oldPicData = $stmtOldPic->fetch(PDO::FETCH_ASSOC);
        if ($oldPicData && $oldPicData['profile_picture_url']) {
            $oldPicPath = str_replace('/pw2425/frontend/', __DIR__ . '/../../frontend/', $oldPicData['profile_picture_url']);
            if (file_exists($oldPicPath)) {
                unlink($oldPicPath);
            }
        }


        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Update database
            $stmt = $this->pdo->prepare("UPDATE users SET profile_picture_url = ?, updated_at = NOW() WHERE user_id = ?");
            if ($stmt->execute([$publicUrl, $userId])) {
                $this->respondSuccess(['profile_picture_url' => $publicUrl, 'message' => 'Profile picture updated.'], 200);
                exit;
            } else {
                unlink($uploadPath);
                $this->respondError('Failed to update database with new profile picture.', 500);
                exit;
            }
        } else {
            $this->respondError('Failed to move uploaded file.', 500);
            exit;
        }
    }

    // Verifies the token sent in the Authorization header.
    public function verifyToken()
    {
        try {
            $payload = AuthMiddleware::verifyToken(); // Throws on failure
            $this->respondSuccess(['id' => $payload['user_id'], 'role' => $payload['role']]);
        } catch (Exception $e) {
            error_log("VerifyToken Exception: " . $e->getMessage());
            $this->respondError('Unauthorized: Invalid or expired token.', 401);
        }
    }

    // Initiates the password reset process by sending an email link.
    public function requestPasswordReset($data)
    {
        if (empty($data['email']) || !filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $this->respondError('Valid email is required.', 400);
            return;
        }

        $email = $data['email'];
        // Generic message sent regardless of user existence for security.
        $response_data_on_success = ['message' => 'If an account with that email exists, a password reset link has been sent.'];

        try {
            $stmt = $this->pdo->prepare("SELECT user_id FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user) {
                $token = bin2hex(random_bytes(32));
                $token_hash = password_hash($token, PASSWORD_DEFAULT);
                $expires_at = date('Y-m-d H:i:s', strtotime('+1 hour'));

                // Use transaction for delete/insert consistency.
                $this->pdo->beginTransaction();
                $stmt_delete = $this->pdo->prepare("DELETE FROM password_resets WHERE user_email = ?");
                $stmt_delete->execute([$email]);
                $stmt_insert = $this->pdo->prepare("INSERT INTO password_resets (user_email, token_hash, expires_at) VALUES (?, ?, ?)");

                if ($stmt_insert->execute([$email, $token_hash, $expires_at])) {
                    $this->pdo->commit();

                    // Construct link - Use environment variable for base URL ideally.
                    $frontend_base_url = $_ENV['FRONTEND_URL'] ?? "http://localhost/pw2425";
                    $reset_link = rtrim($frontend_base_url, '/') . "/reset-password/" . $token;

                    if (!send_password_reset_email($email, $reset_link)) {
                        error_log("Failed sending password reset email to: " . $email);
                    }
                } else {
                    $this->pdo->rollBack();
                    error_log("Failed storing password reset token for: " . $email);
                }
            } // If user doesn't exist, do nothing.

            $this->respondSuccess($response_data_on_success);

        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("RequestPasswordReset PDOException for " . $email . ": " . $e->getMessage());
            $this->respondError('A database error occurred. Please try again later.', 500);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("RequestPasswordReset General Exception for " . $email . ": " . $e->getMessage());
            $this->respondError('An internal server error occurred. Please try again later.', 500);
        }
    }

    public function deleteAccount($userId, $data)
    {
        error_log("[AuthController] deleteAccount: Attempting for userId: " . $userId);

        if (empty($data['current_password'])) {
            error_log("[AuthController] deleteAccount: Password confirmation missing for userId: " . $userId);
            $this->respondError('Password confirmation is required to delete account.', 400);
            return;
        }
        $currentPassword = $data['current_password'];

        try {
            $stmt = $this->pdo->prepare("SELECT password_hash FROM users WHERE user_id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user) {
                error_log("[AuthController] deleteAccount: User not found for userId: " . $userId);
                $this->respondError('User not found.', 404);
                return;
            }

            if (!password_verify($currentPassword, $user['password_hash'])) {
                error_log("[AuthController] deleteAccount: Incorrect password for userId: " . $userId);
                $this->respondError('Incorrect password. Account deletion denied.', 401); // 401 for auth failure
                return;
            }

            error_log("[AuthController] deleteAccount: Password verified for userId: " . $userId . ". Proceeding with deletion.");
            $deleteStmt = $this->pdo->prepare("DELETE FROM users WHERE user_id = ?");

            if ($deleteStmt->execute([$userId])) {
                if ($deleteStmt->rowCount() > 0) {
                    error_log("[AuthController] deleteAccount: Account successfully deleted from DB for userId: " . $userId);
                    $this->respondSuccess(['message' => 'Account deleted successfully.'], 200);
                } else {
                    error_log("[AuthController] deleteAccount: Delete statement executed but no rows affected for userId: " . $userId . ". This is unexpected after password verification.");
                    $this->respondError('Account deletion failed: User record could not be removed or was already gone.', 500); // Treat as server error
                }
            } else {
                error_log("[AuthController] deleteAccount: Failed to execute delete statement for userId: " . $userId);
                $this->respondError('Failed to execute account deletion from database.', 500);
            }

        } catch (PDOException $e) {
            error_log("[AuthController] deleteAccount PDOException for userId " . $userId . ": " . $e->getMessage());
            $this->respondError('Database error during account deletion.', 500);
        }
    }

    // Completes the password reset using the provided token.
    public function resetPassword($data)
    {
        $token = $data['token'];
        $new_password = $data['password'];

        try {
            $now = date('Y-m-d H:i:s');
            $stmt_find = $this->pdo->prepare("SELECT reset_id, user_email, token_hash FROM password_resets WHERE expires_at > ?");
            $stmt_find->execute([$now]);

            $reset_request = null;
            $found_record_id = null; // Will store the reset_id
            $user_email = null;


            // Verify the provided token against stored hashes.
            while ($row = $stmt_find->fetch(PDO::FETCH_ASSOC)) {
                if (password_verify($token, $row['token_hash'])) {
                    $reset_request = $row;
                    $found_record_id = $row['reset_id']; // Use the correct column name 'reset_id'
                    $user_email = $row['user_email'];
                    break;
                }
            }

            if (!$reset_request) {
                $this->respondError('The link has expired or is invalid.', 400);
                return;
            }

            $new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

            // Use transaction for update + delete consistency.
            $this->pdo->beginTransaction();
            $stmt_update = $this->pdo->prepare("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE email = ?");
            if ($stmt_update->execute([$new_password_hash, $user_email])) {
                // Delete using the correct column name 'reset_id'
                $stmt_delete = $this->pdo->prepare("DELETE FROM password_resets WHERE reset_id = ?");
                if ($stmt_delete->execute([$found_record_id])) { // Use the correct variable holding reset_id
                    $this->pdo->commit();
                    $this->respondSuccess(['message' => 'Password was successfully changed.']);
                } else {
                    $this->pdo->rollBack();
                    // Log the specific error if possible
                    error_log("ResetPassword: Failed to delete password reset record with reset_id: " . $found_record_id);
                    throw new Exception("Failed to delete password reset token after password update.");
                }
            } else {
                $this->pdo->rollBack();
                // Log the specific error if possible
                error_log("ResetPassword: Failed to update password for email: " . $user_email);
                throw new Exception("Failed to execute password update statement.");
            }
        } catch (PDOException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("ResetPassword PDOException for token starting " . substr($token, 0, 5) . ": " . $e->getMessage());
            $this->respondError('A database error occurred while resetting the password.', 500);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            error_log("ResetPassword General Exception for token starting " . substr($token, 0, 5) . ": " . $e->getMessage());
            $this->respondError('An internal error occurred while resetting the password.', 500);
        }
    }

    // Helper to send a standardized successful JSON response and exit.
    private function respondSuccess($data = null, $statusCode = 200)
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }
        $response = ['success' => true];
        if ($data !== null) {
            $response['data'] = $data;
        }
        $jsonData = json_encode($response);
        if ($jsonData === false) {
            error_log("respondSuccess FATAL: json_encode failed! Error: " . json_last_error_msg());
            if (!headers_sent()) {
                http_response_code(500);
            }
            echo '{"success": false, "message": "Internal Server Error: Failed to encode success response."}';
        } else {
            echo $jsonData;
        }
        exit();
    }

    // Helper to send a standardized error JSON response and exit.
    private function respondError($message, $statusCode = 400)
    {
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=utf-8');
        }
        echo json_encode(['success' => false, 'message' => $message]);
        exit();
    }

}

<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../controllers/ChatbotController.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$requestUri = $_SERVER['REQUEST_URI'];
$basePath = '/pw2425/api';
$path = str_replace($basePath, '', parse_url($requestUri, PHP_URL_PATH));
$pathParts = explode('/', trim($path, '/'));


$resource = $pathParts[0] ?? null;
$id = $pathParts[1] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Parse JSON request body
$data = null;
if (in_array($method, ['POST', 'PUT', 'DELETE'])) {
    $input = file_get_contents('php://input');
    if ($input) {
        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid JSON payload: ' . json_last_error_msg()]);
            exit();
        }
    }
}

if (!isset($pdo)) {
    error_log("API FATAL: PDO connection not established in api/index.php");
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal Server Error: Database connection failed.']);
    exit();
}

$authMiddleware = new AuthMiddleware();

// Route to controller
try {
    switch ($resource) {


        case 'auth':
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController($pdo);

            if ($method === 'POST') {
                if ($id === 'signup') {
                    $controller->signup($data);
                } elseif ($id === 'login') {
                    $controller->login($data);
                } elseif ($id === 'request-reset') {
                    $controller->requestPasswordReset($data);
                } elseif ($id === 'reset-password') {
                    $controller->resetPassword($data);
                } else {
                    throw new Exception('Invalid auth action');
                }
            } elseif ($method === 'GET' && $id === 'verify') {
                // Verify route might implicitly use middleware or handle token itself
                $controller->verifyToken();
            } else {
                throw new Exception('Method not allowed for this resource');
            }
            break;



        case 'chatbot':
            // Protect the chatbot endpoint
            $token = $authMiddleware->getBearerToken();
            $userData = $authMiddleware->verifyToken($token); // Throws exception on failure

            // Only allow POST requests to the 'chat' action
            if ($method === 'POST' && $id === 'chat') {
                $controller = new ChatbotController();
                $controller->handleChatMessage($data, $userData, $pdo);
            } else {
                header("HTTP/1.1 404 Not Found");
                echo json_encode(['message' => 'Chatbot endpoint not found']);
            }
            break;



        case 'users':
            require_once __DIR__ . '/../controllers/AuthController.php';
            require_once __DIR__ . '/../controllers/ProgramController.php';
            $programController = new ProgramController($pdo);
            $controller = new AuthController($pdo);
            $token = $authMiddleware->getBearerToken();
            $requestingUserData = $authMiddleware->verifyToken($token); // Verify the token of the user making the request

            $action = $pathParts[2] ?? null;
            $targetUserId = $id; // The user ID from the URL path /api/users/{id}

            if (!$targetUserId) {
                throw new Exception('User ID is required for this action.');
            }

            // Authorization: Ensure the requesting user is the target user or an admin
            if ($requestingUserData['user_id'] != $targetUserId && $requestingUserData['role'] !== 'admin') {
                http_response_code(403); // Forbidden
                echo json_encode(['success' => false, 'message' => 'Forbidden: You do not have permission to perform this action on this user.']);
                exit();
            }

            if ($method === 'GET' && $action === 'purchased-programs') {
                $programController->getPurchasedPrograms($targetUserId);
            }
            if ($method === 'GET' && $action === null) {
                $controller->getUserProfile($targetUserId);
            } elseif ($method === 'PUT' && $action === 'profile') {
                $controller->updateProfile($targetUserId, $data);
            } elseif ($method === 'PUT' && $action === 'password') {
                $controller->changePassword($targetUserId, $data);
            } elseif ($method === 'POST' && $action === 'profile-picture') {
                $controller->updateProfilePicture($targetUserId, $_FILES);
            } elseif ($method === 'DELETE' && $action === 'account') {
                $controller->deleteAccount($targetUserId, $data);
            } else {
                throw new Exception('Invalid action or method for users resource.');
            }
            break;


        case 'trainers':
            require_once __DIR__ . '/../controllers/ProgramController.php';
            $controller = new ProgramController($pdo);
            $token = $authMiddleware->getBearerToken();
            $requestingUserData = $authMiddleware->verifyToken($token);

            $trainerId = $id;
            $action = $pathParts[2] ?? null;

            // Only allow the trainer or admin to access
            if ($requestingUserData['user_id'] != $trainerId && $requestingUserData['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit();
            }

            if ($method === 'GET' && $action === 'clients') {
                $controller->getTrainerClients($trainerId);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Resource not found']);
            }
            break;


        case 'programs':
            require_once __DIR__ . '/../controllers/ProgramController.php';
            $controller = new ProgramController($pdo);

            if ($method === 'DELETE' && $id) {
                $controller->deleteProgram($id);
            }
            // 1) LIST /api/programs?limit=&exclude_id=
            if ($method === 'GET' && !$id) {
                $controller->listPrograms($_GET);
            } elseif ($method === 'GET' && $id === 'trainer' && isset($pathParts[2])) {
                $trainerId = $pathParts[2];
                $controller->listTrainerPrograms($trainerId);
            } elseif ($method === 'POST' && !$id) {
                $controller->createProgram();
            }
            // 2) DETAIL /api/programs/{id}/detail
            elseif ($method === 'GET' && $id && ($pathParts[2] ?? null) === 'detail') {
                $controller->getProgramDetail($id);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false,'message' => 'Resource not found']);
            }
            break;


        case 'admin':
            require_once __DIR__ . '/../controllers/ProgramController.php';
            $programController = new ProgramController($pdo);
            $token = $authMiddleware->getBearerToken();
            $requestingUserData = $authMiddleware->verifyToken($token);

            // Only allow admin role
            if ($requestingUserData['role'] !== 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden: Admins only.']);
                exit();
            }

            $action = $pathParts[1] ?? null;
            if ($method === 'GET' && $action === 'dashboard') {
                $programController->getAdminDashboardData();
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Resource not found']);
            }
            break;


        default:
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Resource not found']);
    }


} catch (Exception $e) {
    $statusCode = 500;
    $clientMessage = 'An internal server error occurred.';

    // Check for specific authentication/authorization exceptions
    $authErrorMessages = [
        'Missing Token',
        'Authorization token not found.',
        'Invalid token format.',
        'Invalid signature.',
        'Invalid payload encoding',
        'Token expired',
        'Invalid issue time (iat)',
        'Token payload missing required data (user_id or role).'
    ];
    if (in_array($e->getMessage(), $authErrorMessages)) {
        $statusCode = 401;
        $clientMessage = 'Unauthorized: ' . $e->getMessage();
    }


    if (!headers_sent()) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode(['success' => false, 'message' => $clientMessage]);
}

<?php

class ProgramController
{
    private $pdo;

    public function __construct($dbConnection)
    {
        if (!$dbConnection) {
            error_log("ProgramController: Database connection is not provided.");
        }
        $this->pdo = $dbConnection;
    }

    public function getProgramDetail($programId)
    {
        if (empty($programId) || !is_numeric($programId)) {
            $this->respondError('Valid Program ID is required.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                tp.program_id, tp.title, tp.description, tp.duration_weeks, 
                tp.price, tp.currency, tp.program_img, tp.program_link,
                (
                    SELECT COUNT(*) FROM program_purchases pp WHERE pp.program_id = tp.program_id
                ) AS purchase_count,
                u.user_id as trainer_user_id, u.first_name as trainer_first_name, u.last_name as trainer_last_name
            FROM training_programs tp
            JOIN users u ON tp.trainer_user_id = u.user_id
            WHERE tp.program_id = ?
            ");
            $stmt->execute([$programId]);
            $program = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$program) {
                $this->respondError('Training program not found.', 404);
                return;
            }

            $this->respondSuccess($program);

        } catch (PDOException $e) {
            error_log("PDOException in getProgramDetail for program_id " . $programId . ": " . $e->getMessage());
            $this->respondError('A database error occurred while fetching program details.', 500);
        } catch (Exception $e) {
            error_log("Exception in getProgramDetail for program_id " . $programId . ": " . $e->getMessage());
            $this->respondError('An internal server error occurred while fetching program details.', 500);
        }
    }
    public function getAdminDashboardData()
    {
        try {
            error_log("REACHED ADMIN DASHBOARD ENDPOINT");
            // Total revenue (sum of all purchases)
            $stmt = $this->pdo->query("SELECT IFNULL(SUM(tp.price),0) AS totalRevenue FROM program_purchases pp JOIN training_programs tp ON pp.program_id = tp.program_id");
            $totalRevenue = $stmt->fetchColumn();

            // Total clients
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'client'");
            $totalClients = $stmt->fetchColumn();

            // Total trainers
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'trainer'");
            $totalTrainers = $stmt->fetchColumn();

            // Total programs
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM training_programs");
            $totalPrograms = $stmt->fetchColumn();

            // Total purchases
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM program_purchases");
            $totalPurchases = $stmt->fetchColumn();

            // Average program price
            $stmt = $this->pdo->query("SELECT IFNULL(AVG(price),0) FROM training_programs");
            $avgProgramPrice = $stmt->fetchColumn();

            // Most popular program
            $stmt = $this->pdo->query("SELECT title FROM training_programs ORDER BY purchase_count DESC LIMIT 1");
            $mostPopularProgram = $stmt->fetchColumn();

            // Most active trainer (by programs sold)
            $stmt = $this->pdo->query("
            SELECT u.first_name, u.last_name, SUM(tp.purchase_count) AS total_sold
            FROM users u
            JOIN training_programs tp ON tp.trainer_user_id = u.user_id
            GROUP BY u.user_id
            ORDER BY total_sold DESC
            LIMIT 1
        ");
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $mostActiveTrainer = $row ? trim($row['first_name'] . ' ' . $row['last_name']) : '';

            // New clients this month
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'client' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
            $newClientsThisMonth = $stmt->fetchColumn();

            // New trainers this month
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM users WHERE role = 'trainer' AND MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())");
            $newTrainersThisMonth = $stmt->fetchColumn();

            // Programs sold this month
            $stmt = $this->pdo->query("SELECT COUNT(*) FROM program_purchases WHERE MONTH(purchase_date) = MONTH(CURRENT_DATE()) AND YEAR(purchase_date) = YEAR(CURRENT_DATE())");
            $programsSoldThisMonth = $stmt->fetchColumn();

            // Revenue this month
            $stmt = $this->pdo->query("SELECT IFNULL(SUM(tp.price),0) FROM program_purchases pp JOIN training_programs tp ON pp.program_id = tp.program_id WHERE MONTH(pp.purchase_date) = MONTH(CURRENT_DATE()) AND YEAR(pp.purchase_date) = YEAR(CURRENT_DATE())");
            $revenueThisMonth = $stmt->fetchColumn();

            // Analytics: revenue per month for the last 12 months
            $stmt = $this->pdo->query("
            SELECT DATE_FORMAT(pp.purchase_date, '%b') AS month, YEAR(pp.purchase_date) as year, IFNULL(SUM(tp.price),0) AS revenue
            FROM program_purchases pp
            JOIN training_programs tp ON pp.program_id = tp.program_id
            WHERE pp.purchase_date >= DATE_SUB(CURRENT_DATE(), INTERVAL 11 MONTH)
            GROUP BY year, month
            ORDER BY year, STR_TO_DATE(month, '%b')
        ");
            $revenueData = [];
            $months = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $months[] = $row['month'];
                $revenueData[] = (float)$row['revenue'];
            }

            // Latest users (5)
            $stmt = $this->pdo->query("SELECT first_name, last_name, email, role, DATE(created_at) as registered FROM users ORDER BY created_at DESC LIMIT 5");
            $latestUsers = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Latest purchases (5)
            $stmt = $this->pdo->query("
            SELECT u.first_name, u.last_name, tp.title AS program, tp.price, pp.purchase_date
            FROM program_purchases pp
            JOIN users u ON pp.client_user_id = u.user_id
            JOIN training_programs tp ON pp.program_id = tp.program_id
            ORDER BY pp.purchase_date DESC
            LIMIT 5
        ");
            $latestPurchases = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $latestPurchases[] = [
                    'client' => trim($row['first_name'] . ' ' . $row['last_name']),
                    'program' => $row['program'],
                    'amount' => '€' . number_format($row['price'], 2),
                    'date' => date('Y-m-d', strtotime($row['purchase_date'])),
                ];
            }

            $this->respondSuccess([
                'metrics' => [
                    'totalRevenue' => '€' . number_format($totalRevenue, 2),
                    'totalClients' => (int)$totalClients,
                    'totalTrainers' => (int)$totalTrainers,
                    'totalPrograms' => (int)$totalPrograms,
                    'totalPurchases' => (int)$totalPurchases,
                    'avgProgramPrice' => '€' . number_format($avgProgramPrice, 2),
                    'mostPopularProgram' => $mostPopularProgram,
                    'mostActiveTrainer' => $mostActiveTrainer,
                    'newClientsThisMonth' => (int)$newClientsThisMonth,
                    'newTrainersThisMonth' => (int)$newTrainersThisMonth,
                    'programsSoldThisMonth' => (int)$programsSoldThisMonth,
                    'revenueThisMonth' => '€' . number_format($revenueThisMonth, 2),
                ],
                'analytics' => [
                    'revenueData' => $revenueData,
                    'months' => $months,
                ],
                'latestUsers' => $latestUsers,
                'latestPurchases' => $latestPurchases,
            ]);

        } catch (PDOException $e) {
            error_log("AdminDashboardData PDOException: " . $e->getMessage());
            $this->respondError('A database error occurred while fetching admin dashboard data.', 500);
        }
    }

    public function deleteProgram($programId)
    {
        if (empty($programId) || !is_numeric($programId)) {
            $this->respondError('Valid program ID is required.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("DELETE FROM training_programs WHERE program_id = ?");
            $stmt->execute([$programId]);
            if ($stmt->rowCount() > 0) {
                $this->respondSuccess(['message' => 'Programi u fshi me sukses.']);
            } else {
                $this->respondError('Programi nuk u gjet ose nuk mund të fshihej.', 404);
            }
        } catch (PDOException $e) {
            error_log("deleteProgram PDOException: " . $e->getMessage());
            $this->respondError('A database error occurred while deleting the program.', 500);
        }
    }

    public function listTrainerPrograms($params)
    {
        $trainerId = isset($params['trainer_id']) ? $params['trainer_id'] : null;
        try {
            if ($trainerId) {
                $stmt = $this->pdo->prepare("
                SELECT * FROM training_programs WHERE trainer_user_id = ? ORDER BY created_at DESC
            ");
                $stmt->execute([$trainerId]);
            } else {
                // fallback: list all programs (limit, exclude_ids, etc. can be added)
                $stmt = $this->pdo->query("SELECT * FROM training_programs ORDER BY created_at DESC");
            }
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respondSuccess($programs);
        } catch (PDOException $e) {
            error_log("listTrainingPrograms PDOException: " . $e->getMessage());
            $this->respondError('A database error occurred while fetching programs.', 500);
        }
    }

    public function getTrainerClients($trainerId)
    {
        if (empty($trainerId) || !is_numeric($trainerId)) {
            $this->respondError('Valid trainer ID is required.', 400);
            return;
        }
        try {
            $stmt = $this->pdo->prepare("
            SELECT 
                u.user_id, u.first_name, u.last_name, u.email,
                tp.title AS program_title,
                tp.price AS program_price,
                tp.currency
            FROM users u
            JOIN program_purchases pp ON pp.client_user_id = u.user_id
            JOIN training_programs tp ON pp.program_id = tp.program_id
            WHERE tp.trainer_user_id = ?
            GROUP BY u.user_id, tp.program_id
        ");
            $stmt->execute([$trainerId]);
            $clients = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respondSuccess($clients);
        } catch (PDOException $e) {
            error_log("getTrainerClients PDOException: " . $e->getMessage());
            $this->respondError('A database error occurred while fetching clients.', 500);
        }
    }

    public function createProgram()
    {
        // Use $_POST for text fields, $_FILES for files
        $fields = ['title', 'description', 'duration_weeks', 'price', 'currency', 'trainer_user_id'];
        foreach ($fields as $field) {
            if (empty($_POST[$field])) {
                $this->respondError("Field '$field' is required.", 400);
                return;
            }
        }

        // Handle image upload
        $imgPath = null;
        if (isset($_FILES['program_img']) && $_FILES['program_img']['error'] === UPLOAD_ERR_OK) {
            $imgTmp = $_FILES['program_img']['tmp_name'];
            $imgName = uniqid('progimg_') . '_' . preg_replace('/[^A-Za-z0-9_\-\.]/', '_', basename($_FILES['program_img']['name']));
            $imgDest = __DIR__ . '/../../frontend/assets/programs_banner/' . $imgName;
            if (!move_uploaded_file($imgTmp, $imgDest)) {
                $this->respondError('Failed to upload program image.', 500);
                return;
            }
            $imgPath = '/pw2425/frontend/assets/programs_banner/' . $imgName;
        } else {
            $this->respondError('Program image is required.', 400);
            return;
        }

        // Handle PDF upload (optional)
        $pdfPath = null;
        if (isset($_FILES['program_pdf']) && $_FILES['program_pdf']['error'] === UPLOAD_ERR_OK) {
            $pdfTmp = $_FILES['program_pdf']['tmp_name'];
            $pdfName = uniqid('progp_') . '_' . basename($_FILES['program_pdf']['name']);
            $pdfDest = __DIR__ . '/../../frontend/assets/training_programs/' . $pdfName;
            if (!move_uploaded_file($pdfTmp, $pdfDest)) {
                $this->respondError('Failed to upload program PDF.', 500);
                return;
            }
            $pdfPath = '/pw2425/frontend/assets/training_programs/' . $pdfName;
        }

        try {
            $stmt = $this->pdo->prepare("
            INSERT INTO training_programs
            (trainer_user_id, title, description, duration_weeks, price, currency, program_img, program_link, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ");
            $stmt->execute([
                $_POST['trainer_user_id'],
                $_POST['title'],
                $_POST['description'],
                $_POST['duration_weeks'],
                $_POST['price'],
                $_POST['currency'],
                $imgPath,
                $pdfPath
            ]);
            $this->respondSuccess(['message' => 'Programi u krijua me sukses!']);
        } catch (PDOException $e) {
            error_log("createProgram PDOException: " . $e->getMessage());
            $this->respondError('A database error occurred while creating the program.', 500);
        }
    }

    public function getPurchasedPrograms($userId)
    {
        if (empty($userId) || !is_numeric($userId)) {
            $this->respondError('Valid user ID is required.', 400);
            return;
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT 
                    tp.program_id,
                    tp.title,
                    tp.description,
                    tp.duration_weeks,
                    tp.price,
                    tp.currency,
                    tp.program_img,
                    tp.program_link,
                    tp.purchase_count,
                    u.user_id    AS trainer_user_id,
                    u.first_name AS trainer_first_name,
                    u.last_name  AS trainer_last_name,
                    pp.purchase_date
                FROM program_purchases pp
                JOIN training_programs tp ON pp.program_id = tp.program_id
                JOIN users u ON tp.trainer_user_id = u.user_id
                WHERE pp.client_user_id = ?
                ORDER BY pp.purchase_date DESC
            ");
            $stmt->execute([$userId]);
            $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
            $this->respondSuccess($programs);
        } catch (PDOException $e) {
            error_log("PDOException in getPurchasedPrograms for user_id " . $userId . ": " . $e->getMessage());
            $this->respondError('A database error occurred while fetching purchased programs.', 500);
        } catch (Exception $e) {
            error_log("Exception in getPurchasedPrograms for user_id " . $userId . ": " . $e->getMessage());
            $this->respondError('An internal server error occurred while fetching purchased programs.', 500);
        }
    }

    public function listPrograms(array $query)
    {
        $limit     = isset($query['limit']) ? (int)$query['limit'] : 20;
        $excludeId = isset($query['exclude_id']) ? (int)$query['exclude_id'] : null;

        $sql = "
            SELECT 
                tp.program_id,
                tp.title,
                tp.description,
                tp.duration_weeks,
                tp.price,
                tp.currency,
                tp.program_img,
                tp.program_link,
                tp.purchase_count,
                (
                    SELECT COUNT(*) FROM program_purchases pp WHERE pp.program_id = tp.program_id
                ) AS purchase_count,
                u.user_id    AS trainer_user_id,
                u.first_name AS trainer_first_name,
                u.last_name  AS trainer_last_name
            FROM training_programs tp
            JOIN users u 
              ON tp.trainer_user_id = u.user_id
            WHERE (:exclude IS NULL OR tp.program_id <> :exclude)
            ORDER BY tp.created_at DESC
            LIMIT :limit
        ";
        $stmt = $this->pdo->prepare($sql);
        $stmt->bindValue(':exclude', $excludeId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();

        $programs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $this->respondSuccess($programs);
    }

    // Standardized response helpers (can be in a base controller or trait)
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
        echo json_encode($response);
        exit();
    }

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

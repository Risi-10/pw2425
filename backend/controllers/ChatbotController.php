<?php
require_once __DIR__ . '/../config/env.php';   // helperi për .env
$root = realpath(__DIR__ . '/../../');         // rrënja e projektit
load_env($root . '/.env');                     // ngarko .env

class ChatbotController
{
    private $geminiApiKey;
    private $geminiApiUrl;

    public function __construct()
    {
        $this->geminiApiKey = env('GOOGLE_API_KEY');  // ose getenv('GOOGLE_API_KEY')
        if (!$this->geminiApiKey) {
            http_response_code(500);
            die('Missing GOOGLE_API_KEY');
        }

        $this->geminiApiUrl =
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key='
            . $this->geminiApiKey;
    }
}


    //interface method for handling chat messages
    public function handleChatMessage($data, $userData, $pdo)
    {
        if (!isset($data['history']) || !is_array($data['history']) || empty(
            ($data['history']))) {
            $this->respondError('Message cannot be empty.', 400);
            return;
        }

        // Get the last message from the history.
        $lastMessage = end($data['history']);
        $userMessageText = $lastMessage['parts'][0]['text'] ?? '';
        $userMessageLower = trim(strtolower($userMessageText));

        if (!isset($userData['user_id'])) {
            $this->respondError('User information not found.', 401);
            return;
        }

        $userId = $userData['user_id'];
        $userName = '';

        // fetch user name from database
        try {
            $stmt = $pdo->prepare("SELECT first_name FROM users WHERE user_id = ? LIMIT 1");
            $stmt->execute([$userId]);
            $userResult = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($userResult && !empty($userResult['first_name'])) {
                $userName = $userResult['first_name'];
            }
        } catch (PDOException $e) {
            error_log("Chatbot PDOException fetching user name for ID {$userId}: " . $e->getMessage());
        }

        //request payload for Gemini API
        $systemPrompt = "You are Carti, a friendly and encouraging fitness assistant. Your user's name is {$userName}. Respond in a helpful and human-like conversational style. Keep answers concise and focused on fitness, workouts, nutrition, or using this fitness platform (DO NOT PROVIDE TRAINING PLANS, ENCOURAGE CLIENTS TO TAKE A LOOK AT OUR PROGRAMS AND PURCHASE FROM THERE, JUST GENERATE SOME NUTRITION TIPS AND PROGRAM IF REQUESTED), all the responses should be in albanian language (DO NOT EVER USE THE LETTER ë,Ë,ç and Ç). DO NOT translate the excercise names, keep them in english, If the question is in english, reply in english. If the user asks about something outside of fitness, politely redirect them back to fitness topics. Avoid any sensitive or personal topics. Be supportive and positive. Use emojis to make the conversation more engaging. ALWAYS REMEMBER: Give me a response using the following Markdown formatting rules only: Use `**{text}**` to bold text , Use either `*{text}*` or `_{text}_` to italicize text, Use `\n` for line breaks (don't use actual newlines),Do not include any HTML or advanced Markdown (like headers, code blocks, or links),Assume the text will be rendered in a custom parser that escapes HTML and supports only these formats. Do not provide random '`'.";

        $payload = json_encode([
            //instructions
            'systemInstruction' => [
                 'parts' => [
                     ['text' => $systemPrompt]
                 ]
            ],
            'contents' => $data['history'],
             'safetySettings' => [
                ['category' => 'HARM_CATEGORY_DANGEROUS_CONTENT', 'threshold' => 'BLOCK_ONLY_HIGH'],
                ['category' => 'HARM_CATEGORY_HARASSMENT', 'threshold' => 'BLOCK_MEDIUM_AND_ABOVE'],
             ],
             'generationConfig' => [
                'temperature' => 0.7,
                'topP' => 0.9,
                'topK' => 40,
             ]
        ]);

        // curl for api request
        $ch = curl_init($this->geminiApiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            error_log("cURL Error calling Gemini: " . $curlError);
            $this->respondError('Failed to communicate with the AI service.', 500);
            return;
        }

        if ($httpCode >= 400) {
            error_log("Gemini API Error (HTTP {$httpCode}): " . $response);
            $errorResponseData = json_decode($response, true);
            $apiErrorMessage = $errorResponseData['error']['message'] ?? 'The AI service returned an error.';
            $this->respondError($apiErrorMessage, $httpCode);
            return;
        }

        $responseData = json_decode($response, true);

        $replyText = $responseData['candidates'][0]['content']['parts'][0]['text'] ?? null;

        if ($replyText === null) {
            // Log the unexpected response structure
            error_log("Gemini response missing expected text path. Response: " . $response);
            $finishReason = $responseData['candidates'][0]['finishReason'] ?? 'UNKNOWN';
            if ($finishReason === 'SAFETY') {
                $replyText = "I cannot respond to that request due to safety guidelines.";
            } elseif ($finishReason === 'RECITATION') {
                $replyText = "My apologies, I cannot provide that specific information.";
            } else {
                $replyText = 'Sorry, I encountered an issue processing your request.';
            }
        }

        $this->respondSuccess(['reply' => $replyText]);
    }

    //helper methods
    private function respondSuccess($data = [], $statusCode = 200)
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
        $response = ['success' => false, 'message' => $message];
        echo json_encode($response);
        exit();
    }
}

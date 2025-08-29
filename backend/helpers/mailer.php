<?php

require_once __DIR__ . '/../libs/PHPMailer/src/Exception.php';
require_once __DIR__ . '/../libs/PHPMailer/src/PHPMailer.php';
require_once __DIR__ . '/../libs/PHPMailer/src/SMTP.php';
require_once __DIR__ . '/../config/mail.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

function send_password_reset_email(string $recipient_email, string $reset_link): bool
{
    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->isSMTP();
        $mail->Host       = MAIL_HOST;
        $mail->SMTPAuth   = true;
        $mail->Username   = MAIL_USERNAME;
        $mail->Password   = MAIL_PASSWORD;
        $mail->SMTPSecure = (MAIL_ENCRYPTION === 'tls') ? PHPMailer::ENCRYPTION_STARTTLS : PHPMailer::ENCRYPTION_SMTPS;
        $mail->Port       = MAIL_PORT;

        // Recipients
        $mail->setFrom(MAIL_FROM_ADDRESS, MAIL_FROM_NAME);
        $mail->addAddress($recipient_email);

        // Content
        $mail->isHTML(true);
        $mail->Subject = 'Password Reset - Fitness App';
        $mail->Body    = "Hello,<br><br>You have requested a password reset for your profile on Fitness App.<br>" .
                         "Click the link below to reset your password:<br><br>" .
                         "<a href='" . htmlspecialchars($reset_link) . "'>" . htmlspecialchars($reset_link) . "</a><br><br>" .
                         "The link is valid for 1 hour.<br><br>" .
                         "If you did not request this, simply ignore this email.<br><br>Thank you,<br>The Fitness App Team";
        $mail->AltBody = "Hello,\n\nYou have requested a password reset for your profile on Fitness App.\n" .
                         "Click the link below to reset your password:\n\n" .
                         $reset_link . "\n\nThe link is valid for 1 hour.\n\n" .
                         "If you did not request this, simply ignore this email.\n\nThank you,\nThe Fitness App Team";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Mailer error [{$recipient_email}]: {$mail->ErrorInfo}");
        return false;
    }
}

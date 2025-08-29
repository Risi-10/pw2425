# PW2425 Sistemi i Menaxhimit te Fitnessit - Struktura e Bazes se te Dhenave

## Pershkrim

Kjo strukture e bazes se te dhenave mbeshtet aplikacionin e menaxhimit te fitnessit PW2425, duke mundesuar regjistrimin e perdoruesve dhe menaxhimin e roleve (klient, trajner, admin), krijimin dhe shitjen e programeve nga trajneret, blerjet e programeve nga klientet dhe menaxhimin e aksesit, regjistrimin e sigurte te pagesave permes PayPal, ngarkimin e dokumenteve (certifikata, foto), gjurmimin bazik te progresit te ushtrimeve te klienteve, dhe regjistrimin e komunikimeve esenciale. Fluksi kryesor perfshin perdoruesit qe regjistrohen, trajneret qe krijojne programe te shitshme me ushtrime te detajuara per cdo dite, klientet qe blejne keto programe (qe i jep atyre akses te perkohshem dhe i lidh me trajnerin), dhe klientet qe shenojne ditet e perfunduara te ushtrimeve. Te gjitha te dhenat qe lidhen me perdoruesit, programet, blerjet, pagesat, dokumentet, progresin, dhe njoftimet ruhen ne menyre relacional per te siguruar integritetin e te dhenave dhe per te mbeshtetur funksionalitetet e aplikacionit.

## Tabelat dhe Fushat e Bazes se te Dhenave

- **`users`**

  - `user_id` (INT, PK, Auto-Increment)
  - `first_name` (VARCHAR)
  - `last_name` (VARCHAR)
  - `email` (VARCHAR, UNIQUE, NOT NULL)
  - `bio` (TEXT)
  - `password_hash` (VARCHAR, NOT NULL)
  - `role` (ENUM('client', 'trainer', 'admin'), NOT NULL)
  - `profile_picture_url` (VARCHAR, Opsionale)
  - `created_at` (TIMESTAMP/DATETIME)
  - `updated_at` (TIMESTAMP/DATETIME)

- **`password_resets`**

  - `reset_id` (INT, PK, Auto-Increment)
  - `user_email` (VARCHAR, NOT NULL)
  - `token_hash` (VARCHAR, UNIQUE, NOT NULL)
  - `expires_at` (DATETIME, NOT NULL)
  - `created_at` (TIMESTAMP/DATETIME)

- **`training_programs`**

  - `program_id` (INT, PK, Auto-Increment)
  - `trainer_user_id` (INT, FK duke referuar `users.user_id`, NOT NULL)
  - `title` (VARCHAR, NOT NULL)
  - `description` (TEXT)
  - `duration_weeks` (INT, NOT NULL)
  - `price` (DECIMAL(10, 2), NOT NULL)
  - `currency` (VARCHAR(3), NOT NULL)
  - `program_link` (VARCHAR(255), NOT NULL)
  - `program_img` (VARCHAR(255), NOT NULL)
  - `purchase_count` (INT, Default: 0)
  - `created_at` (TIMESTAMP/DATETIME)
  - `updated_at` (TIMESTAMP/DATETIME)

- **`exercises`** (Lista kryesore e ushtrimeve)

  - `exercise_id` (INT, PK, Auto-Increment)
  - `exercise_name` (VARCHAR, UNIQUE, NOT NULL)
  - `exercise_description` (TEXT, Opsionale)

- **`program_purchases`**

  - `purchase_id` (INT, PK, Auto-Increment)
  - `client_user_id` (INT, FK qe referon `users.user_id`, NOT NULL)
  - `program_id` (INT, FK qe referon `training_programs.program_id`, NOT NULL)
  - `trainer_user_id` (INT, FK qe referon `users.user_id`, NOT NULL) - Denormalizuar/derivuar nga programi per kerkim me te lehte.
  - `purchase_date` (TIMESTAMP/DATETIME, NOT NULL)
  - `payment_id` (INT, FK qe referon `payments.payment_id`, NOT NULL)

* `duration_weeks`.

- **`payments`**

  - `payment_id` (INT, PK, Auto-Increment)
  - `client_user_id` (INT, FK qe referon `users.user_id`, NOT NULL)
  - `gateway_transaction_id` (VARCHAR, UNIQUE, NOT NULL) - ID-ja e transaksionit PayPal.
  - `amount` (DECIMAL(10, 2), NOT NULL)
  - `currency` (VARCHAR(3), NOT NULL)
  - `status` (ENUM('completed', 'failed', 'refunded'), NOT NULL)
  - `created_at` (TIMESTAMP/DATETIME)

- **`documents`**

  - `document_id` (INT, PK, Auto-Increment)
  - `uploader_user_id` (INT, FK qe referon `users.user_id`, NOT NULL)
  - `document_type` (ENUM('certificate', 'progress_photo'), NOT NULL)
  - `file_path` (VARCHAR, NOT NULL)
  - `original_filename` (VARCHAR)
  - `upload_timestamp` (TIMESTAMP/DATETIME)

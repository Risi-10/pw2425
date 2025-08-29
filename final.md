# Raporti Final i Projektit: Sistemi i Menaxhimit te Fitnessit PW2425

## 1. Hyrje dhe Permbledhje e Projektit

### 1.1 Informacioni i Pergjithshem

**Emri i Projektit:** PW2425 - Sistemi i Menaxhimit te Fitnessit  
**Grupi:** Inteligjenca Natyrale  
**Anetaret:** Florenc Kulici, Klausar Vladi, Eris Hasanpapaj, Florjon Seci, Aldo Margjeka, Igli Arapi

### 1.2 Qellimi

Ky projekt u krijua me qellimin per te zhvilluar nje sistem modern dhe funksional per menaxhimin e nje qendre fitness-i. Platforma synon te mundesoje regjistrimin e perdoruesve si trajnere personale ose kliente, krijimin dhe shitjen e programeve te trajnimit, komunikimin efektiv permes email-it dhe SMS-ve, si dhe integrimin e nje chatbot-i te fuqizuar nga AI per ndihme te personalizuar.

## 2. Arkitektura e Projektit

### 2.1 Struktura e Pergjithshme

Projekti eshte i ndertuar ne arkitekturen **frontend-backend**, ku:

```
Frontend (Klient) ↔ API RESTful ↔ Backend (Server) ↔ Database (MySQL)
```

## 3. Teknologjite e Perdorura

### 3.1 Frontend

- **HTML5/CSS3**: Per strukturen dhe dizajnin e faqeve
- **JavaScript ES6+**: Per nderveprimet dinamike dhe Single Page Application
- **CSS Modules**: cdo faqe ka stilet e saj te vecanta (HomePage.css, LoginPage.css, etj.)
- **SPA Router**: Sistem custom routing per navigim pa reload te faqes

### 3.2 Backend

- **PHP**: Si gjuhe kryesore e serverit me OOP patterns
- **MySQL**: Per ruajtjen e te dhenave me struktura relacional te optimizuara
- **JWT (JSON Web Tokens)**: Per autentifikimin e sigurt dhe session management
- **PHPMailer**: Per dergimin e email-eve me SMTP support
- **MVC Architecture**: Model-View-Controller per organizim te mire te kodit

### 3.3 Integrimet e Jashtme

- **Stripe API**: Sistemi kryesor i pagesave online per blerjen e programeve
- **Google Gemini AI**: Per chatbot-in "Carti" me AI te avancuar ne gjuhen shqipe
- **SMTP Email Service**: Per dergimin e njoftimeve dhe reset password

## 4. Baza e te Dhenave dhe Struktura

### 4.1 Dizajni i Bazes se te Dhenave

Baza e te dhenave permban tabela te organizuara per te mbeshtetur te gjitha funksionalitetet e sistemit:

#### Tabela `users`

```sql
users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE NOT NULL,
    bio TEXT,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('client', 'trainer', 'admin') NOT NULL,
    profile_picture_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

#### Tabela `training_programs`

```sql
training_programs (
    program_id INT PRIMARY KEY AUTO_INCREMENT,
    trainer_user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_weeks INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    program_link VARCHAR(255) NOT NULL,  -- Path te PDF-se se programit
    program_img VARCHAR(255) NOT NULL,   -- Path te imazhit te programit
    purchase_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (trainer_user_id) REFERENCES users(user_id)
)
```

#### Tabela `payments`

```sql
payments (
    payment_id INT PRIMARY KEY AUTO_INCREMENT,
    client_user_id INT NOT NULL,
    gateway_transaction_id VARCHAR(255) UNIQUE NOT NULL, -- Stripe session ID
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'EUR',
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(50) DEFAULT 'stripe',
    status ENUM('completed', 'failed', 'refunded') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_user_id) REFERENCES users(user_id)
)
```

#### Tabela `program_purchases`

```sql
program_purchases (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT,
    client_user_id INT NOT NULL,
    program_id INT NOT NULL,
    trainer_user_id INT NOT NULL,
    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_id INT NOT NULL,
    FOREIGN KEY (client_user_id) REFERENCES users(user_id),
    FOREIGN KEY (program_id) REFERENCES training_programs(program_id),
    FOREIGN KEY (trainer_user_id) REFERENCES users(user_id),
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
)
```

#### Tabela `password_resets`

```sql
password_resets (
    reset_id INT PRIMARY KEY AUTO_INCREMENT,
    user_email VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

#### Tabela `documents`

```sql
documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    uploader_user_id INT NOT NULL,
    document_type ENUM('certificate', 'progress_photo') NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255),
    upload_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploader_user_id) REFERENCES users(user_id)
)
```

## 5. Rrjedha e Informacionit dhe Funksionalitetet

### 5.1 Regjistrimi dhe Autentifikimi

#### 5.1.1 Procesi i Regjistrimit dhe Rrjedha e Informacionit

Informacioni rrjedh neper sistem ne menyren e meposhtme:

**Frontend → Backend → Database → Email Service**

1. **Mbledhja e te dhenave**: Perdoruesi ploteson formularin ne `SignupView.js`
2. **Validimi frontend**: JavaScript validimet kryhen ne kohe reale
3. **Transmitimi i te dhenave**: HTTP POST request dergohet ne `/api/auth/register`
4. **Procesimi backend**: `AuthController::register()` pranon dhe validimon te dhenat
5. **Kriptimi**: Password enkriptohet me `password_hash()`
6. **Ruajtja**: Te dhenat ruhen ne tabelen `users`
7. **Njoftimi**: Email automatik dergohet permes PHPMailer

```php
// AuthController.php - Funksionet kryesore
public function register() {
    // Validim → Enkriptim → Ruajtje → Email
}
```

#### 5.1.2 Autentifikimi me JWT dhe Rrjedha e Session-it

**Rrjedha e informacionit gjate login-it:**

1. **Kredencialet**: Frontend dergon email/password ne `/api/auth/login`
2. **Verifikimi**: `AuthController::login()` kontrollon kredencialet
3. **Krijimi i token-it**: JWT token gjenerohet me te dhenat e perdoruesit
4. **Kthimi**: Token dhe te dhenat e perdoruesit kthehen ne frontend
5. **Ruajtja**: Token ruhet ne localStorage per session management

```php
// AuthController.php - Funksionet e autentifikimit
private function generateJWT($userData) {
    // Krijimi i payload-it dhe enkriptimi
}

public function login() {
    // Verifikim → Token generation → Response
}
```

#### 5.1.3 Mbrojtja e Route-ave dhe Verifikimi i Aksesit

**Rrjedha e kontrollit te sigurise:**

1. **Interceptimi**: `AuthMiddleware` intercepts cdo request API
2. **Ekstratkimi**: Bearer token ekstraktohet nga header-at
3. **Dekodimi**: JWT token dekodohet dhe verifkohet
4. **Kontrolli i rolit**: Roli i perdoruesit verifkohet sipas route-s
5. **Autorization**: Akses lejohet ose mohohet bazuar ne role

```php
// AuthMiddleware.php
public function verifyToken($token) {
    // Dekodim → Verifikim → Return user data
}
```

#### 5.1.4 Password Reset dhe Rrjedha e Sigurise

**Rrjedha e informacionit per reset password:**

1. **Kerkesa**: Perdoruesi fut email-in ne `ForgotPasswordView.js`
2. **Token Security**: Sistem gjeneron token te enkriptuar me ekspirimi 1 ore
3. **Database Storage**: Token ruhet ne tabelen `password_resets`
4. **Email Delivery**: Link reset dergohet permes `mailer.php`
5. **Verification**: Token verifkohet kur perdoruesi hap link-un
6. **Password Update**: Password i ri ruhet dhe token fshihet

```php
// AuthController.php - Reset functionality
public function resetPassword() {
    // Email check → Token generation → Email sending
}

public function confirmPasswordReset() {
    // Token validation → Password update → Token cleanup
}
```

### 5.2 Panelet e Perdoruesve sipas Roleve

Sistemi implementon tre panele te specializuara me funksionalitete specifike per cdo rol:

#### 5.2.1 Paneli i Administratorit dhe Rrjedha e te Dhenave

**Rrjedha e informacionit ne dashboard admin:**

1. **Data Aggregation**: Sistemi grumbullon te dhena nga tabela te ndryshme
2. **Metrics Calculation**: Kalkulohen statistika ne kohe reale
3. **Real-time Updates**: Te dhenat perditesohen automatikisht
4. **Access Control**: Verifikohet roli admin para shfaqjes se te dhenave

**Funksionalitetet kryesore:**

- **Sistema Metrics**: Numri i perdoruesve, programeve, pagesave
- **User Management**: CRUD operacione per te gjithe perdoruesit
- **Payment Monitoring**: Shikimi i historikut te transaksioneve
- **Content Moderation**: Aprovimi/refuzimi i programeve te reja

```javascript
// AdminDashboardView.js - Data fetching
async fetchMetrics() {
    // API call → Data processing → UI update
}

async manageUsers() {
    // User list → Filter → Action handlers
}
```

#### 5.2.2 Paneli i Trajnerit dhe Menaxhimi i Biznesit

**Rrjedha e informacionit per trajneret:**

1. **Client Management**: Sistema ngarkon listen e klienteve aktive
2. **Program Creation**: Form per krijimin e programeve me file upload
3. **Sales Analytics**: Te dhenat e shitjeve kalkulohen nga pagesat
4. **Revenue Tracking**: Llogaritja e te ardhurave nga programet

**Komponente kryesore:**

- **Lista e Klienteve**: Klientet qe kane blere programe
- **Program Builder**: Interface per krijimin e programeve te reja
- **Upload Manager**: Ngarkimi i PDF-ve dhe imazheve
- **Performance Metrics**: Statistika shitjesh dhe rating-e

#### 5.2.3 Paneli i Klientit dhe Aksesi ne Programe

**Rrjedha e informacionit per klientet:**

1. **Program Access**: Sistemi kontrollon programet e blera
2. **Content Delivery**: PDF-te dhe materialet servohen nga server
3. **Progress Tracking**: Foto progres ngarkohen dhe ruhen
4. **Communication Flow**: Kanali direkt me trajnerin e programit

**Vecori kryesore:**

- **My Programs**: Programet e blera me akses te plote
- **Recommendations**: Algoritmi sugjeron programe te reja
- **Progress Photos**: Upload dhe menaxhim i foto progres
- **Purchase History**: Historiku i plote i transaksioneve

### 5.3 Menaxhimi i Programeve te Trajnimit

#### 5.3.1 Krijimi i Programeve dhe Rrjedha e te Dhenave

**Rrjedha e informacionit gjate krijimit te programit:**

1. **Form Submission**: Trajneri ploteson formularin ne frontend
2. **File Upload**: PDF dhe imazhet ngarkohen simultanisht
3. **Validation Layer**: Backend verifikon role, te dhena dhe file types
4. **File Processing**: Upload-et ruhen ne direktori specifike
5. **Database Storage**: Metadata ruhet ne `training_programs`
6. **Notification System**: Admin-at njoftohen per programin e ri

**Kontrollet e sigurise:**

- **Role Verification**: Vetem trajneret mund te krijojne programe
- **File Type Validation**: PNG/JPG per imazhe, PDF per programe
- **Size Limitations**: 5MB per imazhe, 10MB per PDF

#### 5.3.2 Blerja e Programeve dhe Integrimi i Pagesave

**Rrjedha e informacionit gjate blerjes:**

1. **Program Selection**: Klienti zgjedh programin ne `TrainingProgramView.js`
2. **Stripe Integration**: Drejtohet ne `stripe-checkout.php`
3. **Payment Processing**: Stripe procedon pagesen dhe gjeneron session ID
4. **Success Callback**: `payment-success.php` merr konfirmimin
5. **Database Updates**: Regjistrimi ne `payments` dhe `program_purchases`
6. **Access Granted**: Klienti merr akses te menjehershem ne program

**Sekuenca e sigurise:**

- **Session Validation**: Verifikimi i Stripe session-it
- **Double-spending Prevention**: Kontrolli per te evituar blérje te dyfishta
- **User Verification**: Identifikimi i sakte i bleresit
- **Transaction Logging**: Regjistrimi i plote per auditim

```php
// payment-success.php - Payment flow
$session = \Stripe\Checkout\Session::retrieve($session_id);

// Regjistro pagesen → Jep aksesin → Njofto perdoruesin
```

#### 5.3.3 Kontroll i Aksesit dhe Menaxhimi i Sigurise

**Rrjedha e kontrollit te sigurise:**

1. **Role-based Access**: Middleware verifikon rolin e perdoruesit per cdo operacion
2. **Ownership Verification**: Trajneret mund te redaktojne vetem programet e tyre
3. **Purchase Verification**: Klientet aksesojne vetem programet e blera
4. **File Security**: Upload-et kryhen me validim te strict te tipeve

**Kontrollet e implementuara:**

- **Authentication Layer**: JWT token per te gjitha request-et
- **Authorization Matrix**: Tabela e aksesit sipas roleve
- **Input Validation**: Sanitization i te gjitha te dhenave
- **File Type Filtering**: Whitelist per tipet e lejuara te skedareve

```php
// Security flow ne ProgramController.php
public function updateProgram() {
    // Auth → Ownership check → Validation → Update
}
```

### 5.4 Sistemi i Pagesave me Stripe

#### 5.4.1 Integrimi me Stripe Checkout dhe Rrjedha e Pagesave

**Rrjedha e informacionit ne sistemin e pagesave:**

1. **Session Creation**: `stripe-checkout.php` krijon session te pageses
2. **Payment Gateway**: Perdoruesi drejtohet ne Stripe Checkout
3. **Payment Processing**: Stripe procedon karten dhe gjeneron session ID
4. **Callback Handling**: Sistema merr konfirmimin ne `payment-success.php`
5. **Data Validation**: Verifikohet session-i dhe metadata
6. **Database Recording**: Transaksioni regjistrohet ne dy tabela

**Komponentet kryesore:**

- **Stripe SDK**: Integrimi me API-ne e Stripe
- **Session Management**: Krijimi dhe verifikimi i session-ave
- **Error Handling**: Menaxhimi i gabimeve dhe retry logic
- **Security Layer**: Webhook signature verification

```php
// stripe-checkout.php - Payment initialization
\Stripe\Stripe::setApiKey($secretKey);
$session = \Stripe\Checkout\Session::create([
    // Konfigurimi i pageses → Redirect URL-te → Metadata
]);

// payment-success.php - Payment completion
$session = \Stripe\Checkout\Session::retrieve($session_id);
// Verification → Database update → Access grant
```

#### 5.4.2 Procesimi i Pagesave te Suksesshme dhe Database Updates

**Rrjedha e konfirmimit te pageses:**

1. **Session Retrieval**: Marrja e detajeve te session-it nga Stripe
2. **User Identification**: Identifikimi i perdoruesit permes email ose ID
3. **Payment Recording**: Ruajtja e te dhenave ne tabelen `payments`
4. **Purchase Linking**: Lidhja e pageses me programin ne `program_purchases`
5. **Access Activation**: Aktivizimi i aksesit te menjehershem
6. **Notification Trigger**: Dergimi i konfirmimit permes email

**Siguria e transaksioneve:**

- **Session Validation**: Verifikimi i vlefshmerise se session-it
- **Amount Verification**: Kontrolli i shumes se paguar
- **Status Checking**: Verifikimi i statusit "completed"
- **Duplicate Prevention**: Parandalimi i regjistrimeve te dyfishta

```php
// payment-success.php - Core processing logic
$session = \Stripe\Checkout\Session::retrieve($session_id);

// User identification → Payment recording → Access granting
if ($session->payment_status === 'paid') {
    // Record payment → Link to program → Send confirmation
}
```

#### 5.4.3 Monitorimi dhe Auditimi i Transaksioneve

**Rrjedha e te dhenave per auditim:**

1. **Transaction Logging**: cdo pagese regjistrohet me timestamp te detajuar
2. **Status Tracking**: Statuset ndryshojne nga "pending" → "completed" → "verified"
3. **Error Recovery**: Sistemet e rikuperimit per pagesa te deshtuara
4. **Financial Reporting**: Raporte automatike per trajneret dhe admin-at

**Sistemet e monitorimit:**

- **Real-time Alerts**: Njoftime per pagesa te medha ose te dyshimta
- **Daily Reconciliation**: Krahasimi me te dhenat e Stripe
- **Fraud Detection**: Algoritme per zbulimin e aktiviteteve te dyshimta
- **Revenue Analytics**: Metrika per performancen financiare

```php
// Monitoring functions
public function getPaymentMetrics() {
    // Daily/monthly revenue → Success rates → Error tracking
}
```

### 5.5 Menaxhimi i Dokumenteve dhe Upload-ave

#### 5.5.1 Arkitektura e Upload Sistemit dhe Rrjedha e Skedareve

**Rrjedha e informacionit per file upload:**

1. **Frontend Selection**: Perdoruesi zgjedh skedaret ne interface
2. **Client Validation**: JavaScript kontrollon tipin dhe madhesine
3. **Multipart Transfer**: Skedaret dergohen si FormData
4. **Server Processing**: Backend verifikon dhe proceson upload-et
5. **File System Storage**: Skedaret ruhen ne direktori te organizuara
6. **Database Metadata**: Path-et dhe metadata ruhen ne databaze

**Organizimi i direktrive:**

```
frontend/assets/
├── profile_pictures/      # Foto profili (JPG, PNG, GIF)
├── programs_banner/       # Banner imazhe per programe
├── training_programs/     # PDF programe trajnimi
└── uploads/              # Dokumente te tjera
```

**Kontrollet e sigurise:**

- **File Type Whitelist**: Vetem tipet e aprovuara
- **Size Limitations**: Kufizime te madhesise per cdo tip
- **Unique Naming**: Emra unike per te evituar konfliktet
- **Directory Isolation**: Upload vetem ne zona te sigurta

#### 5.5.2 Upload i Programeve dhe Validimi

**Rrjedha e upload-it te programeve:**

1. **Form Processing**: `ProgramController::createProgram()` merr file-t
2. **Type Validation**: Kontrollohen tipet e lejuara (PNG/JPG, PDF)
3. **Size Checking**: Verifikohen kufizimet e madhesise
4. **Unique Naming**: Gjenerohen emra unike me prefix dhe timestamp
5. **File Movement**: Skedaret levizen ne direktorite perfundimtare
6. **Path Storage**: Path-et relative ruhen ne databaze

```php
// ProgramController.php - File upload flow
private function handleImageUpload($file) {
    // Validation → Unique naming → Move file → Return path
}

private function handlePdfUpload($file) {
    // PDF validation → Size check → Storage → Metadata
}
```

#### 5.5.3 Profile Pictures dhe Menaxhimi Personal

**Rrjedha e upload-it te foto profilit:**

1. **User Selection**: Interface e thjeshte per zgjedhjen e fotos
2. **Frontend Preview**: Shfaqja e preview-t para upload-it
3. **Size Optimization**: Kompresimi automatik nese eshte e nevojshme
4. **Server Processing**: `AuthController::updateProfilePicture()`
5. **Old File Cleanup**: Fshirja e fotos se vjeter nese ekziston
6. **Database Update**: Perditesimi i `profile_picture_url`

**Optimizimet e implementuara:**

- **Progressive Upload**: Upload me progress bar
- **Image Resizing**: Ridimensionimi automatik
- **Format Conversion**: Konvertimi ne formate te optimizuara
- **CDN Integration**: Gatishmeri per CDN ne te ardhmen

```php
// AuthController.php - Profile picture management
public function updateProfilePicture($userId, $files) {
    // Validation → Old file cleanup → Upload → Database update
}
```

#### 5.5.4 Siguria dhe Protokollet e Upload-it

**Rrjedha e kontrolleve te sigurise:**

1. **Client-side Validation**: Kontrolli i pare ne browser
2. **MIME Type Verification**: Verifikimi i vertete i tipit te file-it
3. **Magic Number Check**: Kontrolli i header-ave te file-it
4. **Size Enforcement**: Zbatimi i kufizimeve te madhesise
5. **Directory Traversal Prevention**: Siguria kunder path injection

**Masat e sigurise:**

- **File Extension Whitelist**: Lista e kufizuar e ekstensioneve
- **Content Scanning**: Analiza e permbajtjes se file-it
- **Quarantine System**: Izolimi i file-ve te dyshimta
- **Access Logging**: Regjistrimi i te gjitha upload-eve

### 5.6 Komunikimi (Email/SMS)

#### 5.6.1 Arkitektura e Email Sistemit dhe Rrjedha e Komunikimit

**Rrjedha e informacionit ne sistemin e email-eve:**

1. **Event Triggering**: Sistemi zbulkon events qe kerkojne email (regjistrimi, reset, etj.)
2. **Template Selection**: Zgjedhja e template-it te pershtatshem
3. **Data Preparation**: Pergatitja e te dhenave per personalizim
4. **SMTP Processing**: PHPMailer dergon email-in permes SMTP
5. **Delivery Confirmation**: Verifikimi i dergimit te suksesshem
6. **Error Handling**: Menaxhimi i gabimeve dhe retry logic

**Tipet e email-eve te automatizuara:**

- **Welcome Emails**: Mireseardhjeje per anetare te rinj
- **Password Reset**: Link-e te sigurta per reset
- **Purchase Confirmations**: Konfirmimet e blerjes se programeve
- **Trainer Notifications**: Njoftime per trajneret nga klientet
- **Admin Alerts**: Njoftime per aktivitete te rendesishme

```php
// mailer.php - Email delivery system
function send_password_reset_email($recipient, $reset_link) {
    // SMTP config → Template prep → Send → Log result
}

function send_welcome_email($email, $name) {
    // Personalization → HTML template → Delivery
}
```

#### 5.6.2 Njoftimet Automatike dhe Event-Driven Messaging

**Rrjedha e event-eve dhe njoftimeve:**

1. **Event Detection**: Sistemi monitoron aktivitete te rendesishme
2. **Rule Engine**: Rregullat percaktojne kush njoftohet dhe si
3. **Message Queuing**: Email-et vendosen ne radhe per dergim
4. **Batch Processing**: Dergimi ne grupe per te optimizuar performance
5. **Delivery Tracking**: Monitorimi i statusit te dergimit
6. **Failure Recovery**: Retry automatik per email-e te deshtuar

**Email triggers ne sistem:**

- **User Registration**: Aktivizohet pas regjistrimit te suksesshem
- **Password Reset Request**: Kur perdoruesi kerkon reset password
- **Program Purchase**: Pas cdo blerje te suksesshme programi
- **New Program Alert**: Kur trajneri krijon program te ri
- **Payment Notifications**: Per te gjitha transaksionet financiare

#### 5.6.3 Konfigurimi dhe Menaxhimi i SMTP

**Rrjedha e konfigurimit te email sistemit:**

1. **Environment Setup**: Konfigurimi ne `mail.php` me parametra SMTP
2. **Authentication Setup**: Google App Passwords per Gmail SMTP
3. **Connection Testing**: Verifikimi i lidhjes me SMTP server
4. **Error Logging**: Regjistrimi i gabimeve per debugging
5. **Performance Monitoring**: Monitorimi i kohes se dergimit
6. **Fallback Configuration**: SMTP alternative ne rast deshtimi

**Parametrat e konfigurimit:**

- **SMTP Host**: Gmail SMTP server (smtp.gmail.com)
- **Port Configuration**: Port 587 per TLS encryption
- **Authentication**: Username/password per autentifikim
- **Security Layer**: TLS encryption per siguri
- **From Address**: Email adresa zyrtare e platformes

```php
// mail.php - SMTP configuration
define('MAIL_HOST', 'smtp.gmail.com');
define('MAIL_PORT', 587);
// Other SMTP settings...
```

### 5.7 Chatbot-i "Carti" me Google Gemini AI

#### 5.7.1 Integrimi me Google Gemini AI dhe Rrjedha e te Dhenave

**Rrjedha e informacionit ne chatbot sistem:**

1. **User Input**: Perdoruesi shkruan mesazhin ne chat interface
2. **Context Building**: Sistemi nderton historikun e bisedes
3. **API Request**: Mesazhi dergohet ne Google Gemini API
4. **AI Processing**: Gemini AI procesion mesazhin me kontekst
5. **Response Generation**: AI-ja gjeneron pergjigjen ne shqip
6. **UI Update**: Pergjigja shfaqet ne chat interface

**Komponentet e sistemit:**

- **Frontend Interface**: Chat widget i integruar ne te gjitha panelet
- **Message History**: Ruajtja e kontekstit te bisedes
- **AI Configuration**: System prompt i optimizuar per fitness
- **Safety Filters**: Filtra per permbajtje te papershtatshme
- **Language Processing**: Optimizim per gjuhen shqipe

```php
// ChatbotController.php - AI integration
class ChatbotController {
    public function handleChatMessage($data, $userData, $pdo) {
        // User context → System prompt → API call → Response processing
    }

    private function buildSystemPrompt($userName) {
        // Personalized prompt → Fitness focus → Albanian language
    }
}
```

#### 5.7.2 Frontend Integration dhe User Experience

**Rrjedha e nderveprimit ne frontend:**

1. **Widget Initialization**: Chat widget inicializohet ne te gjitha dashboard-et
2. **Message Handling**: Event listener-at kapin input-in e perdoruesit
3. **UI Updates**: Mesazhet shtohen ne interface ne kohe reale
4. **API Communication**: Async request-et dergohen ne backend
5. **Response Rendering**: Pergjigjet e AI-se shfaqen me formatim
6. **History Management**: Historiku i bisedes ruhet ne localStorage

**Frontend komponente:**

- **Chat Widget**: Icon floating ne te gjitha faqet
- **Message Container**: Lista e mesazheve me scroll automatik
- **Input Handler**: Textarea me submit ne Enter
- **Typing Indicators**: Visual feedback gjate procesimit
- **Error Handling**: Mesazhe fallback per gabime API

#### 5.7.3 AI Capabilities dhe Personalizimi

**Rrjedha e inteligjences artificiale:**

1. **Context Awareness**: AI-ja kupton kontekstin e perdoruesit (emri, roli)
2. **Domain Expertise**: Specializimi ne keshilla fitness dhe nutricion
3. **Language Optimization**: Optimizim per gjuhen shqipe me rregulla specifike
4. **Safety Protocols**: Filtra te avancuar per permbajtje te sigurt
5. **Response Personalization**: Pergjigje te personalizuara sipas perdoruesit
6. **Learning Adaptation**: Permiresimi i pergjigjes bazuar ne feedback

**Vecorite e specializuara:**

- **Fitness Focus**: AI-ja eshte trajnuar per keshilla fitness specifike
- **Albanian Language**: Optimizim i posacem per gjuhen shqipe
- **Platform Integration**: Njohurite per funksionalitetet e platformes
- **User Personalization**: Perdorimi i emrit dhe informacioneve te profilit
- **Exercise Knowledge**: Baza e te dhenave per ushtrime dhe teknika
- **Nutrition Guidance**: Keshilla te detajuara ushqimore

**AI Safety dhe Performance:**

- **Content Filtering**: Parandalimi i permbajtjes se papershtatshme
- **Response Time**: Optimizim per pergjigje te shpejta
- **Token Management**: Menaxhimi efikas i API tokens
- **Error Recovery**: Handling i gabimeve te API-se
- **Rate Limiting**: Kontrolli i frekuences se request-eve

## 6. API dhe Struktura Backend

### 6.1 Arkitektura RESTful dhe Rrjedha e Request-eve

**Rrjedha e informacionit ne API:**

1. **Request Interception**: `index.php` intercepton te gjitha kerkesat API
2. **CORS Handling**: Konfigurohet Cross-Origin Resource Sharing
3. **Route Parsing**: URL-te analizohen per te percaktuar endpoint-in
4. **Controller Delegation**: Request-et drejtohen ne kontrollerin perkates
5. **Authentication Check**: Middleware verifikon JWT tokens
6. **Response Formatting**: Te dhenat kthehen ne format JSON

**Struktura e endpoint-eve:**

```
/api/auth/*          → AuthController (login, register, reset)
/api/programs/*      → ProgramController (CRUD operations)
/api/chat/*          → ChatbotController (AI interactions)
/api/payments/*      → PaymentController (transaction handling)
/api/admin/*         → AdminController (system management)
```

**Router workflow:**

- **Method Detection**: GET, POST, PUT, DELETE handling
- **Parameter Extraction**: ID-te dhe parametra nga URL
- **Header Processing**: Authorization dhe Content-Type
- **Error Standardization**: Format i njejte per te gjitha gabimet

```php
// api/index.php - Central routing system
$endpoint = $segments[0] ?? '';
$method = $_SERVER['REQUEST_METHOD'];

switch ($endpoint) {
    case 'auth': routeAuthRequests($authController, $method, $segments);
    case 'programs': routeProgramRequests($programController, $method, $segments);
    // Other route handlers...
}
```

### 6.2 Middleware Sistem dhe Rrjedha e Sigurise

**Rrjedha e autentifikimit dhe autorizimit:**

1. **Token Extraction**: Middleware ekstrakton Bearer token nga headers
2. **JWT Validation**: Verifikon nenshkrimin dhe skadimin e token-it
3. **User Context**: Ekstrakton te dhenat e perdoruesit nga payload
4. **Role Verification**: Kontrollon nese roli lejon aksesimin e resursi
5. **Request Continuation**: Lejon ose bllokon vazhdimin e request-it
6. **Error Response**: Kthen mesazhe te standardizuara gabimi

**Nivelet e sigurise:**

- **Public Endpoints**: Pa autentifikim (register, login)
- **Authenticated Routes**: Kerkon JWT token valid
- **Role-based Access**: Kontrollon role specifike (admin, trainer, client)
- **Resource Ownership**: Verifikon ownership per modifikime
- **Rate Limiting**: Kontrollon frekuencen e request-eve (ne plan)

```php
// AuthMiddleware.php - Security flow
class AuthMiddleware {
    public function authenticate() {
        // Header extraction → JWT decode → User verification
    }

    public function requireRole($allowedRoles) {
        // Auth check → Role validation → Access control
    }

    private function respondUnauthorized($message) {
        // Standardized error response
    }
}
```

### 6.3 Kontrolleret Kryesore dhe Implementimi i Tyre

#### 6.3.1 AuthController - Menaxhimi i Plote i Autentifikimit

**Rrjedha e te dhenave ne proceset e autentifikimit:**

1. **Registration Flow**: Input validation → Password hashing → Database storage → Email notification
2. **Login Process**: Credential verification → JWT generation → Session establishment → User data return
3. **Password Reset**: Email validation → Token generation → Email delivery → Token verification → Password update
4. **Profile Management**: Authentication check → Data validation → Profile update → Response confirmation

**Funksionet kryesore dhe pergjegjesite:**

- **Data Validation**: Input sanitization dhe format checking
- **Security Implementation**: Password hashing dhe token management
- **Email Integration**: Welcome emails dhe password reset notifications
- **Session Management**: JWT creation dhe validation
- **Error Handling**: Standardized error responses

```php
// AuthController.php - Core authentication methods
public function register() {
    // Validation → Hashing → Storage → Email notification
}

public function login() {
    // Verification → JWT creation → Session setup
}

public function resetPassword() {
    // Email check → Token generation → Email delivery
}

private function validateRegistrationData($data) {
    // Required fields → Email format → Password strength → Role validation
}
```

**Login Flow - Database to JWT Pipeline:**

1. **Credential Validation**: Database query for active user → Password verification
2. **JWT Token Creation**: User data extraction → Payload assembly → Token encoding
3. **Session Update**: Last login timestamp → Database record update
4. **Response Assembly**: Token + User profile → JSON response

**Password Reset Flow - Security Token Pipeline:**

1. **Email Verification**: User lookup in database → Security response (same message for valid/invalid)
2. **Token Generation**: Random 32-byte token → 1-hour expiration → Database storage
3. **Email Delivery**: Reset link creation → SMTP email dispatch
4. **Response Handling**: Success confirmation or error logging

**Data Validation Pipeline:**

- **Required Fields**: first_name, last_name, email, password, role
- **Email Format**: FILTER_VALIDATE_EMAIL validation
- **Password Strength**: Minimum 6 characters requirement
- **Role Verification**: admin/trainer/client enum validation

**Email System Integration:**

- **Welcome Emails**: New user registration → Template processing → SMTP delivery
- **Reset Notifications**: Token generation → Link embedding → Secure delivery

#### 6.3.2 ProgramController - Menaxhimi i Programeve te Trajnimit

**Rrjedha e te dhenave ne menaxhimin e programeve:**

1. **Program Creation**: Role verification → Input validation → File upload → Database storage → Admin notification
2. **Program Listing**: Public access → Data aggregation → Rating calculation → Response formatting
3. **User Programs**: Authentication → Role-based queries → Sales analytics → Data return
4. **Program Updates**: Ownership verification → Data validation → File replacement → Database update

**Funksionalitetet kryesore:**

- **CRUD Operations**: Create, Read, Update, Delete per programe
- **File Management**: Upload dhe menaxhim i imazheve dhe PDF-ve
- **Access Control**: Role-based permissions per operacione
- **Analytics Integration**: Llogaritja e metrikave te shitjeve
- **Notification System**: Njoftimet per admin-at dhe trajneret

```php
// ProgramController.php - Core program management
public function createProgram() {
    // Auth → Validation → File upload → Database → Notifications
}

public function getAllPrograms() {
    // Data aggregation → Rating calculation → Response formatting
}

public function getUserPrograms() {
    // Role check → Specific queries → Analytics → Response
}

private function handleImageUpload($file) {
    // Validation → Upload → Path return
}
```

### 6.4 Menaxhimi i Gabimeve dhe Rrjedha e Logging-ut

**Rrjedha e menaxhimit te gabimeve ne sistem:**

1. **Error Detection**: PHP errors, exceptions, dhe shutdown errors → Global handlers
2. **Data Collection**: Error details, file location, user context → Structured logging
3. **Security Processing**: Production mode filtering → Safe error responses
4. **Log Storage**: Timestamp addition → File system storage → Rotation management
5. **Response Generation**: User-safe messages → HTTP status codes → JSON formatting

**Komponentet e sistemit te gabimeve:**

- **Global Handlers**: set_error_handler, set_exception_handler, register_shutdown_function
- **Context Preservation**: Request URI, user agent, timestamp, user session
- **Environment Awareness**: Production vs development response modes
- **Structured Logging**: Consistent format per te gjitha gabimet
- **Security Features**: Sensitive data filtering ne production

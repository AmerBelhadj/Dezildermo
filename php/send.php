<?php
/**
 * ============================================================
 * DEZIL DERMO — Backend formulaire de réservation v2.0
 * ============================================================
 * Sécurité :
 *   ✓ Sanitisation complète (filter_var, strip_tags, longueur)
 *   ✓ Validation MIME réelle des fichiers (finfo)
 *   ✓ Honeypot anti-bot
 *   ✓ Timing check (soumission trop rapide = bot)
 *   ✓ Rate-limiting par IP (fichier JSON local)
 *   ✓ Prévention header-injection
 *   ✓ CORS strict
 *
 * Délivrabilité :
 *   ✓ From = domaine SMTP authentifié
 *   ✓ Reply-To = email du client
 *   ✓ Message-ID unique
 *   ✓ Email HTML + version texte (multipart/alternative)
 *   ✓ Encodage UTF-8 conforme RFC 2047
 * ============================================================
 */

declare(strict_types=1);
error_reporting(0); // Ne jamais exposer les erreurs PHP en prod

/* ── Config ── */
$cfg = require __DIR__ . '/config.php';

/* ── Headers HTTP ── */
header('Content-Type: application/json; charset=utf-8');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($cfg['allowed_origin'] === '*' || $origin === $cfg['allowed_origin']) {
    header('Access-Control-Allow-Origin: ' . ($cfg['allowed_origin'] === '*' ? '*' : $origin));
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

/* ── Helpers ── */
function respond(bool $ok, string $msg, int $code = 200): never {
    http_response_code($code);
    echo json_encode(['success' => $ok, 'message' => $msg], JSON_UNESCAPED_UNICODE);
    exit;
}

function clientIp(): string {
    foreach (['HTTP_CF_CONNECTING_IP','HTTP_X_FORWARDED_FOR','REMOTE_ADDR'] as $k) {
        $ip = $_SERVER[$k] ?? '';
        if ($ip) return explode(',', $ip)[0];
    }
    return '0.0.0.0';
}

/* ── 1. Méthode ── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Méthode non autorisée.', 405);
}

/* ── 2. Rate-limiting par IP ─────────────────────────────────
 *  Stocke un compteur par IP dans un fichier JSON temporaire.
 *  Bloque si > rate_limit_max envois dans la fenêtre.           */
$rateFile = sys_get_temp_dir() . '/dz_rate_' . md5(clientIp()) . '.json';
$now      = time();
$rateData = ['count' => 0, 'first' => $now];

if (file_exists($rateFile)) {
    $rateData = json_decode(file_get_contents($rateFile), true) ?: $rateData;
    if ($now - $rateData['first'] > $cfg['rate_limit_window']) {
        $rateData = ['count' => 0, 'first' => $now]; // reset fenêtre
    }
}
$rateData['count']++;
file_put_contents($rateFile, json_encode($rateData), LOCK_EX);

if ($rateData['count'] > $cfg['rate_limit_max']) {
    respond(false, 'Trop de tentatives. Veuillez réessayer dans une heure.', 429);
}

/* ── 3. Honeypot ─────────────────────────────────────────────
 *  Un bot remplit le champ caché ; un humain le laisse vide.   */
$honeypot = $_POST[$cfg['honeypot_field']] ?? '';
if ($honeypot !== '') {
    // Simuler un succès pour ne pas alerter le bot
    respond(true, 'Votre demande a bien été envoyée !');
}

/* ── 4. Timing check ─────────────────────────────────────────
 *  On vérifie un token de session posé au chargement de la page.
 *  Si absent ou trop récent → bot.                              */
$formToken = filter_input(INPUT_POST, 'form_token', FILTER_SANITIZE_SPECIAL_CHARS) ?? '';
$tokenFile = sys_get_temp_dir() . '/dz_token_' . md5($formToken) . '.txt';
if (empty($formToken) || !file_exists($tokenFile)) {
    respond(false, 'Session expirée. Rechargez la page et réessayez.', 422);
}
$tokenAge = $now - (int) file_get_contents($tokenFile);
@unlink($tokenFile); // Usage unique
if ($tokenAge < $cfg['min_submit_seconds']) {
    respond(false, 'Soumission trop rapide. Veuillez réessayer.', 422);
}

/* ── 5. Sanitisation & validation des champs ─────────────────
 *
 *  Règles appliquées sur chaque champ :
 *    a) filter_var SANITIZE  → supprime les caractères dangereux
 *    b) Validation de format (email, longueur, regex…)
 *    c) Prévention header-injection : pas de \n ni \r
 ─────────────────────────────────────────────────────────────── */

/** Nettoie une chaîne texte brute */
function sanitizeText(string $val, int $maxLen = 200): string {
    $v = filter_var($val, FILTER_SANITIZE_SPECIAL_CHARS); // encode entités HTML
    $v = strip_tags($v);                                   // supprime balises résiduelles
    $v = preg_replace('/[\r\n\t]/', ' ', $v);              // élimine retours à la ligne (header injection)
    $v = mb_substr(trim($v), 0, $maxLen, 'UTF-8');         // limite la longueur
    return $v;
}

/** Nettoie un numéro de téléphone (chiffres, +, espaces, tirets) */
function sanitizePhone(string $val): string {
    return preg_replace('/[^0-9+\s\-()]/', '', mb_substr($val, 0, 20));
}

/** Nettoie un message long (autorise les retours à la ligne) */
function sanitizeMessage(string $val, int $maxLen = 2000): string {
    $v = strip_tags($val);
    $v = htmlspecialchars($v, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    $v = mb_substr(trim($v), 0, $maxLen, 'UTF-8');
    return $v;
}

// Récupération et nettoyage
$nom        = sanitizeText($_POST['nom']        ?? '');
$telephone  = sanitizePhone($_POST['telephone'] ?? '');
$emailRaw   = trim($_POST['email']              ?? '');
$prestation = sanitizeText($_POST['prestation'] ?? '');
$date       = sanitizeText($_POST['date']       ?? '', 20);
$heure      = sanitizeText($_POST['heure']      ?? '', 10);
$message    = sanitizeMessage($_POST['message'] ?? '');

// Validation email (filter_var strict)
$email = filter_var($emailRaw, FILTER_VALIDATE_EMAIL);
if ($email === false) {
    respond(false, 'L\'adresse email saisie n\'est pas valide.', 422);
}
// Sécurité supplémentaire : pas de newline dans l'email (header injection)
if (preg_match('/[\r\n]/', $email)) {
    respond(false, 'Email invalide.', 422);
}

// Champs obligatoires non vides après nettoyage
$missing = [];
if (!$nom)        $missing[] = 'Nom';
if (!$telephone)  $missing[] = 'Téléphone';
if (!$prestation) $missing[] = 'Prestation';
if (!$date)       $missing[] = 'Date';
if (!$heure)      $missing[] = 'Heure';
if ($missing) {
    respond(false, 'Champs manquants : ' . implode(', ', $missing) . '.', 422);
}

// Validation date (format YYYY-MM-DD, pas dans le passé)
if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
    respond(false, 'Format de date invalide.', 422);
}
if (strtotime($date) < strtotime('today')) {
    respond(false, 'La date choisie est dans le passé.', 422);
}

// Validation heure (HH:MM)
if (!preg_match('/^\d{2}:\d{2}$/', $heure)) {
    respond(false, 'Format d\'heure invalide.', 422);
}

// Détection spam dans le contenu : URLs, mots-clés suspects
$spamPatterns = [
    '/https?:\/\//i',
    '/www\./i',
    '/\b(viagra|casino|crypto|bitcoin|forex|loan|debt)\b/i',
    '/\bclick here\b/i',
    '/<[a-z]/i',   // balise HTML résiduelle
];
foreach ($spamPatterns as $pattern) {
    if (preg_match($pattern, $nom . ' ' . $message)) {
        respond(true, 'Votre demande a bien été envoyée !'); // leurre
    }
}

/* ── 6. Validation et déplacement des fichiers uploadés ────── */
$attachments = [];
$uploadDir   = $cfg['upload_dir'];

if (!empty($_FILES['photos']['name'][0])) {
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0750, true);
        file_put_contents($uploadDir . '.htaccess', "Require all denied\n");
    }

    $files = $_FILES['photos'];
    $count = is_array($files['name']) ? count($files['name']) : 1;
    if (!is_array($files['name'])) {
        foreach ($files as $k => $v) $files[$k] = [$v];
    }

    if ($count > $cfg['max_files']) {
        respond(false, 'Maximum ' . $cfg['max_files'] . ' photos autorisées.', 422);
    }

    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    for ($i = 0; $i < $count; $i++) {
        if ($files['error'][$i] !== UPLOAD_ERR_OK) continue;

        $size    = (int) $files['size'][$i];
        $tmpPath = $files['tmp_name'][$i];
        $origName = basename($files['name'][$i]);

        // Taille
        if ($size > $cfg['max_size_mb'] * 1024 * 1024) {
            respond(false, '"' . $origName . '" dépasse ' . $cfg['max_size_mb'] . ' Mo.', 422);
        }

        // MIME réel (finfo sur le contenu binaire, pas l'extension)
        $mime = finfo_file($finfo, $tmpPath);
        if (!in_array($mime, $cfg['allowed_types'], true)) {
            respond(false, '"' . $origName . '" : format non autorisé.', 422);
        }

        // Nom sécurisé : pas d'extension forgée
        $ext = match($mime) {
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            default      => 'bin'
        };
        $safeName = 'rdv_' . bin2hex(random_bytes(8)) . '.' . $ext;
        $destPath = $uploadDir . $safeName;

        if (move_uploaded_file($tmpPath, $destPath)) {
            $attachments[] = ['path' => $destPath, 'name' => $origName];
        }
    }
    finfo_close($finfo);
}

/* ── 7. Chargement PHPMailer ── */
$composerAutoload = __DIR__ . '/../vendor/autoload.php';
$libAutoload      = __DIR__ . '/lib/PHPMailer/src/PHPMailer.php';

$usePHPMailer = false;
if (file_exists($composerAutoload)) {
    require $composerAutoload;
    $usePHPMailer = true;
} elseif (file_exists($libAutoload)) {
    require $libAutoload;
    require __DIR__ . '/lib/PHPMailer/src/SMTP.php';
    require __DIR__ . '/lib/PHPMailer/src/Exception.php';
    $usePHPMailer = true;
}

/* ── 8. Contenu de l'email ── */
$dateFormatted = date('d/m/Y', strtotime($date));
$photoNote = $attachments
    ? '<p style="margin:0"><strong style="color:#c9a96e">📷 ' . count($attachments) . ' photo(s) jointe(s)</strong></p>'
    : '<p style="margin:0;color:#888"><em>Aucune photo jointe.</em></p>';

$htmlBody = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/>
<style>
  body{margin:0;padding:0;background:#f4f4f4;font-family:Arial,sans-serif}
  .wrap{max-width:580px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.1)}
  .header{background:#0a0a0a;padding:28px 32px;text-align:center}
  .header h1{color:#c9a96e;font-size:24px;font-weight:300;letter-spacing:3px;margin:0}
  .header p{color:#777;font-size:13px;margin:8px 0 0}
  .body{padding:28px 32px}
  table{width:100%;border-collapse:collapse}
  td{padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:14px;vertical-align:top}
  td:first-child{color:#999;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;width:130px;padding-right:16px}
  td:last-child{color:#222}
  .msg{margin-top:20px;background:#f9f9f9;border-left:3px solid #c9a96e;padding:14px 18px;border-radius:0 6px 6px 0;font-size:14px;color:#444;line-height:1.65;white-space:pre-wrap}
  .footer{background:#f4f4f4;padding:16px 32px;text-align:center;font-size:11px;color:#aaa;border-top:1px solid #eee}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>DEZIL DERMO</h1>
    <p>Nouvelle demande de rendez-vous</p>
  </div>
  <div class="body">
    <table>
      <tr><td>Nom</td><td>{$nom}</td></tr>
      <tr><td>Téléphone</td><td>{$telephone}</td></tr>
      <tr><td>Email</td><td><a href="mailto:{$email}" style="color:#c9a96e">{$email}</a></td></tr>
      <tr><td>Prestation</td><td>{$prestation}</td></tr>
      <tr><td>Date</td><td>{$dateFormatted} à {$heure}</td></tr>
      <tr><td>Photos</td><td>{$photoNote}</td></tr>
    </table>
    <div class="msg">{$message}</div>
  </div>
  <div class="footer">Dezil Dermo • Saint-Sulpice-la-Pointe 81370 • dezildermo.fr</div>
</div>
</body>
</html>
HTML;

$textBody = "DEZIL DERMO — Nouvelle demande de RDV\n"
          . str_repeat('-', 40) . "\n"
          . "Nom        : $nom\n"
          . "Téléphone  : $telephone\n"
          . "Email      : $email\n"
          . "Prestation : $prestation\n"
          . "Date       : $dateFormatted à $heure\n"
          . "Photos     : " . (count($attachments) ? count($attachments) . " jointe(s)" : "aucune") . "\n"
          . str_repeat('-', 40) . "\n"
          . "$message\n";

/* ── Nettoyage des temporaires ── */
function cleanup(array $attachments): void {
    foreach ($attachments as $att) { @unlink($att['path']); }
}

/* ── 9a. Envoi via PHPMailer (SMTP) ── */
if ($usePHPMailer) {
    use PHPMailer\PHPMailer\PHPMailer;
    use PHPMailer\PHPMailer\SMTP;
    use PHPMailer\PHPMailer\Exception;

    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $cfg['smtp_host'];
        $mail->SMTPAuth   = true;
        $mail->Username   = $cfg['smtp_user'];
        $mail->Password   = $cfg['smtp_pass'];
        $mail->SMTPSecure = $cfg['smtp_secure'] === 'ssl'
                                ? PHPMailer::ENCRYPTION_SMTPS
                                : PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = (int) $cfg['smtp_port'];
        $mail->CharSet    = PHPMailer::CHARSET_UTF8;
        $mail->Encoding   = PHPMailer::ENCODING_BASE64;

        /* Expéditeur = domaine SMTP → évite le rejet SPF/DKIM */
        $mail->setFrom($cfg['from_email'], $cfg['from_name']);

        /* Reply-To = email du client → un clic "Répondre" ouvre son adresse */
        $mail->addReplyTo($email, $nom);

        $mail->addAddress($cfg['to_email'], $cfg['to_name']);

        /* Message-ID unique (aide la délivrabilité) */
        $mail->MessageID = '<' . bin2hex(random_bytes(12)) . '@dezildermo.fr>';

        /* Corps HTML + texte brut */
        $mail->isHTML(true);
        $mail->Subject = "🗓 RDV Dezil Dermo — $nom — $dateFormatted";
        $mail->Body    = $htmlBody;
        $mail->AltBody = $textBody;

        /* Pièces jointes */
        foreach ($attachments as $att) {
            $mail->addAttachment($att['path'], $att['name']);
        }

        $mail->send();
        cleanup($attachments);
        respond(true, 'Votre demande a bien été envoyée ! Olivier vous contactera sous 24h.');

    } catch (Exception $e) {
        cleanup($attachments);
        error_log('[DezilDermo] PHPMailer: ' . $mail->ErrorInfo);
        respond(false, 'Erreur lors de l\'envoi. Appelez-nous au +33 6 01 00 00 00.', 500);
    }
}

/* ── 9b. Fallback : mail() natif PHP ── */
$boundary  = md5(uniqid((string) mt_rand(), true));
$headers   = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: multipart/alternative; boundary="' . $boundary . '"',
    'From: ' . $cfg['from_name'] . ' <' . $cfg['from_email'] . '>',
    'Reply-To: ' . $nom . ' <' . $email . '>',
    'Message-ID: <' . bin2hex(random_bytes(12)) . '@dezildermo.fr>',
    'X-Mailer: PHP/' . phpversion(),
]);
$body  = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
$body .= base64_encode($textBody) . "\r\n";
$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
$body .= base64_encode($htmlBody) . "\r\n";
$body .= "--$boundary--";

$sent = mail($cfg['to_email'], "=?UTF-8?B?" . base64_encode("🗓 RDV Dezil Dermo — $nom — $dateFormatted") . "?=", $body, $headers);
cleanup($attachments);

if ($sent) {
    respond(true, 'Votre demande a bien été envoyée ! Olivier vous contactera sous 24h.');
} else {
    respond(false, 'Erreur d\'envoi. Appelez-nous au +33 6 01 00 00 00.', 500);
}

<?php
/**
 * ============================================================
 * DEZIL DERMO — Configuration email & sécurité
 * ============================================================
 * ⚠️  Ce fichier est protégé par .htaccess
 *     Ne jamais le committer avec de vrais mots de passe
 * ============================================================
 */
return [

    /* ── Destinataire ── */
    'to_email' => 'votre-email@dezildermo.fr',   // ← Votre email pro
    'to_name'  => 'Dezil Dermo — Olivier',

    /* ── Expéditeur
     *  DOIT correspondre exactement au domaine du compte SMTP
     *  Ex : si SMTP = smtp.dezildermo.fr → from = xxx@dezildermo.fr
     *  Un from d'un domaine différent fait souvent atterrir en spam.        */
    'from_email' => 'noreply@dezildermo.fr',
    'from_name'  => 'Dezil Dermo',

    /* ── SMTP ──
     *  Paramètres fournis par votre hébergeur (cPanel, OVH, Infomaniak…)   */
    'smtp_host'   => 'ssl0.ovh.net',          // ← hôte SMTP hébergeur
    'smtp_port'   => 587,                     // 587 = STARTTLS | 465 = SSL
    'smtp_secure' => 'tls',                   // 'tls' ou 'ssl'
    'smtp_user'   => 'noreply@dezildermo.fr', // ← identifiant SMTP
    'smtp_pass'   => 'VOTRE_MOT_DE_PASSE',   // ← mot de passe SMTP

    /* ── Upload photos ── */
    'max_files'     => 5,
    'max_size_mb'   => 8,
    'allowed_types' => ['image/jpeg', 'image/png', 'image/webp'],
    'upload_dir'    => __DIR__ . '/uploads_tmp/',

    /* ── Anti-spam : honeypot
     *  Champ caché dans le form ; les bots le remplissent, les humains non. */
    'honeypot_field' => 'website',

    /* ── Anti-spam : délai minimal de soumission (secondes)
     *  Un bot soumet le formulaire en < 3 s ; un humain prend plus de temps. */
    'min_submit_seconds' => 4,

    /* ── Anti-spam : rate-limiting par IP
     *  Nombre max de soumissions par plage de temps.                        */
    'rate_limit_max'      => 3,    // 3 envois max …
    'rate_limit_window'   => 3600, // … par heure

    /* ── CORS : autorise uniquement votre domaine en production
     *  Mettre '*' uniquement pour les tests en local.                       */
    'allowed_origin' => 'https://dezildermo.fr', // ou '*' pour les tests

];

<?php
/**
 * Génère un token de session anti-bot (timing check)
 * Appelé au chargement de la page via fetch()
 * Le token est stocké côté serveur avec le timestamp actuel
 */
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

$token    = bin2hex(random_bytes(16));
$tmpFile  = sys_get_temp_dir() . '/dz_token_' . md5($token) . '.txt';
file_put_contents($tmpFile, (string) time(), LOCK_EX);

// Nettoyer les vieux tokens (> 2h) en tâche de fond
$dir = sys_get_temp_dir();
foreach (glob($dir . '/dz_token_*.txt') ?: [] as $f) {
    if (filemtime($f) < time() - 7200) @unlink($f);
}

echo json_encode(['token' => $token]);

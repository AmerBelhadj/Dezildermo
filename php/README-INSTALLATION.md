# Installation & Configuration — Dezil Dermo Backend

## 📁 Structure livrée

```
php/
  send.php          ← Backend principal (form + upload + mail)
  config.php        ← Configuration SMTP et sécurité
  token.php         ← Générateur token anti-bot
  .htaccess         ← Protection config.php et uploads_tmp/
  uploads_tmp/      ← Fichiers temporaires (auto-nettoyés)
  README-INSTALLATION.md
```

---

## 🔧 Étape 1 — Installer PHPMailer

**Option A : Composer (recommandé)**
```bash
# Depuis la racine du projet (là où est index.html)
composer require phpmailer/phpmailer
```

**Option B : Sans Composer**
1. Télécharger : https://github.com/PHPMailer/PHPMailer/releases
2. Extraire `src/PHPMailer.php`, `src/SMTP.php`, `src/Exception.php`
3. Les copier dans `php/lib/PHPMailer/src/`

---

## ⚙️ Étape 2 — Remplir config.php

```php
'to_email'    => 'olivier@dezildermo.fr',  // votre email
'from_email'  => 'noreply@dezildermo.fr',  // MÊME domaine que SMTP !
'smtp_host'   => 'ssl0.ovh.net',           // hôte SMTP hébergeur
'smtp_port'   => 587,
'smtp_secure' => 'tls',
'smtp_user'   => 'noreply@dezildermo.fr',
'smtp_pass'   => 'MOT_DE_PASSE',
'allowed_origin' => 'https://dezildermo.fr', // votre domaine réel
```

### Paramètres SMTP courants

| Hébergeur    | smtp_host              | Port | Sécurité |
|-------------|------------------------|------|---------|
| OVH         | ssl0.ovh.net           | 587  | tls     |
| Infomaniak  | mail.infomaniak.com    | 587  | tls     |
| O2Switch    | mail.votredomaine.fr   | 587  | tls     |
| Ionos/1&1   | smtp.ionos.fr          | 587  | tls     |

---

## 📧 Étape 3 — Configurer SPF, DKIM, DMARC (anti-spam)

Ces 3 enregistrements DNS évitent que les emails atterrissent en spam.
À configurer dans le panneau DNS de votre hébergeur.

### SPF — autorise votre serveur à envoyer
```
Type : TXT
Nom  : dezildermo.fr
Valeur : v=spf1 include:mx.ovh.com ~all
```
_(Remplacez `mx.ovh.com` par la valeur indiquée par votre hébergeur)_

### DKIM — signature cryptographique
Activez DKIM dans cPanel/Plesk → votre hébergeur génère la clé automatiquement.

### DMARC — politique anti-usurpation
```
Type : TXT
Nom  : _dmarc.dezildermo.fr
Valeur : v=DMARC1; p=quarantine; rua=mailto:admin@dezildermo.fr
```

---

## 🛡️ Sécurité intégrée dans send.php

| Protection          | Mécanisme                                     |
|--------------------|-----------------------------------------------|
| Injection de headers | `preg_replace('/[\r\n]/', ...)` sur tous les champs |
| XSS                 | `filter_var SANITIZE_SPECIAL_CHARS` + `strip_tags` |
| Spam via formulaire | Honeypot invisible + timing check (min 4s)    |
| Flood               | Rate-limiting : 3 envois max / heure / IP     |
| Fichiers malveillants | Vérification MIME réelle via `finfo`          |
| Accès direct        | `.htaccess` bloque config.php et uploads_tmp/ |

---

## ✅ Test

1. Soumettre le formulaire sur le site
2. Vérifier la réception de l'email avec les photos jointes
3. Vérifier dans les logs PHP si erreur : `tail -f /var/log/php/error.log`

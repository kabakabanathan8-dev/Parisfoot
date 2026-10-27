# GLOBAL BET — prototype football

GLOBAL BET est un prototype original de plateforme football, en français, conçu pour être modifié depuis Android et hébergé gratuitement au départ sur GitHub + Vercel.

## Ce que contient cette version

- Interface responsive mobile / ordinateur
- Liste de matchs et cotes **fictifs**
- Marchés 1 / N / 2
- Ticket combiné et calcul du gain potentiel **virtuel**
- Inscription / connexion via Supabase (après configuration)
- Enregistrement et historique des tickets de démonstration
- Schéma SQL avec Row Level Security (RLS)
- Aucun dépôt, paiement, retrait ou pari en argent réel

## 1. Publier sur GitHub depuis Android

1. Téléchargez et décompressez `global-bet.zip`.
2. Ouvrez GitHub dans votre navigateur Android et créez un dépôt nommé `global-bet`.
3. Dans le dépôt, choisissez **Add file > Upload files**.
4. Importez les fichiers et dossiers du projet : `index.html`, `styles.css`, `app.js`, `config.js`, `README.md` et le dossier `supabase`.
5. Appuyez sur **Commit changes**.

Si GitHub mobile ne permet pas de téléverser facilement un dossier, ouvrez GitHub dans Chrome avec **Site pour ordinateur**, ou téléversez les fichiers individuellement en conservant le dossier `supabase`.

## 2. Déployer sur Vercel

1. Ouvrez https://vercel.com/ et connectez-vous avec GitHub.
2. Choisissez **Add New > Project** puis importez `global-bet`.
3. Framework Preset : **Other**.
4. Build command : laissez vide. Output directory : `.` si Vercel le demande.
5. Cliquez sur **Deploy**.

Le site statique devrait être publié avec une adresse `*.vercel.app`.

## 3. Activer les comptes et l'historique avec Supabase

1. Créez un projet sur https://supabase.com/.
2. Ouvrez **SQL Editor > New query**.
3. Copiez tout le contenu de `supabase/schema.sql`, collez-le et cliquez sur **Run**.
4. Ouvrez **Project Settings > API** (ou la section API Keys selon la nouvelle interface) et copiez l'URL du projet ainsi que la clé publique `anon` / `publishable`.
5. Ouvrez `config.js` dans GitHub et remplacez les deux valeurs vides :

```js
window.GLOBAL_BET_CONFIG = {
  SUPABASE_URL: "https://VOTRE-PROJET.supabase.co",
  SUPABASE_ANON_KEY: "VOTRE_CLE_PUBLIQUE"
};
```

6. Enregistrez le fichier. Vercel redéploiera le site.
7. Testez l'inscription, la connexion, puis l'enregistrement d'un ticket fictif.

N'insérez jamais une clé `service_role` dans `config.js`, GitHub ou du code navigateur. La clé publique est prévue pour être utilisée avec des politiques RLS correctement configurées.

## 4. Limitations actuelles

- Les matchs, équipes et cotes sont des exemples de démonstration.
- Le rôle `admin` est prévu dans la base, mais cette version ne comprend pas encore un panneau d'administration sécurisé. Il doit être ajouté avec des contrôles côté serveur, des autorisations strictes et des politiques RLS spécifiques.
- La connexion nécessite la configuration de Supabase. Selon les paramètres du projet, une confirmation par e-mail peut être requise.
- Le système ne vérifie pas de véritables résultats sportifs.
- Les valeurs en FC sont virtuelles et ne représentent pas de l'argent réel.

## 5. Avant toute exploitation commerciale réelle

Avant d'activer des mises, dépôts ou retraits réels, il faudra notamment vérifier les autorisations applicables en RDC, la conformité, la vérification d'âge et d'identité, la lutte contre la fraude et le blanchiment, la protection des données, la sécurité du portefeuille et l'intégration contractuelle d'un fournisseur de données sportives et d'un prestataire de paiement agréés. Le prototype ne doit pas être présenté comme un bookmaker opérationnel.

## Structure

```text
global-bet/
├── index.html
├── styles.css
├── app.js
├── config.js
├── README.md
└── supabase/
    └── schema.sql
```

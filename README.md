# SpendingPlanner

Application web de gestion de depenses personnelles avec synchronisation en temps reel, multi-utilisateurs et deploiement sur Vercel.

## Stack technique

- **Frontend** : React 19, TypeScript, Vite, Tailwind CSS 4
- **Backend** : Express.js (dev), Vercel Serverless Functions (prod)
- **Base de donnees** : NeonDB (PostgreSQL)
- **Authentification** : JWT (tokens d'acces + tokens SSE)
- **Graphiques** : Recharts
- **Icons** : Lucide React
- **Securite** : Helmet, rate limiting, bcrypt

## Fonctionnalites

### Tableau de bord
- Solde du mois (revenus, depenses, difference)
- Comparaison avec le mois precedent (pourcentages de variation)
- Graphique d'activite quotidienne (barres revenus/depenses par jour)
- Repartition des depenses par categorie (barres horizontales)
- Liste des transactions recentes
- Navigation rapide vers les details

### Transactions
- Ajout rapide via le bouton central `+`
- Types : depense et revenu
- Selection de categorie avec icones
- Ajout de notes
- Edition et suppression
- Filtrage par mois

### Timeline
- 3 niveaux de zoom : Mois, Semaine, Jour
- **Mois** : barres empilees par categorie avec navigation semaine
- **Semaine** : liste jour par jour avec totaux
- **Jour** : timeline horaire (0h-23h) avec transactions placees

### Budgets
- Definition de limites mensuelles par categorie
- Visualisation en temps reel : depense / limite
- Barre de progression coloree (vert → orange → rouge)
- Edition et suppression des budgets

### Categories
- Categories par defaut pre-configurees (depenses et revenus)
- Ajout de categories personalisees
- Selection d'icones (24 icones disponibles)
- Types : depense, revenu, ou les deux
- Suppression des categories personnalisees

### Parametres
- **Devise** : DT, EUR, USD, TND, MAD, DZD, GBP, CAD
- **PWA** : installation sur l'ecran d'accueil
- **Sauvegarde** : export JSON complet (transactions, categories, budgets, reglages)
- **Restauration** : import depuis un fichier de sauvegarde
- **Reinitialisation** : suppression de toutes les donnees
- **Categories** : gestion integree directement dans les parametres
- **Administration** : (admin uniquement) gestion des utilisateurs

### Multi-utilisateurs
- Inscription avec nom, email et mot de passe
- Connexion par email/mot de passe
- Activation de compte par un administrateur
- Roles : utilisateur et administrateur
- Synchronisation en temps reel via SSE (Server-Sent Events)

### Securite
- Hashage des mots de passe avec bcrypt (12 rounds)
- Migration automatique SHA-256 → bcrypt
- Tokens JWT avec expiration (7 jours)
- Tokens SSE separes (5 minutes, audience: 'sse')
- Revocation des tokens via `tokenVersion`
- Rate limiting (10 tentatives/15min pour auth, 200 requetes/15min pour API)
- Headers Helmet (CSP, HSTS, etc.)
- Validation et sanitisation des entrees
- Messages d'erreur generiques (pas de fuite d'infos)
- Body limit 100kb

### Mode hors ligne
- Service Worker pour le cache des assets
- Indicateur de statut en ligne/hors ligne
- Pull-to-refresh pour synchroniser

### Mobile
- Navigation flottante en forme de pilule (bottom dock)
- Bouton `+` central pour ajout rapide
- Pull-to-refresh natif
- Interface responsive adaptee mobile/tablette/desktop

## Installation

### Pre-requis
- Node.js 18+
- NeonDB (ou autre PostgreSQL)

### Variables d'environnement

Creer un fichier `.env` a la racine :

```env
# Base de donnees
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Authentification
JWT_SECRET=your_secret_key_here_64_chars_min

# CORS
ALLOWED_ORIGIN=http://localhost:3000,http://localhost:3001

# Admin (emails separes par des virgules)
ADMIN_EMAILS=admin@example.com

# Frontend (optionnel, pour le dev)
VITE_API_URL=http://localhost:3001
```

### Demarrage local

```bash
# Installer les dependances
npm install

# Lancer le dev (frontend + backend)
npm run dev

# Ou separement :
npm run dev:client   # Frontend sur port 3000
npm run dev:server   # Backend sur port 3001
```

### Scripts disponibles

```bash
npm run dev          # Frontend + Backend en parallele
npm run dev:client   # Frontend seul (Vite, port 3000)
npm run dev:server   # Backend seul (Express, port 3001)
npm run build        # Build de production
npm run preview      # Preview du build
npm run lint         # Verification TypeScript
npm run clean        # Supprimer dist/ et server.js
```

## Deploiement Vercel

Le projet est configure pour le deploiement sur Vercel avec une fonction serverless auto-contained.

### Structure

```
/
├── api/
│   └── index.ts          # Fonction serverless Vercel
├── public/
│   ├── sw.js             # Service Worker
│   └── manifest.json     # Manifest PWA
├── server/
│   ├── app.ts            # Express (dev)
│   ├── index.ts          # Point d'entree dev
│   └── db.ts             # Connection NeonDB
├── src/
│   ├── components/       # Composants React
│   ├── contexts/         # AuthContext
│   ├── db/               # API client
│   ├── types.ts          # Types TypeScript
│   └── utils/            # Utilitaires
├── vercel.json           # Config Vercel
└── package.json
```

### Deploiement

```bash
# Installer Vercel CLI
npm i -g vercel

# Deployer
vercel

# Deployer en production
vercel --prod
```

Ou connecter le repo GitHub sur vercel.com pour les deploiements automatiques.

## Utilisation

### 1. Creer un compte

1. Aller sur l'application
2. Cliquer sur "S'inscrire"
3. Remplir le formulaire (nom, email, mot de passe)
4. Valider → le compte est en attente d'activation

### 2. Activation par l'admin

1. L'admin se connecte
2. Va dans **Parametres → Administration**
3. Trouve le compte en attente
4. Cliquer sur **Activer**

### 3. Ajouter une transaction

1. Cliquer sur le bouton `+` au centre de la navigation
2. Choisir le type (depense/revenu)
3. Entrer le montant
4. Selectionner la categorie
5. Choisir la date
6. Ajouter une note (optionnel)
7. Valider

### 4. Gerer les categories

1. Aller dans **Parametres → Categories**
2. Cliquer sur **Ajouter**
3. Entrer le nom, choisir le type et l'icone
4. Valider

### 5. Definir des budgets

1. Aller dans **Budgets**
2. Cliquer sur l'icone de crayon a cote d'une categorie
3. Entrer la limite mensuelle
4. Valider

### 6. Consulter la timeline

1. Aller dans **Timeline**
2. Utiliser les boutons Mois/Semaine/Jour pour changer le zoom
3. Naviguer avec les fleches ← →
4. Cliquer sur une transaction pour la modifier

### 7. Sauvegarder / Restaurer

1. Aller dans **Parametres**
2. **Exporter** : telecharge un fichier JSON avec toutes les donnees
3. **Importer** : selectionne un fichier JSON pour restaurer

### 8. Administration (admin)

1. Se connecter avec un compte admin
2. Aller dans **Parametres → Administration**
3. **Activer** un compte en attente
4. **Promouvoir** un utilisateur en admin
5. **Retirer** les droits admin
6. **Desactiver** un compte

## Navigation

### Mobile (bottom dock)
- **Accueil** : tableau de bord
- **Transactions** : liste des transactions
- **Timeline** : vue chronologique
- **+** : ajout rapide de transaction
- **Budgets** : gestion des budgets
- **Reglages** : parametres, categories, administration

### Desktop (sidebar)
- Meme structure que mobile, avec le bouton `+` en haut
- Sidebar fixe a gauche

## Types de donnees

```typescript
type TransactionType = 'expense' | 'income';

interface Category {
  id: string;
  name: string;
  icon: string;
  type: 'expense' | 'income' | 'both';
  isDefault?: boolean;
}

interface Transaction {
  id?: number;
  type: TransactionType;
  amount: number;
  categoryId: string;
  date: string;        // 'YYYY-MM-DD'
  note?: string;
  createdAt: number;   // timestamp
}

interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
}

type CurrencyCode = 'DT' | 'EUR' | 'USD' | 'TND' | 'GBP' | 'CAD' | 'MAD' | 'DZD';
```

## API Endpoints

### Authentification
- `POST /api/auth/register` — Inscription
- `POST /api/auth/login` — Connexion
- `GET /api/auth/me` — Profil utilisateur

### Transactions
- `GET /api/transactions` — Lister
- `POST /api/transactions` — Creer
- `PUT /api/transactions/:id` — Modifier
- `DELETE /api/transactions/:id` — Supprimer

### Categories
- `GET /api/categories` — Lister
- `POST /api/categories` — Creer
- `DELETE /api/categories/:id` — Supprimer

### Budgets
- `GET /api/budgets` — Lister
- `POST /api/budgets` — Creer/Modifier
- `DELETE /api/budgets/:id` — Supprimer

### Parametres
- `GET /api/settings` — Lister
- `POST /api/settings` — Sauvegarder

### Evenements temps reel
- `GET /api/events` — Stream SSE (Server-Sent Events)

### Admin
- `GET /api/admin/users` — Lister les utilisateurs
- `PUT /api/admin/users/:uuid/active` — Activer/Desactiver
- `PUT /api/admin/users/:uuid/role` — Changer le role

## Licence

Projet prive.

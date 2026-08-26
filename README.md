# 🚗 Plateforme de gestion — Auto-École

Plateforme interne complète pour la gestion d'une auto-école : clients, séances, paiements, planning, formules, et envoi automatique des informations aux clients via WhatsApp.

**Principe : un seul utilisateur se connecte — l'administrateur.** Les clients n'ont pas de compte et reçoivent leurs informations uniquement via WhatsApp.

## Stack technique

- **Frontend** : Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **Backend** : Server Actions Next.js (API interne sécurisée)
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth v5 (Credentials — email/mot de passe, admin uniquement)
- **Déploiement cible** : Vercel + Supabase/Neon (PostgreSQL managé)

## Fonctionnalités

- Dashboard avec statistiques (clients, séances du jour, revenus, séances restantes...)
- Gestion complète des clients (CRUD, recherche, filtres, fiche détaillée)
- Gestion des séances (calendrier + liste, statuts : prévue/effectuée/annulée/absence)
- Planning mensuel visuel
- Gestion des paiements avec calcul automatique du montant restant et statut (payé / partiel / non payé)
- Gestion des formules/prix, véhicules et moniteurs
- **Bouton "Envoyer sur WhatsApp"** : génère un message pré-rempli avec uniquement les informations utiles au client (jamais les notes internes) et ouvre `wa.me` avec le numéro du client
- **Génération de fiche PDF** : page imprimable (bouton "Télécharger / Imprimer en PDF" → impression navigateur en PDF)
- Design responsive (desktop / tablette / mobile), thème bleu/blanc/gris

---

## ⚠️ Note importante sur cet environnement de génération

Ce projet a été développé et son code entièrement écrit et **vérifié par compilation TypeScript et build Next.js** dans un environnement sandboxé dont l'accès réseau est limité à une liste blanche de domaines (npm, GitHub, apt...). Cette liste blanche **n'inclut pas `binaries.prisma.sh`**, le serveur depuis lequel Prisma télécharge son moteur de requête natif.

Conséquence concrète :
- ✅ Tout le code (composants, pages, server actions, schéma Prisma, validation, auth) a été écrit et son typage TypeScript **validé avec succès** (`next build` passe la compilation et la vérification de types).
- ⚠️ Je n'ai **pas pu exécuter** `prisma generate`, `prisma migrate dev`, ni un build de bout en bout avec une vraie base de données dans cette sandbox, car le téléchargement du moteur Prisma a été bloqué par le pare-feu réseau (erreur 403 sur `binaries.prisma.sh`).

**Sur votre machine ou sur Vercel, ce problème n'existe pas** : `npm install` déclenchera normalement `prisma generate` (configuré dans `postinstall`) et tout fonctionnera. Suivez simplement les étapes ci-dessous.

---

## 1. Installation locale

```bash
cd auto-ecole
npm install
```

L'installation déclenche automatiquement `prisma generate`.

## 2. Configurer la base de données

Créez un fichier `.env` à la racine (un `.env.example` est fourni) :

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
NEXTAUTH_SECRET="générer avec: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### Option A — Supabase (recommandé)

1. Créez un projet sur [supabase.com](https://supabase.com)
2. Allez dans **Project Settings → Database**
3. Copiez :
   - **Connection pooling** (mode transaction, port 6543) → `DATABASE_URL`
   - **Connection string direct** (port 5432) → `DIRECT_URL`

### Option B — Neon

1. Créez un projet sur [neon.tech](https://neon.tech)
2. Copiez la chaîne de connexion fournie → utilisez-la pour `DATABASE_URL` et `DIRECT_URL` (Neon gère le pooling automatiquement via `-pooler` dans l'hôte pour `DATABASE_URL`)

## 3. Créer les tables et les données de démonstration

```bash
npx prisma migrate dev --name init
npm run db:seed
```

Cela crée toutes les tables (Admin, Client, Session, Payment, Package, Vehicle, Instructor, Settings) et des données de test :
- 5 clients, 10 séances, plusieurs paiements, 4 formules, véhicules et moniteurs
- **Un compte admin de démonstration** :
  - Email : `admin@auto-ecole.tn`
  - Mot de passe : `Admin123!`

  ⚠️ Changez ce mot de passe (ou supprimez ce compte et créez-en un nouveau directement en base) avant toute mise en production réelle.

## 4. Lancer en local

```bash
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) → vous serez redirigé vers `/login`.

## 5. Vérifier le build de production

```bash
npm run build
npm start
```

---

## 6. Déploiement sur Vercel

1. Poussez le projet sur GitHub/GitLab/Bitbucket.
2. Sur [vercel.com](https://vercel.com), importez le repository.
3. Dans **Settings → Environment Variables**, ajoutez :
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXTAUTH_SECRET`
   - `NEXTAUTH_URL` → l'URL de production, ex. `https://votre-projet.vercel.app`
4. Déployez. Vercel exécute automatiquement `npm install` (donc `prisma generate` via `postinstall`) puis `npm run build`.
5. Après le premier déploiement, exécutez la migration et le seed **une seule fois** contre la base de production, depuis votre machine locale avec les variables d'environnement de production :

   ```bash
   DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
   DATABASE_URL="..." DIRECT_URL="..." npm run db:seed   # optionnel, données de démo
   ```

---

## 7. Créer votre propre compte admin (production)

Ne gardez pas le compte de démonstration en production.

Créez `scripts/create-admin.ts` :
```ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const email = "votre-email@exemple.com";
const password = "VotreMotDePasse!";

async function run() {
  await prisma.admin.create({
    data: { email, name: "Admin", passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log("Admin créé");
}

run().finally(() => prisma.$disconnect());
```
Exécutez avec `npx tsx scripts/create-admin.ts`, puis supprimez le compte de démonstration.

---

## Structure du projet

```
/app
  /login                    → page de connexion (seule route publique)
  /(dashboard)               → routes protégées par middleware (session admin requise)
    /dashboard
    /clients
    /clients/[id]
    /seances
    /paiements
    /planning
    /parametres
  /clients/[id]/fiche        → fiche imprimable (PDF) — hors layout dashboard
  /api/auth/[...nextauth]    → route NextAuth

/components                  → composants réutilisables (tables, modales, formulaires...)
/actions                      → Server Actions (CRUD sécurisé, vérifie la session admin)
/lib                          → prisma client, auth config, validation zod, utilitaires, whatsapp
/prisma
  schema.prisma               → schéma complet (8 modèles + relations)
  seed.ts                      → données de démonstration
```

## Sécurité

- Toutes les routes du dashboard sont protégées par `middleware.ts` (redirection vers `/login` si non authentifié).
- Chaque Server Action vérifie la session admin côté serveur avant toute opération.
- Mots de passe hachés avec bcrypt (jamais stockés en clair).
- Toutes les entrées sont validées avec Zod avant d'atteindre la base de données.
- Les variables sensibles (base de données, secret NextAuth) sont dans `.env`, jamais exposées côté client.
- Le message WhatsApp envoyé au client ne contient jamais les notes internes ni les informations d'autres clients.

## Notes de personnalisation

- **Modifier les couleurs** : `app/globals.css` (variables `--brand`, `--accent`).
- **Renommer l'auto-école / logo / coordonnées** : page **Paramètres → Informations générales** dans le dashboard (aucune modification de code nécessaire).
- **Modifier les formules et prix** : page **Paramètres → Formules & prix**.
- **Format du numéro WhatsApp** : `lib/whatsapp.ts` → fonction `normalizePhoneForWhatsapp` (indicatif Tunisie `216` par défaut, ajustable).

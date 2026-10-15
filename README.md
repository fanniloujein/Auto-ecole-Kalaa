# 🚗 Plateforme de gestion — Auto-École

Plateforme interne complète pour la gestion d'une auto-école : clients, inscriptions, séances, examens, paiements, dépenses, planning, et envoi des informations aux clients via WhatsApp.

**Principe : un seul utilisateur se connecte — l'administrateur.** Les clients n'ont pas de compte et reçoivent leurs informations uniquement via WhatsApp.

## Stack technique

- **Frontend** : Next.js 16 (App Router), TypeScript, Tailwind CSS 4
- **Backend** : Server Actions Next.js (API interne sécurisée)
- **Base de données** : PostgreSQL + Prisma ORM
- **Authentification** : NextAuth v5 (Credentials — email/mot de passe, admin uniquement)
- **Déploiement cible** : Vercel + Supabase/Neon (PostgreSQL managé)

## Fonctionnalités

- **Tableau de bord** : clients actifs, séances du jour, examens à venir, taux de réussite, et finances du mois (encaissements, dépenses, résultat net, reste à percevoir)
- **Clients** : CRUD, recherche, filtres (permis, statut, situation financière), fiche détaillée
- **Tarification à l'heure + frais d'inscription** (configurable dans **Paramètres → Tarifs**) :

  | Prestation | Tarif par défaut |
  | --- | --- |
  | 1 heure de conduite (et de park) | 28 TND |
  | 1 heure de code | 10 TND |
  | Inscription code | 100 TND |
  | Inscription conduite | 200 TND |
  | Inscription park | 200 TND |
  | Repassage examen du code (après échec ou absence) | 50 TND |
  | Repassage examen du park | 100 TND |
  | Repassage examen de conduite | 100 TND |

  Seules les séances **effectuées** sont facturées, au prorata de leur durée (1 h 30 de conduite = 42 TND). Le tarif est figé sur chaque séance et chaque inscription : un changement de tarif ne modifie pas l'historique.
- **Examens** (code, park, conduite) : résultats *Programmé / Réussi / Échoué / Absent*, **nombre de passages illimité** (en cas d'échec, on programme un nouveau passage), **frais de repassage ajoutés automatiquement** dès qu'un examen est marqué « Échoué » ou « Absent » (compte « Repassage d'examen »), saisie du résultat en un clic (boutons *Réussi* / *Échoué*), taux de réussite par examen
- **Paiements séparés par compte** : inscription, code, conduite, park, repassage d'examen — pour une inscription ou un repassage, une seconde liste permet de préciser *code / conduite / park*. Pour chaque client et chaque compte : montant dû, payé et reste (ou avance)
- **Dépenses / sorties d'argent** : carburant, entretien, assurance, salaires, loyer, factures, frais d'examen, taxes, fournitures... avec filtres par mois et répartition par catégorie
- Séances (calendrier + liste, statuts : prévue / effectuée / annulée / absence) et planning mensuel
- Véhicules et moniteurs
- **Bouton « Envoyer le point sur WhatsApp »** : message pré-rempli avec uniquement les informations utiles au client (examens, heures, situation de chaque compte — jamais les notes internes)
- **Fiche client PDF** : page imprimable avec relevé de compte, parcours d'examens et historique des paiements (bouton « Télécharger / Imprimer en PDF »), aussi accessible par un lien public non devinable
- Design responsive (desktop / tablette / mobile), thème bleu/blanc/gris

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
npx prisma migrate deploy
npm run db:seed
```

Cela crée toutes les tables (Admin, Client, Session, Exam, Payment, Expense, Vehicle, Instructor, Settings) et des données de test (uniquement si la base ne contient encore aucun client) :
- 4 clients, des séances, des examens (dont un échec suivi d'un nouveau passage), des paiements par compte, des dépenses, véhicules et moniteurs
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

## 6 bis. Déploiement sur Netlify

Le fichier `netlify.toml` est déjà prêt : à chaque déploiement, Netlify applique les migrations (`prisma migrate deploy`) puis compile l'application.

1. Sur [app.netlify.com](https://app.netlify.com) : **Add new site → Import an existing project → GitHub**, choisissez ce dépôt et la branche `main`.
2. Dans **Site configuration → Environment variables**, ajoutez :
   - `DATABASE_URL` : URL de connexion PostgreSQL (Supabase : URL du *pooler*, port 6543, avec `?pgbouncer=true`)
   - `DIRECT_URL` : URL de connexion directe (Supabase : port 5432) — utilisée pour les migrations
   - `NEXTAUTH_SECRET` : une longue chaîne aléatoire (`openssl rand -base64 32`)
3. Lancez le déploiement (**Deploys → Trigger deploy**). Les mises à jour suivantes se déploient automatiquement à chaque modification de la branche `main`.

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
    /examens
    /paiements
    /depenses
    /planning
    /parametres
  /clients/[id]/fiche        → fiche imprimable (PDF) — hors layout dashboard
  /fiche/[token]             → fiche publique (lien envoyé au client)
  /api/auth/[...nextauth]    → route NextAuth

/components                  → composants réutilisables (tables, modales, formulaires...)
/actions                      → Server Actions (CRUD sécurisé, vérifie la session admin)
/lib                          → prisma client, auth config, validation zod, utilitaires, whatsapp
  billing.ts                  → calcul des comptes client (tarifs, heures, soldes par compte, examens)
  labels.ts                   → libellés partagés (types de séance, examens, comptes, dépenses)
/prisma
  schema.prisma               → schéma complet (9 modèles + relations)
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
- **Modifier les tarifs** (heure de conduite, heure de code, frais d'inscription) : page **Paramètres → Tarifs**.
- **Format du numéro WhatsApp** : `lib/whatsapp.ts` → fonction `normalizePhoneForWhatsapp` (indicatif Tunisie `216` par défaut, ajustable).

## Mise à jour d'une base existante

La migration `20261010120000_tarifs_examens_depenses` remplace les anciennes « formules » par la tarification à l'heure. Sur une base déjà en service :

```bash
DATABASE_URL="..." DIRECT_URL="..." npx prisma migrate deploy
```

Ce qu'elle fait sur les données existantes :
- supprime la table des formules et les champs manuels du client (total séances, prix total, montant payé) : le montant dû et le montant payé sont désormais **calculés** à partir des séances, inscriptions, examens et paiements ;
- applique les tarifs par défaut aux séances existantes (28 TND/h conduite, 10 TND/h code) et transforme les séances « examen blanc » en séances de code ;
- affecte les paiements existants au compte « Conduite » (modifiable en supprimant / ressaisissant le paiement) ;
- les inscriptions des clients existants sont à cocher dans leur fiche (bouton **Modifier**).

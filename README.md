# 📄 Nuxt PDF Merger

Une application web simple, rapide et serverless pour fusionner des fichiers PDF en mémoire, construite avec **Nuxt 3**, **NuxtHub**, **Tailwind CSS** et **pdf-lib**, prête à être déployée sur **Cloudflare Workers**.

---

## 🚀 Stack Technique

- **Framework :** [Nuxt 3](https://nuxt.com/)
- **Déploiement & Cloud :** [NuxtHub](https://hub.nuxt.com/) (sur l'infrastructure Cloudflare Workers)
- **Traitement PDF :** [pdf-lib](https://pdf-lib.js.org/) (manipulation 100% Edge-compatible)
- **Styles :** [Tailwind CSS](https://tailwindcss.com/)
- **Linter & Formatage :** [@nuxt/eslint](https://eslint.nuxt.com/)

---

## ✨ Fonctionnalités

- 📁 **Sélection multiple :** Importez plusieurs fichiers PDF simultanément.
- 🔀 **Réorganisation :** Changez l'ordre d'assemblage des documents (monter / descendre).
- ⚡ **Exécution Edge :** La fusion s'effectue en mémoire sur le backend serverless Cloudflare Workers sans aucun stockage persistant.
- 🔒 **Respect de la confidentialité :** Aucun fichier n'est conservé sur disque ou en base de données.

---

## 🛠️ Installation et Développement Local

### Prérequis

- [Node.js](https://nodejs.org/) (v18.0.0 ou supérieur)
- `npm` ou un autre gestionnaire de paquets (`pnpm`, `bun`, `yarn`)

### 1. Cloner le projet & installer les dépendances

```bash
git clone <URL_DU_REPO>
cd pdf-merger
npm install
```

### 2. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

---

## 🧹 Qualité du code (ESLint)

Pour vérifier ou corriger automatiquement le style et la propreté du code :

```bash
# Vérification du code
npx eslint .

# Correction automatique
npx eslint . --fix
```

---

## 🚀 Déploiement sur Cloudflare avec NuxtHub

Grâce à NuxtHub, le déploiement sur votre compte Cloudflare s'effectue en une seule commande :

```bash
npx nuxthub deploy
```

La CLI vous guidera pour lier votre compte Cloudflare et configurera automatiquement le projet Pages/Workers.

---

## ⚠️ Limitations

- **Mémoire Cloudflare Workers (Plan gratuit) :** La mémoire limite par requête est de **128 Mo**. Il est recommandé de fusionner des fichiers PDF de taille standard (jusqu'à ~30-40 Mo au total).
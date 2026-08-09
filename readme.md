# FileConvert — Convertisseur de Fichiers

Application web open source de conversion de fichiers, pensée avec une approche **local-first** : lorsqu'une conversion peut être réalisée de manière fiable dans le navigateur, le fichier ne quitte pas l'appareil de l'utilisateur.

> Le projet privilégie la fiabilité à la quantité : une conversion n'est affichée dans l'interface que si un moteur réellement implémenté et disponible la prend en charge.

## Fonctionnalités V2

- Conversion d'images PNG, JPG/JPEG, WebP et ICO dans le navigateur
- Génération de vrais fichiers ICO multi-résolutions : 16, 32, 48, 64, 128 et 256 px
- Conversion audio et vidéo via FFmpeg WebAssembly auto-hébergé
- Conversion TXT / Markdown / HTML avec Marked, DOMPurify et Turndown
- Outils PDF locaux avec `pdf-lib` et PDF.js
- PDF déposé sur l'accueil automatiquement orienté vers l'espace PDF
- PWA avec service worker et cache des ressources locales
- Backend Office → PDF optionnel basé sur LibreOffice Headless
- Détection centralisée des formats et matrice source → destination
- Validation des fichiers, erreurs explicites et aucune inscription

## Images

Conversions actuellement disponibles :

- PNG → JPG, JPEG, WebP, ICO
- JPG/JPEG → PNG, WebP, ICO
- WebP → PNG, JPG, JPEG, ICO
- ICO → PNG, JPG, JPEG, WebP lorsque le navigateur sait décoder la source

L'export ICO génère un véritable conteneur `.ico` avec plusieurs représentations PNG intégrées, et non une image renommée.

## Audio et vidéo

Les conversions audio/vidéo sont exécutées avec FFmpeg WebAssembly dans le navigateur.

Entrées vidéo principales : MP4, WebM, AVI, MKV et MOV.

Audio : MP3, WAV, OGG, FLAC, M4A et AAC.

Le core FFmpeg JS/WASM est versionné dans `public/ffmpeg` et servi depuis le même domaine : l'application ne dépend plus d'un CDN tiers pour initialiser FFmpeg.

## Texte

- TXT → HTML, Markdown
- Markdown → HTML, TXT
- HTML → TXT, Markdown

Markdown est analysé avec `marked`; le HTML produit ou fourni est assaini avec `DOMPurify`; la conversion HTML → Markdown utilise `Turndown`.

## Outils PDF

La page `/pdf` traite les documents localement dans le navigateur :

- Images PNG/JPG/JPEG/WebP/ICO → PDF
- PDF → PNG, une image par page
- Fusion de plusieurs PDF
- Séparation d'un PDF en un fichier par page
- Rotation des pages à 90°, 180° ou 270°
- Extraction de pages sélectionnées
- Réorganisation des pages avec une syntaxe comme `3,1,2` ou `1,3,5-8`

Un PDF déposé directement sur la page d'accueil est accepté et redirigé vers cet espace au lieu d'être rejeté comme format non supporté.

## Office → PDF

La V2 contient un service serveur optionnel dans `server/office-converter`.

Formats pris en charge : DOC, DOCX, XLS, XLSX, PPT, PPTX, ODT, ODS et ODP. La sortie est PDF.

Le service utilise LibreOffice Headless dans Docker et applique : limite d'upload, timeout, noms de fichiers assainis, exécution sans interpolation shell et suppression automatique des fichiers temporaires.

Le frontend n'affiche les formats Office que lorsque la variable suivante est configurée :

```env
VITE_OFFICE_CONVERTER_URL=https://office-converter.example.com
```

Sans cette variable, aucun bouton Office trompeur n'est affiché.

Voir `server/office-converter/README.md` pour le déploiement Docker.

## Architecture

```text
                         FileConvert Web
                              │
                    validation / registry
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
        ▼                     ▼                      ▼
 Images / ICO            Audio / Vidéo          Texte
 Canvas + ICO             FFmpeg.wasm      Marked / Turndown
 encoder local            auto-hébergé       + DOMPurify
        │                     │                      │
        └────────────── traitement local ───────────┘
                              │
                              ▼
                         Outils PDF
                    pdf-lib + PDF.js
                              │
                              ▼
                 Aucun upload pour ces outils

Office (optionnel)
Browser ── HTTPS ──► Docker Node service ──► LibreOffice Headless
                              │
                              └── fichiers temporaires supprimés
```

## PWA / hors ligne

Un service worker est enregistré en production. Le shell de l'application et les ressources déjà chargées peuvent être réutilisés hors ligne. Les assets FFmpeg du même domaine sont mis en cache après leur première utilisation.

Les conversions nécessitant le service Office restent dépendantes d'une connexion réseau.

## Stack

React 18, TypeScript, Vite 8, Tailwind CSS, React Router, React Dropzone, FFmpeg WebAssembly, Canvas API, pdf-lib, PDF.js, Marked, DOMPurify, Turndown, Node.js, LibreOffice Headless, Docker, Vitest et GitHub Actions.

## Installation frontend

Node.js 22.12+ est requis.

```bash
git clone https://github.com/njaga/Convertisseur-documents.git
cd Convertisseur-documents
npm ci
npm run dev
```

Vérifications locales :

```bash
npm audit --audit-level=high
npm run lint
npm run typecheck
npm test
node --check server/office-converter/server.mjs
npm run build
```

## Confidentialité

Images, audio, vidéo, texte et outils PDF sont traités localement.

Les documents Office ne quittent le navigateur que si le service LibreOffice optionnel est explicitement configuré. Ce service est stateless et supprime ses fichiers temporaires après chaque requête.

Les conversions FFmpeg et le rendu de gros PDF peuvent utiliser beaucoup de mémoire sur les appareils mobiles.

## CI

GitHub Actions contrôle `npm ci`, l'audit des dépendances, ESLint, TypeScript, Vitest, la syntaxe du service Office, la présence des assets FFmpeg auto-hébergés et le build Vite de production.

## État V2

- [x] Support ICO entrée/sortie et multi-résolutions
- [x] Images → PDF et PDF → PNG
- [x] Fusion, séparation, rotation, extraction et réorganisation PDF
- [x] Markdown / HTML avec parseurs dédiés
- [x] PWA / cache offline
- [x] FFmpeg auto-hébergé
- [x] Backend Docker LibreOffice Office → PDF
- [x] Tests unitaires des règles de conversion et de sélection de pages
- [ ] Déployer le conteneur LibreOffice sur une infrastructure publique et configurer son URL dans le frontend
- [ ] Étendre les tests E2E navigateur

## Contribution

N'ajoutez un couple de conversion à la matrice qu'après avoir vérifié qu'un provider produit réellement un fichier valide avec le type MIME attendu.

## Contact

Ndiaga Ndiaye — contact@ndiagandiaye.com

Site : https://ndiagandiaye.com

# Convertisseur de Fichiers

Application web open source de conversion de fichiers, pensée avec une approche **local-first** : lorsqu'une conversion peut être réalisée de manière fiable dans le navigateur, le fichier ne quitte pas l'appareil de l'utilisateur.

> Le projet privilégie la fiabilité à la quantité : une conversion n'est affichée dans l'interface que si un moteur réellement implémenté la prend en charge.

## Fonctionnalités

- Conversion d'images PNG, JPG/JPEG, WebP et ICO via les APIs du navigateur
- Génération de vrais fichiers ICO avec une image PNG 256×256 intégrée
- Conversion audio et vidéo via FFmpeg WebAssembly
- Conversion locale entre TXT, Markdown et HTML
- Outils PDF 100 % locaux : images → PDF, fusion, séparation et rotation
- Détection centralisée du format d'entrée
- Matrice de compatibilité source → destination
- Validation des fichiers avant conversion
- Taille maximale actuelle : 100 MB pour le convertisseur principal
- Progression et messages d'erreur explicites
- Interface responsive avec glisser-déposer
- Tests unitaires sur la matrice de conversion et la détection
- Aucun compte requis

## Conversions actuellement supportées

### Images

- PNG → JPG, JPEG, WebP, ICO
- JPG/JPEG → PNG, WebP, ICO
- WebP → PNG, JPG, JPEG, ICO
- ICO → PNG, JPG, JPEG, WebP lorsque le navigateur sait décoder le fichier ICO

L'export ICO produit un véritable conteneur `.ico` et non un fichier PNG simplement renommé.

### Vidéo

Les formats d'entrée actuellement gérés sont MP4, WebM, AVI, MKV et MOV. Les sorties proposées dépendent du format source et sont encodées localement avec FFmpeg.wasm.

### Audio

Conversions entre MP3, WAV, OGG, FLAC, M4A et AAC via FFmpeg.wasm.

### Documents texte

- TXT → HTML, Markdown
- Markdown → HTML, TXT
- HTML → TXT, Markdown

### Outils PDF

La page `/pdf` fonctionne intégralement dans le navigateur avec `pdf-lib` :

- plusieurs images PNG/JPG/JPEG/WebP/ICO → un PDF ;
- fusion de plusieurs PDF ;
- séparation d'un PDF en un fichier par page ;
- rotation de toutes les pages à 90°, 180° ou 270°.

Aucun PDF utilisé par ces outils n'est envoyé vers un serveur.

La page `/formats` est générée à partir de la même matrice que le moteur de conversion afin d'éviter les divergences entre documentation et fonctionnalités réelles.

## Office : prochaine étape serveur

Une ancienne version annonçait des conversions PDF, DOCX, XLSX et PPTX via une API tierce appelée directement depuis le navigateur. Cette approche exposait des clés API et rendait incorrecte la promesse de traitement local.

Les conversions Office seront réintroduites via une couche serveur sécurisée basée sur LibreOffice Headless, isolée du frontend et sans clé secrète embarquée dans le bundle.

## Architecture

```text
Convertisseur principal
Upload
  │
  ▼
Validation + détection du format
  │
  ▼
Conversion Registry
  │
  ├── Image provider ───── Canvas API + encodeur ICO
  ├── Video provider ───── FFmpeg.wasm
  ├── Audio provider ───── FFmpeg.wasm
  └── Text provider ────── Browser APIs

Outils PDF
Fichiers locaux ────────── pdf-lib ────────── PDF local
```

La matrice `conversionMatrix` dans `src/utils/formats.ts` reste la source de vérité pour les conversions proposées par le convertisseur principal.

## Stack

- React 18
- TypeScript
- Vite 8
- Tailwind CSS
- React Router
- React Dropzone
- FFmpeg WebAssembly
- Canvas API
- pdf-lib
- Vitest
- GitHub Actions

## Installation

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
npm run build
```

## Tests

Les tests unitaires protègent notamment la matrice de compatibilité et la détection des formats. Ils vérifient qu'une conversion non implémentée ne puisse pas être annoncée par erreur dans l'interface, que les conversions identité ne soient pas proposées et que les extensions inconnues soient refusées au lieu d'être classées arbitrairement comme documents.

## Confidentialité

Les conversions et outils PDF actuellement disponibles sont exécutés localement dans le navigateur. Aucun fichier n'est envoyé vers un serveur applicatif par ces moteurs.

Les performances des conversions FFmpeg et des grosses manipulations PDF dépendent de la mémoire et de la puissance de l'appareil. Les fichiers volumineux peuvent donc être coûteux à traiter sur mobile.

## CI

À chaque changement vérifié par la CI, GitHub Actions contrôle :

- installation reproductible avec `npm ci` ;
- audit des dépendances ;
- ESLint ;
- TypeScript ;
- tests Vitest ;
- build de production.

## Roadmap V2

- [x] Support ICO en entrée/sortie image
- [x] Images → PDF
- [x] Fusion PDF
- [x] Séparation PDF
- [x] Rotation PDF
- [ ] Backend de conversion Office basé sur LibreOffice Headless
- [ ] Isoler les conversions lourdes dans des workers
- [ ] Héberger les assets FFmpeg sous contrôle du projet
- [ ] Ajouter des tests end-to-end
- [ ] Remplacer le convertisseur Markdown minimal par un parseur dédié
- [ ] Ajouter une PWA avec cache des dépendances locales

## Contribution

Les contributions sont les bienvenues. Merci de n'ajouter un couple de conversion à la matrice qu'après avoir vérifié qu'un provider produit réellement un fichier valide avec le bon type MIME.

## Contact

Ndiaga Ndiaye — contact@ndiagandiaye.com

Site : https://ndiagandiaye.com

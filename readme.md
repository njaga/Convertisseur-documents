# Convertisseur de Fichiers

Application web open source de conversion de fichiers, pensée avec une approche **local-first** : lorsqu'une conversion peut être réalisée de manière fiable dans le navigateur, le fichier ne quitte pas l'appareil de l'utilisateur.

> Le projet privilégie la fiabilité à la quantité : une conversion n'est affichée dans l'interface que si un moteur réellement implémenté la prend en charge.

## Fonctionnalités

- Conversion d'images PNG, JPG/JPEG et WebP via Canvas API
- Conversion audio via FFmpeg WebAssembly
- Conversion vidéo via FFmpeg WebAssembly
- Conversion locale entre TXT, Markdown et HTML
- Détection centralisée du format d'entrée
- Matrice de compatibilité source → destination
- Validation des fichiers avant conversion
- Taille maximale actuelle : 100 MB
- Progression et messages d'erreur explicites
- Interface responsive avec glisser-déposer
- Aucun compte requis

## Conversions actuellement supportées

### Images

- PNG → JPG, JPEG, WebP
- JPG/JPEG → PNG, WebP
- WebP → PNG, JPG, JPEG

### Vidéo

Les formats d'entrée actuellement gérés sont MP4, WebM, AVI, MKV et MOV. Les sorties proposées dépendent du format source et sont encodées localement avec FFmpeg.wasm.

### Audio

Conversions entre MP3, WAV, OGG, FLAC, M4A et AAC via FFmpeg.wasm.

### Documents texte

- TXT → HTML, Markdown
- Markdown → HTML, TXT
- HTML → TXT, Markdown

La page `/formats` est générée à partir de la même matrice que le moteur de conversion afin d'éviter les divergences entre documentation et fonctionnalités réelles.

## Pourquoi les conversions PDF / Office ont-elles été retirées ?

Une ancienne version annonçait des conversions PDF, DOCX, XLSX et PPTX via une API tierce appelée directement depuis le navigateur. Cette approche avait plusieurs défauts :

- clés API exposées dans le bundle frontend ;
- dépendance forte à un fournisseur externe ;
- formats proposés par l'interface sans garantie qu'une route de conversion existe ;
- promesse « 100 % local » incorrecte pour les fichiers envoyés à l'API.

Ces conversions seront réintroduites lorsqu'un moteur serveur sécurisé sera disponible, idéalement avec LibreOffice Headless dans un worker Dockerisé.

## Architecture

```text
Upload
  │
  ▼
Validation + détection du format
  │
  ▼
Conversion Registry
  │
  ├── Image provider ───── Canvas API
  ├── Video provider ───── FFmpeg.wasm
  ├── Audio provider ───── FFmpeg.wasm
  └── Text provider ────── Browser APIs
```

La matrice `conversionMatrix` dans `src/utils/formats.ts` est la source de vérité pour les conversions proposées par l'interface.

## Stack

- React 18
- TypeScript
- Vite 8
- Tailwind CSS
- React Router
- React Dropzone
- FFmpeg WebAssembly
- Canvas API
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

Les conversions actuellement disponibles sont exécutées localement dans le navigateur. Aucun fichier n'est envoyé vers un serveur applicatif par le moteur actuel.

La taille maximale acceptée par l'interface est de 100 MB. Les performances des conversions FFmpeg dépendent fortement de la mémoire et de la puissance de l'appareil ; les gros fichiers vidéo sont donc plus coûteux à traiter sur mobile.

## CI

À chaque changement, GitHub Actions vérifie :

- installation reproductible avec `npm ci` ;
- audit des dépendances avec échec en cas de vulnérabilité importante ;
- ESLint ;
- TypeScript ;
- tests Vitest ;
- build de production.

La toolchain a été modernisée et l'audit npm est actuellement à **0 vulnérabilité connue** sur la branche de refonte.

## Roadmap

- [ ] Ajouter des outils PDF locaux : fusion, séparation, rotation, images → PDF
- [ ] Ajouter un backend de conversion Office basé sur LibreOffice Headless
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

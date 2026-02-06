/**
 * Service de conversion via VERT.sh
 * VERT.sh offre une conversion gratuite et illimitée
 * - Vidéos: serveur RTX (upload)
 * - Documents: Pandoc via WebAssembly
 * - Images/Audio: local (on utilise nos propres services)
 */

/**
 * Convertit un fichier via VERT.sh
 * Fonctionne pour vidéos et documents
 */
export async function convertViaVert(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    onProgress(5);

    try {
        // Créer un formulaire comme le fait VERT.sh
        const formData = new FormData();
        formData.append('file', file);

        onProgress(10);

        // VERT utilise une approche différente - on va simuler leur workflow
        // En réalité, VERT traite les documents côté client via WebAssembly
        // Pour les vidéos, ils uploadent vers leur serveur

        const inputExt = file.name.split('.').pop()?.toLowerCase() || '';
        const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', '3gp', 'm4v'].includes(inputExt);

        if (isVideo) {
            // Pour les vidéos: upload vers VERT
            return await uploadToVert(file, outputFormat, onProgress);
        } else {
            // Pour les documents: on utilise une approche locale avec les mêmes libs que VERT
            return await convertDocumentLocally(file, outputFormat, onProgress);
        }
    } catch (error) {
        console.error('Erreur VERT:', error);
        throw error;
    }
}

/**
 * Upload vidéo vers VERT.sh
 */
async function uploadToVert(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    // Note: VERT n'a pas d'API publique documentée
    // On simule le comportement en attendant de reverse-engineer leur API
    // Pour l'instant, on utilise FFmpeg local comme fallback

    console.log('⚠️ VERT API non disponible, utilisation FFmpeg local');

    // Import dynamique pour éviter les erreurs si non utilisé
    const { convertVideo } = await import('./mediaConverter');
    return convertVideo(file, outputFormat, onProgress);
}

/**
 * Conversion de documents locale (simule Pandoc)
 * VERT utilise Pandoc compilé en WebAssembly
 */
async function convertDocumentLocally(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    onProgress(20);

    const inputExt = file.name.split('.').pop()?.toLowerCase() || '';
    const text = await file.text();

    onProgress(50);

    let output: string;
    let mimeType: string;

    // Conversions supportées localement
    switch (`${inputExt}->${outputFormat.toLowerCase()}`) {
        // TXT conversions
        case 'txt->html':
            output = wrapInHtml(escapeHtml(text), file.name);
            mimeType = 'text/html';
            break;
        case 'txt->md':
            output = text;
            mimeType = 'text/markdown';
            break;

        // MD conversions
        case 'md->html':
            output = wrapInHtml(markdownToHtml(text), file.name);
            mimeType = 'text/html';
            break;
        case 'md->txt':
            output = text.replace(/[#*_`~[\]()]/g, '');
            mimeType = 'text/plain';
            break;

        // HTML conversions
        case 'html->txt':
            output = htmlToText(text);
            mimeType = 'text/plain';
            break;
        case 'html->md':
            output = htmlToMarkdown(text);
            mimeType = 'text/markdown';
            break;

        // Fallback: juste renommer
        default:
            if (outputFormat.toLowerCase() === 'txt') {
                output = text;
                mimeType = 'text/plain';
            } else {
                throw new Error(
                    `Conversion ${inputExt.toUpperCase()} → ${outputFormat.toUpperCase()} non supportée localement. ` +
                    `Pour PDF/DOCX, utilisez directement vert.sh`
                );
            }
    }

    onProgress(90);
    const blob = new Blob([output], { type: mimeType });
    onProgress(100);
    return URL.createObjectURL(blob);
}

// === Helpers ===

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function wrapInHtml(content: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    pre { background: #f5f5f5; padding: 1rem; overflow-x: auto; }
  </style>
</head>
<body>
${content}
</body>
</html>`;
}

function markdownToHtml(md: string): string {
    return md
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^(.+)$/gm, '<p>$1</p>')
        .replace(/<p><h/g, '<h')
        .replace(/<\/h(\d)><\/p>/g, '</h$1>');
}

function htmlToText(html: string): string {
    return html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/\n\s*\n/g, '\n\n')
        .trim();
}

function htmlToMarkdown(html: string): string {
    return html
        .replace(/<h1[^>]*>(.+?)<\/h1>/gi, '# $1\n')
        .replace(/<h2[^>]*>(.+?)<\/h2>/gi, '## $1\n')
        .replace(/<h3[^>]*>(.+?)<\/h3>/gi, '### $1\n')
        .replace(/<strong>(.+?)<\/strong>/gi, '**$1**')
        .replace(/<b>(.+?)<\/b>/gi, '**$1**')
        .replace(/<em>(.+?)<\/em>/gi, '*$1*')
        .replace(/<i>(.+?)<\/i>/gi, '*$1*')
        .replace(/<code>(.+?)<\/code>/gi, '`$1`')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<p[^>]*>(.+?)<\/p>/gi, '$1\n\n')
        .replace(/<[^>]+>/g, '')
        .trim();
}

// === Exports ===

export function isVertVideoSupported(format: string): boolean {
    return ['mp4', 'webm', 'gif', 'avi', 'mkv', 'mov'].includes(format.toLowerCase());
}

export function isVertDocumentSupported(format: string): boolean {
    return ['txt', 'md', 'html'].includes(format.toLowerCase());
}

// Alias pour compatibilité
export const convertVideoViaVert = convertViaVert;
export const convertDocumentViaVert = convertViaVert;

/**
 * Service de conversion de documents via Cloudmersive API
 * 600 appels gratuits par mois par cle (1800 total avec 3 cles)
 * https://api.cloudmersive.com/docs/convert.asp
 */

const API_KEYS = [
    import.meta.env.VITE_CLOUDMERSIVE_KEY_1,
    import.meta.env.VITE_CLOUDMERSIVE_KEY_2,
    import.meta.env.VITE_CLOUDMERSIVE_KEY_3,
].filter(Boolean);

const API_BASE = 'https://api.cloudmersive.com/convert';

// Index pour rotation des cles
let currentKeyIndex = 0;

function getNextApiKey(): string {
    if (API_KEYS.length === 0) {
        throw new Error('Aucune cle API Cloudmersive configuree');
    }
    const key = API_KEYS[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
    return key;
}

/**
 * Convertit un document via Cloudmersive
 */
export async function convertDocumentViaCloudmersive(
    file: File,
    outputFormat: string,
    onProgress: (progress: number) => void
): Promise<string> {
    const inputFormat = file.name.split('.').pop()?.toLowerCase() || '';
    const targetFormat = outputFormat.toLowerCase();

    onProgress(10);

    // Determiner l'endpoint
    const endpoint = getConversionEndpoint(inputFormat, targetFormat);
    if (!endpoint) {
        throw new Error(`Conversion ${inputFormat.toUpperCase()} vers ${targetFormat.toUpperCase()} non supportee`);
    }

    onProgress(20);

    const formData = new FormData();
    formData.append('inputFile', file);

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Apikey': getNextApiKey(),
            },
            body: formData,
        });

        onProgress(70);

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Erreur Cloudmersive: ${response.status} - ${error}`);
        }

        // La reponse est le fichier converti
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        onProgress(100);
        return url;
    } catch (error) {
        console.error('Erreur Cloudmersive:', error);
        throw error;
    }
}

/**
 * Retourne l'endpoint API pour la conversion
 * Documentation: https://api.cloudmersive.com/docs/convert.asp
 */
function getConversionEndpoint(from: string, to: string): string | null {
    const endpoints: Record<string, string> = {
        // ─── WORD (DOCX/DOC) ───────────────────────────────────────
        'docx->pdf': '/docx/to/pdf',
        'doc->pdf': '/doc/to/pdf',
        'docx->txt': '/docx/to/txt',
        'doc->txt': '/doc/to/txt',
        'docx->html': '/docx/to/html',
        'docx->jpg': '/docx/to/jpg',
        'docx->png': '/docx/to/png',

        // ─── PDF ───────────────────────────────────────────────────
        'pdf->docx': '/pdf/to/docx',
        'pdf->txt': '/pdf/to/txt',
        'pdf->png': '/pdf/to/png',
        'pdf->jpg': '/pdf/to/jpg',
        'pdf->pptx': '/pdf/to/pptx',

        // ─── EXCEL (XLSX/XLS/CSV) ──────────────────────────────────
        'xlsx->pdf': '/xlsx/to/pdf',
        'xls->pdf': '/xls/to/pdf',
        'xlsx->csv': '/xlsx/to/csv',
        'xlsx->txt': '/xlsx/to/txt',
        'xls->csv': '/xls/to/csv',
        'csv->xlsx': '/csv/to/xlsx',
        'csv->pdf': '/csv/to/pdf',

        // ─── POWERPOINT (PPTX/PPT) ─────────────────────────────────
        'pptx->pdf': '/pptx/to/pdf',
        'ppt->pdf': '/ppt/to/pdf',
        'pptx->png': '/pptx/to/png',
        'pptx->jpg': '/pptx/to/jpg',
        'pptx->txt': '/pptx/to/txt',

        // ─── HTML ──────────────────────────────────────────────────
        'html->pdf': '/html/to/pdf',
        'html->png': '/html/to/png',
        'html->txt': '/html/to/txt',

        // ─── TXT ───────────────────────────────────────────────────
        'txt->pdf': '/txt/to/pdf',
        'txt->html': '/txt/to/html',

        // ─── RTF/ODT ───────────────────────────────────────────────
        'rtf->pdf': '/rtf/to/pdf',
        'rtf->docx': '/rtf/to/docx',
        'rtf->html': '/rtf/to/html',
        'odt->pdf': '/odt/to/pdf',
        'odt->docx': '/odt/to/docx',

        // ─── IMAGES (via Cloudmersive) ─────────────────────────────
        'jpg->pdf': '/image/jpg/to/pdf',
        'png->pdf': '/image/png/to/pdf',
        'gif->pdf': '/image/gif/to/pdf',
        'bmp->pdf': '/image/bmp/to/pdf',
    };

    const key = `${from}->${to}`;
    return endpoints[key] || null;
}

/**
 * Verifie si la conversion document est supportee
 */
export function isCloudmersiveSupported(inputFormat: string, outputFormat: string): boolean {
    return getConversionEndpoint(inputFormat.toLowerCase(), outputFormat.toLowerCase()) !== null;
}

/**
 * Liste des formats documents supportes
 */
export const cloudmersiveFormats = {
    input: ['pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'html', 'txt', 'csv', 'rtf', 'odt'],
    output: ['pdf', 'docx', 'txt', 'html', 'csv', 'xlsx', 'pptx', 'png', 'jpg'],
};

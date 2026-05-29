/**
 * Service to manage Google Docs creations and updates
 */

export interface ExportStatus {
  success: boolean;
  docId?: string;
  docUrl?: string;
  error?: string;
}

/**
 * Clean and style markdown for writing into a standard Google Doc
 */
export function cleanMarkdownForDoc(md: string): string {
  if (!md) return '';
  const lines = md.split('\n');
  const resultLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('### ')) {
      resultLines.push(`\n[ ${line.substring(4).toUpperCase()} ]\n`);
    } else if (line.startsWith('## ')) {
      resultLines.push(`\n► ${line.substring(3).toUpperCase()}\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`);
    } else if (line.startsWith('# ')) {
      resultLines.push(`\n========================================\n  ${line.substring(2).toUpperCase()}\n========================================\n`);
    } else if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
      const cleanLine = line.trim().substring(2).replace(/\*\*/g, '');
      resultLines.push(`   • ${cleanLine}`);
    } else if (/^\s*\d+\.\s/.test(line)) {
      const cleanLine = line.trim().replace(/\*\*/g, '');
      resultLines.push(`   ${cleanLine}`);
    } else {
      // Remove markdowns formatting like bold ** and italic * handles gracefully
      const cleanLine = line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
      resultLines.push(cleanLine);
    }
  }

  return resultLines.join('\n');
}

/**
 * Creates a new Google Doc with the specified title and markdown content
 */
export async function createGoogleDocFromStudy(
  accessToken: string,
  title: string,
  markdownText: string
): Promise<ExportStatus> {
  try {
    // 1. Create the document object
    const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title })
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      return {
        success: false,
        error: `Gagal membuat Dokumen Google: ${errText}`
      };
    }

    const docData = await createRes.json();
    const docId = docData.documentId;
    const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

    // 2. Prepare the content text
    const formattedBody = cleanMarkdownForDoc(markdownText);

    // 3. insert formatting and structured content
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${docId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: formattedBody
            }
          }
        ]
      })
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      return {
        success: false,
        error: `Gagal mengisi konten tulisan: ${errText}`,
        docId,
        docUrl
      };
    }

    return {
      success: true,
      docId,
      docUrl
    };
  } catch (error: any) {
    console.error('Error exporting to Google Doc:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

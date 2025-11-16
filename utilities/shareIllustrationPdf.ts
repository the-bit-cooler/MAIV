import { Alert } from 'react-native';

import * as Application from 'expo-application';
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { marked } from 'marked';

interface Verse {
  version: string;
  book: string;
  chapter: number | string;
  verse: number | string;
  text: string;
}

export async function shareIllustrationPdf(imageUrl: string, verseReference: string, verse: Verse) {
  try {
    const backgroundColor = '#E8D9B5';

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page {
              size: A4 portrait;
              margin: 0in; /* Reduced margins to give more space */
              background-color: ${backgroundColor}; /* Apply to page for full coverage */
            }
            body {
              font-family: -apple-system, Roboto, sans-serif;
              font-size: 16px; /* Slightly reduced font size for compactness */
              background-color: ${backgroundColor};
              line-height: 1.3; /* Tighter line height */
              margin: 0;
              padding: 0px; /* Minimal padding */
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              page-break-after: avoid; /* Prevent breaks after body */
            }
            h2 {
              text-align: center;
              font-size: 18px; /* Smaller header */
              color: #3E2F1C;
            }
            blockquote {
              border-left: 4px solid #d0d7de;
              margin: 10px; /* Reduced margins */
              padding-left: 12px;
              color: #3E2F1C;
              background-color: #EFE2C6;
              border-radius: 4px;
              font-size: 16px; /* Match body */
              line-height: 1.3;
            }
            .content-wrapper {
              background-color: ${backgroundColor};
              display: block;
              min-height: 0; /* Allow shrinking */
            }
            .image-container {
              text-align: center;
              margin: 10px auto 0 auto;
              padding: 0;
              page-break-inside: avoid; /* Prevent image from breaking */
              width: 100%;
            }
            .generated-image {
              max-width: 100%;
              max-height: 600pt; /* Fixed max height in points (A4 ~842pt, minus ~200pt for text/margins) */
              width: auto;
              height: auto;
              display: block;
              margin: 0 auto;
            }
            /* Force single page by scaling if needed (fallback) */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
              }
            }
            /* Force single page by scaling if needed (fallback) */
            @media print {
              body {
                -webkit-print-color-adjust: exact;
              }
              html {
                background-color: ${backgroundColor}; /* Ensure full-page background */
              }
            }
          </style>
        </head>
        <body>
          <div class="content-wrapper">
            <h2>Verse Illustration</h2>
            ${marked.parse(`> **${verse.book} ${verse.chapter}:${verse.verse} (${verse.version})**  
> ${verse.text}`)}
          </div>
          <div class="image-container">
            <img src="${imageUrl}" alt="AI Generated Image" class="generated-image" />
          </div>
        </body>
      </html>
    `;

    // Generate PDF
    // Generate PDF with options to fit content (expo-print handles single-page by default if content is concise)
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false, // Ensure external image URL loads if possible,
      width: 595, // A4 width in points (adjust if needed)
      height: 842, // A4 height in points
    });

    const fileDisplayName = `${verseReference.replace(/[\s:]+/g, '-')}-${Application.applicationName}.pdf`;

    const temp = new File(uri);
    const file = new File(Paths.cache, fileDisplayName);

    if (file.exists) file.delete();
    temp.copy(file);

    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri);
    } else {
      Alert.alert('Sorry, Sharing not available.');
    }
  } catch {
    Alert.alert('We are unable to share this at the moment. Please try again at another time.');
  }
}

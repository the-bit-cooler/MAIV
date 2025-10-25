import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as Application from 'expo-application';
import { File, Paths } from 'expo-file-system';
import { marked } from 'marked';
import { Alert } from 'react-native';

interface Verse {
  version: string;
  book: string;
  chapter: number | string;
  verse: number | string;
  text: string;
}

export async function shareMarkdownAsPdf(
  markdown: string,
  title: string,
  verseReference: string,
  aiMode: string,
  verse?: Verse,
  imageUrl?: string,
) {
  try {
    // Convert Markdown → HTML
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            @page { margin: 40px; }
            body {
              font-family: -apple-system, Roboto, sans-serif;
              font-size: 18px;
              color: #222;
              background-color: white;
              line-height: 1.5;
            }
            h1 {
              text-align: center;
              font-size: 32px;
              margin-bottom: 5px;
              color: #0366d6;
            }
            h2 {
              text-align: center;
              font-size: 24px;
              margin-top: 0;
              margin-bottom: 20px;
              color: #555;
            }
            blockquote {
              border-left: 4px solid #d0d7de;
              margin: 20px 0;
              padding-left: 16px;
              color: #57606a;
              background-color: #f6f8fa;
              border-radius: 4px;
            }
            pre {
              background-color: #f6f8fa;
              padding: 10px;
              border-radius: 6px;
              overflow-x: auto;
            }
            code {
              font-family: Menlo, monospace;
            }
            h3, h4 {
              color: #0366d6;
            }
            p {
              margin-bottom: 12px;
            }
            img.generated-image {
              display: block;
              margin: 0 auto 20px auto;
              max-width: 100%;
              height: auto;
              border-radius: 12px;
              box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            }
            @page {
              @bottom-center {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 12px;
                color: #666;
              }
            }
          </style>
        </head>
        <body>
        ${imageUrl ? `<img src="${imageUrl}" alt="AI Generated Image" class="generated-image" />` : ''}
          ${
            verse
              ? marked.parse(`> **${verse.book} ${verse.chapter}:${verse.verse} (${verse.version})**  
> ${verse.text}`)
              : ''
          }
          <h1>${title}</h1>
          <hr />
          ${marked.parse(markdown)}
        </body>
      </html>
    `;

    // Generate PDF
    const { uri } = await Print.printToFileAsync({ html });

    const temp = new File(uri);
    const file = new File(
      Paths.cache,
      `${verseReference.replace(/[\s:]+/g, '-')}-${Application.applicationName}-${aiMode}-Mode.pdf`,
    );

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

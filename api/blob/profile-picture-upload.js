import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  // Fix: Parse JSON body for Node.js http.IncomingMessage
  let body;
  try {
    body = JSON.parse(await new Promise((resolve, reject) => {
      let data = '';
      request.on('data', chunk => data += chunk);
      request.on('end', () => resolve(data));
      request.on('error', reject);
    }));
  } catch (e) {
    return response.status(400).json({ error: 'Invalid JSON' });
  }

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate the user here
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          tokenPayload: JSON.stringify({}),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return response.json(jsonResponse);
  } catch (error) {
    console.error('Blob upload error:', error);
    return response.status(400).json({ error: error.message });
  }
}

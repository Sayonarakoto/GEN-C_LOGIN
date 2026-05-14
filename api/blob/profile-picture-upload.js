import { handleUpload } from '@vercel/blob/client';

export default async function handler(request, response) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate the user here, e.g., check JWT
        // In a real app, verify the JWT from the request headers.
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
          tokenPayload: JSON.stringify({
            // optional: userID or other info
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        // Optional: Perform actions after upload
        console.log('blob upload completed', blob, tokenPayload);
      },
    });

    return response.json(jsonResponse);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
}

import axios from 'axios';

const CLIPDROP_API_URL = 'https://clipdrop-api.co/remove-background/v1';

export async function removeBackground(imageBuffer: Buffer): Promise<Buffer> {
  const apiKey = process.env.CLIPDROP_API_KEY;

  if (!apiKey) {
    throw new Error('CLIPDROP_API_KEY is not configured');
  }

  const formData = new FormData();
  formData.append(
    'image_file',
    new Blob([new Uint8Array(imageBuffer)]),
    'image.png'
  );

  const response = await axios.post(CLIPDROP_API_URL, formData, {
    headers: {
      'x-api-key': apiKey,
    },
    responseType: 'arraybuffer',
    validateStatus: (status) => status < 500,
  });

  if (response.status !== 200) {
    const errorText = Buffer.from(response.data).toString('utf-8');
    let errorMessage = 'Background removal failed';
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorMessage;
    } catch {
      // Response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  return Buffer.from(response.data);
}

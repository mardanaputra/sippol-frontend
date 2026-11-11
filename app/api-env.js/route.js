export const dynamic = 'force-dynamic';

export async function GET() {
  // Read process.env directly at runtime avoiding NEXT_PUBLIC_ build-time inlining
  const envMap = process.env;
  const apiUrl = envMap['NEXT_PUBLIC_API_URL'] || '';
  const recaptchaKey = envMap['NEXT_PUBLIC_RECAPTCHA_SITE_KEY'] || '';

  const env = {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: recaptchaKey,
  };

  const jsContent = `window.__ENV__ = ${JSON.stringify(env)};`;

  return new Response(jsContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}

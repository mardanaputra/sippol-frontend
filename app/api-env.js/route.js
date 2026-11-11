export const dynamic = 'force-dynamic';

export async function GET() {
  // Turbopack / Webpack aggressively replaces literal strings starting with "NEXT_PUBLIC_"
  // with static empty strings at build time.
  // Construct the environment variable keys dynamically at runtime to prevent compile-time inlining.
  const env = process.env;

  const keyApi = ['NEXT', 'PUBLIC', 'API', 'URL'].join('_');
  const keyRecaptcha = ['NEXT', 'PUBLIC', 'RECAPTCHA', 'SITE', 'KEY'].join('_');

  const apiUrl = env[keyApi] || '';
  const recaptchaKey = env[keyRecaptcha] || '';

  const runtimeEnv = {
    NEXT_PUBLIC_API_URL: apiUrl,
    NEXT_PUBLIC_RECAPTCHA_SITE_KEY: recaptchaKey,
  };

  const jsContent = `window.__ENV__ = ${JSON.stringify(runtimeEnv)};`;

  return new Response(jsContent, {
    status: 200,
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}

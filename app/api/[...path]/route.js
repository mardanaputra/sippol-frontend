export const dynamic = 'force-dynamic';

async function handleProxy(request, context) {
  const params = await context.params;
  const pathArr = params?.path || [];
  const pathStr = Array.isArray(pathArr) ? pathArr.join('/') : pathArr;

  const backendBase = (
    process.env.INTERNAL_BACKEND_URL ||
    'http://backend:8000'
  ).replace(/\/$/, '');

  const urlObj = new URL(request.url);
  const targetUrl = `${backendBase}/api/${pathStr}${urlObj.search}`;

  const headers = new Headers();
  request.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    // Exclude hop-by-hop headers and host to avoid upstream conflicts
    if (!['host', 'connection', 'keep-alive', 'transfer-encoding'].includes(lowerKey)) {
      headers.set(key, value);
    }
  });

  // Preserve proxy forwarding headers
  if (!headers.has('x-forwarded-proto')) {
    headers.set('x-forwarded-proto', urlObj.protocol.replace(':', ''));
  }
  if (!headers.has('x-forwarded-host')) {
    headers.set('x-forwarded-host', urlObj.host);
  }

  let body = undefined;
  if (!['GET', 'HEAD'].includes(request.method.toUpperCase())) {
    body = await request.arrayBuffer();
  }

  try {
    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body,
      redirect: 'manual',
    });

    const responseHeaders = new Headers();
    backendResponse.headers.forEach((value, key) => {
      responseHeaders.set(key, value);
    });

    return new Response(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (err) {
    console.error(`[API Proxy Error] Failed to reach ${targetUrl}:`, err);
    return new Response(
      JSON.stringify({
        error: 'Backend service unavailable',
        details: err.message,
      }),
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

export const GET = handleProxy;
export const POST = handleProxy;
export const PUT = handleProxy;
export const PATCH = handleProxy;
export const DELETE = handleProxy;
export const HEAD = handleProxy;
export const OPTIONS = handleProxy;

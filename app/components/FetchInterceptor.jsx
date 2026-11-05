'use client';

import React, { useEffect } from 'react';

export default function FetchInterceptor() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.__fetchPatched) {
      window.__fetchPatched = true;
      const originalFetch = window.fetch;

      window.fetch = async function (input, init = {}) {
        // Resolve URL string from input (can be string, URL object, or Request object)
        let urlStr = '';
        if (typeof input === 'string') {
          urlStr = input;
        } else if (input instanceof URL) {
          urlStr = input.toString();
        } else if (input && typeof input === 'object' && 'url' in input) {
          urlStr = input.url;
        }

        const isApiCall = urlStr && (urlStr.startsWith('/api/') || urlStr.includes('/api/'));

        if (isApiCall) {
          // If NEXT_PUBLIC_API_URL is defined, redirect directly to that backend origin.
          // Otherwise, keep relative /api/ calls which are proxied by Next.js server rewrites.
          const backendOrigin = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');
          if (backendOrigin) {
            if (typeof input === 'string') {
              if (input.startsWith('/api/')) {
                input = backendOrigin + input;
                urlStr = input;
              }
            } else if (input instanceof URL) {
              if (input.pathname.startsWith('/api/')) {
                input = new URL(backendOrigin + input.pathname + input.search);
                urlStr = input.toString();
              }
            } else if (input && typeof input === 'object' && 'url' in input) {
              if (input.url.startsWith('/api/')) {
                const newUrl = backendOrigin + new URL(input.url, window.location.origin).pathname + new URL(input.url, window.location.origin).search;
                input = new Request(newUrl, input);
                urlStr = input.url;
              }
            }
          }

          // Ambil token dari localStorage, atau coba dari cookie jika di localStorage tidak ada
          let token = localStorage.getItem('adminToken');
          if (!token) {
            const match = document.cookie.match(/(^|;)\s*adminToken\s*=\s*([^;]+)/);
            if (match) {
              token = match[2];
              // Sync back to localStorage for consistency
              localStorage.setItem('adminToken', token);
              localStorage.setItem('isAdminLoggedIn', 'true');
            }
          }

          // Let's modify the headers
          if (input instanceof Request) {
            // If input is a Request object, it contains its own headers. We clone and merge.
            const headers = new Headers(input.headers);
            if (init.headers) {
              const initHeaders = new Headers(init.headers);
              initHeaders.forEach((value, key) => headers.set(key, value));
            }
            if (token && !headers.has('Authorization')) {
              headers.set('Authorization', `Bearer ${token}`);
            }
            if (!headers.has('Accept')) {
              headers.set('Accept', 'application/json');
            }
            headers.set('ngrok-skip-browser-warning', 'true');
            init.headers = headers;
          } else {
            // Input is a string or URL object
            if (init.headers instanceof Headers) {
              if (token && !init.headers.has('Authorization')) {
                init.headers.set('Authorization', `Bearer ${token}`);
              }
              if (!init.headers.has('Accept')) {
                init.headers.set('Accept', 'application/json');
              }
              init.headers.set('ngrok-skip-browser-warning', 'true');
            } else if (Array.isArray(init.headers)) {
              const headers = new Headers(init.headers);
              if (token && !headers.has('Authorization')) {
                headers.set('Authorization', `Bearer ${token}`);
              }
              if (!headers.has('Accept')) {
                headers.set('Accept', 'application/json');
              }
              headers.set('ngrok-skip-browser-warning', 'true');
              init.headers = Object.fromEntries(headers.entries());
            } else {
              init.headers = {
                'Accept': 'application/json',
                'ngrok-skip-browser-warning': 'true',
                ...init.headers,
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              };
            }
          }
        }

        // Execute original fetch call
        const response = await originalFetch(input, init);

        // Handle 401 Unauthorized globally!
        if (response.status === 401 && isApiCall) {
          // Do not redirect for login calls to prevent infinite loops
          if (!urlStr.includes('/api/login')) {
            if (window.location.pathname.startsWith('/admin')) {
              console.warn('Unauthorized! Token expired or invalid. Redirecting to login...');

              // Clear auth state
              localStorage.removeItem('isAdminLoggedIn');
              localStorage.removeItem('adminToken');
              localStorage.removeItem('rememberAdmin');
              document.cookie = 'adminToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
              document.cookie = 'isAdminLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';

              // Redirect to login page
              window.location.href = '/admin/login?expired=true';
            } else {
              console.warn('API returned 401, but ignoring redirect since we are on a public page.');
            }
          }
        }

        return response;
      };
      console.log('SIPPOL API Fetch Interceptor Loaded Successfully.');
    }
  }, []);

  return null;
}

# Deployment: nginx headers, gzip and static caching

Example nginx config for a production MathTutor AI deployment. It terminates
TLS, proxies the Next.js client (`:3000`) and the Spring Boot backend
(`:8080`), adds the security headers the app already sets (so they also cover
responses cached by nginx), compresses JSON API responses, and long-caches the
legacy client's hashed static files.

## Headers + gzip + static caching

```nginx
server {
    listen 443 ssl http2;
    server_name math.example;

    # TLS terminated here (cert paths omitted).
    ssl_certificate     /etc/letsencrypt/live/math.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/math.example/privkey.pem;

    # --- Security headers (mirror WebConfig + next.config.ts) ---
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;
    # Relaxed so the IE6 legacy client's inline scripts/styles keep working.
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" always;

    # --- Next.js client ---
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # --- Backend API ---
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # --- gzip for JSON API responses (NOT the SSE stream) ---
    location ~ ^/api/ {
        gzip on;
        gzip_types application/json;
        gzip_min_length 256;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Streaming chat responses must not be buffered/compressed.
        location ~ ^/api/chat/(message|image)$ {
            gzip off;
            proxy_buffering off;
            proxy_cache off;
            proxy_read_timeout 120s;
            proxy_set_header Connection "";
        }
    }

    # --- Legacy IE6 client (served by the backend under /legacy/**) ---
    location /legacy/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        # Hashed/deployed static assets (js/css) are immutable for a year.
        location ~* /legacy/.*\.(js|css)$ {
            proxy_pass http://127.0.0.1:8080;
            add_header Cache-Control "public, max-age=31536000, immutable" always;
        }
        # HTML entry points are always revalidated.
        location ~* /legacy/(index|login|signup|settings|progress)\.html$ {
            proxy_pass http://127.0.0.1:8080;
            add_header Cache-Control "no-cache" always;
        }
    }
}
```

## Notes

- The `Cache-Control` on `/legacy/**` assets is the deployment-time caching
  layer; for a pure backend-only setup the same rules belong on the
  `WebConfig` resource handler. Files with a `.` in the name (deployed assets)
  get `immutable`; html gets `no-cache`.
- gzip must stay **off** for `/api/chat/message` and `/api/chat/image` — those
  are SSE streams delivered as `text/plain` and compressing them breaks the
  streaming UX and the client's per-chunk rendering.
- The app already sets every header above on non-nginx paths via
  `WebConfig.securityHeadersFilter` and `next.config.ts`, so this config only
  needs to be the same on paths nginx serves/caches itself.
- `server_tokens off;` is recommended to avoid leaking nginx/OS version.

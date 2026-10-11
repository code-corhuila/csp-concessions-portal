FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/csp-concessions-portal/browser /usr/share/nginx/html
# The CORS rule is rendered from the container environment at startup (ADR-026)
COPY deploy/runtime/cors-origin.conf.template /opt/csp-runtime/cors-origin.conf.template
COPY deploy/runtime/40-render-cors.sh /docker-entrypoint.d/40-render-cors.sh
RUN chmod +x /docker-entrypoint.d/40-render-cors.sh
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1
CMD ["nginx", "-g", "daemon off;"]

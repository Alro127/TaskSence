# Configuration stage
FROM nginx:alpine AS config

WORKDIR /etc/nginx

COPY nginx.conf /etc/nginx/nginx.conf
COPY default.conf.template /etc/nginx/templates/default.conf.template

# Runtime stage
FROM nginx:alpine AS runtime

COPY --from=config /etc/nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=config /etc/nginx/templates/default.conf.template /etc/nginx/templates/default.conf.template

ENV NGINX_SERVER_NAME=localhost \
    NGINX_ENVSUBST_FILTER=NGINX_SERVER_NAME

RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

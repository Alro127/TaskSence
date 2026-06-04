FROM nginx:alpine AS runtime

COPY nginx.conf /etc/nginx/nginx.conf
ENV NGINX_SERVER_NAME=localhost \
    NGINX_ENVSUBST_FILTER=NGINX_SERVER_NAME

RUN mkdir -p /var/cache/nginx && \
    chown -R nginx:nginx /var/cache/nginx

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

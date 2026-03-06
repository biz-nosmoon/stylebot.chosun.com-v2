# 1단계: 빌드 환경
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2단계: 실행 환경 (Nginx)
FROM nginx:alpine
RUN rm /etc/nginx/conf.d/default.conf

RUN echo "server { \
    listen 8080; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
    location /api-proxy { \
        proxy_pass https://chosun-backend-491702989448.asia-northeast3.run.app/api-proxy; \
        proxy_ssl_server_name on; \
        proxy_set_header Host chosun-backend-491702989448.asia-northeast3.run.app; \
        proxy_set_header X-Real-IP \$remote_addr; \
    } \
}" > /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]

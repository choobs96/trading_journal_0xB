# Deployment Guide

## 🚀 Production Deployment

### Security Checklist Before Deployment

- [ ] Generate strong JWT secret (32+ characters)
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Use environment-specific database
- [ ] Configure proper logging
- [ ] Set up monitoring and alerts

### Environment Variables for Production

**Backend:**
```env
NODE_ENV=production
JWT_SECRET=your_very_long_random_secret_key_here_minimum_32_chars
PORT=3000
DB_FILENAME=/var/lib/trading_journal/production.db
UPLOAD_DIR=/var/lib/trading_journal/uploads
CORS_ORIGIN=https://yourdomain.com
```

**Frontend:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_DEBUG_MODE=false
VITE_ENABLE_ANALYTICS=true
```

### Docker Deployment

```dockerfile
# Backend Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2 Process Management

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start backend/server.js --name "trading-journal-backend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        root /var/www/trading-journal-frontend;
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 🔒 Security Best Practices

1. **Never commit .env files**
2. **Use strong, unique secrets for each environment**
3. **Regular security updates**
4. **Monitor application logs**
5. **Backup database regularly**
6. **Use HTTPS everywhere**
7. **Implement rate limiting**
8. **Set up security headers**

## 📊 Monitoring

- Application performance monitoring
- Error tracking and alerting
- Database performance monitoring
- Security event logging
- User activity analytics

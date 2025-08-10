# Security Guide for Trading Journal Application

## 🚨 **CRITICAL: Before Publishing to GitHub**

This application contains sensitive information that **MUST** be secured before making it public.

## 🔐 **What Has Been Secured**

### 1. **JWT Secret Keys**
- ✅ Removed hardcoded `'test_secret_key'` from server.js
- ✅ Added environment variable support via `config.js`
- ✅ Default development key is now in config (should be changed for production)

### 2. **API Endpoints**
- ✅ Removed hardcoded `localhost:5001` URLs from all frontend components
- ✅ Added centralized configuration via `frontend/src/config.js`
- ✅ All API calls now use `config.api.baseURL`

### 3. **Database Configuration**
- ✅ Removed hardcoded database paths
- ✅ Added environment variable support for database configuration

### 4. **Port Configuration**
- ✅ Removed hardcoded port `5001`
- ✅ Added environment variable support via `config.js`

## 🛡️ **What You Need to Do Before Publishing**

### 1. **Create Production Environment Files**

**Backend (.env):**
```bash
# Create backend/.env with your production values
JWT_SECRET=your_super_secret_production_jwt_key_here_make_it_long_and_random
PORT=5001
NODE_ENV=production
DB_FILENAME=./trading_journal.db
```

**Frontend (.env.local):**
```bash
# Create frontend/.env.local with your production values
VITE_API_BASE_URL=http://localhost:3000
VITE_DEBUG_MODE=false
```

### 2. **Generate Strong JWT Secret**
```bash
# Generate a strong random secret (64+ characters)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. **Remove Development Files**
- Delete `backend/.env.local` if it exists
- Delete `backend/trading_journal.db` (contains your data)
- Delete `backend/uploads/` directory (contains your CSV files)
- Delete `backend/logs.txt`

### 4. **Update Configuration Files**
- Review `backend/config.js` for any development-specific defaults
- Review `frontend/src/config.js` for any development-specific defaults

## 📁 **Files That Should NOT Be Committed**

```
backend/.env                    # Production environment variables
backend/.env.local             # Local development environment
backend/trading_journal.db     # Your personal database
backend/uploads/               # Your uploaded CSV files
backend/logs.txt               # Application logs
frontend/.env.local            # Frontend environment variables
```

## 🔍 **Verification Checklist**

Before pushing to GitHub, verify:

- ✅ No hardcoded `localhost:5001` URLs in any files
- [ ] No hardcoded JWT secrets
- [ ] No hardcoded database paths
- [ ] `.env` files are in `.gitignore`
- [ ] Database file is not committed
- [ ] Upload directory is not committed
- [ ] Log files are not committed
- [ ] All API calls use `config.api.baseURL`

## 🚀 **Production Deployment**

### 1. **Environment Variables**
Set these in your production environment:
- `JWT_SECRET` - Strong random string
- `PORT` - Your production port
- `NODE_ENV` - Set to `production`
- `CORS_ORIGIN` - Your production frontend URL

### 2. **Database**
- Use a production database (PostgreSQL, MySQL) instead of SQLite
- Update `backend/config.js` to support different database types
- Never commit production database credentials

### 3. **File Uploads**
- Use cloud storage (AWS S3, Google Cloud Storage) for production
- Never store uploaded files on the server filesystem

## 📚 **Additional Security Recommendations**

1. **Rate Limiting**: Add rate limiting to prevent brute force attacks
2. **Input Validation**: Validate all user inputs on both frontend and backend
3. **HTTPS**: Use HTTPS in production
4. **CORS**: Restrict CORS to only your production domains
5. **Logging**: Implement proper logging without exposing sensitive data
6. **Backup**: Regular database backups
7. **Updates**: Keep dependencies updated

## 🆘 **If You Accidentally Commit Sensitive Data**

1. **Immediately** change any exposed secrets
2. Use `git filter-branch` or `BFG Repo-Cleaner` to remove from history
3. Force push to overwrite the repository
4. Consider the repository compromised and create a new one

## 📞 **Support**

If you need help securing your application, review this guide thoroughly before asking for assistance.

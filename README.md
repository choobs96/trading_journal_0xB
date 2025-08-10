# Trading Journal 0xB

A comprehensive trading journal application for tracking and analyzing your trading performance.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <your-fork-url>
   cd trading_journal_0xB
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   cp env.example .env.local
   # Edit .env.local with your API URL
   npm run dev
   ```

### Environment Variables

**Backend (.env):**
```env
JWT_SECRET=your_secure_jwt_secret_here
PORT=5001
DB_FILENAME=./trading_journal.db
UPLOAD_DIR=./uploads
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env.local):**
```env
VITE_API_BASE_URL=http://localhost:5001
```

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Environment variable configuration
- SQL injection protection
- CORS configuration

## Features

### 🔐 Authentication
- User registration and login system
- JWT token-based authentication
- Secure password hashing with bcrypt

### 📊 Trade Management
- CSV file upload for trade data import
- Automatic trade processing and analysis
- Risk/Reward ratio calculations
- Trade duration tracking
- Profit/Loss analysis

### 📝 Journal System
- Rich text editor for trade journaling
- Trade-specific journal entries
- Journal search and management
- Trade summary integration

### 📈 Analytics
- Daily aggregated statistics
- Win rate calculations
- P&L tracking
- Interactive calendar view
- Trade performance metrics

### 🎨 User Interface
- Modern, responsive design
- Interactive data tables with sorting
- Real-time data updates
- Mobile-friendly interface

## Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Ant Design** - UI components
- **TinyMCE** - Rich text editor
- **FullCalendar** - Calendar component
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **SQLite** - Database (easier setup than PostgreSQL)
- **JWT** - Authentication
- **Multer** - File upload handling
- **PapaParse** - CSV parsing

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
# The .env file is already created with default values
# You can modify it if needed:
# DB_USER=postgres
# DB_HOST=localhost
# DB_NAME=trading_journal
# DB_PASSWORD=password
# DB_PORT=5432
# JWT_SECRET=your_super_secret_jwt_key_here
# PORT=5001
```

4. Start the backend server:
```bash
npm start
```

The backend will run on `http://localhost:5001` (configurable via environment variables)

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Usage

### 1. Registration & Login
- Register a new account with email and password
- Login with your credentials
- JWT tokens are automatically managed

### 2. Import Trade Data
- Prepare CSV files: `History.csv` and `Positions.csv`
- Click "Import Paper Trades" in the navbar
- Upload both files and specify trade account
- Data will be automatically processed and stored

### 3. View Trades
- Trades are displayed in an interactive table
- Sort by any column
- Click on trades to view detailed information
- Use pagination to navigate through large datasets

### 4. Create Journal Entries
- Click the "📝 Journal" button on any trade row
- Use the rich text editor to write your analysis
- Include trade setup, execution, and lessons learned
- Save and edit journal entries as needed

### 5. View Journals
- Click "📚 Journals" in the navbar
- Browse all your journal entries
- Click on any journal to edit or view details

### 6. Analytics
- View daily aggregated statistics
- Interactive calendar shows daily performance
- Track win rates and P&L over time

## API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login

### Trades
- `GET /api/data` - Get all trades for user
- `GET /api/agg_daily_data` - Get daily aggregated data
- `GET /api/trade-accounts` - Get user's trade accounts
- `POST /api/upload` - Upload and process CSV files

### Journals
- `GET /api/journals` - Get all journal entries
- `GET /api/journal/:trade_id` - Get specific journal entry
- `POST /api/journal` - Create new journal entry
- `PUT /api/journal/:trade_id` - Update journal entry
- `DELETE /api/journal/:trade_id` - Delete journal entry

## Database Schema

### Users Table
- `user_id` (Primary Key)
- `email` (Unique)
- `password` (Hashed)
- `created_at`

### Trades Table
- `trade_id` (Primary Key)
- `user_id` (Foreign Key)
- `trade_account`
- `symbol`
- `side` (Buy/Sell)
- `time_of_first_entry`
- `avg_entry_price`
- `total_entry_stock_amount`
- `time_of_last_exit`
- `avg_exit_price`
- `total_exit_stock_amount`
- `total_buy`
- `total_sell`
- `pnl`
- `outcome` (Profit/Loss)
- `num_entries`
- `num_exits`
- `stop_loss`
- `price_target`
- `created_at`

### Trade Journals Table
- `journal_id` (Primary Key)
- `trade_id` (Foreign Key)
- `user_id` (Foreign Key)
- `trade_account`
- `journal_content` (JSON)
- `created_at`
- `updated_at`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For support or questions, please open an issue on GitHub or contact the development team.

## Future Enhancements

- [ ] Advanced charting and technical analysis
- [ ] Portfolio performance tracking
- [ ] Risk management tools
- [ ] Trade automation integration
- [ ] Mobile app development
- [ ] Social features and sharing
- [ ] Advanced reporting and exports
- [ ] Multi-account support
- [ ] Real-time market data integration

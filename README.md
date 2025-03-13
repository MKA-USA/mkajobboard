# MKA USA Job Board

A dedicated job board platform for members of Majlis Khuddamul Ahmadiyya USA, managed by the Sanat-o-Tijarat Department. This platform facilitates job connections between Khuddam seeking employment and those who can help their brothers secure positions.

## 🚀 Features

- **Job Listings**: Browse and search through job opportunities posted by fellow Khuddam
- **Advanced Filtering**: Filter jobs by category, location, and job type
- **Application System**: Simple application process for job seekers
- **Admin Dashboard**: Secure admin interface for managing job postings
- **Responsive Design**: Fully responsive interface that works on all devices
- **Real-time Updates**: Instant updates for job listings and applications

## 🛠️ Technology Stack

- **Frontend**: React.js with Vite
- **UI Components**: ShadcnUI + Tailwind CSS
- **State Management**: React Context
- **Routing**: React Router
- **Backend Integration**: Express.js
- **Database**: Google Sheets API
- **Authentication**: JWT with HTTP-only cookies

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v14 or higher)
- npm (v6 or higher)

## 🔧 Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd mka-job-board
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173

# Google Sheets API
GOOGLE_SHEETS_PRIVATE_KEY="your-private-key"
GOOGLE_SHEETS_CLIENT_EMAIL="your-client-email"
GOOGLE_SHEETS_SPREADSHEET_ID="your-spreadsheet-id"
GOOGLE_SHEETS_SHEET_NAME="Jobs"

# JWT Secret for Admin Authentication
JWT_SECRET="your-jwt-secret"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD_HASH="your-password-hash"

# Cache settings
CACHE_TTL=300
```

4. Start the development server:
```bash
npm run dev
```

## 🏗️ Project Structure

```
mka-job-board/
├── src/
│   ├── components/         # Reusable UI components
│   ├── contexts/          # React Context providers
│   ├── lib/              # Utility functions and helpers
│   ├── pages/            # Page components
│   ├── services/         # API service functions
│   ├── server/           # Express.js server code
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Application entry point
├── public/              # Static assets
└── package.json        # Project dependencies and scripts
```

## 🔐 Authentication

The admin interface is protected and requires authentication. Default credentials:
- Username: admin
- Password: admin123

⚠️ Make sure to change these credentials in production.

## 🚀 Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm run server
```

## 💻 Development

- **Development Server**: `npm run dev`
- **Build**: `npm run build`
- **Preview Production Build**: `npm run preview`
- **Start Server**: `npm run server`

## 🔄 API Endpoints

### Public Endpoints
- `GET /api/jobs` - Get all jobs with optional filters
- `GET /api/jobs/:id` - Get specific job details
- `GET /api/categories` - Get job categories
- `POST /api/jobs/:id/apply` - Submit job application

### Admin Endpoints (Protected)
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/jobs` - Create new job listing
- `PUT /api/admin/jobs/:id` - Update existing job
- `DELETE /api/admin/jobs/:id` - Delete job listing

## 🎨 Customization

### Theme Colors
The primary brand color (`#78c197`) and other design tokens can be customized in:
- `tailwind.config.js` - For Tailwind CSS theme
- `src/index.css` - For CSS variables

### Components
All UI components are built using ShadcnUI and can be customized in the `components/ui` directory.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is maintained by Majlis Khuddamul Ahmadiyya USA and is intended for internal use only.

## 📞 Support

For technical support or questions, please contact:
- Sanat-o-Tijarat Department
- Email: jobs@mkausa.org

## ✨ Acknowledgments

- MKA USA Leadership
- Sanat-o-Tijarat Department
- All contributing Khuddam

---

Built with ❤️ for Majlis Khuddamul Ahmadiyya USA

# Healthcare Platform - AI-Powered Centralized Healthcare

A comprehensive Next.js frontend for an AI-Powered Centralized Healthcare Platform built with TypeScript and Tailwind CSS. This platform supports patient, doctor, insurance agent, and admin interactions with modern UI/UX design.

## 🚀 Features

### User Authentication
- **Multi-role Login/Signup**: Support for Patients, Doctors, Insurance Agents, and Admins
- **JWT Token Management**: Secure authentication with localStorage/cookie storage
- **Role-based Dashboard Redirection**: Automatic routing based on user role

### Patient Dashboard
- **Medical Document Management**: Upload and view prescriptions, lab reports, and medical history
- **AI Health Summary**: AI-generated health insights and recommendations
- **Symptom Checker**: AI-powered symptom analysis with possible conditions
- **Insurance Integration**: Policy linking and claim status tracking
- **Notifications**: Real-time alerts for AI insights, reports, and claims

### Doctor Dashboard
- **Patient Management**: View assigned patients' medical history
- **Diagnostic Tools**: Add diagnostic notes and prescriptions
- **AI Summaries**: Access AI-generated patient summaries
- **Claims Approval**: Review and approve insurance claims
- **Medical Records**: Comprehensive patient record management

### Insurance Agent Dashboard
- **Policy Management**: View and manage patient insurance policies
- **Claims Processing**: Verify and update claim status
- **Patient Verification**: Access linked patients' information
- **Notifications**: Alerts for new claims and policy updates

### Admin Dashboard
- **User Management**: Manage patients, doctors, and insurance agents
- **System Analytics**: Dashboard with key performance indicators
- **Audit Logs**: Comprehensive system activity monitoring
- **Platform Monitoring**: System health and performance metrics

## 🛠️ Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **File Upload**: React Dropzone
- **Notifications**: React Hot Toast
- **Authentication**: JWT with custom implementation

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   │   ├── login/         # Login page
│   │   └── register/      # Registration page
│   ├── dashboard/         # Dashboard pages
│   │   ├── patient/       # Patient dashboard
│   │   ├── doctor/        # Doctor dashboard
│   │   ├── insurance/     # Insurance dashboard
│   │   └── admin/         # Admin dashboard
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/               # UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       └── StatCard.tsx
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── lib/                  # Utility libraries
│   ├── auth.ts          # Authentication utilities
│   └── api.ts           # API client
├── types/               # TypeScript type definitions
│   └── index.ts
└── middleware.ts        # Next.js middleware
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd healthcare-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Credentials

The application includes demo credentials for testing:

- **Patient**: `patient@demo.com` / `password123`
- **Doctor**: `doctor@demo.com` / `password123`
- **Insurance Agent**: `insurance@demo.com` / `password123`
- **Admin**: `admin@demo.com` / `password123`

## 🎨 Design Features

### Modern UI/UX
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Dark/Light Theme Support**: Consistent color schemes
- **Interactive Components**: Hover effects, animations, and transitions
- **Accessibility**: WCAG compliant design patterns

### User Experience
- **Intuitive Navigation**: Role-based sidebar navigation
- **Real-time Updates**: Live notifications and status updates
- **File Upload**: Drag-and-drop document upload with progress tracking
- **Data Visualization**: Charts and statistics for better insights

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
JWT_SECRET=your-secret-key
```

### API Integration
The frontend is designed to work with a backend API. Update the `API_BASE_URL` in `src/lib/api.ts` to point to your backend server.

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop**: Full-featured dashboard experience
- **Tablet**: Adapted layouts with touch-friendly interactions
- **Mobile**: Streamlined mobile interface with essential features

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Route Protection**: Middleware-based route protection
- **Role-based Access**: Different access levels for different user types
- **Input Validation**: Client-side form validation
- **Secure File Upload**: File type and size validation

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@healthcare-platform.com or create an issue in the repository.

## 🔮 Future Enhancements

- **Real-time Chat**: Doctor-patient communication
- **Video Consultations**: Integrated video calling
- **Mobile App**: React Native mobile application
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Third-party healthcare system integration
- **Multi-language Support**: Internationalization
- **Advanced Security**: Two-factor authentication
- **Blockchain Integration**: Secure medical record storage

---

Built with ❤️ using Next.js, TypeScript, and Tailwind CSS
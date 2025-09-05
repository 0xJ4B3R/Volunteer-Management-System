# Volunteer Management System

A comprehensive web application for managing volunteer activities and community service programs at **Neveh Horim**, an elderly home in Jerusalem. This system facilitates the coordination between volunteers, residents, and managers to enhance the quality of life for elderly residents through meaningful volunteer interactions and activities.

## 📚 Course Information

This project is part of the **Software Engineering in the Service of the Community** course at **Azrieli College of Engineering Jerusalem**. The course focuses on developing software solutions that address real-world community needs and challenges.

## 🌟 Features

### Manager Features
- **Dashboard**: Overview of volunteer activities, statistics, and quick actions
- **Volunteer Management**: Add, edit, delete, and manage volunteer profiles
- **Resident Management**: Manage resident profiles and preferences
- **Calendar & Scheduling**: Create and manage sessions with recurring patterns
- **Appointment Management**: Handle volunteer requests and approvals
- **Attendance Tracking**: Record and manage attendance for sessions
- **Reports Generation**: Generate detailed reports in PDF format
- **Matching Rules**: Configure AI-powered matching algorithms
- **Multi-language Support**: Hebrew and English interface

### Volunteer Features
- **Dashboard**: Personal overview of upcoming sessions and statistics
- **Calendar View**: Browse available sessions and request participation
- **Appointment History**: View past and upcoming appointments
- **Attendance Management**: Mark attendance for completed sessions
- **Profile Management**: Update personal information and preferences

### System Features
- **AI-Powered Matching**: Intelligent algorithm to match volunteers with residents
- **Real-time Updates**: Live synchronization using Firebase
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **RTL Support**: Full right-to-left language support for Hebrew
- **Export/Import**: CSV import/export functionality for data management
- **Authentication**: Secure login system with role-based access

## 🛠 Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe JavaScript development
- **JavaScript** - Used for volunteer-side components and functionality
- **CSS** - Custom styling for volunteer components and responsive design
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn/ui** - High-quality React components
- **Radix UI** - Accessible component primitives

### State Management
- **Redux Toolkit** - Predictable state management
- **React Query** - Server state management and caching

### Backend & Database
- **Firebase** - Backend-as-a-Service platform
  - **Firestore** - NoSQL cloud database
  - **Authentication** - User authentication system
  - **Storage** - File storage solution

### Internationalization
- **i18next** - Internationalization framework
- **react-i18next** - React bindings for i18next

### Additional Libraries
- **React Router DOM** - Client-side routing
- **React Hook Form** - Form handling and validation
- **Zod** - TypeScript-first schema validation
- **Date-fns** - Date utility library
- **Recharts** - Chart library for data visualization
- **jsPDF** - PDF generation
- **Framer Motion** - Animation library

## 📋 Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v8 or higher)
- **Firebase account** with a project set up

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Volunteer-Management-System
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Firebase Configuration

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password)
4. Create a web app in your Firebase project
5. Copy the Firebase configuration

### 4. Environment Variables

Create a `.env` file in the root directory with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 5. Database Setup

The application will automatically create the necessary collections in Firestore when you first run it. The main collections are:

- `users` - User accounts and authentication
- `volunteers` - Volunteer profiles and information
- `residents` - Resident profiles and preferences
- `calendar_slots` - Session scheduling and management
- `appointments` - Appointment records
- `attendance` - Attendance tracking
- `matching_rules` - AI matching algorithm configuration
- `reports` - Generated reports
- `external_groups` - External group visit management

### 6. Initialize Manager Account

Before running the application, you need to create the first manager account:

```bash
npm run init-manager
```

This script will guide you through creating a manager account with:
- Username and full name
- Secure password (automatically hashed)
- Proper role assignment

The script includes validation and will prevent duplicate usernames. After creation, you can use these credentials to log in as a manager.

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:8080`

### 8. Build for Production

```bash
npm run build
```

## 👥 User Roles

### Manager
- Full access to all system features
- Can manage volunteers, residents, and sessions
- Can generate reports and configure matching rules
- Can approve/reject volunteer requests

### Volunteer
- Limited access to personal features
- Can browse and request session participation
- Can manage personal profile and attendance
- Can view appointment history

## 🔧 Configuration

### Matching Algorithm
The system includes a configurable AI matching algorithm that considers:
- Language preferences
- Availability matching
- Skills compatibility
- Hobbies matching
- Age proximity
- Gender preferences
- Prior visit history

### Session Categories
Supported session types:
- Music
- Gardening
- Beads/Crafts
- Art
- Baking

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🌐 Internationalization

The system supports multiple languages:
- **English** - Default language
- **Hebrew** - Full RTL support

Language switching is available in the user interface.

## 🔒 Security Features

- Role-based access control
- Secure authentication
- Input validation and sanitization
- Protected routes
- Secure API endpoints

## 📊 Reporting

The system includes comprehensive reporting features:
- Volunteer activity reports
- Resident engagement reports
- Attendance statistics
- Session summaries
- Export to PDF format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is developed as part of the Software Engineering in the Service of the Community course at Azrieli College of Engineering Jerusalem.

## 👨‍💻 Development Team

This project was developed by students in the Software Engineering program at Azrieli College of Engineering Jerusalem, under the guidance of course instructors.

---

**Note**: This is an educational project developed for the Software Engineering in the Service of the Community course. It demonstrates modern web development practices and real-world application development.
// giga
// import { Provider } from "react-redux";
// import { store, persistor } from "@/store";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { Toaster as Sonner } from "@/components/ui/sonner";
// import ProtectedRoute from "@/components/auth/ProtectedRoute";
// import { PersistGate } from "redux-persist/integration/react";
// import { BrowserRouter, Routes, Route } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// // General Pages
// import Index from "@/pages/Index";
// import Login from "@/pages/Login";
// import ForgotPassword from "@/pages/ForgotPassword";
// import NotFound from "@/pages/NotFound";

// // Volunteer Pages
// import VolunteerDashboard from "@/pages/volunteer/Dashboard";
// import VolunteerCalendar from "@/pages/volunteer/Calendar";
// import VolunteerAppointments from "@/pages/volunteer/Appointments";
// // import VolunteerAttendance from "@/pages/volunteer/Attendance";
// import VolunteerProfile from "@/pages/volunteer/Profile";

// // Manager Pages
// import Dashboard from "@/pages/manager/Dashboard";
// import Calendar from "@/pages/manager/Calendar";
// import Appointments from "@/pages/manager/Appointments";
// import Volunteers from "@/pages/manager/Volunteers";
// import Residents from "@/pages/manager/Residents";
// import MatchingRules from "@/pages/manager/MatchingRules";
// import Reports from "@/pages/manager/Reports";
// import Settings from "@/pages/manager/Settings";

// // Test Pages
// import TestVolunteers from './pages/test/TestVolunteers';
// import TestResidents from './pages/test/TestResidents';
// import CalendarFirestoreTest from './pages/test/CalendarFirestoreTest';

// const queryClient = new QueryClient();

// // Helper to DRY up ProtectedRoutes
// const RoleRoute = ({ role, element }) => (
//   <ProtectedRoute allowedRoles={[role]}>
//     {element}
//   </ProtectedRoute>
// );

// const App = () => (
//   <Provider store={store}>
//     <PersistGate loading={null} persistor={persistor}>
//       <QueryClientProvider client={queryClient}>
//         <TooltipProvider>
//           <Toaster />
//           <Sonner />
//           <BrowserRouter>
//             <Routes>
//               <Route path="/" element={<Index />} />
//               <Route path="/login" element={<Login />} />
//               <Route path="forgot-password" element={<ForgotPassword />}/>

//               {/* Manager Routes */}
//               <Route
//                 path="/manager"
//                 element={<RoleRoute role="manager" element={<Dashboard />} />}
//               />
//               <Route
//                 path="/manager/calendar"
//                 element={<RoleRoute role="manager" element={<Calendar />} />}
//               />
//               <Route
//                 path="/manager/appointments"
//                 element={<RoleRoute role="manager" element={<Appointments />} />}
//               />
//               <Route
//                 path="/manager/volunteers"
//                 element={<RoleRoute role="manager" element={<Volunteers />} />}
//               />
//               <Route
//                 path="/manager/residents"
//                 element={<RoleRoute role="manager" element={<Residents />} />}
//               />
//               <Route
//                 path="/manager/matching-rules"
//                 element={<RoleRoute role="manager" element={<MatchingRules />} />}
//               />
//               <Route
//                 path="/manager/reports/*"
//                 element={<RoleRoute role="manager" element={<Reports />} />}
//               />
//               <Route
//                 path="/manager/settings"
//                 element={<RoleRoute role="manager" element={<Settings />} />}
//               />
              
//               {/* Volunteer Routes */}
//               <Route
//                 path="/volunteer"
//                 element={<RoleRoute role="volunteer" element={<VolunteerDashboard />} />}
//               />
//               <Route
//                 path="/volunteer/calendar"
//                 element={<RoleRoute role="volunteer" element={<VolunteerCalendar />} />}
//               />
//               <Route
//                 path="/volunteer/appointments"
//                 element={<RoleRoute role="volunteer" element={<VolunteerAppointments />} />}
//               />
//               {/* <Route
//                 path="/volunteer/attendance"
//                 element={<RoleRoute role="volunteer" element={<VolunteerAttendance />} />}
//               /> */}
//               <Route
//                 path="/volunteer/profile"
//                 element={<RoleRoute role="volunteer" element={<VolunteerProfile />} />}
//               />

//               {/* Test Routes */}
//               <Route path="/test/volunteers" element={<TestVolunteers />} />
//               <Route path="/test/residents" element={<TestResidents />} />
//               <Route path="/test/calendar-firestore-test" element={<CalendarFirestoreTest />} />
              
//               {/* Catch-all 404 */}
//               <Route path="*" element={<NotFound />} />
//             </Routes>
//           </BrowserRouter>
//         </TooltipProvider>
//       </QueryClientProvider>
//     </PersistGate>
//   </Provider>
// );

// export default App; 

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/volunteer/Layout';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// General Pages
import Login from '@/pages/Login';
import ForgotPassword from '@/pages/ForgotPassword';
import NotFound from '@/pages/NotFound';

// Volunteer Pages
import VolunteerDashboard from '@/pages/volunteer/Dashboard';
import VolunteerCalendar from '@/pages/volunteer/Calendar';
import VolunteerAppointments from '@/pages/volunteer/Appointments';
// import VolunteerAttendance from '@/pages/volunteer/Attendance';
import VolunteerProfile from '@/pages/volunteer/Profile';

// Manager Pages
import Dashboard from '@/pages/manager/Dashboard';
import Calendar from '@/pages/manager/Calendar';
import Appointments from '@/pages/manager/Appointments';
import Volunteers from '@/pages/manager/Volunteers';
import Residents from '@/pages/manager/Residents';
import MatchingRules from '@/pages/manager/MatchingRules';
import Reports from '@/pages/manager/Reports';
import Settings from '@/pages/manager/Settings';

// Test Pages
import TestVolunteers from '@/pages/test/TestVolunteers';
import TestResidents from '@/pages/test/TestResidents';
import CalendarFirestoreTest from '@/pages/test/CalendarFirestoreTest';

// Wrapper component to add Layout to protected routes
const LayoutRoute = ({ 
  element, 
  role 
}: { 
  element: React.ReactElement, 
  role: 'volunteer' | 'manager' 
}) => (
  <ProtectedRoute allowedRoles={[role]}>
    <Layout>{element}</Layout>
  </ProtectedRoute>
);

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Manager Routes */}
      <Route
        path="/manager"
        element={<LayoutRoute role="manager" element={<Dashboard />} />}
      />
      <Route
        path="/manager/calendar"
        element={<LayoutRoute role="manager" element={<Calendar />} />}
      />
      <Route
        path="/manager/appointments"
        element={<LayoutRoute role="manager" element={<Appointments />} />}
      />
      <Route
        path="/manager/volunteers"
        element={<LayoutRoute role="manager" element={<Volunteers />} />}
      />
      <Route
        path="/manager/residents"
        element={<LayoutRoute role="manager" element={<Residents />} />}
      />
      <Route
        path="/manager/matching-rules"
        element={<LayoutRoute role="manager" element={<MatchingRules />} />}
      />
      <Route
        path="/manager/reports/*"
        element={<LayoutRoute role="manager" element={<Reports />} />}
      />
      <Route
        path="/manager/settings"
        element={<LayoutRoute role="manager" element={<Settings />} />}
      />
      
      {/* Volunteer Routes */}
      <Route
        path="/volunteer"
        element={<LayoutRoute role="volunteer" element={<VolunteerDashboard />} />}
      />
      <Route
        path="/volunteer/calendar"
        element={<LayoutRoute role="volunteer" element={<VolunteerCalendar />} />}
      />
      <Route
        path="/volunteer/appointments"
        element={<LayoutRoute role="volunteer" element={<VolunteerAppointments />} />}
      />
      {/* <Route
        path="/volunteer/attendance"
        element={<LayoutRoute role="volunteer" element={<VolunteerAttendance />} />}
      /> */}
      <Route
        path="/volunteer/profile"
        element={<LayoutRoute role="volunteer" element={<VolunteerProfile />} />}
      />

      {/* Test Routes */}
      <Route path="/test/volunteers" element={<TestVolunteers />} />
      <Route path="/test/residents" element={<TestResidents />} />
      <Route path="/test/calendar-firestore-test" element={<CalendarFirestoreTest />} />
      
      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
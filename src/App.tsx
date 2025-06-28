// React and Redux
import { useEffect } from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Store and State Management
import { store, persistor } from "@/store";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { loginSuccess } from "@/store/slices/authSlice";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "@/components/ui/sonner";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// General Pages
import Index from "@/pages/Index";
import Login from "@/pages/Login.jsx";
import NotFound from "@/pages/NotFound.jsx";

// Volunteer Pages
import VolunteerDashboard from "@/pages/volunteer/Dashboard.jsx";
import VolunteerCalendar from "@/pages/volunteer/Calendar.jsx";
import VolunteerAppointments from "@/pages/volunteer/Appointments.jsx";
import VolunteerAttendance from "@/pages/volunteer/Attendance.jsx";
import VolunteerProfile from "@/pages/volunteer/Profile.jsx";

// Manager Pages
import Dashboard from "@/pages/manager/Dashboard";
import Calendar from "@/pages/manager/Calendar";
import Appointments from "@/pages/manager/Appointments";
import Volunteers from "@/pages/manager/Volunteers";
import Residents from "@/pages/manager/Residents";
import MatchingRules from "@/pages/manager/MatchingRules";
import Reports from "@/pages/manager/Reports";
import Settings from "@/pages/manager/Settings";

const queryClient = new QueryClient();

// Auth Initializer Component
const AuthInitializer = ({ children }: { children: React.ReactNode }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Initialize auth state from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.id && user.role) {
          dispatch(loginSuccess({
            user: {
              id: user.id,
              username: user.username,
              role: user.role,
              email: user.email || ''
            },
            token: 'firebase-authenticated'
          }));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
  }, [dispatch]);

  return children;
};

// Helper to DRY up ProtectedRoutes
const RoleRoute = ({ role, element }: { role: 'manager' | 'volunteer'; element: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={[role]}>
    {element}
  </ProtectedRoute>
);

const App = () => (
  <Provider store={store}>
    <PersistGate loading={null} persistor={persistor}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthInitializer>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />

                {/* Volunteer Routes */}
                <Route
                  path="/volunteer"
                  element={<RoleRoute role="volunteer" element={<VolunteerDashboard />} />}
                />
                <Route
                  path="/volunteer/calendar"
                  element={<RoleRoute role="volunteer" element={<VolunteerCalendar />} />}
                />
                <Route
                  path="/volunteer/appointments"
                  element={<RoleRoute role="volunteer" element={<VolunteerAppointments />} />}
                />
                <Route
                  path="/volunteer/attendance"
                  element={<RoleRoute role="volunteer" element={<VolunteerAttendance />} />}
                />
                <Route
                  path="/volunteer/profile"
                  element={<RoleRoute role="volunteer" element={<VolunteerProfile />} />}
                />

                {/* Manager Routes */}
                <Route
                  path="/manager"
                  element={<RoleRoute role="manager" element={<Dashboard />} />}
                />
                <Route
                  path="/manager/calendar"
                  element={<RoleRoute role="manager" element={<Calendar />} />}
                />
                <Route
                  path="/manager/appointments"
                  element={<RoleRoute role="manager" element={<Appointments />} />}
                />
                <Route
                  path="/manager/volunteers"
                  element={<RoleRoute role="manager" element={<Volunteers />} />}
                />
                <Route
                  path="/manager/residents"
                  element={<RoleRoute role="manager" element={<Residents />} />}
                />
                <Route
                  path="/manager/matching-rules"
                  element={<RoleRoute role="manager" element={<MatchingRules />} />}
                />
                <Route
                  path="/manager/reports/*"
                  element={<RoleRoute role="manager" element={<Reports />} />}
                />
                <Route
                  path="/manager/settings"
                  element={<RoleRoute role="manager" element={<Settings />} />}
                />

                {/* Catch-all 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </AuthInitializer>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App; 
import { Clock, Calendar, Award, Home, ClipboardList, User } from 'lucide-react';
import { VolunteerProfile, Appointment, StatCard, NavigationItem } from '../types/VolunteerTypes';

export const volunteerProfile: VolunteerProfile = {
  name: "Sarah Johnson",
  email: "sarah.johnson@example.com",
  avatar: "https://source.unsplash.com/80x80/?portrait,woman,smile"
};

export const appointments: Appointment[] = [
  { date: "May 15, 2024", place: "Community Center", time: "10:00 AM" },
  { date: "May 22, 2024", place: "Local Food Bank", time: "2:00 PM" }
];

export const stats: StatCard[] = [
  {
    label: "Total Hours",
    value: 42,
    icon: Clock,
    color: "bg-blue-100 text-blue-800",
    border: "border-blue-200"
  },
  {
    label: "Upcoming Events",
    value: 3,
    icon: Calendar,
    color: "bg-green-100 text-green-800",
    border: "border-green-200"
  },
  {
    label: "Achievements",
    value: 2,
    icon: Award,
    color: "bg-purple-100 text-purple-800",
    border: "border-purple-200"
  }
];

export const navigation: NavigationItem[] = [
  { name: 'Dashboard', icon: Home, path: 'dashboard' },
  { name: 'Calendar', icon: Calendar, path: 'calendar' },
  { name: 'Appointments', icon: ClipboardList, path: 'appointments' },
  { name: 'Profile', icon: User, path: 'profile' },
];
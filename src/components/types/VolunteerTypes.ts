// Types for volunteer application
import { LucideIcon } from 'lucide-react';

export interface VolunteerProfile {
  name: string;
  email: string;
  avatar: string;
}

export interface Appointment {
  date: string;
  place: string;
  time: string;
}

export interface StatCard {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  border: string;
}

export interface NavigationItem {
  name: string;
  icon: LucideIcon;
  path: string;
}
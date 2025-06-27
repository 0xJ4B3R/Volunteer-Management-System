
import React from 'react';
import { 
  BarChart3, 
  Calendar, 
  CalendarDays, 
  Check, 
  Clock, 
  Download, 
  ExternalLink, 
  MessageSquareText, 
  Star, 
  Upload, 
  UserPlus, 
  Users, 
  Zap 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

// Mock data for appointments
const upcomingAppointment = {
  date: 'Tomorrow',
  time: '2:00 PM - 3:30 PM',
  type: 'Reading Session',
  location: 'Sunny Pines Home, Room 102',
  residents: ['John D.', 'Sarah M.']
};

// Mock data for AI match suggestion
const aiSuggestion = {
  residentName: 'Maria G.',
  interests: ['Music', 'Gardening', 'Spanish'],
  matchScore: 92,
  availability: 'Tuesday & Thursday afternoons'
};

// Mock data for volunteer stats
const volunteerStats = {
  hoursThisMonth: 16,
  sessionsAttended: 8,
  attendanceRate: 100,
  positiveReviews: 7
};

// Mock data for fellow volunteers
const fellowVolunteers = [
  { initial: 'AB', name: 'Alex B.', hoursThisMonth: 12 },
  { initial: 'CJ', name: 'Chris J.', hoursThisMonth: 15 },
  { initial: 'DM', name: 'Dana M.', hoursThisMonth: 10 },
  { initial: 'JW', name: 'Jamie W.', hoursThisMonth: 8 }
];

const VolunteerWidgets: React.FC = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Appointment Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Upcoming Appointment</CardTitle>
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{upcomingAppointment.date}</p>
                <p className="text-sm text-muted-foreground">{upcomingAppointment.time}</p>
              </div>
              <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {upcomingAppointment.type}
              </span>
            </div>
            
            <p className="text-sm">
              <span className="font-medium">Location:</span> {upcomingAppointment.location}
            </p>
            
            <div className="pt-2">
              <p className="text-sm font-medium mb-1">Residents:</p>
              <div className="flex flex-wrap gap-1">
                {upcomingAppointment.residents.map(resident => (
                  <span key={resident} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
                    {resident}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Clock className="mr-1 h-4 w-4" />
              Reschedule
            </Button>
            <Button size="sm">
              <Check className="mr-1 h-4 w-4" />
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* AI Suggested Match Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">AI Suggested Match</CardTitle>
          <Star className="h-5 w-5 text-amber-500" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-lg">{aiSuggestion.residentName}</p>
              <span className="flex items-center text-sm font-medium text-green-600">
                <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {aiSuggestion.matchScore}% Match
                </span>
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-1">Interests:</p>
              <div className="flex flex-wrap gap-1">
                {aiSuggestion.interests.map(interest => (
                  <span key={interest} className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            
            <p className="text-sm">
              <span className="font-medium">Availability:</span> {aiSuggestion.availability}
            </p>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <ExternalLink className="mr-1 h-4 w-4" />
              View Details
            </Button>
            <Button size="sm">
              <Calendar className="mr-1 h-4 w-4" />
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* My Stats Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">My Stats</CardTitle>
          <BarChart3 className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-2xl font-bold">{volunteerStats.hoursThisMonth}</p>
              <p className="text-xs text-muted-foreground">Hours This Month</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{volunteerStats.sessionsAttended}</p>
              <p className="text-xs text-muted-foreground">Sessions Attended</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Attendance Rate</span>
                <span className="text-sm font-semibold">{volunteerStats.attendanceRate}%</span>
              </div>
              <Progress value={volunteerStats.attendanceRate} className="h-2" />
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm">Positive Reviews</span>
                <span className="text-sm font-semibold">{volunteerStats.positiveReviews}</span>
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < volunteerStats.positiveReviews/2 ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
            </div>
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-4">
            <Download className="mr-1 h-4 w-4" />
            Download Report
          </Button>
        </CardContent>
      </Card>
      
      {/* Fellow Volunteers Widget */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-md font-medium">Fellow Volunteers</CardTitle>
          <Users className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {fellowVolunteers.map((volunteer, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center mr-2">
                    <span className="text-xs font-medium">{volunteer.initial}</span>
                  </div>
                  <span className="text-sm font-medium">{volunteer.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">{volunteer.hoursThisMonth} hrs</span>
              </div>
            ))}
          </div>
          
          <Button variant="outline" size="sm" className="w-full mt-4">
            <MessageSquareText className="mr-1 h-4 w-4" />
            Community Chat
          </Button>
        </CardContent>
      </Card>
      
      {/* Quick Actions Widget */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-md font-medium">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Button size="sm" className="justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              Add Availability
            </Button>
            <Button size="sm" className="justify-start">
              <Upload className="mr-2 h-4 w-4" />
              Upload Documents
            </Button>
            <Button size="sm" className="justify-start">
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Friend
            </Button>
            <Button size="sm" className="justify-start">
              <MessageSquareText className="mr-2 h-4 w-4" />
              Contact Manager
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VolunteerWidgets;

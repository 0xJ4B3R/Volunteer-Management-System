import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Menu,
  RefreshCw,
  Search,
  User,
  X,
  Info,
  Plus,
  Heart,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar as CalendarIcon,
  Grid,
  List,
  ChevronDown,
  Check,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import NotificationsPanel from "@/components/common/NotificationsPanel";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock data for calendar slots
const calendarSlots = [
  {
    id: 1,
    date: new Date(2025, 3, 10),
    startTime: "10:00 AM",
    endTime: "11:30 AM",
    type: "Reading",
    available: true,
    volunteers: ["JD", "AS"],
    maxVolunteers: 5
  },
  {
    id: 2,
    date: new Date(2025, 3, 10),
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    type: "Games",
    available: true,
    volunteers: ["BT"],
    maxVolunteers: 4
  },
  {
    id: 3,
    date: new Date(2025, 3, 11),
    startTime: "1:00 PM",
    endTime: "2:30 PM",
    type: "Music",
    available: true,
    volunteers: ["CL", "RJ", "MG"],
    maxVolunteers: 3
  },
  {
    id: 4,
    date: new Date(2025, 3, 12),
    startTime: "11:00 AM",
    endTime: "12:30 PM",
    type: "Reading",
    available: true,
    volunteers: [],
    maxVolunteers: 4
  },
  {
    id: 5,
    date: new Date(2025, 3, 13),
    startTime: "3:00 PM",
    endTime: "4:30 PM",
    type: "Games",
    available: false,
    volunteers: ["JD", "AS", "BT", "CL"],
    maxVolunteers: 4
  },
  {
    id: 6,
    date: new Date(2025, 3, 13),
    startTime: "3:00 PM",
    endTime: "4:30 PM",
    type: "Games",
    available: false,
    volunteers: ["JD", "AS", "BT", "CL"],
    maxVolunteers: 4
  }
];

// Function to get the color for a session type
const getSessionTypeColor = (type) => {
  switch (type.toLowerCase()) {
    case "reading":
      return "bg-green-100 text-green-800";
    case "games":
      return "bg-blue-100 text-blue-800";
    case "music":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const VolunteerCalendar = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 10));
  const [viewMode, setViewMode] = useState("week");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSessionType, setSelectedSessionType] = useState("all");

  // Example notification data
  const notifications = [
    { id: 1, message: "New calendar slot available", time: "5 minutes ago" },
    { id: 2, message: "Your session request was approved", time: "1 hour ago" },
    { id: 3, message: "Schedule change for tomorrow", time: "Today, 9:15 AM" }
  ];

  // Check authentication
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (!user.username) {
      navigate("/login");
    } else if (user.role !== "volunteer") {
      navigate("/manager");
    }
  }, [navigate]);

  // Handle window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
        setViewMode("week");
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/login");
  };

  const refreshCalendar = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Calendar refreshed",
        description: "Calendar data has been updated.",
      });
    }, 1000);
  };

  const handleBookSession = () => {
    if (!selectedSlot) return;
    toast({
      title: "Session requested",
      description: `You have requested a session on ${selectedSlot.date.toLocaleDateString()} at ${selectedSlot.startTime}.`,
    });
    setSelectedSlot(null);
  };

  // Get displayed dates for week view
  const getWeekDates = () => {
    const dates = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Filter slots based on selected date and showOnlyAvailable setting
  const getFilteredSlots = () => {
    let filtered = [...calendarSlots];
    if (viewMode === "week") {
      const weekDates = getWeekDates();
      const startDate = weekDates[0];
      const endDate = weekDates[6];
      filtered = filtered.filter(slot =>
        slot.date >= startDate &&
        slot.date <= endDate
      );
    } else if (viewMode === "month") {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      filtered = filtered.filter(slot =>
        slot.date.getFullYear() === year &&
        slot.date.getMonth() === month
      );
    }
    if (showOnlyAvailable) {
      filtered = filtered.filter(slot =>
        slot.available && slot.volunteers.length < slot.maxVolunteers
      );
    }
    if (selectedSessionType !== "all") {
      filtered = filtered.filter(slot =>
        slot.type.toLowerCase() === selectedSessionType.toLowerCase()
      );
    }
    return filtered;
  };

  // Get unique session types for filter
  const getSessionTypes = () => {
    const types = new Set();
    calendarSlots.forEach(slot => types.add(slot.type));
    return Array.from(types);
  };

  // Format date for display
  const formatDateDisplay = () => {
    if (viewMode === "week") {
      const weekDates = getWeekDates();
      return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    } else if (viewMode === "month") {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      return "All Sessions";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        

        {/* Calendar Content */}
        <main className="flex-1 overflow-auto p-4">
          {/* Calendar Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
            <div className="flex items-center">
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === "week") {
                    newDate.setDate(currentDate.getDate() - 7);
                  } else if (viewMode === "month") {
                    newDate.setMonth(currentDate.getMonth() - 1);
                  }
                  setCurrentDate(newDate);
                }}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="mx-4 text-lg font-medium">
                {formatDateDisplay()}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newDate = new Date(currentDate);
                  if (viewMode === "week") {
                    newDate.setDate(currentDate.getDate() + 7);
                  } else if (viewMode === "month") {
                    newDate.setMonth(currentDate.getMonth() + 1);
                  }
                  setCurrentDate(newDate);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="ml-2"
                onClick={() => setCurrentDate(new Date())}
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={refreshCalendar}
                disabled={isLoading}
              >
                <RefreshCw className={cn("h-4 w-4", { "animate-spin": isLoading })} />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tabs
                value={viewMode}
                onValueChange={setViewMode}
                className="w-auto"
              >
                <TabsList>
                  <TabsTrigger value="week" className="text-xs">
                    <Calendar className="h-4 w-4 mr-1" />
                    Week
                  </TabsTrigger>
                  <TabsTrigger value="month" className="text-xs">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Month
                  </TabsTrigger>
                  <TabsTrigger value="list" className="text-xs">
                    <List className="h-4 w-4 mr-1" />
                    List
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center">
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <div className="p-2">
                    <div className="flex items-center space-x-2 mb-2">
                      <Switch
                        id="available-only"
                        checked={showOnlyAvailable}
                        onCheckedChange={setShowOnlyAvailable}
                      />
                      <Label htmlFor="available-only">Available slots only</Label>
                    </div>
                    <Select
                      value={selectedSessionType}
                      onValueChange={setSelectedSessionType}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select session type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Session Types</SelectItem>
                        {getSessionTypes().map((type) => (
                          <SelectItem key={type} value={type.toLowerCase()}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Calendar Content */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            {viewMode === "week" && (
              <div>
                {/* Week Header */}
                <div className="grid grid-cols-7 border-b border-slate-200">
                  {getWeekDates().map((date, index) => (
                    <div 
                      key={index} 
                      className={cn(
                        "p-2 text-center border-r border-slate-200 last:border-r-0",
                        date.toDateString() === new Date().toDateString() ? "bg-blue-50" : ""
                      )}
                    >
                      <div className="text-sm font-medium">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center mx-auto mt-1",
                        date.toDateString() === new Date().toDateString() ? "bg-blue-500 text-white" : ""
                      )}>
                        {date.getDate()}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Week Content */}
                <div className="grid grid-cols-7 min-h-[600px]">
                  {getWeekDates().map((date, index) => (
                    <div 
                      key={index} 
                      className="border-r border-slate-200 last:border-r-0 p-2"
                    >
                      {getFilteredSlots()
                        .filter(slot => slot.date.toDateString() === date.toDateString())
                        .map(slot => (
                          <Dialog key={slot.id}>
                            <DialogTrigger asChild>
                              <div
                                className={cn(
                                  "p-2 rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity",
                                  getSessionTypeColor(slot.type),
                                  !slot.available || slot.volunteers.length >= slot.maxVolunteers ? "opacity-50" : "opacity-100"
                                )}
                                onClick={() => setSelectedSlot(slot)}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{slot.startTime}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {slot.type}
                                  </Badge>
                                </div>
                                <div className="text-xs mt-1">
                                  {slot.startTime} - {slot.endTime}
                                </div>
                                <div className="flex items-center gap-1 mt-1 text-xs">
                                  <Users className="h-3 w-3" />
                                  <span>
                                    {slot.volunteers.length}/{slot.maxVolunteers}
                                  </span>
                                </div>
                              </div>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Session Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="flex items-center justify-between">
                                  <Badge className={getSessionTypeColor(slot.type)}>
                                    {slot.type}
                                  </Badge>
                                  <Badge 
                                    variant={slot.available && slot.volunteers.length < slot.maxVolunteers ? "outline" : "secondary"}
                                  >
                                    {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-xs text-slate-500">Date</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Calendar className="h-4 w-4 mr-2" />
                                      {slot.date.toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Time</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Clock className="h-4 w-4 mr-2" />
                                      {slot.startTime} - {slot.endTime}
                                    </div>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">Volunteers</Label>
                                  <div className="font-medium flex items-center mt-1">
                                    <Users className="h-4 w-4 mr-2" />
                                    {slot.volunteers.length > 0 
                                      ? slot.volunteers.join(", ")
                                      : "No volunteers yet"}
                                    <span className="text-sm text-slate-500 ml-1">
                                      ({slot.volunteers.length}/{slot.maxVolunteers})
                                    </span>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-slate-500">Additional Notes</Label>
                                  <p className="text-sm mt-1">
                                    This is a {slot.type.toLowerCase()} session that needs volunteer support.
                                    Please arrive 15 minutes before the session starts.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setSelectedSlot(null)}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleBookSession}
                                  disabled={!slot.available || slot.volunteers.length >= slot.maxVolunteers}
                                >
                                  <Heart className="h-4 w-4 mr-2" />
                                  Volunteer for this Session
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {viewMode === "month" && (
              <div className="grid grid-cols-7 min-h-[600px]">
                {/* Month view implementation */}
                <div className="col-span-7 p-4 text-center border-b border-slate-200">
                  <p className="text-slate-500">Month view implementation</p>
                </div>
              </div>
            )}

            {viewMode === "list" && (
              <div className="p-4">
                {getFilteredSlots().length > 0 ? (
                  <div className="space-y-2">
                    {getFilteredSlots().map(slot => (
                      <Card key={slot.id} className="overflow-hidden">
                        <div className={cn(
                          "h-1 w-full",
                          getSessionTypeColor(slot.type)
                        )} />
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base flex items-center">
                              <span className="font-medium">{slot.date.toLocaleDateString()}</span>
                              <span className="mx-2 text-slate-300">•</span>
                              <span>{slot.startTime} - {slot.endTime}</span>
                            </CardTitle>
                            <Badge className={getSessionTypeColor(slot.type)}>
                              {slot.type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1 text-slate-500" />
                                <span className="text-sm">
                                  {slot.volunteers.length}/{slot.maxVolunteers} volunteers
                                </span>
                              </div>
                              <div className="flex items-center">
                                {slot.available && slot.volunteers.length < slot.maxVolunteers ? (
                                  <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 mr-1 text-orange-500" />
                                )}
                                <span className="text-sm">
                                  {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                </span>
                              </div>
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedSlot(slot)}
                                >
                                  View Details
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Session Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="flex items-center justify-between">
                                    <Badge className={getSessionTypeColor(slot.type)}>
                                      {slot.type}
                                    </Badge>
                                    <Badge 
                                      variant={slot.available && slot.volunteers.length < slot.maxVolunteers ? "outline" : "secondary"}
                                    >
                                      {slot.available && slot.volunteers.length < slot.maxVolunteers ? "Available" : "Unavailable"}
                                    </Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <Label className="text-xs text-slate-500">Date</Label>
                                      <div className="font-medium flex items-center mt-1">
                                        <Calendar className="h-4 w-4 mr-2" />
                                        {slot.date.toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div>
                                      <Label className="text-xs text-slate-500">Time</Label>
                                      <div className="font-medium flex items-center mt-1">
                                        <Clock className="h-4 w-4 mr-2" />
                                        {slot.startTime} - {slot.endTime}
                                      </div>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Volunteers</Label>
                                    <div className="font-medium flex items-center mt-1">
                                      <Users className="h-4 w-4 mr-2" />
                                      {slot.volunteers.length > 0 
                                        ? slot.volunteers.join(", ")
                                        : "No volunteers yet"}
                                      <span className="text-sm text-slate-500 ml-1">
                                        ({slot.volunteers.length}/{slot.maxVolunteers})
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-slate-500">Additional Notes</Label>
                                    <p className="text-sm mt-1">
                                      This is a {slot.type.toLowerCase()} session that needs volunteer support.
                                      Please arrive 15 minutes before the session starts.
                                    </p>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setSelectedSlot(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleBookSession}
                                    disabled={!slot.available || slot.volunteers.length >= slot.maxVolunteers}
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
                                    Volunteer for this Session
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                      <Calendar className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No sessions found</h3>
                    <p className="text-slate-500 max-w-md mx-auto">
                      There are no sessions matching your current filter criteria. Try changing your filters or check back later.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Notifications Panel */}
        {notificationsOpen && (
          <div className="fixed inset-0 bg-black/20 z-30 lg:relative lg:inset-auto lg:bg-transparent">
            <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-lg p-4 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Notifications</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="flex-1 overflow-auto">
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                                              <div
                        key={notification.id}
                        className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-2">
                          <div className="bg-blue-100 rounded-full p-1">
                            <Info className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm">{notification.message}</p>
                            <p className="text-xs text-slate-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                      <Bell className="h-6 w-6 text-slate-400" />
                    </div>
                    <h3 className="font-medium mb-2">No notifications</h3>
                    <p className="text-slate-500 text-sm">
                      You're all caught up! You have no new notifications.
                    </p>
                  </div>
                )}
              </div>
              <div className="pt-4 border-t border-slate-200 mt-4">
                <Button variant="outline" className="w-full">
                  Mark all as read
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VolunteerCalendar;
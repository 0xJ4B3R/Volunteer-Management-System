// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Bell,
//   Calendar,
//   CalendarDays,
//   ChevronLeft,
//   ChevronRight,
//   Filter,
//   Menu,
//   RefreshCw,
//   Search,
//   User,
//   X,
//   Info,
//   Plus,
//   Heart,
//   Clock,
//   Users,
//   CheckCircle2,
//   AlertCircle,
//   Calendar as CalendarIcon,
//   Grid,
//   List,
//   ChevronDown,
//   Check,
//   Star
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { toast } from "@/components/ui/use-toast";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Switch } from "@/components/ui/switch";
// import { Label } from "@/components/ui/label";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
// import VolunteerSidebar from "@/components/volunteer/Sidebar";
// import NotificationsPanel from "@/components/common/NotificationsPanel";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";

// // Mock data for calendar slots
// const calendarSlots = [
//   {
//     id: 1,
//     date: new Date(2025, 3, 10), // April 10, 2025
//     startTime: "10:00 AM",
//     endTime: "11:30 AM",
//     type: "Reading",
//     available: true,
//     volunteers: ["JD", "AS"],
//     maxVolunteers: 5
//   },
//   {
//     id: 2,
//     date: new Date(2025, 3, 10), // April 10, 2025
//     startTime: "2:00 PM",
//     endTime: "3:30 PM",
//     type: "Games",
//     available: true,
//     volunteers: ["BT"],
//     maxVolunteers: 4
//   },
//   {
//     id: 3,
//     date: new Date(2025, 3, 11), // April 11, 2025
//     startTime: "1:00 PM",
//     endTime: "2:30 PM",
//     type: "Music",
//     available: true,
//     volunteers: ["CL", "RJ", "MG"],
//     maxVolunteers: 3
//   },
//   {
//     id: 4,
//     date: new Date(2025, 3, 12), // April 12, 2025
//     startTime: "11:00 AM",
//     endTime: "12:30 PM",
//     type: "Reading",
//     available: true,
//     volunteers: [],
//     maxVolunteers: 4
//   },
//   {
//     id: 5,
//     date: new Date(2025, 3, 13), // April 13, 2025
//     startTime: "3:00 PM",
//     endTime: "4:30 PM",
//     type: "Games",
//     available: false,
//     volunteers: ["JD", "AS", "BT", "CL"],
//     maxVolunteers: 4
//   }
// ];

// // Function to get the color for a session type
// const getSessionTypeColor = (type: string) => {
//   switch (type.toLowerCase()) {
//     case "reading":
//       return "bg-green-100 text-green-800";
//     case "games":
//       return "bg-blue-100 text-blue-800";
//     case "music":
//       return "bg-red-100 text-red-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

// const VolunteerCalendar = () => {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [notificationsOpen, setNotificationsOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
//   const [currentDate, setCurrentDate] = useState(new Date(2025, 3, 10)); // April 10, 2025
//   const [viewMode, setViewMode] = useState<"week" | "month" | "list">("week");
//   const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
//   const [selectedSlot, setSelectedSlot] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedSessionType, setSelectedSessionType] = useState<string>("all");

//   // Example notification data
//   const notifications = [
//     { id: 1, message: "New calendar slot available", time: "5 minutes ago" },
//     { id: 2, message: "Your session request was approved", time: "1 hour ago" },
//     { id: 3, message: "Schedule change for tomorrow", time: "Today, 9:15 AM" }
//   ];

//   // Check authentication
//   useEffect(() => {
//     const user = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

//     if (!user.username) {
//       navigate("/login");
//     } else if (user.role !== "volunteer") {
//       navigate("/manager");
//     }
//   }, [navigate]);

//   // Handle window resize for responsive layout
//   useEffect(() => {
//     const handleResize = () => {
//       const mobile = window.innerWidth < 1024;
//       setIsMobile(mobile);
//       if (mobile) {
//         setSidebarOpen(false);
//         setViewMode("week");
//       }
//     };

//     window.addEventListener('resize', handleResize);
//     handleResize(); // Initial check

//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     sessionStorage.removeItem("user");
//     toast({
//       title: "Logged out",
//       description: "You have been successfully logged out.",
//     });
//     navigate("/login");
//   };

//   const refreshCalendar = () => {
//     setIsLoading(true);
//     // Simulate API call
//     setTimeout(() => {
//       setIsLoading(false);
//       toast({
//         title: "Calendar refreshed",
//         description: "Calendar data has been updated.",
//       });
//     }, 1000);
//   };

//   const handleBookSession = () => {
//     if (!selectedSlot) return;

//     toast({
//       title: "Session requested",
//       description: `You have requested a session on ${selectedSlot.date.toLocaleDateString()} at ${selectedSlot.startTime}.`,
//     });

//     setSelectedSlot(null);
//   };

//   // Get displayed dates for week view
//   const getWeekDates = () => {
//     const dates = [];
//     const startOfWeek = new Date(currentDate);
//     startOfWeek.setDate(currentDate.getDate() - currentDate.getDay()); // Start from Sunday

//     for (let i = 0; i < 7; i++) {
//       const date = new Date(startOfWeek);
//       date.setDate(startOfWeek.getDate() + i);
//       dates.push(date);
//     }

//     return dates;
//   };

//   // Filter slots based on selected date and showOnlyAvailable setting
//   const getFilteredSlots = () => {
//     let filtered = [...calendarSlots];

//     if (viewMode === "week") {
//       const weekDates = getWeekDates();
//       const startDate = weekDates[0];
//       const endDate = weekDates[6];

//       filtered = filtered.filter(slot =>
//         slot.date >= startDate &&
//         slot.date <= endDate
//       );
//     } else if (viewMode === "month") {
//       // Month view filtering
//       const year = currentDate.getFullYear();
//       const month = currentDate.getMonth();

//       filtered = filtered.filter(slot =>
//         slot.date.getFullYear() === year &&
//         slot.date.getMonth() === month
//       );
//     }

//     if (showOnlyAvailable) {
//       filtered = filtered.filter(slot =>
//         slot.available && slot.volunteers.length < slot.maxVolunteers
//       );
//     }

//     if (selectedSessionType !== "all") {
//       filtered = filtered.filter(slot =>
//         slot.type.toLowerCase() === selectedSessionType.toLowerCase()
//       );
//     }

//     return filtered;
//   };

//   // Get unique session types for filter
//   const getSessionTypes = () => {
//     const types = new Set<string>();
//     calendarSlots.forEach(slot => types.add(slot.type));
//     return Array.from(types);
//   };

//   // Format date for display
//   const formatDateDisplay = () => {
//     if (viewMode === "week") {
//       const weekDates = getWeekDates();
//       return `${weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
//     } else if (viewMode === "month") {
//       return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
//     } else {
//       return "All Sessions";
//     }
//   };

//   return (
//     <div className="h-screen flex flex-col bg-slate-50">
//       {/* Top Header */}
//       <header className="bg-white border-b border-slate-200 shadow-sm z-10">
//         <div className="px-4 py-3 flex justify-between items-center">
//           <div className="flex items-center space-x-4">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setSidebarOpen(!sidebarOpen)}
//               className="lg:hidden"
//             >
//               <Menu className="h-5 w-5" />
//             </Button>
//             <div className="flex items-center space-x-2">
//               <CalendarIcon className="h-6 w-6 text-primary" />
//               <h1 className="font-bold text-xl hidden sm:block">Calendar</h1>
//             </div>
//           </div>

//           <div className="flex items-center space-x-2">
//             {/* Notifications */}
//             <div className="relative">
//               <Button
//                 variant="ghost"
//                 size="icon"
//                 onClick={() => setNotificationsOpen(!notificationsOpen)}
//                 className="relative"
//               >
//                 <Bell className="h-5 w-5" />
//                 <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
//               </Button>

//               <NotificationsPanel
//                 isOpen={notificationsOpen}
//                 onClose={() => setNotificationsOpen(false)}
//                 notifications={notifications}
//               />
//             </div>

//             {/* User Avatar */}
//             <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
//               <span className="text-sm font-medium text-primary">V</span>
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Main Content with Sidebar */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* Sidebar Navigation */}
//         <VolunteerSidebar
//           isOpen={sidebarOpen}
//           onClose={() => setSidebarOpen(false)}
//           isMobile={isMobile}
//           onLogout={handleLogout}
//         />

//         {/* Main Content */}
//         <main
//           className={cn(
//             "flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300"
//           )}
//         >
//           {/* Calendar Header */}
//           <div className="mb-6">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-slate-900">Volunteer Calendar</h2>
//                 <p className="text-slate-600 mt-1">View and book available sessions</p>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => {
//                     const newDate = new Date(currentDate);
//                     if (viewMode === "week") {
//                       newDate.setDate(currentDate.getDate() - 7);
//                     } else if (viewMode === "month") {
//                       newDate.setMonth(currentDate.getMonth() - 1);
//                     }
//                     setCurrentDate(newDate);
//                   }}
//                 >
//                   <ChevronLeft className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={() => setCurrentDate(new Date())}
//                 >
//                   Today
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={() => {
//                     const newDate = new Date(currentDate);
//                     if (viewMode === "week") {
//                       newDate.setDate(currentDate.getDate() + 7);
//                     } else if (viewMode === "month") {
//                       newDate.setMonth(currentDate.getMonth() + 1);
//                     }
//                     setCurrentDate(newDate);
//                   }}
//                 >
//                   <ChevronRight className="h-4 w-4" />
//                 </Button>
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={refreshCalendar}
//                   disabled={isLoading}
//                 >
//                   <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
//                 </Button>
//               </div>
//             </div>

//             {/* View Options and Filters */}
//             <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div className="flex items-center space-x-4">
//                   <Tabs defaultValue="week" value={viewMode} onValueChange={(value) => setViewMode(value as "week" | "month" | "list")} className="w-auto">
//                     <TabsList>
//                       <TabsTrigger value="week">
//                         <Grid className="h-4 w-4 mr-2" />
//                         Week
//                       </TabsTrigger>
//                       <TabsTrigger value="month">
//                         <CalendarDays className="h-4 w-4 mr-2" />
//                         Month
//                       </TabsTrigger>
//                       <TabsTrigger value="list">
//                         <List className="h-4 w-4 mr-2" />
//                         List
//                       </TabsTrigger>
//                     </TabsList>
//                   </Tabs>

//                   <div className="text-sm font-medium text-slate-700">
//                     {formatDateDisplay()}
//                   </div>
//                 </div>

//                 <div className="flex flex-wrap items-center gap-3">
//                   <div className="flex items-center space-x-2">
//                     <Switch
//                       id="available-only"
//                       checked={showOnlyAvailable}
//                       onCheckedChange={setShowOnlyAvailable}
//                     />
//                     <Label htmlFor="available-only" className="text-sm">Available only</Label>
//                   </div>

//                   <Select value={selectedSessionType} onValueChange={setSelectedSessionType}>
//                     <SelectTrigger className="w-[180px]">
//                       <SelectValue placeholder="Session type" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="all">All Types</SelectItem>
//                       {getSessionTypes().map(type => (
//                         <SelectItem key={type} value={type.toLowerCase()}>
//                           {type}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>

//                   <div className="relative">
//                     <Input
//                       placeholder="Search sessions..."
//                       className="w-[200px] pl-9"
//                     />
//                     <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Calendar Legend */}
//             <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
//                 <span>Reading</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
//                 <span>Games</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
//                 <span>Music</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 rounded border border-gray-400 bg-white mr-2"></div>
//                 <span>Available</span>
//               </div>
//               <div className="flex items-center">
//                 <div className="w-3 h-3 rounded border border-gray-400 bg-gray-200 mr-2"></div>
//                 <span>Full</span>
//               </div>
//             </div>
//           </div>

//           {/* Calendar View */}
//           {viewMode === "week" && (
//             <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//               <div className="grid grid-cols-7 border-b">
//                 {getWeekDates().map((date, index) => (
//                   <div
//                     key={index}
//                     className={`py-2 text-center border-r last:border-r-0 font-medium ${
//                       date.toDateString() === new Date().toDateString() ? 'bg-blue-50' : ''
//                     }`}
//                   >
//                     <div className="text-sm text-gray-500">
//                       {date.toLocaleDateString('en-US', { weekday: 'short' })}
//                     </div>
//                     <div className="text-lg">
//                       {date.getDate()}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <div className="min-h-[60vh]">
//                 <div className="grid grid-cols-7 divide-x h-full">
//                   {getWeekDates().map((date, dateIndex) => (
//                     <div key={dateIndex} className="min-h-full p-1">
//                       {getFilteredSlots()
//                         .filter(slot =>
//                           slot.date.getDate() === date.getDate() &&
//                           slot.date.getMonth() === date.getMonth() &&
//                           slot.date.getFullYear() === date.getFullYear()
//                         )
//                         .map(slot => (
//                           <div
//                             key={slot.id}
//                             className={`p-2 mb-2 rounded text-sm cursor-pointer transition-colors hover:opacity-80 ${
//                               slot.available && slot.volunteers.length < slot.maxVolunteers
//                                 ? 'bg-white border-2 border-gray-200'
//                                 : 'bg-gray-200 border-2 border-gray-300'
//                             } ${slot.type === 'Reading' ? 'border-l-4 border-l-green-500' :
//                                 slot.type === 'Games' ? 'border-l-4 border-l-blue-500' :
//                                 'border-l-4 border-l-red-500'}`}
//                             onClick={() => setSelectedSlot(slot)}
//                           >
//                             <div className="font-semibold">
//                               {slot.startTime} - {slot.endTime}
//                             </div>
//                             <div className="flex justify-between items-center mt-1">
//                               <span className={`px-1.5 py-0.5 text-xs rounded-full ${getSessionTypeColor(slot.type)}`}>
//                                 {slot.type}
//                               </span>
//                               <span className="text-xs text-gray-500">
//                                 {slot.volunteers.length}/{slot.maxVolunteers}
//                               </span>
//                             </div>
//                             {slot.volunteers.length > 0 && (
//                               <div className="flex mt-1 flex-wrap gap-1">
//                                 {slot.volunteers.map((volunteer: string, i: number) => (
//                                   <span key={i} className="text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
//                                     {volunteer}
//                                   </span>
//                                 ))}
//                               </div>
//                             )}
//                           </div>
//                         ))}
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             </div>
//           )}

//           {viewMode === "month" && (
//             <div className="bg-white rounded-lg shadow-sm overflow-hidden">
//               <div className="grid grid-cols-7 border-b">
//                 {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
//                   <div key={day} className="py-2 text-center border-r last:border-r-0 font-medium">
//                     {day}
//                   </div>
//                 ))}
//               </div>

//               <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y">
//                 {/* Month view implementation would go here */}
//                 <div className="col-span-7 row-span-6 p-4 flex items-center justify-center text-gray-500">
//                   Month view calendar would be implemented here with full month display
//                 </div>
//               </div>
//             </div>
//           )}

//           {viewMode === "list" && (
//             <div className="space-y-4">
//               {getFilteredSlots().map((slot) => (
//                 <Card
//                   key={slot.id}
//                   className={cn(
//                     "transition-all duration-200 hover:shadow-md",
//                     !slot.available && "opacity-50"
//                   )}
//                 >
//                   <CardContent className="p-4">
//                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                       <div className="space-y-1">
//                         <div className="flex items-center space-x-2">
//                           <Badge variant="outline" className={getSessionTypeColor(slot.type)}>
//                             {slot.type}
//                           </Badge>
//                           <span className="text-sm font-medium">
//                             {slot.date.toLocaleDateString()}
//                           </span>
//                         </div>
//                         <div className="flex items-center space-x-2">
//                           <Clock className="h-4 w-4 text-slate-500" />
//                           <span className="text-sm">
//                             {slot.startTime} - {slot.endTime}
//                           </span>
//                         </div>
//                       </div>

//                       <div className="flex items-center space-x-4">
//                         <div className="flex items-center space-x-1 text-slate-500">
//                           <Users className="h-4 w-4" />
//                           <span className="text-sm">
//                             {slot.volunteers.length}/{slot.maxVolunteers}
//                           </span>
//                         </div>

//                         <Button
//                           className="w-full sm:w-auto"
//                           disabled={!slot.available || slot.volunteers.length >= slot.maxVolunteers}
//                           onClick={() => setSelectedSlot(slot)}
//                         >
//                           {!slot.available ? (
//                             <>
//                               <AlertCircle className="h-4 w-4 mr-2" />
//                               Unavailable
//                             </>
//                           ) : slot.volunteers.length >= slot.maxVolunteers ? (
//                             <>
//                               <X className="h-4 w-4 mr-2" />
//                               Full
//                             </>
//                           ) : (
//                             <>
//                               <CheckCircle2 className="h-4 w-4 mr-2" />
//                               Book Session
//                             </>
//                           )}
//                         </Button>
//                       </div>
//                     </div>
//                   </CardContent>
//                 </Card>
//               ))}

//               {/* Empty State */}
//               {getFilteredSlots().length === 0 && (
//                 <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//                   <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//                   <h3 className="text-lg font-medium text-slate-900 mb-2">No sessions found</h3>
//                   <p className="text-slate-600 mb-4">
//                     Try adjusting your filters or selecting a different date range
//                   </p>
//                   <Button variant="outline" onClick={() => {
//                     setShowOnlyAvailable(false);
//                     setSelectedSessionType("all");
//                   }}>
//                     Clear Filters
//                   </Button>
//                 </div>
//               )}
//             </div>
//           )}
//         </main>
//       </div>

//       {/* Booking Dialog */}
//       <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Book Session</DialogTitle>
//             <DialogDescription>
//               Confirm your session booking details
//             </DialogDescription>
//           </DialogHeader>

//           {selectedSlot && (
//             <div className="space-y-4">
//               <div className="flex items-center justify-between">
//                 <Badge variant="outline" className={getSessionTypeColor(selectedSlot.type)}>
//                   {selectedSlot.type}
//                 </Badge>
//                 <div className="flex items-center space-x-1 text-slate-500">
//                   <Users className="h-4 w-4" />
//                   <span className="text-sm">
//                     {selectedSlot.volunteers.length}/{selectedSlot.maxVolunteers}
//                   </span>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <div className="flex items-center space-x-2">
//                   <Calendar className="h-4 w-4 text-slate-500" />
//                   <span className="text-sm font-medium">
//                     {selectedSlot.date.toLocaleDateString()}
//                   </span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <Clock className="h-4 w-4 text-slate-500" />
//                   <span className="text-sm">
//                     {selectedSlot.startTime} - {selectedSlot.endTime}
//                   </span>
//                 </div>
//               </div>

//               <div className="space-y-2">
//                 <Label htmlFor="notes">Notes (Optional)</Label>
//                 <Textarea
//                   id="notes"
//                   placeholder="Add any notes or preferences for this session..."
//                   className="h-24"
//                 />
//               </div>
//             </div>
//           )}

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setSelectedSlot(null)}>
//               Cancel
//             </Button>
//             <Button onClick={handleBookSession}>
//               Confirm Booking
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default VolunteerCalendar;

import React from 'react';

export function VolunteerCalendar() {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Calendar</h1>
      <div className="border rounded-lg p-8 text-center text-gray-400">
        📅 Calendar View Coming Soon!
      </div>
    </div>
  );
}

export default VolunteerCalendar;
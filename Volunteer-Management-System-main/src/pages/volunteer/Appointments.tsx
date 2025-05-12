// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Bell,
//   Calendar,
//   Clock,
//   Edit,
//   Eye,
//   Filter,
//   Menu,
//   MoreHorizontal,
//   Search,
//   SlidersHorizontal,
//   Trash2,
//   X,
//   CalendarDays,
//   Users,
//   MapPin,
//   CheckCircle2,
//   AlertCircle,
//   Clock3,
//   Calendar as CalendarIcon,
//   Plus,
//   ChevronRight,
//   ChevronLeft,
//   RefreshCw,
//   Star,
//   Heart
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { toast } from "@/components/ui/use-toast";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Badge } from "@/components/ui/badge";
// import { Separator } from "@/components/ui/separator";
// import { cn } from "@/lib/utils";
// import VolunteerSidebar from "@/components/volunteer/Sidebar";
// import NotificationsPanel from "@/components/common/NotificationsPanel";

// // Mock appointment data
// const appointments = [
//   {
//     id: 1,
//     date: new Date(2025, 3, 15), // April 15, 2025
//     startTime: "10:00 AM",
//     endTime: "11:30 AM",
//     type: "Reading",
//     status: "Approved",
//     location: "Sunny Pines Home, Room 102",
//     residents: ["John D.", "Sarah M."],
//     note: ""
//   },
//   {
//     id: 2,
//     date: new Date(2025, 3, 12), // April 12, 2025
//     startTime: "2:00 PM",
//     endTime: "3:30 PM",
//     type: "Games",
//     status: "Pending",
//     location: "Sunny Pines Home, Recreation Area",
//     residents: ["Robert J."],
//     note: "First time with this resident, likes board games."
//   },
//   {
//     id: 3,
//     date: new Date(2025, 3, 5), // April 5, 2025 (past)
//     startTime: "1:00 PM",
//     endTime: "2:30 PM",
//     type: "Music",
//     status: "Completed",
//     location: "Sunny Pines Home, Music Room",
//     residents: ["Maria G.", "Thomas B."],
//     note: "Residents enjoyed piano music."
//   },
//   {
//     id: 4,
//     date: new Date(2025, 3, 2), // April 2, 2025 (past)
//     startTime: "11:00 AM",
//     endTime: "12:30 PM",
//     type: "Reading",
//     status: "Cancelled",
//     location: "Sunny Pines Home, Library",
//     residents: ["Elizabeth S."],
//     note: "Had to cancel due to illness."
//   },
//   {
//     id: 5,
//     date: new Date(2025, 3, 20), // April 20, 2025 (upcoming)
//     startTime: "3:00 PM",
//     endTime: "4:30 PM",
//     type: "Games",
//     status: "Approved",
//     location: "Sunny Pines Home, Common Area",
//     residents: ["David L.", "Patricia K."],
//     note: ""
//   }
// ];

// // Function to get the color for status badge
// const getStatusColor = (status: string) => {
//   switch (status.toLowerCase()) {
//     case "approved":
//       return "bg-green-100 text-green-800";
//     case "pending":
//       return "bg-yellow-100 text-yellow-800";
//     case "completed":
//       return "bg-blue-100 text-blue-800";
//     case "cancelled":
//       return "bg-red-100 text-red-800";
//     default:
//       return "bg-gray-100 text-gray-800";
//   }
// };

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

// // Function to get the icon for a session type
// const getSessionTypeIcon = (type: string) => {
//   switch (type.toLowerCase()) {
//     case "reading":
//       return <Heart className="h-4 w-4" />;
//     case "games":
//       return <Users className="h-4 w-4" />;
//     case "music":
//       return <Star className="h-4 w-4" />;
//     default:
//       return <Calendar className="h-4 w-4" />;
//   }
// };

// // Function to get the icon for a status
// const getStatusIcon = (status: string) => {
//   switch (status.toLowerCase()) {
//     case "approved":
//       return <CheckCircle2 className="h-4 w-4" />;
//     case "pending":
//       return <Clock3 className="h-4 w-4" />;
//     case "completed":
//       return <CalendarDays className="h-4 w-4" />;
//     case "cancelled":
//       return <AlertCircle className="h-4 w-4" />;
//     default:
//       return <Calendar className="h-4 w-4" />;
//   }
// };

// const VolunteerAppointments = () => {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [notificationsOpen, setNotificationsOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
//   const [activeTab, setActiveTab] = useState("upcoming");
//   const [detailsOpen, setDetailsOpen] = useState(false);
//   const [editOpen, setEditOpen] = useState(false);
//   const [cancelOpen, setCancelOpen] = useState(false);
//   const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
//   const [editedNote, setEditedNote] = useState("");
//   const [cancelReason, setCancelReason] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [searchQuery, setSearchQuery] = useState("");

//   // Example notification data
//   const notifications = [
//     { id: 1, message: "Your appointment was approved", time: "5 minutes ago" },
//     { id: 2, message: "Appointment reminder for tomorrow", time: "1 hour ago" },
//     { id: 3, message: "New session available", time: "Today, 9:15 AM" }
//   ];

//   // Filter appointments based on active tab and search query
//   const getFilteredAppointments = () => {
//     const now = new Date();
//     let filtered = [...appointments];

//     // Filter by tab
//     switch(activeTab) {
//       case "upcoming":
//         filtered = filtered.filter(
//           appt => appt.date > now && (appt.status === "Approved" || appt.status === "Pending")
//         );
//         break;
//       case "past":
//         filtered = filtered.filter(
//           appt => appt.date < now || appt.status === "Completed" || appt.status === "Cancelled"
//         );
//         break;
//       case "pending":
//         filtered = filtered.filter(
//           appt => appt.status === "Pending"
//         );
//         break;
//     }

//     // Filter by search query
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase();
//       filtered = filtered.filter(appt =>
//         appt.type.toLowerCase().includes(query) ||
//         appt.location.toLowerCase().includes(query) ||
//         appt.residents.some((resident: string) => resident.toLowerCase().includes(query))
//       );
//     }

//     return filtered;
//   };

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
//       if (mobile) setSidebarOpen(false);
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

//   const openDetails = (appointment: any) => {
//     setSelectedAppointment(appointment);
//     setDetailsOpen(true);
//   };

//   const openEdit = (appointment: any) => {
//     setSelectedAppointment(appointment);
//     setEditedNote(appointment.note);
//     setEditOpen(true);
//   };

//   const openCancel = (appointment: any) => {
//     setSelectedAppointment(appointment);
//     setCancelReason("");
//     setCancelOpen(true);
//   };

//   const handleSaveEdit = () => {
//     if (!selectedAppointment) return;

//     setIsLoading(true);

//     // Simulate API call
//     setTimeout(() => {
//       // In a real app, this would make an API call
//       const updatedAppointments = appointments.map(appt =>
//         appt.id === selectedAppointment.id ? {...appt, note: editedNote} : appt
//       );

//       toast({
//         title: "Appointment updated",
//         description: "Your appointment details have been updated.",
//       });

//       setIsLoading(false);
//       setEditOpen(false);
//     }, 1000);
//   };

//   const handleCancel = () => {
//     if (!selectedAppointment) return;

//     setIsLoading(true);

//     // Simulate API call
//     setTimeout(() => {
//       // In a real app, this would make an API call
//       const updatedAppointments = appointments.map(appt =>
//         appt.id === selectedAppointment.id ? {...appt, status: "Cancelled", note: cancelReason} : appt
//       );

//       toast({
//         title: "Appointment cancelled",
//         description: "Your appointment has been cancelled.",
//       });

//       setIsLoading(false);
//       setCancelOpen(false);
//     }, 1000);
//   };

//   const isEditable = (appointment: any) => {
//     return (appointment.status === "Pending" || appointment.status === "Approved") &&
//            appointment.date > new Date();
//   };

//   const refreshAppointments = () => {
//     setIsLoading(true);

//     // Simulate API call
//     setTimeout(() => {
//       toast({
//         title: "Appointments refreshed",
//         description: "Your appointments have been updated.",
//       });

//       setIsLoading(false);
//     }, 1000);
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
//               <h1 className="font-bold text-xl hidden sm:block">Appointments</h1>
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
//           className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300"
//         >
//           {/* Page Header */}
//           <div className="mb-6">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-slate-900">Your Appointments</h2>
//                 <p className="text-slate-600 mt-1">Manage and view your scheduled sessions</p>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant="outline"
//                   size="icon"
//                   onClick={refreshAppointments}
//                   disabled={isLoading}
//                 >
//                   <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
//                 </Button>
//                 <Button
//                   variant="default"
//                   onClick={() => navigate('/volunteer/calendar')}
//                 >
//                   <Plus className="h-4 w-4 mr-2" />
//                   New Appointment
//                 </Button>
//               </div>
//             </div>

//             {/* Search and Filter */}
//             <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//                 <div className="relative flex-1 max-w-md">
//                   <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
//                   <Input
//                     placeholder="Search appointments..."
//                     className="pl-9"
//                     value={searchQuery}
//                     onChange={(e) => setSearchQuery(e.target.value)}
//                   />
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="outline">
//                         <Filter className="h-4 w-4 mr-2" />
//                         Filter
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem>All Types</DropdownMenuItem>
//                       <DropdownMenuItem>Reading</DropdownMenuItem>
//                       <DropdownMenuItem>Games</DropdownMenuItem>
//                       <DropdownMenuItem>Music</DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>

//                   <DropdownMenu>
//                     <DropdownMenuTrigger asChild>
//                       <Button variant="outline">
//                         <SlidersHorizontal className="h-4 w-4 mr-2" />
//                         Sort
//                       </Button>
//                     </DropdownMenuTrigger>
//                     <DropdownMenuContent align="end">
//                       <DropdownMenuItem>Date (Newest)</DropdownMenuItem>
//                       <DropdownMenuItem>Date (Oldest)</DropdownMenuItem>
//                       <DropdownMenuItem>Type</DropdownMenuItem>
//                       <DropdownMenuItem>Status</DropdownMenuItem>
//                     </DropdownMenuContent>
//                   </DropdownMenu>
//                 </div>
//               </div>
//             </div>

//             {/* Tabs */}
//             <Tabs defaultValue="upcoming" value={activeTab} onValueChange={setActiveTab} className="w-full">
//               <TabsList className="w-full justify-start mb-6">
//                 <TabsTrigger value="upcoming" className="flex items-center">
//                   <Calendar className="h-4 w-4 mr-2" />
//                   Upcoming
//                 </TabsTrigger>
//                 <TabsTrigger value="past" className="flex items-center">
//                   <Clock className="h-4 w-4 mr-2" />
//                   Past
//                 </TabsTrigger>
//                 <TabsTrigger value="pending" className="flex items-center">
//                   <AlertCircle className="h-4 w-4 mr-2" />
//                   Pending
//                 </TabsTrigger>
//               </TabsList>

//               <TabsContent value="upcoming" className="space-y-4">
//                 {getFilteredAppointments().length > 0 ? (
//                   getFilteredAppointments().map(appointment => (
//                     <AppointmentCard
//                       key={appointment.id}
//                       appointment={appointment}
//                       onViewDetails={() => openDetails(appointment)}
//                       onEdit={() => openEdit(appointment)}
//                       onCancel={() => openCancel(appointment)}
//                       isEditable={isEditable(appointment)}
//                     />
//                   ))
//                 ) : (
//                   <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//                     <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-slate-900 mb-2">No upcoming appointments</h3>
//                     <p className="text-slate-600 mb-4">
//                       You don't have any upcoming appointments scheduled.
//                     </p>
//                     <Button
//                       variant="outline"
//                       onClick={() => navigate('/volunteer/calendar')}
//                     >
//                       <Calendar className="mr-2 h-4 w-4" />
//                       Browse Calendar
//                     </Button>
//                   </div>
//                 )}
//               </TabsContent>

//               <TabsContent value="past" className="space-y-4">
//                 {getFilteredAppointments().length > 0 ? (
//                   getFilteredAppointments().map(appointment => (
//                     <AppointmentCard
//                       key={appointment.id}
//                       appointment={appointment}
//                       onViewDetails={() => openDetails(appointment)}
//                       onEdit={() => openEdit(appointment)}
//                       onCancel={() => openCancel(appointment)}
//                       isEditable={false} // Past appointments are not editable
//                     />
//                   ))
//                 ) : (
//                   <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//                     <Clock className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-slate-900 mb-2">No past appointments</h3>
//                     <p className="text-slate-600 mb-4">
//                       You don't have any past appointments in your history.
//                     </p>
//                   </div>
//                 )}
//               </TabsContent>

//               <TabsContent value="pending" className="space-y-4">
//                 {getFilteredAppointments().length > 0 ? (
//                   getFilteredAppointments().map(appointment => (
//                     <AppointmentCard
//                       key={appointment.id}
//                       appointment={appointment}
//                       onViewDetails={() => openDetails(appointment)}
//                       onEdit={() => openEdit(appointment)}
//                       onCancel={() => openCancel(appointment)}
//                       isEditable={true} // Pending appointments are editable
//                     />
//                   ))
//                 ) : (
//                   <div className="text-center py-12 bg-white rounded-lg shadow-sm">
//                     <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
//                     <h3 className="text-lg font-medium text-slate-900 mb-2">No pending appointments</h3>
//                     <p className="text-slate-600 mb-4">
//                       You don't have any appointments waiting for approval.
//                     </p>
//                   </div>
//                 )}
//               </TabsContent>
//             </Tabs>
//           </div>

//           {/* View Details Dialog */}
//           {selectedAppointment && (
//             <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
//               <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Appointment Details</DialogTitle>
//                   <DialogDescription>
//                     View the details of your appointment.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                   <div className="flex justify-between">
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Date</Label>
//                       <p className="font-medium">{selectedAppointment.date.toLocaleDateString()}</p>
//                     </div>
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Time</Label>
//                       <p className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
//                     </div>
//                   </div>

//                   <div className="flex justify-between">
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Type</Label>
//                       <div className="flex items-center mt-1">
//                         <span className={`px-2 py-1 text-xs rounded-full ${getSessionTypeColor(selectedAppointment.type)} flex items-center`}>
//                           {getSessionTypeIcon(selectedAppointment.type)}
//                           <span className="ml-1">{selectedAppointment.type}</span>
//                         </span>
//                       </div>
//                     </div>
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Status</Label>
//                       <div className="flex items-center mt-1">
//                         <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedAppointment.status)} flex items-center`}>
//                           {getStatusIcon(selectedAppointment.status)}
//                           <span className="ml-1">{selectedAppointment.status}</span>
//                         </span>
//                       </div>
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-sm text-muted-foreground">Location</Label>
//                     <div className="flex items-center mt-1">
//                       <MapPin className="h-4 w-4 text-slate-500 mr-1" />
//                       <p className="font-medium">{selectedAppointment.location}</p>
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-sm text-muted-foreground">Residents</Label>
//                     <div className="flex flex-wrap gap-1 mt-1">
//                       {selectedAppointment.residents.map((resident: string, i: number) => (
//                         <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full flex items-center">
//                           <Users className="h-3 w-3 mr-1" />
//                           {resident}
//                         </span>
//                       ))}
//                     </div>
//                   </div>

//                   {selectedAppointment.note && (
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Note</Label>
//                       <p className="text-sm mt-1 p-2 bg-slate-50 rounded-md">{selectedAppointment.note}</p>
//                     </div>
//                   )}
//                 </div>
//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setDetailsOpen(false)}>
//                     Close
//                   </Button>
//                   {isEditable(selectedAppointment) && (
//                     <Button onClick={() => {
//                       setDetailsOpen(false);
//                       openEdit(selectedAppointment);
//                     }}>
//                       <Edit className="mr-1 h-4 w-4" />
//                       Edit
//                     </Button>
//                   )}
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           )}

//           {/* Edit Dialog */}
//           {selectedAppointment && (
//             <Dialog open={editOpen} onOpenChange={setEditOpen}>
//               <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Edit Appointment</DialogTitle>
//                   <DialogDescription>
//                     Make changes to your appointment.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                   <div className="flex justify-between">
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Date</Label>
//                       <p className="font-medium">{selectedAppointment.date.toLocaleDateString()}</p>
//                     </div>
//                     <div>
//                       <Label className="text-sm text-muted-foreground">Time</Label>
//                       <p className="font-medium">{selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-sm text-muted-foreground">Type</Label>
//                     <div className="flex items-center mt-1">
//                       <span className={`px-2 py-1 text-xs rounded-full ${getSessionTypeColor(selectedAppointment.type)} flex items-center`}>
//                         {getSessionTypeIcon(selectedAppointment.type)}
//                         <span className="ml-1">{selectedAppointment.type}</span>
//                       </span>
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="note">Note</Label>
//                     <Textarea
//                       id="note"
//                       placeholder="Add any details or requests..."
//                       value={editedNote}
//                       onChange={(e) => setEditedNote(e.target.value)}
//                       className="mt-1"
//                     />
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setEditOpen(false)}>
//                     Cancel
//                   </Button>
//                   <Button onClick={handleSaveEdit} disabled={isLoading}>
//                     {isLoading ? (
//                       <>
//                         <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
//                         Saving...
//                       </>
//                     ) : (
//                       "Save Changes"
//                     )}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           )}

//           {/* Cancel Dialog */}
//           {selectedAppointment && (
//             <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
//               <DialogContent className="sm:max-w-md">
//                 <DialogHeader>
//                   <DialogTitle>Cancel Appointment</DialogTitle>
//                   <DialogDescription>
//                     Are you sure you want to cancel this appointment? This action cannot be undone.
//                   </DialogDescription>
//                 </DialogHeader>
//                 <div className="space-y-4 py-4">
//                   <div>
//                     <Label className="text-sm text-muted-foreground">Date and Time</Label>
//                     <div className="flex items-center mt-1">
//                       <Calendar className="h-4 w-4 text-slate-500 mr-1" />
//                       <p className="font-medium">{selectedAppointment.date.toLocaleDateString()}, {selectedAppointment.startTime} - {selectedAppointment.endTime}</p>
//                     </div>
//                   </div>

//                   <div>
//                     <Label className="text-sm text-muted-foreground">Type</Label>
//                     <div className="flex items-center mt-1">
//                       <span className={`px-2 py-1 text-xs rounded-full ${getSessionTypeColor(selectedAppointment.type)} flex items-center`}>
//                         {getSessionTypeIcon(selectedAppointment.type)}
//                         <span className="ml-1">{selectedAppointment.type}</span>
//                       </span>
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="cancelReason">Reason for cancellation (optional)</Label>
//                     <Textarea
//                       id="cancelReason"
//                       placeholder="Please provide a reason for cancellation..."
//                       value={cancelReason}
//                       onChange={(e) => setCancelReason(e.target.value)}
//                       className="mt-1"
//                     />
//                   </div>
//                 </div>
//                 <DialogFooter>
//                   <Button variant="outline" onClick={() => setCancelOpen(false)}>
//                     Keep Appointment
//                   </Button>
//                   <Button variant="destructive" onClick={handleCancel} disabled={isLoading}>
//                     {isLoading ? (
//                       <>
//                         <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
//                         Cancelling...
//                       </>
//                     ) : (
//                       "Cancel Appointment"
//                     )}
//                   </Button>
//                 </DialogFooter>
//               </DialogContent>
//             </Dialog>
//           )}
//         </main>
//       </div>
//     </div>
//   );
// };

// // Appointment Card Component
// interface AppointmentCardProps {
//   appointment: any;
//   onViewDetails: () => void;
//   onEdit: () => void;
//   onCancel: () => void;
//   isEditable: boolean;
// }

// const AppointmentCard: React.FC<AppointmentCardProps> = ({
//   appointment,
//   onViewDetails,
//   onEdit,
//   onCancel,
//   isEditable
// }) => {
//   return (
//     <Card className="overflow-hidden hover:shadow-md transition-shadow">
//       <CardContent className="p-0">
//         <div className="flex flex-col sm:flex-row">
//           {/* Left side (Date) */}
//           <div className="bg-slate-100 p-4 sm:w-32 text-center flex flex-col justify-center">
//             <p className="text-lg font-semibold">{appointment.date.toLocaleDateString('en-US', { month: 'short' })}</p>
//             <p className="text-3xl font-bold">{appointment.date.getDate()}</p>
//             <p className="text-sm text-muted-foreground">{appointment.date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
//           </div>

//           {/* Right side (Details) */}
//           <div className="p-4 flex-1">
//             <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2">
//               <div className="flex items-center mb-2 sm:mb-0">
//                 <Clock className="h-4 w-4 text-gray-500 mr-1" />
//                 <span className="text-sm">{appointment.startTime} - {appointment.endTime}</span>
//               </div>

//               <div className="flex items-center space-x-2">
//                 <span className={`px-2 py-1 text-xs rounded-full ${getSessionTypeColor(appointment.type)} flex items-center`}>
//                   {getSessionTypeIcon(appointment.type)}
//                   <span className="ml-1">{appointment.type}</span>
//                 </span>
//                 <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)} flex items-center`}>
//                   {getStatusIcon(appointment.status)}
//                   <span className="ml-1">{appointment.status}</span>
//                 </span>
//               </div>
//             </div>

//             <div className="flex items-center mb-2">
//               <MapPin className="h-4 w-4 text-gray-500 mr-1" />
//               <p className="text-sm">{appointment.location}</p>
//             </div>

//             {appointment.residents.length > 0 && (
//               <div className="mb-3">
//                 <div className="flex items-center mb-1">
//                   <Users className="h-4 w-4 text-gray-500 mr-1" />
//                   <span className="text-xs text-muted-foreground">Residents:</span>
//                 </div>
//                 <div className="flex flex-wrap gap-1 mt-1">
//                   {appointment.residents.map((resident: string, i: number) => (
//                     <span key={i} className="px-2 py-1 text-xs bg-gray-100 rounded-full">
//                       {resident}
//                     </span>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {appointment.note && (
//               <p className="text-sm text-gray-600 mb-3">
//                 <span className="font-medium">Note:</span> {appointment.note}
//               </p>
//             )}

//             <div className="flex justify-end mt-2">
//               <Button variant="ghost" size="sm" onClick={onViewDetails}>
//                 <Eye className="h-4 w-4 mr-1" />
//                 Details
//               </Button>

//               {isEditable && (
//                 <>
//                   <Button variant="ghost" size="sm" onClick={onEdit}>
//                     <Edit className="h-4 w-4 mr-1" />
//                     Edit
//                   </Button>
//                   <Button variant="ghost" size="sm" className="text-red-600" onClick={onCancel}>
//                     <Trash2 className="h-4 w-4 mr-1" />
//                     Cancel
//                   </Button>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </CardContent>
//     </Card>
//   );
// };

// export default VolunteerAppointments;

import React from 'react';
import { Users } from 'lucide-react';
import { appointments } from '@/components/utils/dummyData';

export function VolunteerAppointments() {
  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-4">Appointments</h1>
      <div className="space-y-4">
        {appointments.map((appt, idx) => (
          <div key={idx} className="bg-gray-100 p-4 rounded-lg flex items-center gap-4">
            <Users className="text-blue-400 w-8 h-8" />
            <div>
              <h2 className="font-semibold">{appt.date}</h2>
              <p className="text-sm">{appt.place} - {appt.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default VolunteerAppointments;
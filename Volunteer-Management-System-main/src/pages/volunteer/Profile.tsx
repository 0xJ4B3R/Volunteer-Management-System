// import { useEffect, useState } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   Bell,
//   Camera,
//   Check,
//   Eye,
//   EyeOff,
//   Menu,
//   Save,
//   User,
//   X,
//   UserCircle,
//   Mail,
//   Phone,
//   Key,
//   Shield,
//   Lock,
//   AlertCircle,
//   Info,
//   Upload,
//   Trash2,
//   Settings,
//   LogOut,
//   ChevronRight,
//   RefreshCw,
//   CheckCircle2,
//   AlertTriangle,
//   Plus,
//   Clock
// } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { toast } from "@/components/ui/use-toast";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { Separator } from "@/components/ui/separator";
// import { Badge } from "@/components/ui/badge";
// import { cn } from "@/lib/utils";
// import VolunteerSidebar from "@/components/volunteer/Sidebar";
// import NotificationsPanel from "@/components/common/NotificationsPanel";

// // Mock user profile data
// const userProfile = {
//   fullName: "John Volunteer",
//   username: "johnv",
//   email: "john.volunteer@example.com",
//   phone: "(555) 123-4567",
//   role: "Volunteer",
//   joinDate: "January 15, 2023",
//   totalHours: 124,
//   completedSessions: 32,
//   profilePicture: null, // In a real app, this would be a URL
//   skills: ["Reading", "Music", "Companionship"],
//   interests: ["Elderly Care", "Community Service", "Education"],
//   bio: "Passionate about making a difference in the community through volunteer work. I enjoy spending time with residents and helping them stay active and engaged."
// };

// const VolunteerProfile = () => {
//   const navigate = useNavigate();
//   const [sidebarOpen, setSidebarOpen] = useState(true);
//   const [notificationsOpen, setNotificationsOpen] = useState(false);
//   const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
//   const [activeTab, setActiveTab] = useState("profile");
//   const [isLoading, setIsLoading] = useState(false);

//   // Form state
//   const [email, setEmail] = useState(userProfile.email);
//   const [phone, setPhone] = useState(userProfile.phone);
//   const [currentPassword, setCurrentPassword] = useState("");
//   const [newPassword, setNewPassword] = useState("");
//   const [confirmPassword, setConfirmPassword] = useState("");
//   const [showCurrentPassword, setShowCurrentPassword] = useState(false);
//   const [showNewPassword, setShowNewPassword] = useState(false);
//   const [showConfirmPassword, setShowConfirmPassword] = useState(false);
//   const [profileImage, setProfileImage] = useState<string | null>(userProfile.profilePicture);
//   const [imageFile, setImageFile] = useState<File | null>(null);
//   const [formChanged, setFormChanged] = useState(false);
//   const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
//   const [bio, setBio] = useState(userProfile.bio);
//   const [skills, setSkills] = useState<string[]>(userProfile.skills);
//   const [interests, setInterests] = useState<string[]>(userProfile.interests);

//   // Example notification data
//   const notifications = [
//     { id: 1, message: "Profile update reminder", time: "5 minutes ago" },
//     { id: 2, message: "New calendar slot available", time: "1 hour ago" },
//     { id: 3, message: "Your last session was rated 5 stars", time: "Today, 9:15 AM" }
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
//       if (mobile) setSidebarOpen(false);
//     };

//     window.addEventListener('resize', handleResize);
//     handleResize(); // Initial check

//     return () => window.removeEventListener('resize', handleResize);
//   }, []);

//   // Check if form has changed
//   useEffect(() => {
//     if (
//       email !== userProfile.email ||
//       phone !== userProfile.phone ||
//       currentPassword !== "" ||
//       newPassword !== "" ||
//       confirmPassword !== "" ||
//       imageFile !== null ||
//       bio !== userProfile.bio ||
//       JSON.stringify(skills) !== JSON.stringify(userProfile.skills) ||
//       JSON.stringify(interests) !== JSON.stringify(userProfile.interests)
//     ) {
//       setFormChanged(true);
//     } else {
//       setFormChanged(false);
//     }
//   }, [email, phone, currentPassword, newPassword, confirmPassword, imageFile, bio, skills, interests]);

//   const handleLogout = () => {
//     localStorage.removeItem("user");
//     sessionStorage.removeItem("user");
//     toast({
//       title: "Logged out",
//       description: "You have been successfully logged out.",
//     });
//     navigate("/login");
//   };

//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];

//       // Check file size and type
//       if (file.size > 5 * 1024 * 1024) { // 5MB limit
//         toast({
//           title: "File too large",
//           description: "Please select an image less than 5MB in size.",
//           variant: "destructive"
//         });
//         return;
//       }

//       if (!file.type.startsWith('image/')) {
//         toast({
//           title: "Invalid file type",
//           description: "Please select a valid image file (JPG, PNG, etc.).",
//           variant: "destructive"
//         });
//         return;
//       }

//       setImageFile(file);

//       // Create a preview
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         if (event.target?.result) {
//           setProfileImage(event.target.result as string);
//         }
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removeProfileImage = () => {
//     setProfileImage(null);
//     setImageFile(null);
//     setFormChanged(true);
//   };

//   const validatePassword = () => {
//     if (!currentPassword && (newPassword || confirmPassword)) {
//       setPasswordErrors(["Current password is required"]);
//       return false;
//     }

//     if (currentPassword && !newPassword) {
//       setPasswordErrors(["New password is required"]);
//       return false;
//     }

//     if (newPassword && newPassword.length < 8) {
//       setPasswordErrors(["Password must be at least 8 characters"]);
//       return false;
//     }

//     if (newPassword && newPassword !== confirmPassword) {
//       setPasswordErrors(["Passwords do not match"]);
//       return false;
//     }

//     setPasswordErrors([]);
//     return true;
//   };

//   const handleSaveChanges = () => {
//     // Validate password if any password field is filled
//     if (currentPassword || newPassword || confirmPassword) {
//       if (!validatePassword()) {
//         return;
//       }
//     }

//     setIsLoading(true);

//     // Simulate API call
//     setTimeout(() => {
//     // In a real app, this would make API calls for:
//       // 1. Profile update (email, phone, bio, skills, interests)
//     // 2. Password change (if fields are filled)
//     // 3. Profile image upload (if changed)

//     toast({
//       title: "Profile updated",
//       description: "Your profile has been updated successfully.",
//     });

//     // Reset password fields
//     setCurrentPassword("");
//     setNewPassword("");
//     setConfirmPassword("");
//     setFormChanged(false);
//       setIsLoading(false);
//     }, 1500);
//   };

//   const addSkill = (skill: string) => {
//     if (skill && !skills.includes(skill)) {
//       setSkills([...skills, skill]);
//       setFormChanged(true);
//     }
//   };

//   const removeSkill = (skillToRemove: string) => {
//     setSkills(skills.filter(skill => skill !== skillToRemove));
//     setFormChanged(true);
//   };

//   const addInterest = (interest: string) => {
//     if (interest && !interests.includes(interest)) {
//       setInterests([...interests, interest]);
//       setFormChanged(true);
//     }
//   };

//   const removeInterest = (interestToRemove: string) => {
//     setInterests(interests.filter(interest => interest !== interestToRemove));
//     setFormChanged(true);
//   };

//   return (
//     <div className="h-screen flex flex-col bg-slate-50">
//       {/* Top Header */}
//       <header className="bg-white border-b border-slate-200 shadow-sm z-10">
//         <div className="px-4 py-3 flex justify-between items-center">
//           <div className="flex items-center space-x-4">
//           <Button
//             variant="ghost"
//             size="icon"
//             onClick={() => setSidebarOpen(!sidebarOpen)}
//             className="lg:hidden"
//           >
//               <Menu className="h-5 w-5" />
//           </Button>
//             <div className="flex items-center space-x-2">
//               <UserCircle className="h-6 w-6 text-primary" />
//               <h1 className="font-bold text-xl hidden sm:block">Profile</h1>
//             </div>
//         </div>

//         <div className="flex items-center space-x-2">
//             {/* Notifications */}
//           <div className="relative">
//             <Button
//               variant="ghost"
//               size="icon"
//               onClick={() => setNotificationsOpen(!notificationsOpen)}
//               className="relative"
//             >
//               <Bell className="h-5 w-5" />
//                 <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
//             </Button>

//             <NotificationsPanel
//               isOpen={notificationsOpen}
//               onClose={() => setNotificationsOpen(false)}
//               notifications={notifications}
//             />
//           </div>

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
//             "flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300",
//             isMobile && sidebarOpen && "opacity-50"
//           )}
//           onClick={() => isMobile && sidebarOpen && setSidebarOpen(false)}
//         >
//           <div className="max-w-4xl mx-auto">
//             {/* Page Header */}
//             <div className="mb-6">
//               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
//                 <div>
//                   <h2 className="text-2xl font-bold text-slate-900">Your Profile</h2>
//                   <p className="text-slate-600 mt-1">Manage your personal information and account settings</p>
//                 </div>

//                 <div className="flex items-center space-x-2">
//                   <Button
//                     variant="outline"
//                     size="icon"
//                     onClick={() => window.location.reload()}
//                   >
//                     <RefreshCw className="h-4 w-4" />
//                   </Button>
//                   <Button
//                     disabled={!formChanged || isLoading}
//                     onClick={handleSaveChanges}
//                   >
//                     {isLoading ? (
//                       <>
//                         <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
//                         Saving...
//                       </>
//                     ) : (
//                       <>
//                         <Save className="mr-2 h-4 w-4" />
//                         Save Changes
//                       </>
//                     )}
//                   </Button>
//                 </div>
//               </div>

//               {/* Tabs */}
//               <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
//                 <TabsList className="w-full justify-start mb-6">
//                   <TabsTrigger value="profile" className="flex items-center">
//                     <User className="h-4 w-4 mr-2" />
//                     Profile
//                   </TabsTrigger>
//                   <TabsTrigger value="security" className="flex items-center">
//                     <Shield className="h-4 w-4 mr-2" />
//                     Security
//                   </TabsTrigger>
//                   <TabsTrigger value="preferences" className="flex items-center">
//                     <Settings className="h-4 w-4 mr-2" />
//                     Preferences
//                   </TabsTrigger>
//                 </TabsList>

//                 {/* Profile Tab */}
//                 <TabsContent value="profile" className="space-y-6">
//                   {/* Profile Overview Card */}
//             <Card>
//               <CardHeader>
//                       <CardTitle>Profile Overview</CardTitle>
//                       <CardDescription>
//                         Your basic information and volunteer statistics
//                       </CardDescription>
//               </CardHeader>
//                     <CardContent>
//                       <div className="flex flex-col md:flex-row gap-6">
//                         {/* Profile Picture */}
//                         <div className="flex flex-col items-center">
//                           <div className="w-32 h-32 bg-gray-100 rounded-full overflow-hidden relative flex items-center justify-center border-2 border-slate-200">
//                   {profileImage ? (
//                     <img
//                       src={profileImage}
//                       alt="Profile"
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <User className="h-16 w-16 text-gray-400" />
//                   )}
//                             <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
//                               <label htmlFor="profile-upload" className="cursor-pointer">
//                                 <Camera className="h-6 w-6 text-white opacity-0 hover:opacity-100" />
//                               </label>
//                               <input
//                                 id="profile-upload"
//                                 type="file"
//                                 className="hidden"
//                                 onChange={handleImageChange}
//                                 accept="image/jpeg, image/png"
//                               />
//                             </div>
//                           </div>

//                           <div className="mt-4 flex flex-col items-center">
//                             <h3 className="font-medium text-lg">{userProfile.fullName}</h3>
//                             <p className="text-sm text-muted-foreground">{userProfile.role}</p>
//                             <p className="text-xs text-muted-foreground mt-1">Member since {userProfile.joinDate}</p>
//                 </div>

//                           <div className="mt-4 flex gap-2">
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               className="relative overflow-hidden"
//                             >
//                       <input
//                         type="file"
//                         className="absolute inset-0 cursor-pointer opacity-0"
//                         onChange={handleImageChange}
//                         accept="image/jpeg, image/png"
//                       />
//                               <Upload className="mr-1 h-3 w-3" />
//                               Upload
//                     </Button>

//                     {profileImage && (
//                       <Button
//                         variant="outline"
//                                 size="sm"
//                         onClick={removeProfileImage}
//                       >
//                                 <Trash2 className="mr-1 h-3 w-3" />
//                                 Remove
//                       </Button>
//                     )}
//                           </div>
//                         </div>

//                         {/* Stats */}
//                         <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
//                           <div className="bg-slate-50 p-4 rounded-lg">
//                             <div className="flex items-center">
//                               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                                 <Clock className="h-5 w-5 text-primary" />
//                               </div>
//                               <div>
//                                 <p className="text-sm text-muted-foreground">Total Hours</p>
//                                 <p className="text-xl font-bold">{userProfile.totalHours}</p>
//                               </div>
//                             </div>
//                           </div>

//                           <div className="bg-slate-50 p-4 rounded-lg">
//                             <div className="flex items-center">
//                               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                                 <CheckCircle2 className="h-5 w-5 text-primary" />
//                               </div>
//                               <div>
//                                 <p className="text-sm text-muted-foreground">Completed Sessions</p>
//                                 <p className="text-xl font-bold">{userProfile.completedSessions}</p>
//                               </div>
//                             </div>
//                           </div>

//                           <div className="bg-slate-50 p-4 rounded-lg">
//                             <div className="flex items-center">
//                               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                                 <Mail className="h-5 w-5 text-primary" />
//                               </div>
//                               <div>
//                                 <p className="text-sm text-muted-foreground">Email</p>
//                                 <p className="text-sm font-medium">{userProfile.email}</p>
//                               </div>
//                             </div>
//                           </div>

//                           <div className="bg-slate-50 p-4 rounded-lg">
//                             <div className="flex items-center">
//                               <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                                 <Phone className="h-5 w-5 text-primary" />
//                               </div>
//                               <div>
//                                 <p className="text-sm text-muted-foreground">Phone</p>
//                                 <p className="text-sm font-medium">{userProfile.phone}</p>
//                               </div>
//                             </div>
//                           </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Contact Information Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Contact Information</CardTitle>
//                       <CardDescription>
//                         Update your contact details
//                       </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <Label htmlFor="fullName">Full Name</Label>
//                           <div className="flex items-center mt-1">
//                     <Input
//                       id="fullName"
//                       value={userProfile.fullName}
//                       disabled
//                       className="bg-gray-50"
//                     />
//                             <Info className="h-4 w-4 text-muted-foreground ml-2" />
//                           </div>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Contact an administrator to change your name
//                     </p>
//                   </div>

//                   <div>
//                     <Label htmlFor="username">Username</Label>
//                           <div className="flex items-center mt-1">
//                     <Input
//                       id="username"
//                       value={userProfile.username}
//                       disabled
//                       className="bg-gray-50"
//                     />
//                             <Info className="h-4 w-4 text-muted-foreground ml-2" />
//                           </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="email">Email</Label>
//                           <div className="flex items-center mt-1">
//                             <Mail className="h-4 w-4 text-muted-foreground mr-2" />
//                     <Input
//                       id="email"
//                       type="email"
//                       value={email}
//                       onChange={(e) => setEmail(e.target.value)}
//                     />
//                           </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="phone">Phone Number</Label>
//                           <div className="flex items-center mt-1">
//                             <Phone className="h-4 w-4 text-muted-foreground mr-2" />
//                     <Input
//                       id="phone"
//                       type="tel"
//                       value={phone}
//                       onChange={(e) => setPhone(e.target.value)}
//                     />
//                   </div>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//                   {/* Bio Card */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>About You</CardTitle>
//                       <CardDescription>
//                         Tell others about yourself
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         <div>
//                           <Label htmlFor="bio">Bio</Label>
//                           <textarea
//                             id="bio"
//                             className="w-full min-h-[100px] p-2 border rounded-md mt-1"
//                             value={bio}
//                             onChange={(e) => setBio(e.target.value)}
//                             placeholder="Tell us about yourself..."
//                           />
//                         </div>

//                         <div>
//                           <Label>Skills</Label>
//                           <div className="flex flex-wrap gap-2 mt-2">
//                             {skills.map((skill, index) => (
//                               <Badge key={index} variant="secondary" className="flex items-center">
//                                 {skill}
//                                 <X
//                                   className="h-3 w-3 ml-1 cursor-pointer"
//                                   onClick={() => removeSkill(skill)}
//                                 />
//                               </Badge>
//                             ))}
//                             <Badge
//                               variant="outline"
//                               className="cursor-pointer flex items-center"
//                               onClick={() => {
//                                 const skill = prompt("Enter a new skill");
//                                 if (skill) addSkill(skill);
//                               }}
//                             >
//                               <Plus className="h-3 w-3 mr-1" />
//                               Add Skill
//                             </Badge>
//                           </div>
//                         </div>

//                         <div>
//                           <Label>Interests</Label>
//                           <div className="flex flex-wrap gap-2 mt-2">
//                             {interests.map((interest, index) => (
//                               <Badge key={index} variant="secondary" className="flex items-center">
//                                 {interest}
//                                 <X
//                                   className="h-3 w-3 ml-1 cursor-pointer"
//                                   onClick={() => removeInterest(interest)}
//                                 />
//                               </Badge>
//                             ))}
//                             <Badge
//                               variant="outline"
//                               className="cursor-pointer flex items-center"
//                               onClick={() => {
//                                 const interest = prompt("Enter a new interest");
//                                 if (interest) addInterest(interest);
//                               }}
//                             >
//                               <Plus className="h-3 w-3 mr-1" />
//                               Add Interest
//                             </Badge>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </TabsContent>

//                 {/* Security Tab */}
//                 <TabsContent value="security" className="space-y-6">
//             {/* Change Password Card */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Change Password</CardTitle>
//                       <CardDescription>
//                         Update your password to keep your account secure
//                       </CardDescription>
//               </CardHeader>
//               <CardContent className="space-y-4">
//                 {passwordErrors.length > 0 && (
//                   <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
//                           <div className="flex items-start">
//                             <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
//                             <div>
//                               <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
//                               <ul className="list-disc pl-5 text-sm text-red-600 mt-1">
//                       {passwordErrors.map((error, index) => (
//                         <li key={index}>{error}</li>
//                       ))}
//                     </ul>
//                             </div>
//                           </div>
//                   </div>
//                 )}

//                 <div className="space-y-4">
//                   <div>
//                     <Label htmlFor="currentPassword">Current Password</Label>
//                           <div className="relative mt-1">
//                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                               <Lock className="h-4 w-4 text-muted-foreground" />
//                             </div>
//                       <Input
//                         id="currentPassword"
//                         type={showCurrentPassword ? "text" : "password"}
//                         value={currentPassword}
//                         onChange={(e) => setCurrentPassword(e.target.value)}
//                               className="pl-9"
//                       />
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         className="absolute right-0 top-0 h-full"
//                         onClick={() => setShowCurrentPassword(!showCurrentPassword)}
//                       >
//                         {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                         <span className="sr-only">
//                           {showCurrentPassword ? "Hide password" : "Show password"}
//                         </span>
//                       </Button>
//                     </div>
//                   </div>

//                   <div>
//                     <Label htmlFor="newPassword">New Password</Label>
//                           <div className="relative mt-1">
//                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                               <Key className="h-4 w-4 text-muted-foreground" />
//                             </div>
//                       <Input
//                         id="newPassword"
//                         type={showNewPassword ? "text" : "password"}
//                         value={newPassword}
//                         onChange={(e) => setNewPassword(e.target.value)}
//                               className="pl-9"
//                       />
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         className="absolute right-0 top-0 h-full"
//                         onClick={() => setShowNewPassword(!showNewPassword)}
//                       >
//                         {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                         <span className="sr-only">
//                           {showNewPassword ? "Hide password" : "Show password"}
//                         </span>
//                       </Button>
//                     </div>
//                     <p className="text-xs text-muted-foreground mt-1">
//                       Password must be at least 8 characters long
//                     </p>
//                   </div>

//                   <div>
//                     <Label htmlFor="confirmPassword">Confirm New Password</Label>
//                           <div className="relative mt-1">
//                             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                               <Key className="h-4 w-4 text-muted-foreground" />
//                             </div>
//                       <Input
//                         id="confirmPassword"
//                         type={showConfirmPassword ? "text" : "password"}
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                               className="pl-9"
//                       />
//                       <Button
//                         type="button"
//                         variant="ghost"
//                         size="icon"
//                         className="absolute right-0 top-0 h-full"
//                         onClick={() => setShowConfirmPassword(!showConfirmPassword)}
//                       >
//                         {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
//                         <span className="sr-only">
//                           {showConfirmPassword ? "Hide password" : "Show password"}
//                         </span>
//                       </Button>
//                     </div>
//                   </div>
//                 </div>
//               </CardContent>
//                   </Card>

//                   {/* Account Security Card */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Account Security</CardTitle>
//                       <CardDescription>
//                         Manage your account security settings
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                           <div className="flex items-center">
//                             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                               <Shield className="h-5 w-5 text-primary" />
//                             </div>
//                             <div>
//                               <h4 className="font-medium">Two-Factor Authentication</h4>
//                               <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
//                             </div>
//                           </div>
//                           <Button variant="outline">Enable</Button>
//                         </div>

//                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                           <div className="flex items-center">
//                             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                               <AlertTriangle className="h-5 w-5 text-primary" />
//                             </div>
//                             <div>
//                               <h4 className="font-medium">Login History</h4>
//                               <p className="text-sm text-muted-foreground">View your recent login activity</p>
//                             </div>
//                           </div>
//                           <Button variant="outline">View</Button>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>
//                 </TabsContent>

//                 {/* Preferences Tab */}
//                 <TabsContent value="preferences" className="space-y-6">
//                   {/* Notification Preferences Card */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Notification Preferences</CardTitle>
//                       <CardDescription>
//                         Manage how you receive notifications
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                           <div className="flex items-center">
//                             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                               <Bell className="h-5 w-5 text-primary" />
//                             </div>
//                             <div>
//                               <h4 className="font-medium">Email Notifications</h4>
//                               <p className="text-sm text-muted-foreground">Receive notifications via email</p>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm text-muted-foreground">On</span>
//                             <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                               <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" defaultChecked />
//                               <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
//                             </div>
//                           </div>
//                         </div>

//                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                           <div className="flex items-center">
//                             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                               <Bell className="h-5 w-5 text-primary" />
//                             </div>
//                             <div>
//                               <h4 className="font-medium">SMS Notifications</h4>
//                               <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
//                             </div>
//                           </div>
//                           <div className="flex items-center space-x-2">
//                             <span className="text-sm text-muted-foreground">Off</span>
//                             <div className="relative inline-block w-10 mr-2 align-middle select-none">
//                               <input type="checkbox" name="toggle" id="toggle2" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer" />
//                               <label htmlFor="toggle2" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     </CardContent>
//                   </Card>

//                   {/* Privacy Settings Card */}
//                   <Card>
//                     <CardHeader>
//                       <CardTitle>Privacy Settings</CardTitle>
//                       <CardDescription>
//                         Control who can see your information
//                       </CardDescription>
//                     </CardHeader>
//                     <CardContent>
//                       <div className="space-y-4">
//                         <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
//                           <div className="flex items-center">
//                             <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
//                               <User className="h-5 w-5 text-primary" />
//                             </div>
//                             <div>
//                               <h4 className="font-medium">Profile Visibility</h4>
//                               <p className="text-sm text-muted-foreground">Control who can see your profile</p>
//                             </div>
//                           </div>
//                           <select className="border rounded-md p-2">
//                             <option>Everyone</option>
//                             <option>Volunteers Only</option>
//                             <option>Managers Only</option>
//                             <option>Private</option>
//                           </select>
//                         </div>
//                       </div>
//                     </CardContent>
//             </Card>
//                 </TabsContent>
//               </Tabs>
//             </div>
//           </div>
//         </main>
//       </div>

//       {/* Overlay for mobile when sidebar is open */}
//       {isMobile && sidebarOpen && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-10"
//           onClick={() => setSidebarOpen(false)}
//         ></div>
//       )}
//     </div>
//   );
// };

// export default VolunteerProfile;

import React from 'react';
import { volunteerProfile } from '@/components/utils/dummyData'

export function VolunteerProfile() {
  return (
    <div className="p-6 bg-white rounded-lg shadow max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="flex items-center gap-4 mb-6">
        <img
          src={volunteerProfile.avatar}
          alt="Profile"
          className="rounded-full w-20 h-20 shadow"
        />
        <div>
          <div className="text-lg font-semibold">{volunteerProfile.name}</div>
          <div className="text-gray-500">{volunteerProfile.email}</div>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input 
            type="text" 
            defaultValue={volunteerProfile.name} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input 
            type="email" 
            defaultValue={volunteerProfile.email} 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

export default VolunteerProfile;
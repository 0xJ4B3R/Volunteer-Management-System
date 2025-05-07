import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Settings, 
  Bell, 
  Menu, 
  LogOut,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Clock,
  Users,
  UserCog,
  AlertCircle,
  Info,
  Upload,
  Download,
  Play,
  Eye,
  RotateCcw,
  Loader2,
  Search,
  ChevronUp,
  ChevronDown,
  Filter,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ManagerSidebar from "@/components/manager/ManagerSidebar";
import NotificationsPanel from "@/components/manager/NotificationsPanel";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";

interface Notification {
  id: number;
  message: string;
  time: string;
  type: "success" | "warning" | "info" | "default";
  link?: string;
}

interface MatchingRule {
  id: string;
  name: string;
  description: string;
  value: number | boolean | string;
  category: "skill" | "availability" | "priority" | "override";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { value: string; label: string }[];
  impact: "high" | "medium" | "low";
}

interface RuleHistory {
  id: string;
  timestamp: string;
  rules: MatchingRule[];
  changedBy: string;
  comment: string;
}

interface TestMatchResult {
  volunteerId: string;
  volunteerName: string;
  residentId: string;
  residentName: string;
  score: number;
  factors: {
    name: string;
    score: number;
    weight: number;
  }[];
}

// Mock data for volunteers and residents
const mockVolunteers = [
  { id: "v1", name: "John Smith", skills: ["medical", "social"], availability: ["monday", "wednesday", "friday"] },
  { id: "v2", name: "Sarah Johnson", skills: ["emergency", "medical"], availability: ["tuesday", "thursday"] },
  { id: "v3", name: "Michael Brown", skills: ["social", "regular"], availability: ["monday", "wednesday", "saturday"] },
  { id: "v4", name: "Emily Davis", skills: ["medical", "emergency"], availability: ["tuesday", "thursday", "sunday"] },
  { id: "v5", name: "David Wilson", skills: ["social", "regular"], availability: ["monday", "friday", "saturday"] }
];

const mockResidents = [
  { id: "r1", name: "Robert Taylor", needs: ["medical", "social"], priority: "high" },
  { id: "r2", name: "Mary Anderson", needs: ["emergency", "medical"], priority: "medium" },
  { id: "r3", name: "James Thomas", needs: ["social", "regular"], priority: "low" },
  { id: "r4", name: "Patricia Jackson", needs: ["medical", "emergency"], priority: "high" },
  { id: "r5", name: "William White", needs: ["social", "regular"], priority: "medium" }
];

// Default matching rules
const defaultRules: MatchingRule[] = [
  // Skill Weight Settings
  { 
    id: "skills-match", 
    name: "Skills Match", 
    description: "Importance of matching volunteer skills with resident needs", 
    value: 3, 
    category: "skill", 
    min: 1, 
    max: 5, 
    step: 1,
    impact: "high"
  },
  { 
    id: "language-compatibility", 
    name: "Language Compatibility", 
    description: "Importance of matching languages spoken", 
    value: 4, 
    category: "skill", 
    min: 1, 
    max: 5, 
    step: 1,
    impact: "medium"
  },
  { 
    id: "experience-level", 
    name: "Experience Level", 
    description: "Importance of volunteer experience with similar residents", 
    value: 3, 
    category: "skill", 
    min: 1, 
    max: 5, 
    step: 1,
    impact: "medium"
  },
  { 
    id: "availability", 
    name: "Availability", 
    description: "Importance of matching volunteer availability with resident needs", 
    value: 5, 
    category: "skill", 
    min: 1, 
    max: 5, 
    step: 1,
    impact: "high"
  },
  
  // Availability Logic
  { 
    id: "exact-time-match", 
    name: "Exact Time Match", 
    description: "Require exact time match for volunteer availability", 
    value: false, 
    category: "availability",
    impact: "medium"
  },
  { 
    id: "flexible-time-window", 
    name: "Flexible Time Window", 
    description: "Allow flexible time windows for volunteer availability", 
    value: true, 
    category: "availability",
    impact: "low"
  },
  { 
    id: "time-window-hours", 
    name: "Time Window Hours", 
    description: "Number of hours flexibility allowed for time windows", 
    value: 1, 
    category: "availability", 
    min: 0, 
    max: 4, 
    step: 0.5,
    unit: " hours",
    impact: "low"
  },
  
  // Resident Priority Options
  { 
    id: "prioritize-no-visits", 
    name: "Prioritize No Recent Visits", 
    description: "Prioritize residents without recent visits", 
    value: true, 
    category: "priority",
    impact: "medium"
  },
  { 
    id: "prioritize-special-needs", 
    name: "Prioritize Special Needs", 
    description: "Prioritize residents with special needs tags", 
    value: true, 
    category: "priority",
    impact: "high"
  },
  { 
    id: "priority-match-rule", 
    name: "Priority Match Rule", 
    description: "Rule for matching priority residents", 
    value: "balanced", 
    category: "priority", 
    options: [
      { value: "balanced", label: "Balanced" },
      { value: "strict", label: "Strict" },
      { value: "flexible", label: "Flexible" }
    ],
    impact: "high"
  },
  
  // Manual Override Settings
  { 
    id: "allow-manual-override", 
    name: "Allow Manual Override", 
    description: "Allow managers to override AI matches", 
    value: true, 
    category: "override",
    impact: "medium"
  },
  { 
    id: "require-justification", 
    name: "Require Justification", 
    description: "Require justification for manual overrides", 
    value: true, 
    category: "override",
    impact: "low"
  }
];

const ManagerMatchingRules = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [rules, setRules] = useState<MatchingRule[]>(defaultRules);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [ruleHistory, setRuleHistory] = useState<RuleHistory[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importData, setImportData] = useState("");
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<"volunteer" | "resident" | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<string | null>(null);
  const [selectedResident, setSelectedResident] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<TestMatchResult[]>([]);
  const [showTestResults, setShowTestResults] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [showAllRules, setShowAllRules] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check authentication
  useEffect(() => {
    // For development/testing purposes, we'll bypass the authentication check
    // This allows the page to be accessed without redirecting to login
    return;
    
    // Original authentication code (commented out)
    /*
    const userData = localStorage.getItem("userData");
    if (!userData) {
      navigate("/login");
      return;
    }

    try {
      const { role } = JSON.parse(userData);
      if (role !== "manager") {
        navigate("/");
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      // Don't redirect on parsing error, just log it
    }
    */
  }, [navigate]);

  const handleRuleChange = (ruleId: string, value: number | boolean | string) => {
    setRules(prevRules => 
      prevRules.map(rule => 
        rule.id === ruleId ? { ...rule, value } : rule
      )
    );
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to history
      const newHistoryItem: RuleHistory = {
        id: `h${ruleHistory.length + 1}`,
        timestamp: new Date().toISOString(),
        rules: [...rules],
        changedBy: "Current User", // Replace with actual user name
        comment: "Rules updated"
      };
      
      setRuleHistory(prev => [newHistoryItem, ...prev]);
      setHasChanges(false);
      
      // Add notification
      setNotifications(prev => [{
        id: Date.now(),
        message: "Matching rules updated successfully",
        time: "Just now",
        type: "success"
      }, ...prev]);
      
      toast({
        title: "Success",
        description: "Matching rules have been updated",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update matching rules",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaults = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setRules(defaultRules);
      setHasChanges(false);
      setIsResetDialogOpen(false);
      
      // Add to history
      const newHistoryItem: RuleHistory = {
        id: `h${ruleHistory.length + 1}`,
        timestamp: new Date().toISOString(),
        rules: defaultRules,
        changedBy: "Current User", // Replace with actual user name
        comment: "Reset to defaults"
      };
      
      setRuleHistory(prev => [newHistoryItem, ...prev]);
      
      // Add notification
      setNotifications(prev => [{
        id: Date.now(),
        message: "Matching rules reset to defaults",
        time: "Just now",
        type: "info"
      }, ...prev]);
      
      toast({
        title: "Success",
        description: "Matching rules have been reset to defaults",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reset matching rules",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportRules = async () => {
    try {
      const importedRules = JSON.parse(importData);
      // Validate imported rules
      if (!Array.isArray(importedRules) || !importedRules.every(rule => 
        typeof rule === "object" && 
        "id" in rule && 
        "category" in rule && 
        "name" in rule && 
        "value" in rule
      )) {
        throw new Error("Invalid rules format");
      }
      
      setRules(importedRules);
      setImportDialogOpen(false);
      setImportData("");
      setHasChanges(true);
      
      // Add to history
      const newHistoryItem: RuleHistory = {
        id: `h${ruleHistory.length + 1}`,
        timestamp: new Date().toISOString(),
        rules: importedRules,
        changedBy: "Current User", // Replace with actual user name
        comment: "Rules imported"
      };
      
      setRuleHistory(prev => [newHistoryItem, ...prev]);
      
      // Add notification
      setNotifications(prev => [{
        id: Date.now(),
        message: "Matching rules imported successfully",
        time: "Just now",
        type: "success"
      }, ...prev]);
      
      toast({
        title: "Success",
        description: "Matching rules have been imported",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import matching rules. Please check the format.",
        variant: "destructive"
      });
    }
  };

  const handleExportRules = () => {
    const rulesJson = JSON.stringify(rules, null, 2);
    const blob = new Blob([rulesJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matching-rules-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportDialogOpen(false);
  };

  const handleTestMatching = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock test results
      const results: TestMatchResult[] = mockVolunteers.flatMap(volunteer => 
        mockResidents.map(resident => ({
          volunteerId: volunteer.id,
          volunteerName: volunteer.name,
          residentId: resident.id,
          residentName: resident.name,
          score: Math.floor(Math.random() * 40) + 60, // Random score between 60-100
          factors: [
            { name: "Skills Match", score: Math.floor(Math.random() * 40) + 60, weight: 0.4 },
            { name: "Availability", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 },
            { name: "Priority", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 }
          ]
        }))
      );
      
      setTestResults(results);
      setShowTestResults(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test matching rules",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewMatching = async () => {
    if ((previewMode === "volunteer" && !selectedVolunteer) || 
        (previewMode === "resident" && !selectedResident)) {
      toast({
        title: "Error",
        description: "Please select a volunteer or resident",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock preview results
      const results: TestMatchResult[] = previewMode === "volunteer"
        ? mockResidents.map(resident => ({
            volunteerId: selectedVolunteer!,
            volunteerName: mockVolunteers.find(v => v.id === selectedVolunteer)!.name,
            residentId: resident.id,
            residentName: resident.name,
            score: Math.floor(Math.random() * 40) + 60,
            factors: [
              { name: "Skills Match", score: Math.floor(Math.random() * 40) + 60, weight: 0.4 },
              { name: "Availability", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 },
              { name: "Priority", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 }
            ]
          }))
        : mockVolunteers.map(volunteer => ({
            volunteerId: volunteer.id,
            volunteerName: volunteer.name,
            residentId: selectedResident!,
            residentName: mockResidents.find(r => r.id === selectedResident)!.name,
            score: Math.floor(Math.random() * 40) + 60,
            factors: [
              { name: "Skills Match", score: Math.floor(Math.random() * 40) + 60, weight: 0.4 },
              { name: "Availability", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 },
              { name: "Priority", score: Math.floor(Math.random() * 40) + 60, weight: 0.3 }
            ]
          }));
      
      setTestResults(results);
      setShowPreview(true);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to preview matching",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userData");
    navigate("/login");
  };

  const filteredRules = rules.filter(rule => 
    rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rule.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get important rules (high impact or key settings)
  const importantRules = filteredRules.filter(rule => 
    rule.impact === "high" || 
    rule.id === "skills-match" || 
    rule.id === "availability" || 
    rule.id === "prioritize-special-needs" ||
    rule.id === "priority-match-rule"
  );

  // Get remaining rules
  const remainingRules = filteredRules.filter(rule => 
    !importantRules.some(importantRule => importantRule.id === rule.id)
  );

  const getRuleValueDisplay = (rule: MatchingRule) => {
    if (typeof rule.value === "boolean") {
      return rule.value ? "Enabled" : "Disabled";
    }
    if (typeof rule.value === "number") {
      return `${rule.value}${rule.unit || ""}`;
    }
    return rule.value;
  };

  const getImpactColor = (impact: "high" | "medium" | "low") => {
    switch (impact) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-primary" />
              <h1 className="font-bold text-xl hidden sm:block">Volunteer Management System</h1>
            </div>
          </div>
          
          {/* Search Bar - Hidden on Mobile */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <Input 
                placeholder="Search rules..." 
                className="pl-9 bg-slate-50 border-slate-200"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Quick Actions */}
            <Button 
              variant="ghost" 
              size="icon"
              className="hidden sm:flex"
              onClick={handleTestMatching}
            >
              <Zap className="h-5 w-5" />
            </Button>
            
            {/* Notifications */}
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Button>
              
              {/* Notifications Panel */}
              <NotificationsPanel 
                isOpen={isNotificationsOpen} 
                onClose={() => setIsNotificationsOpen(false)} 
                notifications={notifications} 
              />
            </div>
            
            {/* User Avatar */}
            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary">M</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <ManagerSidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          isMobile={isMobile} 
          onLogout={handleLogout}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 transition-all duration-300">
          {/* Mobile Search */}
          {isMobile && (
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input 
                  placeholder="Search rules..." 
                  className="pl-9 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Matching Rules</h1>
            <p className="text-slate-600 mt-1">Configure and test AI matching rules for volunteer-resident pairing.</p>
          </div>

          {/* Introduction Card */}
          <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                AI Matching Rules Configuration
              </CardTitle>
              <CardDescription className="text-base">
                Configure how the system matches volunteers with residents based on skills, availability, and other factors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start p-3 bg-white rounded-md shadow-sm">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Sliders className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Skill Weights</h3>
                    <p className="text-sm text-gray-500">Adjust importance of different matching factors</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-white rounded-md shadow-sm">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Availability Logic</h3>
                    <p className="text-sm text-gray-500">Configure time matching preferences</p>
                  </div>
                </div>
                <div className="flex items-start p-3 bg-white rounded-md shadow-sm">
                  <div className="bg-blue-100 p-2 rounded-full mr-3">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Priority Settings</h3>
                    <p className="text-sm text-gray-500">Set rules for prioritizing residents</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search rules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                className="flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <Button
                variant="outline"
                onClick={() => setExportDialogOpen(true)}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setTestDialogOpen(true)}
                className="flex items-center"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Rules
              </Button>
              <Button
                variant="outline"
                onClick={() => setPreviewDialogOpen(true)}
                className="flex items-center"
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsResetDialogOpen(true)}
                className="flex items-center"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || isLoading}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Important Rules Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Essential Rules</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {importantRules.length} rules
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {importantRules.map((rule) => (
                <Card key={rule.id} className="relative hover:shadow-md transition-shadow duration-200">
                  <CardHeader className="pb-2">
                    <div>
                      <CardTitle className="text-lg">{rule.name}</CardTitle>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {typeof rule.value === "boolean" ? (
                      <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                        <Switch
                          checked={rule.value}
                          onCheckedChange={(checked) => handleRuleChange(rule.id, checked)}
                        />
                        <Label className="font-medium">{rule.value ? "Enabled" : "Disabled"}</Label>
                      </div>
                    ) : typeof rule.value === "number" ? (
                      <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">Value</Label>
                          <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {rule.value}{rule.unit}
                          </span>
                        </div>
                        <Slider
                          value={[rule.value]}
                          min={rule.min || 0}
                          max={rule.max || 100}
                          step={rule.step || 1}
                          onValueChange={([value]) => handleRuleChange(rule.id, value)}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{rule.min || 0}{rule.unit}</span>
                          <span>{rule.max || 100}{rule.unit}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <Select
                          value={rule.value}
                          onValueChange={(value) => handleRuleChange(rule.id, value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select value" />
                          </SelectTrigger>
                          <SelectContent>
                            {rule.options?.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="text-sm text-gray-500 flex justify-between items-center pt-0">
                    <span>Last updated: {new Date().toLocaleDateString()}</span>
                    {hasChanges && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Modified
                      </Badge>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>

          {/* Advanced Rules Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-900">Advanced Rules</h2>
                <Badge variant="outline" className="ml-2 bg-gray-100 text-gray-700 border-gray-200">
                  {remainingRules.length} rules
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllRules(!showAllRules)}
                className="flex items-center"
              >
                {showAllRules ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show All
                  </>
                )}
              </Button>
            </div>
            
            {showAllRules && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {remainingRules.map((rule) => (
                  <Card key={rule.id} className="relative hover:shadow-md transition-shadow duration-200">
                    <CardHeader className="pb-2">
                      <div>
                        <CardTitle className="text-lg">{rule.name}</CardTitle>
                        <CardDescription>{rule.description}</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {typeof rule.value === "boolean" ? (
                        <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                          <Switch
                            checked={rule.value}
                            onCheckedChange={(checked) => handleRuleChange(rule.id, checked)}
                          />
                          <Label className="font-medium">{rule.value ? "Enabled" : "Disabled"}</Label>
                        </div>
                      ) : typeof rule.value === "number" ? (
                        <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">Value</Label>
                            <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {rule.value}{rule.unit}
                            </span>
                          </div>
                          <Slider
                            value={[rule.value]}
                            min={rule.min || 0}
                            max={rule.max || 100}
                            step={rule.step || 1}
                            onValueChange={([value]) => handleRuleChange(rule.id, value)}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{rule.min || 0}{rule.unit}</span>
                            <span>{rule.max || 100}{rule.unit}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-gray-50 rounded-md">
                          <Select
                            value={rule.value}
                            onValueChange={(value) => handleRuleChange(rule.id, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select value" />
                            </SelectTrigger>
                            <SelectContent>
                              {rule.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="text-sm text-gray-500 flex justify-between items-center pt-0">
                      <span>Last updated: {new Date().toLocaleDateString()}</span>
                      {hasChanges && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          Modified
                        </Badge>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
            
            {!showAllRules && remainingRules.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm text-center">
                <div className="flex flex-col items-center">
                  <Settings className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Configuration</h3>
                  <p className="text-gray-500 mb-4 max-w-md">
                    Additional matching rules are available for fine-tuning the volunteer-resident matching algorithm.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setShowAllRules(true)}
                    className="flex items-center"
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Show Advanced Rules
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* No Results */}
          {filteredRules.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No rules found</h3>
              <p className="text-gray-500 mb-4">
                Try adjusting your search query or filters
              </p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="flex items-center mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Clear Search
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Sidebar - Only visible on mobile when toggled */}
      {isSidebarOpen && isMobile && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
            <ManagerSidebar
              isOpen={true}
              onClose={() => setIsSidebarOpen(false)}
              onLogout={handleLogout}
              isMobile={isMobile}
            />
          </div>
        </div>
      )}

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Upload className="h-5 w-5 mr-2 text-blue-600" />
              Import Matching Rules
            </DialogTitle>
            <DialogDescription>
              Paste your JSON configuration below to import matching rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-md">
              <h4 className="text-sm font-medium mb-2">JSON Format Example:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {`[
  {
    "id": "skills-match",
    "name": "Skills Match",
    "description": "Importance of matching volunteer skills",
    "value": 3,
    "category": "skill",
    "min": 1,
    "max": 5,
    "step": 1,
    "impact": "high"
  }
]`}
              </pre>
            </div>
            <Textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              placeholder="Paste JSON here..."
              className="h-64 font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImportRules} className="bg-blue-600 hover:bg-blue-700">
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Download className="h-5 w-5 mr-2 text-blue-600" />
              Export Matching Rules
            </DialogTitle>
            <DialogDescription>
              Export your current matching rules configuration as JSON.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={JSON.stringify(rules, null, 2)}
              readOnly
              className="h-64 font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportRules} className="bg-blue-600 hover:bg-blue-700">
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Play className="h-5 w-5 mr-2 text-blue-600" />
              Test Matching Rules
            </DialogTitle>
            <DialogDescription>
              Test your matching rules against the current volunteer and resident data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">About Testing</h4>
                  <p className="text-sm text-blue-700">
                    This test will simulate matching all volunteers with all residents using your current rules.
                    The results will show match scores and the factors that contributed to each match.
                  </p>
                </div>
              </div>
            </div>
            <Button
              onClick={handleTestMatching}
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>
          {showTestResults && (
            <div className="space-y-4">
              <h3 className="font-medium">Test Results</h3>
              <div className="max-h-96 overflow-auto border rounded-md">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Volunteer</th>
                      <th className="text-left p-3 font-medium">Resident</th>
                      <th className="text-left p-3 font-medium">Score</th>
                      <th className="text-left p-3 font-medium">Factors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-3">{result.volunteerName}</td>
                        <td className="p-3">{result.residentName}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              result.score >= 80 ? "default" :
                              result.score >= 60 ? "secondary" :
                              "destructive"
                            }
                            className="text-sm"
                          >
                            {result.score}%
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-2">
                            {result.factors.map((factor, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-sm font-medium min-w-[100px]">{factor.name}:</span>
                                <Progress value={factor.score} className="w-24" />
                                <span className="text-sm font-medium min-w-[40px] text-right">({factor.score}%)</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-blue-600" />
              Preview Matching
            </DialogTitle>
            <DialogDescription>
              Preview how volunteers and residents would be matched with current rules.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-800">About Preview</h4>
                  <p className="text-sm text-blue-700">
                    Select a volunteer or resident to see how they would be matched with all residents or volunteers.
                    This helps you understand the impact of your matching rules on specific cases.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block font-medium">Preview Mode</Label>
                <Select
                  value={previewMode}
                  onValueChange={(value: "volunteer" | "resident") => setPreviewMode(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="volunteer">By Volunteer</SelectItem>
                    <SelectItem value="resident">By Resident</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block font-medium">
                  {previewMode === "volunteer" ? "Select Volunteer" : "Select Resident"}
                </Label>
                <Select
                  value={previewMode === "volunteer" ? selectedVolunteer : selectedResident}
                  onValueChange={(value) => 
                    previewMode === "volunteer" 
                      ? setSelectedVolunteer(value)
                      : setSelectedResident(value)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Select ${previewMode}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {previewMode === "volunteer"
                      ? mockVolunteers.map((volunteer) => (
                          <SelectItem key={volunteer.id} value={volunteer.id}>
                            {volunteer.name}
                          </SelectItem>
                        ))
                      : mockResidents.map((resident) => (
                          <SelectItem key={resident.id} value={resident.id}>
                            {resident.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              onClick={handlePreviewMatching}
              disabled={isLoading || (previewMode === "volunteer" && !selectedVolunteer) || 
                       (previewMode === "resident" && !selectedResident)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Preview...
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </>
              )}
            </Button>
          </div>
          {showPreview && (
            <div className="space-y-4">
              <h3 className="font-medium">Preview Results</h3>
              <div className="max-h-96 overflow-auto border rounded-md">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">
                        {previewMode === "volunteer" ? "Resident" : "Volunteer"}
                      </th>
                      <th className="text-left p-3 font-medium">Score</th>
                      <th className="text-left p-3 font-medium">Factors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result, index) => (
                      <tr key={index} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          {previewMode === "volunteer" ? result.residentName : result.volunteerName}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              result.score >= 80 ? "default" :
                              result.score >= 60 ? "secondary" :
                              "destructive"
                            }
                            className="text-sm"
                          >
                            {result.score}%
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="space-y-2">
                            {result.factors.map((factor, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span className="text-sm font-medium min-w-[100px]">{factor.name}:</span>
                                <Progress value={factor.score} className="w-24" />
                                <span className="text-sm font-medium min-w-[40px] text-right">({factor.score}%)</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <RotateCcw className="h-5 w-5 mr-2 text-yellow-600" />
              Reset to Defaults
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset all matching rules to their default values? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">Warning</h4>
                <p className="text-sm text-yellow-700">
                  Resetting to defaults will discard all your custom settings. This will affect how the AI matches volunteers to residents.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleResetToDefaults}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ManagerMatchingRules; 
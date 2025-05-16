import { db } from "@/lib/firebase";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useVolunteers } from "@/hooks/useVolunteers";
import { collection, getDocs } from 'firebase/firestore';
import { CalendarSlotUI, VolunteerRequestUI } from "@/hooks/useFirestoreCalendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TestVolunteerRequests = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { volunteers, loading: volunteersLoading } = useVolunteers();
  const [slots, setSlots] = useState<CalendarSlotUI[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string>("");
  const [selectedVolunteerId, setSelectedVolunteerId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all calendar slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const slotsRef = collection(db, "calendar_slots");
        const snapshot = await getDocs(slotsRef);
        const slotsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CalendarSlotUI[];
        setSlots(slotsData);
      } catch (error) {
        console.error("Error fetching slots:", error);
        toast({
          title: "Error",
          description: "Failed to fetch calendar slots",
          variant: "destructive"
        });
      }
    };

    fetchSlots();
  }, [toast]);

  const handleAddRequest = async () => {
    if (!selectedSlotId || !selectedVolunteerId) return;

    setIsLoading(true);
    try {
      const selectedSlot = slots.find(s => s.id === selectedSlotId);
      const selectedVolunteer = volunteers.find(v => v.id === selectedVolunteerId);

      if (!selectedSlot || !selectedVolunteer) {
        throw new Error("Selected slot or volunteer not found");
      }

      // Create new request
      const newRequest: VolunteerRequestUI = {
        volunteerId: selectedVolunteer.id,
        status: "pending" as const,
        requestedAt: new Date().toISOString(),
        approvedAt: null,
        rejectedAt: null,
        rejectedReason: null,
        matchScore: null,
        assignedBy: "manager" as const
      };

      // Update local state
      setSlots(prevSlots => 
        prevSlots.map(slot => 
          slot.id === selectedSlotId 
            ? {
                ...slot,
                volunteerRequests: [
                  ...(slot.volunteerRequests || []),
                  newRequest
                ]
              }
            : slot
        )
      );

      toast({
        title: "Success",
        description: "Volunteer request added successfully"
      });

      // Reset selections
      setSelectedSlotId("");
      setSelectedVolunteerId("");
    } catch (error) {
      console.error("Error adding volunteer request:", error);
      toast({
        title: "Error",
        description: "Failed to add volunteer request",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveRequest = (slotId: string, volunteerId: string) => {
    setSlots(prevSlots => {
      return prevSlots.map(slot => {
        if (slot.id === slotId) {
          const now = new Date().toISOString();
          return {
            ...slot,
            volunteerRequests: slot.volunteerRequests.map(request => {
              if (request.volunteerId === volunteerId) {
                return {
                  ...request,
                  status: 'approved',
                  approvedAt: now
                };
              }
              return request;
            })
          };
        }
        return slot;
      });
    });
  };

  const handleRejectRequest = (slotId: string, volunteerId: string) => {
    setSlots(prevSlots => {
      return prevSlots.map(slot => {
        if (slot.id === slotId) {
          const now = new Date().toISOString();
          return {
            ...slot,
            volunteerRequests: slot.volunteerRequests.map(request => {
              if (request.volunteerId === volunteerId) {
                return {
                  ...request,
                  status: 'rejected',
                  rejectedAt: now,
                  rejectedReason: 'Rejected by manager'
                };
              }
              return request;
            })
          };
        }
        return slot;
      });
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Test Volunteer Requests</h1>
        <Button variant="outline" onClick={() => navigate("/manager/calendar")}>
          Back to Calendar
        </Button>
      </div>

      <div className="grid gap-6 p-6 bg-white rounded-lg shadow">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="slot">Select Calendar Slot</Label>
            <Select
              value={selectedSlotId}
              onValueChange={setSelectedSlotId}
              disabled={isLoading}
            >
              <SelectTrigger id="slot">
                <SelectValue placeholder="Select a slot" />
              </SelectTrigger>
              <SelectContent>
                {slots.map(slot => (
                  <SelectItem key={slot.id} value={slot.id}>
                    {slot.date} - {slot.startTime} to {slot.endTime}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="volunteer">Select Volunteer</Label>
            <Select
              value={selectedVolunteerId}
              onValueChange={setSelectedVolunteerId}
              disabled={isLoading || volunteersLoading}
            >
              <SelectTrigger id="volunteer">
                <SelectValue placeholder="Select a volunteer" />
              </SelectTrigger>
              <SelectContent>
                {volunteers.map(volunteer => (
                  <SelectItem key={volunteer.id} value={volunteer.id}>
                    {volunteer.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAddRequest}
            disabled={isLoading || !selectedSlotId || !selectedVolunteerId}
          >
            {isLoading ? "Adding Request..." : "Add Volunteer Request"}
          </Button>
        </div>

        {/* Display current requests for selected slot */}
        {selectedSlotId && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-4">Current Requests for Selected Slot</h2>
            <div className="grid gap-2">
              {slots
                .find(slot => slot.id === selectedSlotId)
                ?.volunteerRequests?.map(request => {
                  const volunteer = volunteers.find(v => v.id === request.volunteerId);
                  return (
                    <div 
                      key={request.volunteerId} 
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{volunteer?.fullName || request.volunteerId}</p>
                        <p className="text-sm text-slate-500">
                          Requested: {new Date(request.requestedAt).toLocaleString()}
                        </p>
                        {request.rejectedReason && (
                          <p className="text-sm text-red-500">
                            Reason: {request.rejectedReason}
                          </p>
                        )}
                      </div>
                      <Badge variant={request.status === "pending" ? "outline" : "default"}>
                        {request.status}
                      </Badge>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestVolunteerRequests; 
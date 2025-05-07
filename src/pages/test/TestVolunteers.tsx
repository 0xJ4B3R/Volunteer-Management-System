import { useState } from 'react';
import { useVolunteers, useAddVolunteer, useUpdateVolunteer, useDeleteVolunteer } from '@/hooks/useFirestoreVolunteers';
import { Timestamp } from 'firebase/firestore';

export default function TestVolunteers() {
  // Real-time data
  const { volunteers, loading, error } = useVolunteers();
  
  // CRUD operations
  const { addVolunteer, loading: adding } = useAddVolunteer();
  const { updateVolunteer, loading: updating } = useUpdateVolunteer();
  const { deleteVolunteer, loading: deleting } = useDeleteVolunteer();

  // Form state
  const [newVolunteer, setNewVolunteer] = useState({
    userId: '',
    fullName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    phoneNumber: '',
    languages: [] as string[],
    skills: [] as string[],
    hobbies: [] as string[],
    groupAffiliation: null as string | null,
    matchingPreference: null as 'oneOnOne' | 'groupActivity' | 'noPreference' | null,
    reasonForVolunteering: null as 'scholarship' | 'communityService' | 'personalInterest' | 'other' | null,
    isActive: true,
    notes: null as string | null,
    createdAt: Timestamp.now(),
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    userId: '',
    fullName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    phoneNumber: '',
    languages: [] as string[],
    skills: [] as string[],
    hobbies: [] as string[],
    groupAffiliation: null as string | null,
    matchingPreference: null as 'oneOnOne' | 'groupActivity' | 'noPreference' | null,
    reasonForVolunteering: null as 'scholarship' | 'communityService' | 'personalInterest' | 'other' | null,
    isActive: true,
    notes: null as string | null,
  });

  // Handle form changes
  const handleNewVolunteerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewVolunteer(prev => ({ ...prev, [name]: value }));
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submissions
  const handleAddVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    await addVolunteer(newVolunteer);
    setNewVolunteer({
      userId: '',
      fullName: '',
      birthDate: '',
      gender: 'male',
      phoneNumber: '',
      languages: [],
      skills: [],
      hobbies: [],
      groupAffiliation: null,
      matchingPreference: null,
      reasonForVolunteering: null,
      isActive: true,
      notes: null,
      createdAt: Timestamp.now(),
    });
  };

  const handleUpdateVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    await updateVolunteer(editingId, editForm);
    setEditingId(null);
  };

  const handleDeleteVolunteer = async (id: string) => {
    await deleteVolunteer(id);
  };

  // Start editing a volunteer
  const startEditing = (volunteer: typeof volunteers[0]) => {
    setEditingId(volunteer.id);
    setEditForm({
      userId: volunteer.userId,
      fullName: volunteer.fullName,
      birthDate: volunteer.birthDate,
      gender: volunteer.gender,
      phoneNumber: volunteer.phoneNumber,
      languages: volunteer.languages,
      skills: volunteer.skills || [],
      hobbies: volunteer.hobbies || [],
      groupAffiliation: volunteer.groupAffiliation,
      matchingPreference: volunteer.matchingPreference,
      reasonForVolunteering: volunteer.reasonForVolunteering,
      isActive: volunteer.isActive,
      notes: volunteer.notes,
    });
  };

  if (loading) return <div className="p-4">Loading volunteers...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-4 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Volunteers Test Page</h1>

      {/* Add New Volunteer Form */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Add New Volunteer</h2>
        <form onSubmit={handleAddVolunteer} className="space-y-4">
          <div>
            <label className="block">User ID:</label>
            <input
              type="text"
              name="userId"
              value={newVolunteer.userId}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">Full Name:</label>
            <input
              type="text"
              name="fullName"
              value={newVolunteer.fullName}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">Birth Date:</label>
            <input
              type="date"
              name="birthDate"
              value={newVolunteer.birthDate}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">Gender:</label>
            <select
              name="gender"
              value={newVolunteer.gender}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className="block">Phone Number:</label>
            <input
              type="tel"
              name="phoneNumber"
              value={newVolunteer.phoneNumber}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block">Languages (comma-separated):</label>
            <input
              type="text"
              name="languages"
              value={newVolunteer.languages.join(',')}
              onChange={(e) => {
                const languages = e.target.value.split(',').map(lang => lang.trim());
                setNewVolunteer(prev => ({ ...prev, languages }));
              }}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Skills (comma-separated):</label>
            <input
              type="text"
              name="skills"
              value={newVolunteer.skills.join(',')}
              onChange={(e) => {
                const skills = e.target.value.split(',').map(skill => skill.trim());
                setNewVolunteer(prev => ({ ...prev, skills }));
              }}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Hobbies (comma-separated):</label>
            <input
              type="text"
              name="hobbies"
              value={newVolunteer.hobbies.join(',')}
              onChange={(e) => {
                const hobbies = e.target.value.split(',').map(hobby => hobby.trim());
                setNewVolunteer(prev => ({ ...prev, hobbies }));
              }}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Group Affiliation:</label>
            <input
              type="text"
              name="groupAffiliation"
              value={newVolunteer.groupAffiliation || ''}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block">Matching Preference:</label>
            <select
              name="matchingPreference"
              value={newVolunteer.matchingPreference || ''}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
            >
              <option value="">No Preference</option>
              <option value="oneOnOne">One-on-One</option>
              <option value="groupActivity">Group Activity</option>
            </select>
          </div>
          <div>
            <label className="block">Reason for Volunteering:</label>
            <select
              name="reasonForVolunteering"
              value={newVolunteer.reasonForVolunteering || ''}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select a reason</option>
              <option value="scholarship">Scholarship</option>
              <option value="communityService">Community Service</option>
              <option value="personalInterest">Personal Interest</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="isActive"
              checked={newVolunteer.isActive}
              onChange={(e) => setNewVolunteer(prev => ({ ...prev, isActive: e.target.checked }))}
              className="p-2 border rounded"
            />
            <label>Active</label>
          </div>
          <div>
            <label className="block">Notes:</label>
            <textarea
              name="notes"
              value={newVolunteer.notes || ''}
              onChange={handleNewVolunteerChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            disabled={adding}
            className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
          >
            {adding ? 'Adding...' : 'Add Volunteer'}
          </button>
        </form>
      </div>

      {/* Edit Volunteer Form */}
      {editingId && (
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Edit Volunteer</h2>
          <form onSubmit={handleUpdateVolunteer} className="space-y-4">
            <div>
              <label className="block">User ID:</label>
              <input
                type="text"
                name="userId"
                value={editForm.userId}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block">Full Name:</label>
              <input
                type="text"
                name="fullName"
                value={editForm.fullName}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block">Birth Date:</label>
              <input
                type="date"
                name="birthDate"
                value={editForm.birthDate}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block">Gender:</label>
              <select
                name="gender"
                value={editForm.gender}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block">Phone Number:</label>
              <input
                type="tel"
                name="phoneNumber"
                value={editForm.phoneNumber}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div>
              <label className="block">Languages (comma-separated):</label>
              <input
                type="text"
                name="languages"
                value={editForm.languages.join(',')}
                onChange={(e) => {
                  const languages = e.target.value.split(',').map(lang => lang.trim());
                  setEditForm(prev => ({ ...prev, languages }));
                }}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block">Skills (comma-separated):</label>
              <input
                type="text"
                name="skills"
                value={editForm.skills.join(',')}
                onChange={(e) => {
                  const skills = e.target.value.split(',').map(skill => skill.trim());
                  setEditForm(prev => ({ ...prev, skills }));
                }}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block">Hobbies (comma-separated):</label>
              <input
                type="text"
                name="hobbies"
                value={editForm.hobbies.join(',')}
                onChange={(e) => {
                  const hobbies = e.target.value.split(',').map(hobby => hobby.trim());
                  setEditForm(prev => ({ ...prev, hobbies }));
                }}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block">Group Affiliation:</label>
              <input
                type="text"
                name="groupAffiliation"
                value={editForm.groupAffiliation || ''}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block">Matching Preference:</label>
              <select
                name="matchingPreference"
                value={editForm.matchingPreference || ''}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
              >
                <option value="">No Preference</option>
                <option value="oneOnOne">One-on-One</option>
                <option value="groupActivity">Group Activity</option>
              </select>
            </div>
            <div>
              <label className="block">Reason for Volunteering:</label>
              <select
                name="reasonForVolunteering"
                value={editForm.reasonForVolunteering || ''}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a reason</option>
                <option value="scholarship">Scholarship</option>
                <option value="communityService">Community Service</option>
                <option value="personalInterest">Personal Interest</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="isActive"
                checked={editForm.isActive}
                onChange={(e) => setEditForm(prev => ({ ...prev, isActive: e.target.checked }))}
                className="p-2 border rounded"
              />
              <label>Active</label>
            </div>
            <div>
              <label className="block">Notes:</label>
              <textarea
                name="notes"
                value={editForm.notes || ''}
                onChange={handleEditFormChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={updating}
                className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="bg-gray-500 text-white px-4 py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Volunteers List */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Volunteers List</h2>
        <div className="space-y-4">
          {volunteers.map(volunteer => (
            <div key={volunteer.id} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{volunteer.fullName}</h3>
                  <p>User ID: {volunteer.userId}</p>
                  <p>Phone: {volunteer.phoneNumber}</p>
                  <p>Gender: {volunteer.gender}</p>
                  <p>Birth Date: {volunteer.birthDate}</p>
                  <p>Languages: {volunteer.languages.join(', ')}</p>
                  <p>Skills: {volunteer.skills?.join(', ')}</p>
                  <p>Hobbies: {volunteer.hobbies?.join(', ')}</p>
                  <p>Group: {volunteer.groupAffiliation || 'None'}</p>
                  <p>Matching Preference: {volunteer.matchingPreference || 'No Preference'}</p>
                  <p>Reason: {volunteer.reasonForVolunteering || 'Not specified'}</p>
                  <p>Status: {volunteer.isActive ? 'Active' : 'Inactive'}</p>
                  <p>Created: {new Date(volunteer.createdAt).toLocaleString()}</p>
                  {volunteer.notes && <p>Notes: {volunteer.notes}</p>}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEditing(volunteer)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteVolunteer(volunteer.id)}
                    disabled={deleting}
                    className="bg-red-500 text-white px-3 py-1 rounded disabled:bg-gray-400"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 
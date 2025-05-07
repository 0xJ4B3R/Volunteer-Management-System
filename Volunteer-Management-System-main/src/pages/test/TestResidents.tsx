import { useState } from 'react';
import { useResidents, useAddResident, useUpdateResident, useDeleteResident } from '@/hooks/useFirestoreResidents';
import { Timestamp } from 'firebase/firestore';

export default function TestResidents() {
  // Real-time data
  const { residents, loading, error } = useResidents();
  
  // CRUD operations
  const { addResident, loading: adding } = useAddResident();
  const { updateResident, loading: updating } = useUpdateResident();
  const { deleteResident, loading: deleting } = useDeleteResident();

  // Initialize available slots for new resident
  const initializeAvailableSlots = () => {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const slots: { [dayOfWeek: string]: string[] } = {};
    days.forEach(day => {
      slots[day] = [];
    });
    return slots;
  };

  // Form state
  const [newResident, setNewResident] = useState({
    fullName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    dateOfAliyah: null as string | null,
    countryOfAliyah: null as string | null,
    phoneNumber: null as string | null,
    education: null as string | null,
    hobbies: [] as string[],
    languages: [] as string[],
    cooperationLevel: 0,
    matchedHistory: [] as { volunteerId: string; appointmentId: string; date: string; feedback?: string }[],
    availableSlots: initializeAvailableSlots(),
    isActive: true,
    createdAt: Timestamp.now(),
    notes: null as string | null,
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    fullName: '',
    birthDate: '',
    gender: 'male' as 'male' | 'female',
    dateOfAliyah: null as string | null,
    countryOfAliyah: null as string | null,
    phoneNumber: null as string | null,
    education: null as string | null,
    hobbies: [] as string[],
    languages: [] as string[],
    cooperationLevel: 0,
    matchedHistory: [] as { volunteerId: string; appointmentId: string; date: string; feedback?: string }[],
    availableSlots: initializeAvailableSlots(),
    isActive: true,
    notes: null as string | null,
  });

  // Handle form changes
  const handleNewResidentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('availableSlots.')) {
      const [day, time] = name.split('.')[1].split('.');
      setNewResident(prev => ({
        ...prev,
        availableSlots: {
          ...prev.availableSlots,
          [day]: prev.availableSlots[day]?.includes(time)
            ? prev.availableSlots[day].filter(t => t !== time)
            : [...(prev.availableSlots[day] || []), time],
        },
      }));
    } else {
      setNewResident(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('availableSlots.')) {
      const [day, time] = name.split('.')[1].split('.');
      setEditForm(prev => ({
        ...prev,
        availableSlots: {
          ...prev.availableSlots,
          [day]: prev.availableSlots[day]?.includes(time)
            ? prev.availableSlots[day].filter(t => t !== time)
            : [...(prev.availableSlots[day] || []), time],
        },
      }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submissions
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    await addResident(newResident);
    setNewResident({
      fullName: '',
      birthDate: '',
      gender: 'male',
      dateOfAliyah: null,
      countryOfAliyah: null,
      phoneNumber: null,
      education: null,
      hobbies: [],
      languages: [],
      cooperationLevel: 0,
      matchedHistory: [],
      availableSlots: initializeAvailableSlots(),
      isActive: true,
      createdAt: Timestamp.now(),
      notes: null,
    });
  };

  const handleUpdateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    await updateResident(editingId, editForm);
    setEditingId(null);
  };

  const handleDeleteResident = async (id: string) => {
    await deleteResident(id);
  };

  // Start editing a resident
  const startEditing = (resident: typeof residents[0]) => {
    setEditingId(resident.id);
    setEditForm({
      fullName: resident.fullName,
      birthDate: resident.birthDate,
      gender: resident.gender,
      dateOfAliyah: resident.dateOfAliyah || null,
      countryOfAliyah: resident.countryOfAliyah || null,
      phoneNumber: resident.phoneNumber || null,
      education: resident.education || null,
      hobbies: resident.hobbies || [],
      languages: resident.languages,
      cooperationLevel: resident.cooperationLevel,
      matchedHistory: resident.matchedHistory || [],
      availableSlots: resident.availableSlots,
      isActive: resident.isActive,
      notes: resident.notes,
    });
  };

  // Handle edit
  const handleEdit = (resident: typeof residents[0]) => {
    setEditingId(resident.id);
    setEditForm({
      fullName: resident.fullName,
      birthDate: resident.birthDate,
      gender: resident.gender,
      dateOfAliyah: resident.dateOfAliyah,
      countryOfAliyah: resident.countryOfAliyah,
      phoneNumber: resident.phoneNumber,
      education: resident.education,
      hobbies: resident.hobbies,
      languages: resident.languages,
      cooperationLevel: resident.cooperationLevel,
      matchedHistory: resident.matchedHistory,
      availableSlots: resident.availableSlots,
      isActive: resident.isActive,
      notes: resident.notes,
    });
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    await deleteResident(id);
  };

  if (loading) return <div className="p-4">Loading residents...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error.message}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Residents Test Page</h1>

      {/* Add New Resident Form */}
      <div className="mb-8 p-4 border rounded">
        <h2 className="text-xl font-semibold mb-4">Add New Resident</h2>
        <form onSubmit={handleAddResident} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={newResident.fullName}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Birth Date</label>
              <input
                type="date"
                name="birthDate"
                value={newResident.birthDate}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                name="gender"
                value={newResident.gender}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                required
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Aliyah</label>
              <input
                type="date"
                name="dateOfAliyah"
                value={newResident.dateOfAliyah || ''}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country of Aliyah</label>
              <input
                type="text"
                name="countryOfAliyah"
                value={newResident.countryOfAliyah || ''}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={newResident.phoneNumber || ''}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Education</label>
              <input
                type="text"
                name="education"
                value={newResident.education || ''}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hobbies (comma-separated)</label>
              <input
                type="text"
                name="hobbies"
                value={newResident.hobbies.join(', ')}
                onChange={(e) => {
                  const hobbies = e.target.value.split(',').map(h => h.trim()).filter(Boolean);
                  setNewResident(prev => ({ ...prev, hobbies }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
              <input
                type="text"
                name="languages"
                value={newResident.languages.join(', ')}
                onChange={(e) => {
                  const languages = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                  setNewResident(prev => ({ ...prev, languages }));
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Cooperation Level</label>
              <input
                type="number"
                name="cooperationLevel"
                value={newResident.cooperationLevel}
                onChange={handleNewResidentChange}
                min="0"
                max="5"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={newResident.notes || ''}
                onChange={handleNewResidentChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Available Slots */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Available Slots</h3>
            <div className="grid grid-cols-7 gap-4">
              {Object.entries(newResident.availableSlots).map(([day, times]) => (
                <div key={day} className="border p-2 rounded">
                  <h4 className="font-medium capitalize">{day}</h4>
                  <div className="space-y-2">
                    {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(time => (
                      <label key={time} className="flex items-center">
                        <input
                          type="checkbox"
                          name={`availableSlots.${day}.${time}`}
                          checked={times.includes(time)}
                          onChange={handleNewResidentChange}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="ml-2">{time}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={adding}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add Resident'}
          </button>
        </form>
      </div>

      {/* Edit Resident Form */}
      {editingId && (
        <div className="mb-8 p-4 border rounded">
          <h2 className="text-xl font-semibold mb-4">Edit Resident</h2>
          <form onSubmit={handleUpdateResident} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Birth Date</label>
                <input
                  type="date"
                  name="birthDate"
                  value={editForm.birthDate}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={editForm.gender}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  required
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Aliyah</label>
                <input
                  type="date"
                  name="dateOfAliyah"
                  value={editForm.dateOfAliyah || ''}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country of Aliyah</label>
                <input
                  type="text"
                  name="countryOfAliyah"
                  value={editForm.countryOfAliyah || ''}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={editForm.phoneNumber || ''}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Education</label>
                <input
                  type="text"
                  name="education"
                  value={editForm.education || ''}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Hobbies (comma-separated)</label>
                <input
                  type="text"
                  name="hobbies"
                  value={editForm.hobbies.join(', ')}
                  onChange={(e) => {
                    const hobbies = e.target.value.split(',').map(h => h.trim()).filter(Boolean);
                    setEditForm(prev => ({ ...prev, hobbies }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
                <input
                  type="text"
                  name="languages"
                  value={editForm.languages.join(', ')}
                  onChange={(e) => {
                    const languages = e.target.value.split(',').map(l => l.trim()).filter(Boolean);
                    setEditForm(prev => ({ ...prev, languages }));
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cooperation Level</label>
                <input
                  type="number"
                  name="cooperationLevel"
                  value={editForm.cooperationLevel}
                  onChange={handleEditFormChange}
                  min="0"
                  max="5"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <textarea
                  name="notes"
                  value={editForm.notes || ''}
                  onChange={handleEditFormChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Available Slots */}
            <div className="mt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Available Slots</h3>
              <div className="grid grid-cols-7 gap-4">
                {Object.entries(editForm.availableSlots).map(([day, times]) => (
                  <div key={day} className="border p-2 rounded">
                    <h4 className="font-medium capitalize">{day}</h4>
                    <div className="space-y-2">
                      {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(time => (
                        <label key={time} className="flex items-center">
                          <input
                            type="checkbox"
                            name={`availableSlots.${day}.${time}`}
                            checked={times.includes(time)}
                            onChange={handleEditFormChange}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2">{time}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={updating}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Update Resident'}
              </button>
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Residents List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Residents List</h2>
        {loading ? (
          <p>Loading residents...</p>
        ) : error ? (
          <p className="text-red-500">Error: {error.message}</p>
        ) : (
          <div className="space-y-4">
            {residents.map(resident => (
              <div key={resident.id} className="border p-4 rounded">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium">{resident.fullName}</h3>
                    <p className="text-gray-600">Birth Date: {resident.birthDate}</p>
                    <p className="text-gray-600">Gender: {resident.gender}</p>
                    <p className="text-gray-600">Cooperation Level: {resident.cooperationLevel}</p>
                    <p className="text-gray-600">Status: {resident.isActive ? 'Active' : 'Inactive'}</p>
                    {resident.notes && <p className="text-gray-600">Notes: {resident.notes}</p>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(resident)}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(resident.id)}
                      disabled={deleting}
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium">Available Slots:</h4>
                  <div className="grid grid-cols-7 gap-2 mt-2">
                    {Object.entries(resident.availableSlots).map(([day, times]) => (
                      <div key={day} className="border p-2 rounded">
                        <h5 className="font-medium capitalize">{day}</h5>
                        <div className="text-sm">
                          {times.length > 0 ? times.join(', ') : 'No slots'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 
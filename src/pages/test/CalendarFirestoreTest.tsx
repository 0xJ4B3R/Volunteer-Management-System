import React, { useState } from 'react';
import { useCalendarSlots, useAddCalendarSlot, useUpdateCalendarSlot, useDeleteCalendarSlot } from '@/hooks/useFirestoreCalendar';
import { Timestamp } from 'firebase/firestore';

const CalendarFirestoreTest: React.FC = () => {
  const { slots, loading, error } = useCalendarSlots();
  const { addCalendarSlot, loading: adding, error: addError } = useAddCalendarSlot();
  const { updateCalendarSlot, loading: updating, error: updateError } = useUpdateCalendarSlot();
  const { deleteCalendarSlot, loading: deleting, error: deleteError } = useDeleteCalendarSlot();

  // Minimal form state
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    await addCalendarSlot({
      date,
      startTime,
      endTime,
      isCustom: false,
      residentIds: [],
      maxCapacity: 1,
      volunteerRequests: [],
      status: 'open',
      isOpen: true,
      createdAt: Timestamp.now(),
    });
    setDate('');
  };

  const handleUpdate = async (id: string) => {
    const randomNote = 'Updated at ' + new Date().toLocaleTimeString();
    await updateCalendarSlot(id, { notes: randomNote });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this slot?')) {
      await deleteCalendarSlot(id);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Firestore Calendar Slots Test</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <label>
          Date (YYYY-MM-DD):
          <input value={date} onChange={e => setDate(e.target.value)} required style={{ marginLeft: 8 }} />
        </label>
        <label style={{ marginLeft: 16 }}>
          Start Time:
          <input value={startTime} onChange={e => setStartTime(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <label style={{ marginLeft: 16 }}>
          End Time:
          <input value={endTime} onChange={e => setEndTime(e.target.value)} style={{ marginLeft: 8 }} />
        </label>
        <button type="submit" disabled={adding} style={{ marginLeft: 16 }}>
          {adding ? 'Adding...' : 'Add Slot'}
        </button>
      </form>
      {addError && <div style={{ color: 'red' }}>Add Error: {addError.message}</div>}
      {updateError && <div style={{ color: 'red' }}>Update Error: {updateError.message}</div>}
      {deleteError && <div style={{ color: 'red' }}>Delete Error: {deleteError.message}</div>}
      {loading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error.message}</div>}
      <div>
        {slots.map(slot => (
          <div key={slot.id} style={{ border: '1px solid #ccc', borderRadius: 4, marginBottom: 12, padding: 12 }}>
            <div><b>ID:</b> {slot.id}</div>
            <div><b>Date:</b> {slot.date}</div>
            <div><b>Start:</b> {slot.startTime} <b>End:</b> {slot.endTime}</div>
            <div><b>Notes:</b> {slot.notes || <i>(none)</i>}</div>
            <button onClick={() => handleUpdate(slot.id)} disabled={updating} style={{ marginRight: 8 }}>
              {updating ? 'Updating...' : 'Update Notes'}
            </button>
            <button onClick={() => handleDelete(slot.id)} disabled={deleting} style={{ color: 'red' }}>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        ))}
      </div>
      <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 4 }}>
        {JSON.stringify(slots, null, 2)}
      </pre>
    </div>
  );
};

export default CalendarFirestoreTest; 
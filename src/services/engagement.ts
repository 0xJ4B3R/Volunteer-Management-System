import { VolunteerAppointmentEntry, VolunteerAttendanceStats, ResidentAppointmentEntry, volunteersRef, residentsRef } from './firestore';
import { updateDoc, doc, getDoc } from 'firebase/firestore';

/**
 * Add an appointment entry to a volunteer or resident's appointmentHistory.
 * @param userId Volunteer or Resident ID
 * @param appointmentEntry The appointment entry to add
 * @param type 'volunteer' or 'resident'
 */
export async function addAppointmentToHistory(userId: string, appointmentEntry: VolunteerAppointmentEntry | ResidentAppointmentEntry, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prev = (snap.exists() && snap.data().appointmentHistory) || [];
    await updateDoc(ref, {
      appointmentHistory: [...prev, appointmentEntry]
    });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prev = (snap.exists() && snap.data().appointmentHistory) || [];
    await updateDoc(ref, {
      appointmentHistory: [...prev, appointmentEntry]
    });
  }
}

/**
 * Update the status of an appointment in a volunteer or resident's appointmentHistory.
 * @param userId Volunteer or Resident ID
 * @param appointmentId The appointment ID to update
 * @param newStatus The new status
 * @param type 'volunteer' or 'resident'
 */
export async function updateAppointmentStatusInHistory(userId: string, appointmentId: string, newStatus: string, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prev: VolunteerAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.map(entry => entry.appointmentId === appointmentId ? { ...entry, status: newStatus } : entry);
    await updateDoc(ref, { appointmentHistory: updated });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prev: ResidentAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.map(entry => entry.appointmentId === appointmentId ? { ...entry, status: newStatus } : entry);
    await updateDoc(ref, { appointmentHistory: updated });
  }
}

/**
 * Increment totalSessions and totalHours for a volunteer or resident.
 * @param userId Volunteer or Resident ID
 * @param duration Session duration in hours
 * @param type 'volunteer' or 'resident'
 */
export async function incrementSessionStats(userId: string, duration: number, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prevSessions = (snap.exists() && snap.data().totalSessions) || 0;
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalSessions: prevSessions + 1,
      totalHours: prevHours + duration
    });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prevSessions = (snap.exists() && snap.data().totalSessions) || 0;
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalSessions: prevSessions + 1,
      totalHours: prevHours + duration
    });
  }
}

/**
 * Decrement totalSessions and totalHours for a volunteer or resident (e.g., on appointment deletion).
 * @param userId Volunteer or Resident ID
 * @param duration Session duration in hours
 * @param type 'volunteer' or 'resident'
 */
export async function decrementSessionStats(userId: string, duration: number, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prevSessions = (snap.exists() && snap.data().totalSessions) || 0;
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalSessions: Math.max(0, prevSessions - 1),
      totalHours: Math.max(0, prevHours - duration)
    });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prevSessions = (snap.exists() && snap.data().totalSessions) || 0;
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalSessions: Math.max(0, prevSessions - 1),
      totalHours: Math.max(0, prevHours - duration)
    });
  }
}

/**
 * Update a volunteer's totalAttendance stats (present, absent, late).
 * If previousStatus is provided and different, decrement it before incrementing the new one.
 * @param volunteerId Volunteer ID
 * @param attendanceStatus 'present' | 'absent' | 'late'
 * @param previousStatus (optional) previous attendance status
 */
export async function updateVolunteerAttendanceStats(
  volunteerId: string,
  attendanceStatus: 'present' | 'absent' | 'late',
  previousStatus?: 'present' | 'absent' | 'late'
) {
  const ref = doc(volunteersRef, volunteerId);
  const snap = await getDoc(ref);
  const prev: VolunteerAttendanceStats = (snap.exists() && snap.data().totalAttendance) || { present: 0, absent: 0, late: 0 };
  let updated = { ...prev };
  if (previousStatus && previousStatus !== attendanceStatus) {
    updated[previousStatus] = Math.max(0, (updated[previousStatus] || 0) - 1);
  }
  updated[attendanceStatus] = (updated[attendanceStatus] || 0) + 1;
  await updateDoc(ref, { totalAttendance: updated });
}

/**
 * Remove an appointment entry from a volunteer or resident's appointmentHistory.
 * @param userId Volunteer or Resident ID
 * @param appointmentId The appointment ID to remove
 * @param type 'volunteer' or 'resident'
 */
export async function removeAppointmentFromHistory(userId: string, appointmentId: string, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prev: VolunteerAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.filter(entry => entry.appointmentId !== appointmentId);
    await updateDoc(ref, { appointmentHistory: updated });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prev: ResidentAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.filter(entry => entry.appointmentId !== appointmentId);
    await updateDoc(ref, { appointmentHistory: updated });
  }
}

/**
 * Update appointment history with new time information for a volunteer or resident.
 * @param userId Volunteer or Resident ID
 * @param appointmentId The appointment ID to update
 * @param newStartTime The new start time
 * @param newEndTime The new end time
 * @param type 'volunteer' or 'resident'
 */
export async function updateAppointmentTimeInHistory(
  userId: string,
  appointmentId: string,
  newStartTime: string,
  newEndTime: string,
  type: 'volunteer' | 'resident'
) {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prev: VolunteerAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.map(entry =>
      entry.appointmentId === appointmentId
        ? { ...entry, startTime: newStartTime, endTime: newEndTime }
        : entry
    );
    await updateDoc(ref, { appointmentHistory: updated });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prev: ResidentAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
    const updated = prev.map(entry =>
      entry.appointmentId === appointmentId
        ? { ...entry, startTime: newStartTime, endTime: newEndTime }
        : entry
    );
    await updateDoc(ref, { appointmentHistory: updated });
  }
}

/**
 * Update appointment history with new volunteer IDs for a resident.
 * @param residentId Resident ID
 * @param appointmentId The appointment ID to update
 * @param newVolunteerIds The new volunteer IDs array
 */
export async function updateAppointmentVolunteerIdsInHistory(
  residentId: string,
  appointmentId: string,
  newVolunteerIds: { id: string; type: 'volunteer' | 'external_group' }[]
) {
  const ref = doc(residentsRef, residentId);
  const snap = await getDoc(ref);
  const prev: ResidentAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
  const updated = prev.map(entry =>
    entry.appointmentId === appointmentId
      ? { ...entry, volunteerIds: newVolunteerIds }
      : entry
  );
  await updateDoc(ref, { appointmentHistory: updated });
}

/**
 * Update appointment history with new resident IDs for a volunteer.
 * @param volunteerId Volunteer ID
 * @param appointmentId The appointment ID to update
 * @param newResidentIds The new resident IDs array
 */
export async function updateAppointmentResidentIdsInHistory(
  volunteerId: string,
  appointmentId: string,
  newResidentIds: string[]
) {
  const ref = doc(volunteersRef, volunteerId);
  const snap = await getDoc(ref);
  const prev: VolunteerAppointmentEntry[] = (snap.exists() && snap.data().appointmentHistory) || [];
  const updated = prev.map(entry =>
    entry.appointmentId === appointmentId
      ? { ...entry, residentIds: newResidentIds }
      : entry
  );
  await updateDoc(ref, { appointmentHistory: updated });
}

/**
 * Increment only totalHours for a volunteer or resident (used for time adjustments).
 * @param userId Volunteer or Resident ID
 * @param duration Duration in hours to add
 * @param type 'volunteer' or 'resident'
 */
export async function incrementHoursOnly(userId: string, duration: number, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalHours: prevHours + duration
    });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalHours: prevHours + duration
    });
  }
}

/**
 * Decrement only totalHours for a volunteer or resident (used for time adjustments).
 * @param userId Volunteer or Resident ID
 * @param duration Duration in hours to subtract
 * @param type 'volunteer' or 'resident'
 */
export async function decrementHoursOnly(userId: string, duration: number, type: 'volunteer' | 'resident') {
  if (type === 'volunteer') {
    const ref = doc(volunteersRef, userId);
    const snap = await getDoc(ref);
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalHours: Math.max(0, prevHours - duration)
    });
  } else {
    const ref = doc(residentsRef, userId);
    const snap = await getDoc(ref);
    const prevHours = (snap.exists() && snap.data().totalHours) || 0;
    await updateDoc(ref, {
      totalHours: Math.max(0, prevHours - duration)
    });
  }
}

/**
 * Decrement a volunteer's totalAttendance stats.
 * @param volunteerId Volunteer ID
 * @param attendanceStatus 'present' | 'absent' | 'late'
 */
export async function decrementVolunteerAttendanceStats(
  volunteerId: string,
  attendanceStatus: 'present' | 'absent' | 'late'
) {
  const ref = doc(volunteersRef, volunteerId);
  const snap = await getDoc(ref);
  const prev: VolunteerAttendanceStats = (snap.exists() && snap.data().totalAttendance) || { present: 0, absent: 0, late: 0 };
  const updated = { ...prev };
  updated[attendanceStatus] = Math.max(0, (updated[attendanceStatus] || 0) - 1);
  await updateDoc(ref, { totalAttendance: updated });
} 
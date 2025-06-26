import { CalendarSlot, RecurringPattern } from '@/services/firestore';
import { Timestamp } from 'firebase/firestore';
import { addDays, addMonths, format, parseISO } from 'date-fns';

export function generateRecurringSlots(
  baseSlot: Omit<CalendarSlot, 'id'>,
  pattern: RecurringPattern,
  parentSlotId: string
): Omit<CalendarSlot, 'id'>[] {
  const slots: Omit<CalendarSlot, 'id'>[] = [];
  const startDate = parseISO(baseSlot.date);
  const endDate = pattern.endDate ? parseISO(pattern.endDate) : addMonths(startDate, 12); // Default to 1 year if no end date

  // Calculate the date for the first recurring instance based on frequency and interval
  let firstRecurringDate = new Date(startDate);

  switch (pattern.frequency) {
    case 'daily':
      firstRecurringDate = addDays(firstRecurringDate, pattern.interval);
      break;
    case 'weekly':
      if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
        // For weekly with selected days, find the first selected day after startDate + interval weeks
        firstRecurringDate = addDays(firstRecurringDate, pattern.interval * 7 - 6); // Start check from beginning of the target week
        let daysToAdd = 0;
        let foundFirstDay = false;
        while (daysToAdd < 14) { // Check within a two-week window just in case
          const checkDate = addDays(firstRecurringDate, daysToAdd);
          if (pattern.daysOfWeek.includes(checkDate.getDay()) && checkDate > startDate) {
            firstRecurringDate = checkDate;
            foundFirstDay = true;
            break;
          }
          daysToAdd++;
        }
        if (!foundFirstDay) {
          // If no selected day is found after startDate within a reasonable range, set date beyond endDate to terminate loop later
          firstRecurringDate = addDays(endDate, 1);
        }
      } else {
        // For weekly without selected days, just add interval weeks
        firstRecurringDate = addDays(firstRecurringDate, pattern.interval * 7);
      }
      break;
    case 'monthly':
      firstRecurringDate = addMonths(firstRecurringDate, pattern.interval);
      break;
  }

  let currentDate = firstRecurringDate;

  // Ensure the first recurring date is after the original slot date, unless interval is 0 (though interval should be >= 1)
  // This check is primarily for safety, given the logic above.
  if (currentDate <= startDate && pattern.interval >= 1) {
    // If somehow the calculated first recurring date is not after the start date, advance by one interval
    // This case should be rare with correct calculation, but adds robustness.
    switch (pattern.frequency) {
      case 'daily':
        currentDate = addDays(startDate, pattern.interval);
        break;
      case 'weekly':
        currentDate = addDays(startDate, pattern.interval * 7);
        break;
      case 'monthly':
        currentDate = addMonths(startDate, pattern.interval);
        break;
    }
  }

  while (currentDate <= endDate) {
    // For weekly recurrence with selected days, ensure the current date is one of the selected days
    // This check is necessary because the initial currentDate calculation for weekly might land on a non-selected day if the interval is large.
    if (pattern.frequency === 'weekly' && pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
      const dayOfWeek = currentDate.getDay();
      if (!pattern.daysOfWeek.includes(dayOfWeek)) {
        // If the current date is not a selected day, find the next selected day *after* the current date
        let nextDayCheckDate = addDays(new Date(currentDate), 1);
        let foundNextDay = false;
        while (nextDayCheckDate <= endDate) {
          if (pattern.daysOfWeek.includes(nextDayCheckDate.getDay())) {
            currentDate = nextDayCheckDate;
            foundNextDay = true;
            break;
          }
          nextDayCheckDate = addDays(nextDayCheckDate, 1);
        }
        if (!foundNextDay) {
          // If no selected day found after the current date up to or on the end date, set currentDate beyond endDate
          currentDate = addDays(endDate, 1);
          continue; // Skip adding the current invalid date
        }
      }
    }

    // Create new slot instance
    slots.push({
      ...baseSlot,
      date: format(currentDate, 'yyyy-MM-dd'),
      recurringPattern: {
        ...pattern,
        parentSlotId
      }
    });

    // Increment date based on frequency and interval
    switch (pattern.frequency) {
      case 'daily':
        currentDate = addDays(currentDate, pattern.interval);
        break;
      case 'weekly':
        // For weekly, find the next occurrence of any selected day after adding the interval weeks
        if (pattern.daysOfWeek && pattern.daysOfWeek.length > 0) {
          // Start checking from the day after the current slot date + interval weeks
          let nextCheckDate = addDays(new Date(currentDate), 1);
          nextCheckDate = addDays(nextCheckDate, (pattern.interval - 1) * 7); // Add interval weeks to find the target week

          let foundNextDay = false;
          while (nextCheckDate <= endDate) {
            const dayOfWeek = nextCheckDate.getDay();
            if (pattern.daysOfWeek.includes(dayOfWeek)) {
              currentDate = nextCheckDate;
              foundNextDay = true;
              break;
            }
            nextCheckDate = addDays(nextCheckDate, 1);
          }
          // If no future selected day found up to or on the end date, set currentDate beyond endDate to terminate loop
          if (!foundNextDay) {
            currentDate = addDays(endDate, 1);
          }

        } else {
          // If no days selected, just add the interval weeks
          currentDate = addDays(currentDate, pattern.interval * 7);
        }
        break;
      case 'monthly':
        currentDate = addMonths(currentDate, pattern.interval);
        break;
    }
  }

  return slots;
}

export function isRecurringInstance(slot: CalendarSlot): boolean {
  return !!slot.recurringPattern?.parentSlotId;
}

export function getParentSlotId(slot: CalendarSlot): string | undefined {
  return slot.recurringPattern?.parentSlotId;
}

export function getRecurringInstances(slots: CalendarSlot[], parentId: string): CalendarSlot[] {
  return slots.filter(slot => slot.recurringPattern?.parentSlotId === parentId);
} 
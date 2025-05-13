import { format, parseISO } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'MM/dd/yyyy'): string => {
  const parsedDate = typeof date === 'string' ? parseISO(date) : date;
  return format(parsedDate, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MM/dd/yyyy hh:mm a');
};

export const formatTime = (date: string | Date): string => {
  return formatDate(date, 'hh:mm a');
};

export const formatRelativeTime = (date: string | Date): string => {
  const now = new Date();
  const diff = now.getTime() - (typeof date === 'string' ? parseISO(date).getTime() : date.getTime());
  const diffMinutes = Math.floor(diff / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return formatDate(date);
  }
};

export const isToday = (date: string | Date): boolean => {
  const today = new Date();
  const compareDate = typeof date === 'string' ? parseISO(date) : date;
  return (
    today.getDate() === compareDate.getDate() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getFullYear() === compareDate.getFullYear()
  );
};

export const isThisWeek = (date: string | Date): boolean => {
  const today = new Date();
  const compareDate = typeof date === 'string' ? parseISO(date) : date;
  const diffTime = Math.abs(today.getTime() - compareDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays <= 7;
}; 
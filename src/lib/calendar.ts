"use client"

import { type LeaveRequest } from "@/lib/types";

// Formats a date for the iCalendar spec (YYYYMMDDTHHMMSSZ)
const formatIcsDate = (date: Date): string => {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
};

export const generateIcsContent = (request: LeaveRequest): string => {
  const { startDate, endDate, reason, id } = request;
  const eventStartDate = new Date(startDate);
  // For all-day events, the end date should be the day AFTER the last day of the event.
  const eventEndDate = new Date(endDate);
  eventEndDate.setDate(eventEndDate.getDate() + 1);

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LeaveApp//Leave Request//EN',
    'BEGIN:VEVENT',
    `UID:${id}@leave.app`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART;VALUE=DATE:${eventStartDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
    `DTEND;VALUE=DATE:${eventEndDate.toISOString().slice(0, 10).replace(/-/g, '')}`,
    `SUMMARY:Leave: ${reason.substring(0, 50)}${reason.length > 50 ? '...' : ''}`,
    `DESCRIPTION:Leave request for: ${reason}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  return icsContent;
};

export const downloadIcsFile = (request: LeaveRequest) => {
  const icsContent = generateIcsContent(request);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `LeaveApp-Leave-${request.startDate.toISOString().slice(0, 10)}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
};

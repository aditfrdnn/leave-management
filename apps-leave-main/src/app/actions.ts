'use server';

import admin from '@/lib/firebase-admin';
import type { CheckLeaveRequestInput } from '@/ai/flows/automatic-reasonableness-check';
import { revalidatePath } from 'next/cache';

export async function submitLeaveRequestAction(data: CheckLeaveRequestInput, userId: string): Promise<{ success: true } | { success: false, error: string }> {
  try {
    const db = admin.database();
    
    // Save to Realtime Database with 'Pending Review' status
    const newRequestRef = db.ref('leaveRequests').push();
    
    const returnDate = new Date(data.endDate);
    returnDate.setDate(returnDate.getDate() + 1);

    await newRequestRef.set({
      ...data,
      startDate: data.startDate,
      endDate: data.endDate,
      returnDate: returnDate.toISOString().split('T')[0],
      status: 'Pending Review', // Always pending for manual approval
      aiResponse: null, // AI check is removed
      userId: userId,
      createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error in DB save:", error);
    return { success: false, error: "Failed to process the leave request. Please try again later." };
  }
}

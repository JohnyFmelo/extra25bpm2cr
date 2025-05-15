
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatToastMessage = (message: string): string => {
  return message.replace(/\n/g, ' ').trim()
}

// New helper function to convert text to uppercase with null/undefined check
export const toUpperCase = (text: string | null | undefined): string => {
  return text ? text.toUpperCase() : '';
}

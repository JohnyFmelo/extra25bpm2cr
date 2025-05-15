
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatToastMessage = (message: string): string => {
  return message.replace(/\n/g, ' ').trim()
}

// Convert text to uppercase with null/undefined check
export const toUpperCase = (text: string | null | undefined): string => {
  return text ? text.toUpperCase() : '';
}

// Format date to readable format
export const formatDate = (date: Date | string): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  });
}

// Format time from 24h to 12h
export const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${minutes} ${ampm}`;
}

// Create a gradient based on a theme color
export const createGradient = (color: string, opacity: number = 0.1): string => {
  return `linear-gradient(135deg, ${color}, ${adjustColorOpacity(color, opacity)})`;
}

// Adjust color opacity
export const adjustColorOpacity = (hex: string, opacity: number): string => {
  // Convert hex to RGB
  let r = 0, g = 0, b = 0;
  
  // 3 digits
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } 
  // 6 digits
  else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

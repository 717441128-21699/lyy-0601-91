import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatTime as formatTimeUtil, formatNumber as formatNumberUtil } from "../utils/math"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatTime = formatTimeUtil
export const formatNumber = formatNumberUtil

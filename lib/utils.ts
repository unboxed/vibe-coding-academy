import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function getLevelColor(level: number): string {
  switch (level) {
    case 1:
      return "bg-level1"
    case 2:
      return "bg-level2"
    case 3:
      return "bg-level3"
    default:
      return "bg-muted"
  }
}

export function getWeekColor(weekNumber: number): string {
  const colors: Record<number, string> = {
    1: "bg-week1",
    2: "bg-week2",
    3: "bg-week3",
    4: "bg-week4",
    5: "bg-week5",
    6: "bg-week6",
    7: "bg-week7",
    8: "bg-week8",
    9: "bg-week9",
    10: "bg-week10",
  }
  return colors[weekNumber] || "bg-muted"
}

export function getLevelForWeek(weekNumber: number): number {
  if (weekNumber <= 3) return 1
  if (weekNumber <= 5) return 2
  return 3
}

export function getLevelName(level: number): string {
  switch (level) {
    case 1:
      return "Level 1: Foundation"
    case 2:
      return "Level 2: Intermediate"
    case 3:
      return "Level 3: Advanced"
    default:
      return "Unknown Level"
  }
}


export type AppMode = 'normal' | 'ramadan';
export type AppTheme = 'indigo' | 'emerald' | 'rose' | 'slate';
export type Language = 'ar' | 'en';

export interface AuthSession {
  email: string;
  isLoggedIn: boolean;
  method: 'google' | 'manual';
}

export interface TrainingDay {
  day: number;
  title: string;
  exercises: string[];
  intensity: 'low' | 'medium' | 'high';
  duration: string;
}

export interface EnergyLog {
  date: string;
  level: number; // 1 to 5
  mood: string;
}

export interface UserProfile {
  name: string;
  age: number;
  gender: 'male' | 'female';
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active';
  likedFoods: string[];
  dislikedFoods: string[];
  dailyCalorieTarget?: number;
  theme?: AppTheme;
  language: Language;
  trainingPlan?: TrainingDay[];
  trainingPlanGeneratedAt?: string;
  mealRegenCount: number;
  energyLogs?: EnergyLog[];
}

export interface WeightLog {
  date: string;
  weight: number;
}

export interface WaterLog {
  date: string;
  amount: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Meal {
  id: string;
  name: string;
  calories: number;
  ingredients: string[];
}

export interface Activity {
  name: string;
  duration: string;
  type: 'cardio' | 'strength' | 'flexibility' | 'light';
  bestTime?: string;
}

export interface DailyPlan {
  breakfast?: Meal;
  lunch?: Meal;
  dinner?: Meal;
  suhoor?: Meal;
  iftar?: Meal;
  snack?: Meal;
  activity?: Activity;
}

export interface WeeklyPlan {
  [day: string]: DailyPlan;
}

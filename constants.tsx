
import { Meal, Activity } from './types';

export const DAYS_AR = ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
export const DAYS_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// نماذج استراتيجيات التدريب الاحترافية
export const TRAINING_STRATEGIES = {
  ar: {
    weightLoss: {
      name: 'حرق الدهون المكثف',
      focus: 'Cardio & HIIT',
      phases: ['تحفيز الحرق', 'زيادة التحمل', 'أقصى أداء']
    },
    muscleGain: {
      name: 'بناء الكتلة العضلية',
      focus: 'Strength & Hypertrophy',
      phases: ['تأسيس القوة', 'تضخيم مدروس', 'تحديد عضلي']
    },
    fitness: {
      name: 'اللياقة العامة والتوازن',
      focus: 'Balanced Mobility & Tone',
      phases: ['مرونة وتنشيط', 'توازن بدني', 'نمط حياة صحي']
    }
  },
  en: {
    weightLoss: {
      name: 'Intensive Fat Burn',
      focus: 'Cardio & HIIT',
      phases: ['Burn Initiation', 'Endurance Boost', 'Peak Performance']
    },
    muscleGain: {
      name: 'Muscle Mass Building',
      focus: 'Strength & Hypertrophy',
      phases: ['Strength Base', 'Hypertrophy Phase', 'Definition']
    },
    fitness: {
      name: 'General Fitness & Tone',
      focus: 'Balanced Mobility & Tone',
      phases: ['Mobility & Activation', 'Body Balance', 'Healthy Lifestyle']
    }
  }
};

export const FOOD_OPTIONS = {
  ar: {
    proteins: ['دجاج', 'لحم بقري', 'سمك', 'تونة', 'بيض', 'بقوليات', 'روبيان', 'صدور ديك رومي'],
    carbs: ['أرز بني', 'بطاطا حلوة', 'شوفان', 'خبز أسمر', 'مكرونة كاملة', 'كينوا'],
    veggies: ['بروكلي', 'سبانخ', 'خيار', 'طماطم', 'فلفل ألوان', 'كوسا', 'باذنجان'],
    dairy: ['زبادي يوناني', 'لبنة', 'جبن قريش', 'حليب لوز', 'حليب قليل الدسم'],
    fats: ['أفوكادو', 'زيت زيتون', 'مكسرات نيئة', 'زبدة فول سوداني']
  },
  en: {
    proteins: ['Chicken', 'Beef', 'Fish', 'Tuna', 'Eggs', 'Legumes', 'Shrimp', 'Turkey Breast'],
    carbs: ['Brown Rice', 'Sweet Potato', 'Oats', 'Brown Bread', 'Whole Pasta', 'Quinoa'],
    veggies: ['Broccoli', 'Spinach', 'Cucumber', 'Tomato', 'Bell Peppers', 'Zucchini', 'Eggplant'],
    dairy: ['Greek Yogurt', 'Labneh', 'Cottage Cheese', 'Almond Milk', 'Low-fat Milk'],
    fats: ['Avocado', 'Olive Oil', 'Raw Nuts', 'Peanut Butter']
  }
};

export const RAMADAN_MEALS_7DAYS = {
  ar: {
    suhoor: [
      { id: 's1', name: 'بيض مسلوق وزبادي يوناني', calories: 450, ingredients: ['2 بيضة مسلوقة', 'نصف رغيف أسمر', 'خيار', 'طماطم', 'زبادي يوناني', '3 حبات لوز'] },
      { id: 's2', name: 'جبن قريش وزيت زيتون', calories: 450, ingredients: ['جبن قريش', 'ملعقة زيت زيتون', 'نصف رغيف أسمر', 'خيار', 'كوب لبن'] },
    ],
    iftar: [
      { id: 'i1', name: 'سمك مشوي وأرز بني', calories: 700, ingredients: ['3 تمرات', 'شوربة عدس', 'سمك مشوي', '3 ملاعق أرز بني', 'سلطة خضراء'] },
      { id: 'i2', name: 'دجاج مشوي وبطاطا', calories: 700, ingredients: ['3 تمرات', 'شوربة خضار', 'دجاج مشوي', 'بطاطا مشوية', 'طبق سلطة كبير'] },
    ],
    snack: [
      { id: 'sn1', name: 'زبادي يوناني ومكسرات', calories: 200, ingredients: ['زبادي يوناني', 'حفنة مكسرات'] },
    ]
  },
  en: {
    suhoor: [
      { id: 's1', name: 'Boiled Eggs & Greek Yogurt', calories: 450, ingredients: ['2 Boiled Eggs', 'Half Brown Bread', 'Cucumber', 'Tomato', 'Greek Yogurt', '3 Almonds'] },
      { id: 's2', name: 'Cottage Cheese & Olive Oil', calories: 450, ingredients: ['Cottage Cheese', '1 tbsp Olive Oil', 'Half Brown Bread', 'Cucumber', 'Milk Cup'] },
    ],
    iftar: [
      { id: 'i1', name: 'Grilled Fish & Brown Rice', calories: 700, ingredients: ['3 Dates', 'Lentil Soup', 'Grilled Fish', '3 tbsp Brown Rice', 'Green Salad'] },
      { id: 'i2', name: 'Grilled Chicken & Potato', calories: 700, ingredients: ['3 Dates', 'Vegetable Soup', 'Grilled Chicken', 'Roasted Potato', 'Large Salad Plate'] },
    ],
    snack: [
      { id: 'sn1', name: 'Greek Yogurt & Nuts', calories: 200, ingredients: ['Greek Yogurt', 'Handful of Nuts'] },
    ]
  }
};

export const NORMAL_MEALS_7DAYS = {
  ar: {
    breakfast: [
      { id: 'nb1', name: 'شوفان بالفواكه والبيض', calories: 350, ingredients: ['3 ملاعق شوفان', 'حليب قليل الدسم', 'فراولة', 'بيضة مسلوقة'] },
    ],
    lunch: [
      { id: 'i1', name: 'سمك مشوي وأرز بني', calories: 600, ingredients: ['سمك مشوي', 'أرز بني', 'سلطة خضراء'] },
    ],
    dinner: [
      { id: 'nd1', name: 'سلطة سيزر دجاج صحية', calories: 300, ingredients: ['صدر دجاج مشوي', 'خس كثير', 'ملعقة زبادي صوص', 'رشة جبن خفيف'] },
    ]
  },
  en: {
    breakfast: [
      { id: 'nb1', name: 'Oats with Fruit & Egg', calories: 350, ingredients: ['3 tbsp Oats', 'Low-fat Milk', 'Strawberry', 'Boiled Egg'] },
    ],
    lunch: [
      { id: 'i1', name: 'Grilled Fish & Brown Rice', calories: 600, ingredients: ['Grilled Fish', 'Brown Rice', 'Green Salad'] },
    ],
    dinner: [
      { id: 'nd1', name: 'Healthy Chicken Caesar', calories: 300, ingredients: ['Grilled Chicken Breast', 'Extra Lettuce', 'Yogurt Dressing', 'Light Cheese Sprinkle'] },
    ]
  }
};

export const DEFAULT_ACTIVITIES_RAMADAN = {
  ar: [
    { name: 'مشي خفيف (قبل الفجر)', duration: '30 دقيقة', type: 'light' as const, bestTime: '4:30 ص' },
    { name: 'مقاومة ومشي سريع (بعد الإفطار)', duration: '40 دقيقة', type: 'strength' as const, bestTime: '10:00 م' },
  ],
  en: [
    { name: 'Light Walk (Before Dawn)', duration: '30 mins', type: 'light' as const, bestTime: '4:30 AM' },
    { name: 'Strength & Brisk Walk (After Iftar)', duration: '40 mins', type: 'strength' as const, bestTime: '10:00 PM' },
  ]
};

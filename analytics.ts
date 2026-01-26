// analytics.ts
// =====================================================
// 📊 تكامل Firebase Analytics لتطبيق موازن AI
// =====================================================

// أضف هذا السكربت في index.html بعد Firebase الأساسي:
// <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics-compat.js"></script>

// =====================================================
// 🔧 إعداد Analytics
// =====================================================

declare global {
  interface Window {
    firebaseAnalytics: any;
  }
}

// Initialize Analytics (أضف هذا في index.html)
/*
<script>
  // بعد firebase.initializeApp(firebaseConfig);
  window.firebaseAnalytics = firebase.analytics();
</script>
*/

const analytics = (window as any).firebaseAnalytics;

// =====================================================
// 📈 أحداث التتبع الأساسية
// =====================================================

// تتبع تسجيل الدخول
export const trackLogin = (method: 'email' | 'google' | 'anonymous') => {
  if (analytics) {
    analytics.logEvent('login', { method });
  }
};

// تتبع التسجيل
export const trackSignUp = (method: 'email' | 'google') => {
  if (analytics) {
    analytics.logEvent('sign_up', { method });
  }
};

// تتبع إكمال إعداد الملف الشخصي
export const trackProfileSetup = (data: {
  gender: string;
  ageGroup: string;
  goalType: 'lose' | 'gain' | 'maintain';
}) => {
  if (analytics) {
    analytics.logEvent('profile_setup_complete', data);
  }
};

// =====================================================
// 🍽️ أحداث الوجبات
// =====================================================

// تتبع تسجيل وجبة
export const trackMealLogged = (data: {
  mealType: string;
  calories: number;
  isCustom: boolean;
}) => {
  if (analytics) {
    analytics.logEvent('meal_logged', data);
  }
};

// تتبع طلب وصفة
export const trackRecipeRequested = (mealName: string) => {
  if (analytics) {
    analytics.logEvent('recipe_requested', { meal_name: mealName });
  }
};

// تتبع تغيير وضع التطبيق
export const trackModeChange = (mode: 'normal' | 'ramadan') => {
  if (analytics) {
    analytics.logEvent('mode_changed', { mode });
  }
};

// =====================================================
// 💧 أحداث الماء
// =====================================================

// تتبع إضافة ماء
export const trackWaterAdded = (amount: number, totalToday: number, goal: number) => {
  if (analytics) {
    analytics.logEvent('water_added', {
      amount,
      total_today: totalToday,
      goal,
      percentage: Math.round((totalToday / goal) * 100)
    });
  }
};

// تتبع تحقيق هدف الماء
export const trackWaterGoalAchieved = () => {
  if (analytics) {
    analytics.logEvent('water_goal_achieved');
  }
};

// =====================================================
// ⚖️ أحداث الوزن
// =====================================================

// تتبع تسجيل وزن
export const trackWeightLogged = (data: {
  weight: number;
  previousWeight?: number;
  targetWeight: number;
}) => {
  if (analytics) {
    const change = data.previousWeight 
      ? data.weight - data.previousWeight 
      : 0;
    
    analytics.logEvent('weight_logged', {
      weight: data.weight,
      change,
      remaining_to_goal: Math.abs(data.weight - data.targetWeight),
      direction: change > 0 ? 'gained' : change < 0 ? 'lost' : 'same'
    });
  }
};

// تتبع الوصول للهدف
export const trackGoalAchieved = (goalType: 'weight' | 'water' | 'workout') => {
  if (analytics) {
    analytics.logEvent('goal_achieved', { goal_type: goalType });
  }
};

// =====================================================
// 🏃 أحداث التمارين
// =====================================================

// تتبع إكمال تمرين
export const trackWorkoutCompleted = (data: {
  workoutName: string;
  duration: number;
  intensity: string;
  caloriesBurned?: number;
}) => {
  if (analytics) {
    analytics.logEvent('workout_completed', data);
  }
};

// تتبع بدء خطة تمارين
export const trackTrainingPlanStarted = (planType: string) => {
  if (analytics) {
    analytics.logEvent('training_plan_started', { plan_type: planType });
  }
};

// =====================================================
// 🤖 أحداث AI Chat
// =====================================================

// تتبع رسالة AI
export const trackAIChatMessage = (data: {
  messageCount: number;
  topic?: string;
}) => {
  if (analytics) {
    analytics.logEvent('ai_chat_message', data);
  }
};

// تتبع الوصول لحد AI
export const trackAILimitReached = (plan: string) => {
  if (analytics) {
    analytics.logEvent('ai_limit_reached', { current_plan: plan });
  }
};

// =====================================================
// 💰 أحداث الاشتراك
// =====================================================

// تتبع عرض صفحة الترقية
export const trackUpgradeViewed = (fromFeature: string) => {
  if (analytics) {
    analytics.logEvent('upgrade_viewed', { from_feature: fromFeature });
  }
};

// تتبع بدء الاشتراك
export const trackSubscriptionStarted = (data: {
  plan: string;
  billingPeriod: 'monthly' | 'yearly';
  price: number;
}) => {
  if (analytics) {
    analytics.logEvent('subscription_started', data);
    analytics.logEvent('purchase', {
      currency: 'AED',
      value: data.price,
      items: [{
        item_id: data.plan,
        item_name: `${data.plan}_${data.billingPeriod}`
      }]
    });
  }
};

// =====================================================
// 📱 أحداث التطبيق
// =====================================================

// تتبع فتح التطبيق
export const trackAppOpen = () => {
  if (analytics) {
    analytics.logEvent('app_open');
  }
};

// تتبع التنقل بين الصفحات
export const trackScreenView = (screenName: string) => {
  if (analytics) {
    analytics.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenName
    });
  }
};

// تتبع تغيير اللغة
export const trackLanguageChange = (language: 'ar' | 'en') => {
  if (analytics) {
    analytics.logEvent('language_changed', { language });
  }
};

// تتبع الأخطاء
export const trackError = (errorType: string, errorMessage: string) => {
  if (analytics) {
    analytics.logEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100) // Limit length
    });
  }
};

// =====================================================
// 👤 تعيين خصائص المستخدم
// =====================================================

export const setUserProperties = (properties: {
  plan?: string;
  language?: string;
  gender?: string;
  ageGroup?: string;
  goalType?: string;
}) => {
  if (analytics) {
    if (properties.plan) analytics.setUserProperties({ plan: properties.plan });
    if (properties.language) analytics.setUserProperties({ language: properties.language });
    if (properties.gender) analytics.setUserProperties({ gender: properties.gender });
    if (properties.ageGroup) analytics.setUserProperties({ age_group: properties.ageGroup });
    if (properties.goalType) analytics.setUserProperties({ goal_type: properties.goalType });
  }
};

export const setUserId = (userId: string) => {
  if (analytics) {
    analytics.setUserId(userId);
  }
};

// =====================================================
// 📊 ملخص الأحداث المهمة للتتبع
// =====================================================

/*
📌 أهم الأحداث للمراقبة في Firebase Analytics Dashboard:

1. المستخدمون:
   - sign_up (معدل التسجيل)
   - login (معدل تسجيل الدخول)
   - profile_setup_complete (إكمال الملف الشخصي)

2. التفاعل اليومي:
   - meal_logged (تسجيل الوجبات)
   - water_added (شرب الماء)
   - weight_logged (تسجيل الوزن)
   - workout_completed (إكمال التمارين)

3. استخدام AI:
   - ai_chat_message (استخدام المستشار)
   - ai_limit_reached (الوصول للحد)
   - recipe_requested (طلب الوصفات)

4. الاشتراكات:
   - upgrade_viewed (عرض صفحة الترقية)
   - subscription_started (بدء الاشتراك)

5. الأهداف:
   - goal_achieved (تحقيق الأهداف)
   - water_goal_achieved (هدف الماء)

📈 KPIs الرئيسية:
   - DAU/MAU (المستخدمون النشطون)
   - Retention Rate (معدل الاحتفاظ)
   - Conversion Rate (معدل التحويل للمدفوع)
   - Feature Usage (استخدام الميزات)
*/

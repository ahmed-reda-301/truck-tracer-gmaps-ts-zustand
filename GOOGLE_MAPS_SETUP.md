# 🗺️ إعداد Google Maps API

## الوضع الحالي
التطبيق يعمل حالياً بـ **خريطة تطوير تفاعلية** تعرض جميع البيانات بدون الحاجة لـ Google Maps API Key.

## للحصول على خريطة Google الحقيقية

### 1. إنشاء مشروع في Google Cloud Console
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد أو اختر مشروع موجود
3. تأكد من أن الفوترة مفعلة (مطلوبة لـ Maps API)

### 2. تفعيل APIs المطلوبة
1. اذهب إلى **APIs & Services** > **Library**
2. ابحث عن وفعّل:
   - **Maps JavaScript API** (مطلوب)
   - **Geocoding API** (اختياري)
   - **Places API** (اختياري)

### 3. إنشاء API Key
1. اذهب إلى **APIs & Services** > **Credentials**
2. انقر **Create Credentials** > **API Key**
3. انسخ الـ API Key الجديد

### 4. تقييد API Key (مهم للأمان)
1. انقر على API Key الذي أنشأته
2. في **Application restrictions**:
   - اختر **HTTP referrers (web sites)**
   - أضف: `http://localhost:3000/*` و `http://localhost:3001/*`
3. في **API restrictions**:
   - اختر **Restrict key**
   - حدد **Maps JavaScript API**

### 5. تحديث ملف .env
```bash
# في ملف .env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

### 6. إعادة تشغيل التطبيق
```bash
npm start
```

## استكشاف الأخطاء

### خطأ "InvalidKey"
- تأكد من أن API Key صحيح
- تأكد من تفعيل Maps JavaScript API
- تأكد من أن الفوترة مفعلة

### خطأ "RefererNotAllowedMapError"
- أضف domain الخاص بك في API Key restrictions
- للتطوير المحلي: `http://localhost:*`

### خطأ "QuotaExceededError"
- تحقق من حدود الاستخدام في Google Cloud Console
- قد تحتاج لزيادة الحد الأقصى

## الميزات المتاحة

### مع خريطة التطوير (الحالية):
- ✅ عرض جميع الشاحنات
- ✅ تفاصيل كل شاحنة
- ✅ التفاعل مع الشاحنات
- ✅ الفلاتر والبحث
- ✅ الإنذارات والتنبيهات

### مع Google Maps (بعد إضافة API Key):
- ✅ جميع الميزات أعلاه
- ✅ خريطة Google الحقيقية
- ✅ عرض المسارات على الخريطة
- ✅ نقاط التفتيش والمطارات
- ✅ تتبع الموقع الجغرافي الدقيق

## ملاحظات مهمة

1. **التكلفة**: Google Maps API مجاني حتى حد معين، ثم يصبح مدفوع
2. **الأمان**: لا تشارك API Key في الكود المفتوح
3. **القيود**: استخدم API restrictions لتقليل المخاطر
4. **المراقبة**: راقب الاستخدام في Google Cloud Console

## روابط مفيدة

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [API Key Best Practices](https://developers.google.com/maps/api-key-best-practices)
- [Pricing Calculator](https://developers.google.com/maps/billing-and-pricing/pricing)

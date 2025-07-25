# Feature Toggle with Gradual Rollout

## วิธีการติดตั้งและใช้งาน
1. ติดตั้งและตั้งค่าฐานข้อมูล
```bash
# ติดตั้ง dependencies
npm install

# สร้าง PostgreSQL database (ใช้ Docker)
docker-compose up -d postgres

# รัน migrations
npm run migrate

# เพิ่มข้อมูลตัวอย่าง
npm run seed
```

2. รันแอพพลิเคชัน
```bash
# Development mode
npm run dev

# Production mode
npm run build && npm start

# หรือใช้ Docker
docker-compose up
```

3. การใช้งาน API
เช็คฟีเจอร์สำหรับผู้ใช้:
```bash
curl -X POST http://localhost:3000/api/feature-toggle/features/new_dashboard/check \
  -H "Content-Type: application/json" \
  -H "x-user-id: user123" \
  -H "x-user-role: premium" \
  -H "x-beta-tester: true" \
  -d '{"user":{"id":"user123","role":"premium"}}'
```

อัพเดทเปอร์เซ็นต์ rollout:
```bash
curl -X PUT http://localhost:3000/api/feature-toggle/features/new_dashboard/rollout \
  -H "Content-Type: application/json" \
  -d '{"percentage": 75}'
```

เริ่ม Gradual Rollout:
```bash
curl -X POST http://localhost:3000/api/feature-toggle/features/payment_v2/gradual-rollout \
  -H "Content-Type: application/json" \
  -d '{
    "stages": [
      {"stage": 1, "percentage": 10, "duration": 300000},
      {"stage": 2, "percentage": 25, "duration": 600000},
      {"stage": 3, "percentage": 50, "duration": 900000},
      {"stage": 4, "percentage": 100, "duration": 1200000}
    ]
  }'
```

---
## คุณสมบัติสำคัญของ Gradual Rollout

1. Consistent User Experience

- ใช้ consistent hashing เพื่อให้ผู้ใช้คนเดิมได้ผลลัพธ์เดิมเสมอ
- เก็บ user assignments ในฐานข้อมูลเพื่อความสม่ำเสมอ

2. Multiple Rollout Strategies
Percentage Rollout:

```typescript
// กระจายตาม percentage ของผู้ใช้ทั้งหมด
rolloutStrategy: 'percentage'
rolloutPercentage: 50  // 50% ของผู้ใช้
```

Segment-based Rollout:
```typescript
// กระจายตาม user segments
rolloutStrategy: 'segment'
// เปิดให้ beta_testers 100%, premium_users 75%
```

Gradual Time-based Rollout:
```typescript
// เพิ่มเปอร์เซ็นต์ตามเวลา
rolloutStrategy: 'gradual'
// เริ่มที่ 0% แล้วค่อยๆ เพิ่มเป็น 100% ตามเวลา
```

3. Real-time Analytics

- ติดตาม feature usage แบบ real-time
- เก็บ metrics สำหรับการตัดสินใจ
- สามารถ rollback ได้ทันทีถ้าเจอปัญหา

4. Database-driven Configuration
```sql
-- เปลี่ยน rollout percentage
UPDATE feature_flags 
SET rollout_percentage = 75 
WHERE name = 'new_dashboard';

-- เปิด/ปิดฟีเจอร์
UPDATE feature_flags 
SET enabled = false 
WHERE name = 'problematic_feature';
```

5. Audit Trail

- เก็บประวัติการเปลี่ยนแปลงทั้งหมด
- ระบุว่าใครเปลี่ยนอะไรเมื่อไหร่
- สามารถ trace back ได้เมื่อเกิดปัญหา

การใช้งานใน Code
```typescript
// ใน service หรือ controller
import { GradualRolloutService } from './services/gradual-rollout.service';

const rolloutService = new GradualRolloutService();

// เช็คฟีเจอร์
const isEnabled = await rolloutService.isFeatureEnabled('new_payment', user);

if (isEnabled) {
  // ใช้ payment system ใหม่
  return await newPaymentService.processPayment(amount);
} else {
  // ใช้ payment system เก่า
  return await legacyPaymentService.processPayment(amount);
}
```
# Feature Toggle ระบบ

โปรเจคนี้แสดงการใช้งาน Feature Toggle แบบต่างๆ 2 แบบ:
1. **Environment-based Feature Toggle** - ใช้ไฟล์ `.env` ในการควบคุมการเปิดปิดฟีเจอร์
2. **Gradual Rollout** - เปิดฟีเจอร์ให้ผู้ใช้บางส่วนตามเปอร์เซ็นต์

## 1. Environment-based Feature Toggle

### วิธีติดตั้ง

```bash
# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env จาก .env.example
cp .env.example .env
```

### การกำหนดค่า

แก้ไขไฟล์ `.env` เพื่อเปิดปิดฟีเจอร์ต่างๆ:

```env
# เปิดปิดฟีเจอร์หลัก
ENABLE_NEW_DASHBOARD=true
ENABLE_BETA_FEATURES=false
ENABLE_DARK_MODE=true
```

### วิธีใช้งาน

```typescript
import { FeatureToggle } from './feature-toggle';

// ตรวจสอบว่าฟีเจอร์เปิดอยู่หรือไม่
if (FeatureToggle.isEnabled('enableNewDashboard')) {
  // โค้ดสำหรับฟีเจอร์ใหม่
}
```

## 2. Gradual Rollout

### วิธีติดตั้ง

```bash
# เข้าไปที่โฟลเดอร์ gradual rollout
cd feature-toggle-gradual-rollout

# ติดตั้ง dependencies
npm install

# สร้างไฟล์ .env
cp .env.example .env
```

### การกำหนดค่า

แก้ไขไฟล์ `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/feature_toggle
PORT=3000
```

### วิธีใช้งาน

```typescript
import { GradualRolloutService } from './services/gradual-rollout.service';

// ตรวจสอบว่าผู้ใช้รายนี้ควรเห็นฟีเจอร์หรือไม่
const shouldShowFeature = await GradualRolloutService.shouldEnableFeature(
  'new-feature',
  userId
);

if (shouldShowFeature) {
  // แสดงฟีเจอร์ใหม่ให้ผู้ใช้
}
```

### API Endpoints

- `GET /api/features` - ดูสถานะฟีเจอร์ทั้งหมด
- `POST /api/features` - เพิ่ม/อัพเดทฟีเจอร์
- `GET /api/features/:name` - ดูสถานะฟีเจอร์
- `GET /api/features/:name/check/:userId` - ตรวจสอบว่าผู้ใช้ควรเห็นฟีเจอร์หรือไม่

## ข้อแตกต่างระหว่าง 2 วิธี

| ลักษณะ | Environment-based | Gradual Rollout |
|--------|-------------------|-----------------|
| วิธีการกำหนดค่า | ผ่านไฟล์ .env | ผ่าน API/Database |
| การเปลี่ยนแปลง | ต้อง restart server | เปลี่ยนแปลงได้ทันที |
| การแบ่งกลุ่มผู้ใช้ | ไม่รองรับ | รองรับการแบ่งตามเปอร์เซ็นต์ |
| ความซับซ้อน | ง่าย | ซับซ้อนกว่า |
| เหมาะกับ | ฟีเจอร์ที่เปิดปิดทั้งระบบ | ฟีเจอร์ที่ต้องการทดสอบกับผู้ใช้บางส่วน |

## การรันเทส

```bash
# รันเทสสำหรับทั้งโปรเจค
npm test

# รัน ESLint
npm run lint

# Format code
npm run format
```

## ผู้พัฒนา

- [ชื่อคุณ] - [อีเมลหรือลิงก์โปรไฟล์]

## License

MIT

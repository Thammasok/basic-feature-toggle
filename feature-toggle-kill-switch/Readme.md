# Feature Toggle with Kill Switch

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
ตรวจสอบ feature:
```bash
curl http://localhost:3000/api/admin/features/user-registration
```

เปิด/ปิด feature:
```bash
curl -X PATCH http://localhost:3000/api/admin/features/user-registration \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

Kill switch (ปิดทุก feature):
```bash
curl -X POST http://localhost:3000/api/admin/kill-switch
```

ทดสอบ protected endpoint:
```bash
curl http://localhost:3000/api/register  # จะได้ 503 ถ้า feature ปิด
```

---

## คุณสมบัติสำคัญของ Kill Switch:
1. FeatureToggleService

- ตรวจสอบสถานะ feature จาก database
- มี caching เพื่อลด database calls
- มีฟังก์ชัน kill switch สำหรับปิด feature ทั้งหมดในกรณีฉุกเฉิน

2. Middleware สำหรับป้องกัน Route

- requireFeature() middleware ที่ตรวจสอบ feature ก่อนเข้าถึง endpoint
- ส่ง error 503 เมื่อ feature ถูกปิด

3. Admin API

- GET /api/admin/features - ดู feature ทั้งหมด
- GET /api/admin/features/:id - ตรวจสอบ feature เฉพาะ
- PATCH /api/admin/features/:id - เปิด/ปิด feature
- POST /api/admin/kill-switch - ปิด feature ทั้งหมดในกรณีฉุกเฉิน

4. Safety Features

- Fail-safe: ถ้า database ไม่ available จะ return false (ปิด feature)
- Cache กับ TTL เพื่อลด database load
- Error handling ที่ครอบคลุม
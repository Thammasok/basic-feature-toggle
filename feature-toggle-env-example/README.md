# Feature Toggle with Environment Variables

วิธีการใช้งาน

## 1. ติดตั้งและตั้งค่า

```bash
# ติดตั้ง dependencies
npm install

# สร้าง .env file
cp .env.example .env

# Build TypeScript
npm run build

# รัน development
npm run dev
```
## 2. การใช้งานใน Code

```bash
// เช็คฟีเจอร์ง่ายๆ
if (FeatureToggle.isEnabled('enableNewDashboard')) {
  // ใช้ dashboard ใหม่
} else {
  // ใช้ dashboard เก่า
}

// ใช้ใน middleware
if (FeatureToggle.isEnabled('enableApiLogging')) {
  console.log('API call logged');
}

// ใช้ใน service
async authenticate(username: string, password: string) {
  const basicAuth = await this.basicAuth(username, password);
  
  if (basicAuth && FeatureToggle.isEnabled('enableTwoFactorAuth')) {
    return await this.twoFactorAuth(username);
  }
  
  return basicAuth;
}
```

## 3. การเปลี่ยนแปลง Feature Flags
วิธีที่ 1: แก้ไข .env file
```bash
# เปิด feature
ENABLE_NEW_DASHBOARD=true

# ปิด feature  
ENABLE_BETA_FEATURES=false
```

วิธีที่ 2: ใช้ script
```bash
# เปิด feature
node scripts/toggle-feature.js ENABLE_NEW_DASHBOARD true

# ปิด feature
node scripts/toggle-feature.js ENABLE_BETA_FEATURES false
```

วิธีที่ 3: Environment Variables
```bash
# เมื่อรัน application
ENABLE_NEW_DASHBOARD=true npm start
```


## 4. การตรวจสอบสถานะ
```bash
# ดู feature flags ทั้งหมด
curl http://localhost:3000/feature-flags

# ดู health status
curl http://localhost:3000/health

# ทดสอบ dashboard
curl http://localhost:3000/dashboard
```
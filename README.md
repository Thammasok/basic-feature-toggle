# ระบบ Feature Toggle

โปรเจคนี้แสดงการใช้งาน Feature Toggle แบบต่างๆ 2 แบบ:
1. **Environment-based Feature Toggle** - ใช้ไฟล์ `.env` ในการควบคุมการเปิดปิดฟีเจอร์
2. **Gradual Rollout** - เปิดฟีเจอร์ให้ผู้ใช้บางส่วนตามเปอร์เซ็นต์

---

## ข้อแตกต่างระหว่าง 2 วิธี

| ลักษณะ | Environment-based | Gradual Rollout |
|--------|-------------------|-----------------|
| วิธีการกำหนดค่า | ผ่านไฟล์ .env | ผ่าน API/Database |
| การเปลี่ยนแปลง | ต้อง restart server | เปลี่ยนแปลงได้ทันที |
| การแบ่งกลุ่มผู้ใช้ | ไม่รองรับ | รองรับการแบ่งตามเปอร์เซ็นต์ |
| ความซับซ้อน | ง่าย | ซับซ้อนกว่า |
| เหมาะกับ | ฟีเจอร์ที่เปิดปิดทั้งระบบ | ฟีเจอร์ที่ต้องการทดสอบกับผู้ใช้บางส่วน |

---

## ตัวอย่างการใช้งาน

- [Environment-based Feature Toggle](feature-toggle-env-example)
- [Gradual Rollout](feature-toggle-gradual-rollout)

import { FeatureToggle } from "../middleware/feature-toggle.middleware";

export class NotificationService {
  async sendNotification(message: string, userId: string): Promise<void> {
    console.log(`📢 Sending notification to user ${userId}: ${message}`);

    const promises: Promise<void>[] = [];

    // Email notifications
    if (FeatureToggle.isEnabled('enableEmailNotifications')) {
      promises.push(this.sendEmail(message, userId));
    }

    // SMS notifications
    if (FeatureToggle.isEnabled('enableSmsNotifications')) {
      promises.push(this.sendSMS(message, userId));
    }

    // Push notifications
    if (FeatureToggle.isEnabled('enablePushNotifications')) {
      promises.push(this.sendPushNotification(message, userId));
    }

    if (promises.length === 0) {
      console.log('⚠️  No notification methods enabled');
      return;
    }

    await Promise.all(promises);
    console.log('✅ All enabled notifications sent successfully');
  }

  private async sendEmail(message: string, userId: string): Promise<void> {
    await this.sleep(500);
    console.log(`📧 Email sent to user ${userId}`);
  }

  private async sendSMS(message: string, userId: string): Promise<void> {
    await this.sleep(800);
    console.log(`📱 SMS sent to user ${userId}`);
  }

  private async sendPushNotification(message: string, userId: string): Promise<void> {
    await this.sleep(300);
    console.log(`🔔 Push notification sent to user ${userId}`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
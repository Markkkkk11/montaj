import prisma from '../config/database';

// Дефолтные настройки платформы
const DEFAULT_SETTINGS: Record<string, { value: string; section: string }> = {
  // Основные
  platformName:   { value: 'SVMontaj',              section: 'general' },
  supportEmail:   { value: 'support@svmontaj.ru',   section: 'general' },
  supportPhone:   { value: '+7 (800) 123-45-67',    section: 'general' },
  maxFileSize:    { value: '5',                      section: 'general' },
  maxWorkPhotos:  { value: '8',                      section: 'general' },
  defaultRegion:  { value: 'Москва и обл.',          section: 'general' },

  // Модерация
  autoApproveUsers:   { value: 'false', section: 'moderation' },
  autoApproveReviews: { value: 'false', section: 'moderation' },
  autoApproveOrders:  { value: 'true',  section: 'moderation' },
  minReviewLength:    { value: '10',    section: 'moderation' },

  // Тарифы
  standardPrice:            { value: '0',   section: 'tariffs' },
  premiumPrice:             { value: '990', section: 'tariffs' },
  premiumSpecializations:   { value: '3',   section: 'tariffs' },
  standardSpecializations:  { value: '1',   section: 'tariffs' },
  trialDays:                { value: '7',   section: 'tariffs' },

  // Email
  emailEnabled: { value: 'true',              section: 'email' },
  smtpHost:     { value: 'smtp.yandex.ru',    section: 'email' },
  smtpPort:     { value: '465',               section: 'email' },
  emailFrom:    { value: 'SVMontaj24@mail.ru', section: 'email' },
};

export class SettingsService {
  /**
   * Инициализация дефолтных настроек (вызывается при старте)
   */
  async seedDefaults() {
    const FORCE_UPDATE_KEYS = ['premiumSpecializations'];

    for (const [key, { value, section }] of Object.entries(DEFAULT_SETTINGS)) {
      const shouldForceUpdate = FORCE_UPDATE_KEYS.includes(key);
      await prisma.platformSetting.upsert({
        where: { key },
        update: shouldForceUpdate ? { value } : {},
        create: { key, value, section },
      });
    }
    await prisma.subscription.updateMany({
      where: { tariffType: 'PREMIUM', specializationCount: { gt: 3 } },
      data: { specializationCount: 3 },
    });

    console.log('⚙️  Настройки платформы инициализированы');
  }

  /**
   * Получить все настройки
   */
  async getAll(): Promise<Record<string, Record<string, string>>> {
    const rows = await prisma.platformSetting.findMany();

    const grouped: Record<string, Record<string, string>> = {};
    for (const row of rows) {
      if (!grouped[row.section]) grouped[row.section] = {};
      grouped[row.section][row.key] = row.value;
    }

    return grouped;
  }

  /**
   * Получить настройки по секции
   */
  async getBySection(section: string): Promise<Record<string, string>> {
    const rows = await prisma.platformSetting.findMany({ where: { section } });
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    return result;
  }

  /**
   * Получить одну настройку по ключу
   */
  async get(key: string): Promise<string | null> {
    const row = await prisma.platformSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULT_SETTINGS[key]?.value ?? null;
  }

  /**
   * Получить публичные настройки (безопасные для отдачи без авторизации)
   */
  async getPublicSettings(): Promise<Record<string, string>> {
    const publicKeys = [
      'platformName', 'supportEmail', 'supportPhone', 'defaultRegion',
      'standardPrice', 'premiumPrice', 'premiumSpecializations',
      'standardSpecializations', 'trialDays', 'maxWorkPhotos', 'maxFileSize',
    ];
    
    const rows = await prisma.platformSetting.findMany({
      where: { key: { in: publicKeys } },
    });
    
    const result: Record<string, string> = {};
    for (const row of rows) {
      result[row.key] = row.value;
    }
    // Добавляем дефолтные значения для отсутствующих ключей
    for (const key of publicKeys) {
      if (!result[key] && DEFAULT_SETTINGS[key]) {
        result[key] = DEFAULT_SETTINGS[key].value;
      }
    }
    return result;
  }

  /**
   * Обновить настройки секции (массово)
   */
  async updateSection(section: string, data: Record<string, string>) {
    const updates = Object.entries(data).map(([key, value]) =>
      prisma.platformSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value, section },
      })
    );

    await prisma.$transaction(updates);

    // При изменении тарифных настроек — обновить существующие подписки
    if (section === 'tariffs') {
      await this.syncSubscriptionLimits(data);
    }

    return this.getBySection(section);
  }

  /**
   * Синхронизировать лимиты специализаций в существующих подписках
   */
  private async syncSubscriptionLimits(data: Record<string, string>) {
    if (data.premiumSpecializations) {
      const premiumSpecs = parseInt(data.premiumSpecializations, 10);
      if (!isNaN(premiumSpecs) && premiumSpecs > 0) {
        await prisma.subscription.updateMany({
          where: { tariffType: 'PREMIUM' },
          data: { specializationCount: premiumSpecs },
        });
      }
    }

    if (data.standardSpecializations) {
      const standardSpecs = parseInt(data.standardSpecializations, 10);
      if (!isNaN(standardSpecs) && standardSpecs > 0) {
        await prisma.subscription.updateMany({
          where: { tariffType: 'STANDARD' },
          data: { specializationCount: standardSpecs },
        });
      }
    }
  }
}

export default new SettingsService();


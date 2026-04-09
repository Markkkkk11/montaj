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
  standardPrice:            { value: '0',    section: 'tariffs' },
  standardResponsePrice:    { value: '150',  section: 'tariffs' },
  comfortPrice:             { value: '0',    section: 'tariffs' },
  comfortOrderTakenPrice:   { value: '500',  section: 'tariffs' },
  premiumPrice:             { value: '5000', section: 'tariffs' },
  premiumSpecializations:   { value: '3',    section: 'tariffs' },
  standardSpecializations:  { value: '1',    section: 'tariffs' },
  comfortSpecializations:   { value: '1',    section: 'tariffs' },
  trialDays:                { value: '30',   section: 'tariffs' },

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
    for (const [key, { value, section }] of Object.entries(DEFAULT_SETTINGS)) {
      await prisma.platformSetting.upsert({
        where: { key },
        update: {},
        create: { key, value, section },
      });
    }

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
      'standardPrice', 'standardResponsePrice', 'comfortPrice', 'comfortOrderTakenPrice',
      'premiumPrice', 'premiumSpecializations', 'comfortSpecializations',
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
        await this.syncTariffSpecializationLimit('PREMIUM', premiumSpecs);
      }
    }

    if (data.standardSpecializations) {
      const standardSpecs = parseInt(data.standardSpecializations, 10);
      if (!isNaN(standardSpecs) && standardSpecs > 0) {
        await this.syncTariffSpecializationLimit('STANDARD', standardSpecs);
      }
    }

    if (data.comfortSpecializations) {
      const comfortSpecs = parseInt(data.comfortSpecializations, 10);
      if (!isNaN(comfortSpecs) && comfortSpecs > 0) {
        await this.syncTariffSpecializationLimit('COMFORT', comfortSpecs);
      }
    }
  }

  private async syncTariffSpecializationLimit(
    tariffType: 'STANDARD' | 'COMFORT' | 'PREMIUM',
    specializationCount: number
  ) {
    await prisma.subscription.updateMany({
      where: { tariffType },
      data: { specializationCount },
    });

    const subscriptions = await prisma.subscription.findMany({
      where: { tariffType },
      select: { userId: true },
    });

    const userIds = subscriptions.map((subscription) => subscription.userId);
    if (userIds.length === 0) {
      return;
    }

    const profiles = await prisma.executorProfile.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      select: {
        userId: true,
        specializations: true,
      },
    });

    const trimUpdates = profiles
      .filter((profile) => profile.specializations.length > specializationCount)
      .map((profile) =>
        prisma.executorProfile.update({
          where: { userId: profile.userId },
          data: {
            specializations: profile.specializations.slice(0, specializationCount),
          },
        })
      );

    if (trimUpdates.length > 0) {
      await prisma.$transaction(trimUpdates);
    }
  }
}

export default new SettingsService();

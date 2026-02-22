import prisma from '../config/database';
import { UpdateProfileData, UpdateExecutorProfileData } from '../types';

export class UserService {
  /**
   * Получить профиль пользователя
   */
  async getProfile(userId: string): Promise<any | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });
  }

  /**
   * Обновить базовый профиль пользователя
   */
  async updateProfile(userId: string, data: UpdateProfileData): Promise<any> {
    const updateData: any = {};

    if (data.fullName) updateData.fullName = data.fullName;
    if (data.organization !== undefined) updateData.organization = data.organization;
    if (data.city) updateData.city = data.city;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.messengers) updateData.messengers = data.messengers as any;
    if (data.inn !== undefined) updateData.inn = data.inn;
    if (data.ogrn !== undefined) updateData.ogrn = data.ogrn;
    if (data.aboutDescription !== undefined) updateData.aboutDescription = data.aboutDescription;
    if (data.website !== undefined) updateData.website = data.website;

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        executorProfile: true,
        balance: true,
        subscription: true,
      },
    });
  }

  /**
   * Обновить фото профиля
   */
  async updatePhoto(userId: string, photoUrl: string): Promise<any> {
    return prisma.user.update({
      where: { id: userId },
      data: { photo: photoUrl },
    });
  }

  /**
   * Обновить профиль исполнителя
   */
  async updateExecutorProfile(
    userId: string,
    data: UpdateExecutorProfileData
  ): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { executorProfile: true },
    });

    if (!user) {
      throw new Error('Пользователь не найден');
    }

    if (user.role !== 'EXECUTOR') {
      throw new Error('Только исполнители могут редактировать этот профиль');
    }

    if (!user.executorProfile) {
      throw new Error('Профиль исполнителя не найден');
    }

    const updateData: any = {};

    if (data.region !== undefined) updateData.region = data.region;
    if (data.specializations !== undefined) {
      updateData.specializations = data.specializations;
    }
    if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription;
    if (data.fullDescription !== undefined) updateData.fullDescription = data.fullDescription;
    if (data.isSelfEmployed !== undefined) updateData.isSelfEmployed = data.isSelfEmployed;

    return prisma.executorProfile.update({
      where: { userId },
      data: updateData,
    });
  }

  /**
   * Добавить фото работ исполнителя
   */
  async addWorkPhoto(userId: string, photoUrl: string): Promise<any> {
    const profile = await prisma.executorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Профиль исполнителя не найден');
    }

    // Проверяем лимит (максимум 5 фото)
    if (profile.workPhotos.length >= 5) {
      throw new Error('Максимальное количество фотографий: 5');
    }

    return prisma.executorProfile.update({
      where: { userId },
      data: {
        workPhotos: {
          push: photoUrl,
        },
      },
    });
  }

  /**
   * Удалить фото работы исполнителя
   */
  async removeWorkPhoto(userId: string, photoUrl: string): Promise<any> {
    const profile = await prisma.executorProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Профиль исполнителя не найден');
    }

    const updatedPhotos = profile.workPhotos.filter((photo: any) => photo !== photoUrl);

    return prisma.executorProfile.update({
      where: { userId },
      data: {
        workPhotos: updatedPhotos,
      },
    });
  }

  /**
   * Получить баланс исполнителя
   */
  async getBalance(userId: string) {
    return prisma.balance.findUnique({
      where: { userId },
    });
  }

  /**
   * Проверить завершенность профиля исполнителя
   */
  async checkExecutorProfileCompletion(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { executorProfile: true },
    });

    if (!user || user.role !== 'EXECUTOR' || !user.executorProfile) {
      return false;
    }

    const profile = user.executorProfile;

    // Проверяем обязательные поля
    const isComplete =
      user.fullName.length > 0 &&
      user.city.length > 0 &&
      profile.region.length > 0 &&
      profile.specializations.length > 0 &&
      (profile.shortDescription?.length || 0) > 0;

    // Если профиль заполнен и еще не активирован - отправляем на модерацию
    if (isComplete && user.status === 'PENDING') {
      // Здесь можно добавить логику уведомления админов
      console.log(`✅ Профиль исполнителя ${user.id} готов к модерации`);
    }

    return isComplete;
  }
}

export default new UserService();


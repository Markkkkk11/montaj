import { Response } from 'express';
import { AuthRequest } from '../types';
import userService from '../services/user.service';
import path from 'path';
import fs from 'fs/promises';

export class UserController {
  /**
   * GET /api/users/profile
   * Получить свой профиль
   */
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const profile = await userService.getProfile(req.user.id);

      if (!profile) {
        res.status(404).json({ error: 'Профиль не найден' });
        return;
      }

      // Удаляем пароль
      const { password, ...profileWithoutPassword } = profile;

      res.json({ profile: profileWithoutPassword });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/users/profile
   * Обновить профиль
   */
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const updatedUser = await userService.updateProfile(req.user.id, req.body);

      // Удаляем пароль
      const { password, ...userWithoutPassword } = updatedUser;

      res.json({
        message: 'Профиль обновлён успешно',
        user: userWithoutPassword,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/users/upload-photo
   * Загрузить фото профиля
   */
  async uploadPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Файл не предоставлен' });
        return;
      }

      // Генерируем URL для доступа к файлу
      const photoUrl = `/uploads/${req.file.filename}`;

      const updatedUser = await userService.updatePhoto(req.user.id, photoUrl);

      res.json({
        message: 'Фото загружено успешно',
        photoUrl,
        user: { id: updatedUser.id, photo: updatedUser.photo },
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * PUT /api/users/executor-profile
   * Обновить профиль исполнителя
   */
  async updateExecutorProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const updatedProfile = await userService.updateExecutorProfile(req.user.id, req.body);

      // Проверяем завершенность профиля
      await userService.checkExecutorProfileCompletion(req.user.id);

      res.json({
        message: 'Профиль исполнителя обновлён успешно',
        profile: updatedProfile,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/users/work-photos
   * Добавить фото работы
   */
  async addWorkPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (!req.file) {
        res.status(400).json({ error: 'Файл не предоставлен' });
        return;
      }

      const photoUrl = `/uploads/${req.file.filename}`;

      const updatedProfile = await userService.addWorkPhoto(req.user.id, photoUrl);

      res.json({
        message: 'Фото работы добавлено успешно',
        photoUrl,
        workPhotos: updatedProfile.workPhotos,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/users/work-photos
   * Удалить фото работы
   */
  async removeWorkPhoto(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { photoUrl } = req.body;

      if (!photoUrl) {
        res.status(400).json({ error: 'URL фото не предоставлен' });
        return;
      }

      const updatedProfile = await userService.removeWorkPhoto(req.user.id, photoUrl);

      // Удаляем файл с диска
      try {
        const filename = path.basename(photoUrl);
        const filepath = path.join(process.cwd(), 'uploads', filename);
        await fs.unlink(filepath);
      } catch (err) {
        console.error('Ошибка удаления файла:', err);
      }

      res.json({
        message: 'Фото работы удалено успешно',
        workPhotos: updatedProfile.workPhotos,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/users/balance
   * Получить баланс исполнителя
   */
  async getBalance(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Доступно только для исполнителей' });
        return;
      }

      const balance = await userService.getBalance(req.user.id);

      if (!balance) {
        res.status(404).json({ error: 'Баланс не найден' });
        return;
      }

      res.json({ balance });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();


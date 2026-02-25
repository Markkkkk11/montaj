import { Response } from 'express';
import { AuthRequest } from '../types';
import settingsService from '../services/settings.service';

export class SettingsController {
  /**
   * Получить все настройки (сгруппированы по секциям)
   */
  async getAll(req: AuthRequest, res: Response) {
    try {
      const settings = await settingsService.getAll();
      res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Получить настройки по секции
   */
  async getBySection(req: AuthRequest, res: Response) {
    try {
      const { section } = req.params;
      const settings = await settingsService.getBySection(section);
      res.json({ success: true, settings });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * Обновить настройки секции
   */
  async updateSection(req: AuthRequest, res: Response) {
    try {
      const { section } = req.params;
      const data = req.body;

      if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
        return res.status(400).json({ success: false, error: 'Нет данных для обновления' });
      }

      const settings = await settingsService.updateSection(section, data);
      res.json({ success: true, settings, message: 'Настройки обновлены' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new SettingsController();


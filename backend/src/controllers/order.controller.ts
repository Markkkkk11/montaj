import { Response } from 'express';
import { AuthRequest } from '../types';
import orderService from '../services/order.service';

export class OrderController {
  /**
   * POST /api/orders
   * Создать новый заказ
   */
  async createOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      console.log('📝 Создание заказа, RAW req.body:', req.body);
      console.log('📝 Создание заказа, данные:', JSON.stringify(req.body, null, 2));
      console.log('📝 req.body.latitude:', req.body.latitude, 'typeof:', typeof req.body.latitude);
      console.log('📝 req.body.longitude:', req.body.longitude, 'typeof:', typeof req.body.longitude);

      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'CUSTOMER') {
        res.status(403).json({ error: 'Только заказчики могут создавать заказы' });
        return;
      }

      if (req.user.status !== 'ACTIVE') {
        res.status(403).json({ 
          error: 'Ваш профиль должен быть активирован для создания заказов',
          status: req.user.status 
        });
        return;
      }

      const orderData = {
        ...req.body,
        customerId: req.user.id,
        startDate: new Date(req.body.startDate),
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        files: req.body.files || [],
      };

      console.log('📍 Координаты в orderData:', {
        latitude: orderData.latitude,
        longitude: orderData.longitude,
        address: orderData.address,
      });

      const order = await orderService.createOrder(orderData);

      res.status(201).json({
        message: 'Заказ успешно создан',
        order,
      });
    } catch (error: any) {
      console.error('❌ Ошибка создания заказа:', error.message);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders
   * Получить список заказов с фильтрами
   */
  async getOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as any,
        region: req.query.region as string,
        minBudget: req.query.minBudget ? Number(req.query.minBudget) : undefined,
        maxBudget: req.query.maxBudget ? Number(req.query.maxBudget) : undefined,
        status: req.query.status as any,
        sortBy: (req.query.sortBy as 'createdAt' | 'startDate') || undefined,
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || undefined,
      };

      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      
      // Передаем userId для фильтрации и информации о просмотрах
      const userId = req.user?.id;

      const result = await orderService.getOrders(filters, page, limit, userId);

      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/view
   * Записать просмотр заказа исполнителем
   */
  async recordOrderView(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Только исполнители могут просматривать заказы' });
        return;
      }

      const { id } = req.params;

      await orderService.recordOrderView(id, req.user.id);

      res.json({ message: 'Просмотр записан' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders/:id
   * Получить заказ по ID
   */
  async getOrderById(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const order = await orderService.getOrderById(id, userId);

      if (!order) {
        res.status(404).json({ error: 'Заказ не найден' });
        return;
      }

      res.json({ order });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * GET /api/orders/my/list
   * Получить заказы текущего пользователя
   */
  async getMyOrders(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      console.log(`📋 Получение заказов для пользователя: ${req.user.id}, роль: ${req.user.role}`);

      let orders;

      if (req.user.role === 'CUSTOMER') {
        orders = await orderService.getCustomerOrders(req.user.id);
        console.log(`✅ Найдено заказов заказчика: ${orders.length}`);
      } else {
        // Для исполнителей - заказы, где он назначен (любой статус)
        const result = await orderService.getOrders(
          { 
            executorId: req.user.id,
            status: undefined  // Не фильтруем по статусу, берем все заказы исполнителя
          },
          1,
          100
        );
        orders = result.orders;
        console.log(`✅ Найдено заказов исполнителя: ${orders.length}`);
      }

      res.json({ orders });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * PUT /api/orders/:id
   * Обновить заказ
   */
  async updateOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { id } = req.params;

      const updateData = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };

      const order = await orderService.updateOrder(id, req.user.id, updateData);

      res.json({
        message: 'Заказ обновлён успешно',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * DELETE /api/orders/:id
   * Отменить заказ
   */
  async cancelOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { id } = req.params;

      const order = await orderService.cancelOrder(id, req.user.id);

      res.json({
        message: 'Заказ отменён. Средства возвращены откликнувшимся исполнителям',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/select-executor
   * Выбрать исполнителя для заказа
   */
  async selectExecutor(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { id } = req.params;
      const { executorId } = req.body;

      if (!executorId) {
        res.status(400).json({ error: 'ID исполнителя обязателен' });
        return;
      }

      const order = await orderService.selectExecutor(id, req.user.id, executorId);

      res.json({
        message: 'Исполнитель выбран успешно',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/start-work
   * Исполнитель приступает к работе
   */
  async startWork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Только исполнители могут приступить к работе' });
        return;
      }

      const { id } = req.params;

      const order = await orderService.startWork(id, req.user.id);

      res.json({
        message: 'Вы успешно приступили к работе',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/cancel-work
   * Исполнитель отказывается от заказа
   */
  async cancelWork(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (req.user.role !== 'EXECUTOR') {
        res.status(403).json({ error: 'Только исполнители могут отказаться от заказа' });
        return;
      }

      const { id } = req.params;
      const { reason } = req.body;

      const order = await orderService.cancelWork(id, req.user.id, reason);

      res.json({
        message: 'Вы отказались от заказа',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/complete
   * Завершить заказ (исполнителем или заказчиком)
   */
  async completeOrder(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      const { id } = req.params;
      let order;

      if (req.user.role === 'EXECUTOR') {
        order = await orderService.completeOrder(id, req.user.id);
      } else if (req.user.role === 'CUSTOMER') {
        order = await orderService.completeOrderByCustomer(id, req.user.id);
      } else {
        res.status(403).json({ error: 'Нет прав для завершения заказа' });
        return;
      }

      res.json({
        message: 'Заказ помечен как выполненный',
        order,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * POST /api/orders/:id/upload-files
   * Загрузить файлы к заказу
   */
  async uploadFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Не авторизован' });
        return;
      }

      if (!req.files || !Array.isArray(req.files)) {
        res.status(400).json({ error: 'Файлы не предоставлены' });
        return;
      }

      const { id } = req.params;

      const fileUrls = (req.files as Express.Multer.File[]).map(
        (file) => `/uploads/${file.filename}`
      );

      // Update the order's files field in the database
      await orderService.addFiles(id, fileUrls);

      res.json({
        message: 'Файлы загружены успешно',
        files: fileUrls,
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
}

export default new OrderController();


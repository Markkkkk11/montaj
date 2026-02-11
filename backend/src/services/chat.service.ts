import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class ChatService {
  /**
   * Создать сообщение в чате
   */
  async createMessage(
    orderId: string,
    senderId: string,
    content: string,
    fileUrl?: string
  ): Promise<Message> {
    // Проверяем, что отправитель имеет доступ к заказу
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.customerId !== senderId && order.executorId !== senderId) {
      throw new Error('У вас нет доступа к этому чату');
    }

    if (order.status !== 'IN_PROGRESS' && order.status !== 'COMPLETED') {
      throw new Error('Чат доступен только для заказов в работе или завершённых');
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId,
        content,
        fileUrl,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
      },
    });

    return message;
  }

  /**
   * Получить историю сообщений по заказу
   */
  async getMessages(orderId: string, userId: string, limit = 100, offset = 0): Promise<Message[]> {
    // Проверяем доступ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new Error('Заказ не найден');
    }

    if (order.customerId !== userId && order.executorId !== userId) {
      throw new Error('У вас нет доступа к этому чату');
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            photo: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
      skip: offset,
    });

    return messages;
  }

  /**
   * Отметить сообщения как прочитанные
   */
  async markAsRead(orderId: string, userId: string): Promise<void> {
    await prisma.message.updateMany({
      where: {
        orderId,
        senderId: { not: userId },
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Получить количество непрочитанных сообщений для пользователя
   */
  async getUnreadCount(userId: string): Promise<number> {
    // Получаем заказы, где пользователь - заказчик или исполнитель
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ customerId: userId }, { executorId: userId }],
        status: { in: ['IN_PROGRESS', 'COMPLETED'] },
      },
      select: { id: true },
    });

    const orderIds = orders.map((o) => o.id);

    const count = await prisma.message.count({
      where: {
        orderId: { in: orderIds },
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  }

  /**
   * Получить непрочитанные сообщения по заказу
   */
  async getUnreadCountByOrder(orderId: string, userId: string): Promise<number> {
    const count = await prisma.message.count({
      where: {
        orderId,
        senderId: { not: userId },
        read: false,
      },
    });

    return count;
  }
}

export default new ChatService();


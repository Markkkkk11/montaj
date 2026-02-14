import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function recalculateCompletedOrders() {
  console.log('🔄 Начинаем пересчёт завершённых заказов...\n');

  try {
    // Получаем всех пользователей (исполнителей и заказчиков)
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['EXECUTOR', 'CUSTOMER'],
        },
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });

    console.log(`📊 Найдено пользователей: ${users.length}\n`);

    let totalUpdated = 0;

    for (const user of users) {
      let completedCount = 0;

      if (user.role === 'EXECUTOR') {
        // Считаем завершённые заказы где пользователь был исполнителем
        completedCount = await prisma.order.count({
          where: {
            executorId: user.id,
            status: 'COMPLETED',
          },
        });
      } else if (user.role === 'CUSTOMER') {
        // Считаем завершённые заказы где пользователь был заказчиком
        completedCount = await prisma.order.count({
          where: {
            customerId: user.id,
            status: 'COMPLETED',
          },
        });
      }

      if (completedCount > 0) {
        // Обновляем счётчик
        await prisma.user.update({
          where: { id: user.id },
          data: {
            completedOrders: completedCount,
          },
        });

        console.log(
          `✅ ${user.fullName || user.email} (${user.role}): ${completedCount} завершённых заказов`
        );
        totalUpdated++;
      }
    }

    console.log(`\n✨ Обновлено пользователей: ${totalUpdated}`);
    console.log('✅ Пересчёт завершён!');
  } catch (error) {
    console.error('❌ Ошибка при пересчёте:', error);
  } finally {
    await prisma.$disconnect();
  }
}

recalculateCompletedOrders();


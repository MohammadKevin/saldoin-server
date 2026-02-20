import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      select: { id: true, name: true, type: true, balance: true },
    });

    const totalBalance = accounts.reduce(
      (acc, a) => acc.plus(a.balance),
      new Prisma.Decimal(0),
    );

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const incomeAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    const expenseAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        createdAt: { gte: startOfMonth },
      },
      _sum: { amount: true },
    });

    return {
      totalBalance: totalBalance.toNumber(),
      totalIncome: incomeAgg._sum.amount?.toNumber() ?? 0,
      totalExpense: expenseAgg._sum.amount?.toNumber() ?? 0,
      accounts: accounts.map((a) => ({
        ...a,
        balance: a.balance.toNumber(),
      })),
    };
  }
}

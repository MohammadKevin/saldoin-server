import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  create(userId: string, name: string, type: any, balance = 0) {
    return this.prisma.account.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: { userId, name, type, balance },
    });
  }

  findAll(userId: string) {
    return this.prisma.account.findMany({ where: { userId } });
  }

  async delete(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: { id: accountId, userId },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    if (!account.balance.equals(0)) {
      throw new BadRequestException('Account balance must be zero');
    }

    const used = await this.prisma.transaction.findFirst({
      where: {
        OR: [{ accountFromId: accountId }, { accountToId: accountId }],
      },
    });

    if (used) {
      throw new BadRequestException('Account has transactions');
    }

    await this.prisma.account.delete({
      where: { id: accountId },
    });

    return { message: 'Account deleted successfully' };
  }

  async getSummary(userId: string, accountId: string) {
    const account = await this.prisma.account.findFirst({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const incomeAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'INCOME',
        accountToId: accountId,
      },
      _sum: { amount: true },
      _count: true,
    });

    const expenseAgg = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'EXPENSE',
        accountFromId: accountId,
      },
      _sum: { amount: true },
      _count: true,
    });

    return {
      balance: Number(account.balance),
      totalIncome: Number(incomeAgg._sum.amount ?? 0),
      totalExpense: Number(expenseAgg._sum.amount ?? 0),
      transactionCount: incomeAgg._count + expenseAgg._count,
    };
  }

  async paginate(
    userId: string,
    params: {
      page?: number;
      limit?: number;
      sort?: 'asc' | 'desc';
    },
  ) {
    const page = Math.max(Number(params.page) || 1, 1);
    const limit = Math.min(Number(params.limit) || 20, 100);
    const sort: 'asc' | 'desc' = params.sort === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    const [total, transactions] = await this.prisma.$transaction([
      this.prisma.transaction.count({
        where: { userId },
      }),
      this.prisma.transaction.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: sort },
        include: {
          accountFrom: { select: { id: true, name: true } },
          accountTo: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      data: transactions.map((t) => ({
        ...t,
        amount: Number(t.amount),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

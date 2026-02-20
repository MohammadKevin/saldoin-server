import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async addIncome(userId: string, dto: CreateIncomeDto) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: dto.accountToId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const amount = new Prisma.Decimal(dto.amount);

      await tx.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount,
          description: dto.description,
          accountToId: account.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: account.balance.plus(amount),
        },
      });

      return { message: 'Income added successfully' };
    });
  }

  async addExpense(userId: string, dto: CreateExpenseDto) {
    return this.prisma.$transaction(async (tx) => {
      const account = await tx.account.findFirst({
        where: { id: dto.accountFromId, userId },
      });

      if (!account) {
        throw new NotFoundException('Account not found');
      }

      const amount = new Prisma.Decimal(dto.amount);

      if (account.balance.lessThan(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount,
          description: dto.description,
          accountFromId: account.id,
        },
      });

      await tx.account.update({
        where: { id: account.id },
        data: {
          balance: account.balance.minus(amount),
        },
      });

      return { message: 'Expense added successfully' };
    });
  }

  async addTransfer(userId: string, dto: CreateTransferDto) {
    if (dto.accountFromId === dto.accountToId) {
      throw new BadRequestException('Cannot transfer to the same account');
    }

    return this.prisma.$transaction(async (tx) => {
      const from = await tx.account.findFirst({
        where: { id: dto.accountFromId, userId },
      });

      const to = await tx.account.findFirst({
        where: { id: dto.accountToId, userId },
      });

      if (!from || !to) {
        throw new NotFoundException('Account not found');
      }

      const amount = new Prisma.Decimal(dto.amount);

      if (from.balance.lessThan(amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.transaction.create({
        data: {
          userId,
          type: 'EXPENSE',
          amount,
          description: dto.description ?? 'Transfer out',
          accountFromId: from.id,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: 'INCOME',
          amount,
          description: dto.description ?? 'Transfer in',
          accountToId: to.id,
        },
      });

      await tx.account.update({
        where: { id: from.id },
        data: {
          balance: from.balance.minus(amount),
        },
      });

      await tx.account.update({
        where: { id: to.id },
        data: {
          balance: to.balance.plus(amount),
        },
      });

      return { message: 'Transfer completed successfully' };
    });
  }

  async list(
    userId: string,
    filters: {
      type?: 'INCOME' | 'EXPENSE';
      from?: string;
      to?: string;
    },
  ) {
    const where: Prisma.TransactionWhereInput = { userId };

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = new Date(filters.from);
      if (filters.to) where.createdAt.lte = new Date(filters.to);
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        accountFrom: { select: { id: true, name: true } },
        accountTo: { select: { id: true, name: true } },
      },
    });

    return transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
    }));
  }

  async deleteTransaction(userId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const trx = await tx.transaction.findFirst({
        where: { id, userId },
      });

      if (!trx) {
        throw new NotFoundException('Transaction not found');
      }

      const amount = trx.amount;

      if (trx.type === 'INCOME' && trx.accountToId) {
        const account = await tx.account.findUnique({
          where: { id: trx.accountToId },
        });

        if (!account) {
          throw new BadRequestException('Account not found');
        }

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance.minus(amount),
          },
        });
      }

      if (trx.type === 'EXPENSE' && trx.accountFromId) {
        const account = await tx.account.findUnique({
          where: { id: trx.accountFromId },
        });

        if (!account) {
          throw new BadRequestException('Account not found');
        }

        await tx.account.update({
          where: { id: account.id },
          data: {
            balance: account.balance.plus(amount),
          },
        });
      }

      await tx.transaction.delete({
        where: { id: trx.id },
      });

      return { message: 'Transaction deleted and balance rolled back' };
    });
  }
}

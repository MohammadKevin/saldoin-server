import {
  Body,
  Controller,
  Post,
  Req,
  Get,
  Query,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport';
import { CreateIncomeDto } from './dto/create-income.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';

@Controller('transactions')
@UseGuards(AuthGuard('jwt'))
export class TransactionsController {
  constructor(private readonly service: TransactionsService) {}

  @Post('income')
  addIncome(@Req() req, @Body() dto: CreateIncomeDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.addIncome(req.user.userId, dto);
  }

  @Post('expense')
  addExpense(@Req() req, @Body() dto: CreateExpenseDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.addExpense(req.user.userId, dto);
  }

  @Post('transfer')
  addTransfer(@Req() req, @Body() dto: CreateTransferDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.addTransfer(req.user.userId, dto);
  }

  @Get()
  list(
    @Req() req,
    @Query('type') type?: 'INCOME' | 'EXPENSE',
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.list(req.user.userId, { type, from, to });
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.deleteTransaction(req.user.userId, id);
  }
}

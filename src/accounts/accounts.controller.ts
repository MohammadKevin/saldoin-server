import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Body,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
  constructor(private service: AccountsService) { }

  @Post()
  create(@Req() req, @Body() body) {
    return this.service.create(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      req.user.userId,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      body.name,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      body.type,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
      body.balance ?? 0,
    );
  }

  @Get()
  findAll(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.findAll(req.user.userId);
  }

  @Delete(':id')
  delete(@Req() req, @Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.delete(req.user.userId, id);
  }

  @Get(':id/summary')
  getSummary(@Req() req, @Param('id') id: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.getSummary(req.user.userId, id);
  }

  @Get('paginate')
  paginate(
    @Req() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: 'asc' | 'desc',
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    return this.service.paginate(req.user.userId, {
      page: Number(page),
      limit: Number(limit),
      sort,
    });
  }
}

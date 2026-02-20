import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateIncomeDto {
  @IsString()
  @IsNotEmpty()
  accountToId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description?: string;
}

import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateTransferDto {
  @IsString()
  @IsNotEmpty()
  accountFromId!: string;

  @IsString()
  @IsNotEmpty()
  accountToId!: string;

  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsString()
  description?: string;
}

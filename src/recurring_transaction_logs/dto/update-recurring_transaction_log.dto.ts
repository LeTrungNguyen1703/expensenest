import { PartialType } from '@nestjs/mapped-types';
import { CreateRecurringTransactionLogDto } from './create-recurring_transaction_log.dto';

export class UpdateRecurringTransactionLogDto extends PartialType(CreateRecurringTransactionLogDto) {}

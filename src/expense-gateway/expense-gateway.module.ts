import { Module } from '@nestjs/common';
import {ExpenseGateway} from "./expense.gateway";

@Module({
    providers:[ExpenseGateway]
})
export class ExpenseGatewayModule {}

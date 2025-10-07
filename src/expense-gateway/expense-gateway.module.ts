import { Module } from '@nestjs/common';
import {ExpenseGateway} from "./expense.gateway";

@Module({
    providers:[ExpenseGateway],
    exports: [ExpenseGateway],
})
export class ExpenseGatewayModule {}

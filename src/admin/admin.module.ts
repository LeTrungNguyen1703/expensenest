import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import {BullModule} from "@nestjs/bullmq";
import {QUEUE_NAMES} from "../../queue-constants";
import {BullBoardController} from "./admin.controller";

@Module({
  controllers: [BullBoardController],
  providers: [AdminService],
  imports: [
    BullModule.registerQueue({ name: QUEUE_NAMES.RECURRING_TRANSACTIONS }),
  ],
})
export class AdminModule {}

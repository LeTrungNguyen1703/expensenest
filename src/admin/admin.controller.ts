// src/admin/bull-board.controller.ts
import {All, Controller, Req, Res, UseGuards} from '@nestjs/common';
import {InjectQueue} from '@nestjs/bullmq';
import {Queue} from 'bullmq';
import {createBullBoard} from '@bull-board/api';
import {BullMQAdapter} from '@bull-board/api/bullMQAdapter';
import {ExpressAdapter} from '@bull-board/express';
import {QUEUE_NAMES} from "../../queue-constants";

@Controller('admin/queues')
// @UseGuards(JwtAuthGuard, AdminGuard) // ✅ Uncomment để thêm auth
export class BullBoardController {
    private serverAdapter: ExpressAdapter;

    constructor(
        @InjectQueue(QUEUE_NAMES.RECURRING_TRANSACTIONS)
        private readonly recurringQueue: Queue,
        // Add thêm queues khác nếu có
        // @InjectQueue(QUEUE_NAMES.NOTIFICATIONS)
        // private readonly notificationQueue: Queue,
    ) {
        this.serverAdapter = new ExpressAdapter();
        this.serverAdapter.setBasePath('/admin/queues');

        createBullBoard({
            queues: [
                new BullMQAdapter(this.recurringQueue),
                // new BullMQAdapter(this.notificationQueue),
            ],
            serverAdapter: this.serverAdapter,
        });
    }

    @All('*')
    async handleBullBoard(@Req() req, @Res() res) {
        const handler = this.serverAdapter.getRouter();
        handler(req, res);
    }
}
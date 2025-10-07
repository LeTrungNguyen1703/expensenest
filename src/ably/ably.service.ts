// src/ably/ably.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Ably from 'ably';

@Injectable()
export class AblyService implements OnModuleDestroy {
  private client: Ably.Realtime;

  constructor() {
    this.client = new Ably.Realtime({
      key: process.env.ABLY_API_KEY,
    });
  }

  async publish(channelName: string, eventName: string, data: any) {
    const channel = this.client.channels.get(channelName);
    await channel.publish(eventName, data);
  }

  onModuleDestroy() {
    this.client.close();
  }
}

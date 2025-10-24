import * as amqp from 'amqplib';
import { Channel, ChannelModel, ConsumeMessage } from 'amqplib';
import config from "@/configs/config";
export class RabbitMQService {
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private url: string;

    constructor(url: string = config.graphql.url) {
        this.url = url;
    }

    /**
     * Connect to RabbitMQ server
     */
    async connect(): Promise<void> {
        try {
            this.connection = await amqp.connect(this.url);
            if (!this.connection) {
                throw new Error("Failed to connect");
            }
            this.channel = await this.connection.createChannel();

            console.log('Connected to RabbitMQ');

            // Handle connection errors
            this.connection.on('error', (err) => {
                console.error('RabbitMQ connection error:', err);
            });

            this.connection.on('close', () => {
                console.log('RabbitMQ connection closed');
            });
        } catch (error) {
            console.error('Failed to connect to RabbitMQ:', error);
            throw error;
        }
    }

    /**
     * Ensure queue exists
     */
    async assertQueue(queueName: string, options = { durable: true }): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }
        await this.channel.assertQueue(queueName, options);
    }

    /**
     * Send message to queue (Producer)
     */
    async sendToQueue(queueName: string, message: any, options = {}): Promise<boolean> {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }

        try {
            await this.assertQueue(queueName);
            const sent = this.channel.sendToQueue(
                queueName,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            console.log(`Message sent to queue "${queueName}":`, message);
            return sent;
        } catch (error) {
            console.error('Error sending message:', error);
            throw error;
        }
    }

    /**
     * Consume messages from queue (Consumer)
     */
    async consume(
        queueName: string,
        callback: (message: any) => Promise<void>
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }

        try {
            await this.assertQueue(queueName);

            console.log(`Waiting for messages in queue "${queueName}"...`);

            await this.channel.consume(queueName, async (msg: ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        console.log(`Received message from "${queueName}":`, content);

                        // Process the message
                        await callback(content);

                        // Acknowledge the message
                        this.channel!.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        // Reject and requeue the message
                        this.channel!.nack(msg, false, true);
                    }
                }
            });
        } catch (error) {
            console.error('Error consuming messages:', error);
            throw error;
        }
    }

    /**
     * Publish to exchange (Pub/Sub pattern)
     */
    async publish(
        exchangeName: string,
        routingKey: string,
        message: any,
        type: "direct" | "topic" | "headers" | "fanout" | "match" | string = 'topic',
        options = {}
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }

        try {
            await this.channel.assertExchange(exchangeName, type, { durable: true });

            this.channel.publish(
                exchangeName,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                { persistent: true }
            );

            console.log(`Published to exchange "${exchangeName}" with key "${routingKey}":`, message);
        } catch (error) {
            console.error('Error publishing message:', error);
            throw error;
        }
    }

    /**
     * Subscribe to exchange (Pub/Sub pattern)
     */
    async subscribe(
        exchangeName: string,
        routingKey: string,
        callback: (message: any) => Promise<void>
    ): Promise<void> {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }

        try {
            await this.channel.assertExchange(exchangeName, 'topic', { durable: true });

            // Create a temporary queue
            const q = await this.channel.assertQueue('', { exclusive: true });

            // Bind queue to exchange with routing key
            await this.channel.bindQueue(q.queue, exchangeName, routingKey);

            console.log(`Subscribed to exchange "${exchangeName}" with key "${routingKey}"`);

            await this.channel.consume(q.queue, async (msg: ConsumeMessage | null) => {
                if (msg) {
                    try {
                        const content = JSON.parse(msg.content.toString());
                        console.log(`Received from exchange "${exchangeName}":`, content);

                        await callback(content);
                        this.channel!.ack(msg);
                    } catch (error) {
                        console.error('Error processing message:', error);
                        this.channel!.nack(msg, false, false);
                    }
                }
            });
        } catch (error) {
            console.error('Error subscribing:', error);
            throw error;
        }
    }

    /**
     * Close connection
     */
    async close(): Promise<void> {
        try {
            if (this.channel) {
                await this.channel.close();
            }
            if (this.connection) {
                await this.connection.close();
            }
            console.log('RabbitMQ connection closed');
        } catch (error) {
            console.error('Error closing connection:', error);
        }
    }

    /**
     * Get channel instance
     */
    getChannel(): Channel {
        if (!this.channel) {
            throw new Error('Channel not initialized. Call connect() first.');
        }
        return this.channel;
    }
}

export const rabbitMQService = new RabbitMQService();

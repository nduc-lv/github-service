import githubConsumer from "./messageQueue/consumers/github.consumer";
import { rabbitMQService } from "./messageQueue/rabbitmq.service";
import { QUEUE_NAMES } from "./messageQueue/types/queueNames";
import { initializeBaseDirectory } from "./utils/dir.util";

const startMessageQueue = async () => {
    try {
        console.log('Starting GitHub Service...');
        // Connect to RabbitMQ
        console.log('Connecting to RabbitMQ...');
        await rabbitMQService.connect();
        console.log('Connected to RabbitMQ successfully');

        // Start consuming from all queues
        console.log('Starting message consumers...');
        const queueNames = Object.values(QUEUE_NAMES);
        await Promise.all(
            queueNames.map((queueName) => {
                console.log(`  - Consuming from queue: ${queueName}`);
                return githubConsumer.consume(queueName);
            })
        );

        console.log(`All ${queueNames.length} consumers started successfully`);
        console.log('GitHub Service is ready!');
    } catch (e) {
        console.error('Failed to start message queue:', e);
        console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
        process.exit(1); // Exit with error code
    }
};

// Graceful shutdown handler
const shutdown = async () => {
    console.log('\nShutting down gracefully...');
    try {
        await rabbitMQService.close();
        console.log('RabbitMQ connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

// Handle shutdown signals
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    shutdown();
});

// Start the application
startMessageQueue();
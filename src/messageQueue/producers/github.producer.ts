import { MessageQueueProducer } from "../types/types";
import { rabbitMQService } from "../rabbitmq.service";

class GithubProducer implements MessageQueueProducer {

    private _rabbitMQService = rabbitMQService;

    async sendToQueue(queueName: string, message: any, options?: any): Promise<boolean> {
        return await this._rabbitMQService.sendToQueue(queueName, message, options);
    }
}

const githubProducer = new GithubProducer();

export default githubProducer;
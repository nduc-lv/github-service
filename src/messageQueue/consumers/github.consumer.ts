import { CloneProjectRequest, MessageQueueConsumer } from "../types/types";
import githubClient from "@/core";
import { rabbitMQService } from "../rabbitmq.service";
import { QUEUE_NAMES, QueueName } from "../types/queueNames";
import { createProjectDirectory } from "@/utils/dir.util";
import githubProducer from "../producers/github.producer";

class GithubConsumer implements MessageQueueConsumer {
    private _queueService = rabbitMQService;
    private _githubClient = githubClient;
    private _githubProducer = githubProducer;

    async consume(queueName: QueueName): Promise<void> {
        let callback = this.getCallBackByQueueName(queueName);
        await this._queueService.consume(queueName, callback);
    }

    private async cloneProject(message: CloneProjectRequest) {

        try {
            const githubUrl = message.githubUrl;
            const userId = message.authorId;
            const projectName = message.projectName;
            const directoryPath = await createProjectDirectory(userId, projectName);
            await this._githubClient.cloneProject(githubUrl, directoryPath);

            const messagePayload = {
                githubUrl,
                authorId: userId,
                directoryPath
            }
            
            this._githubProducer.sendToQueue(QUEUE_NAMES.PROJECT_SYNC, messagePayload);
        }
        catch (e) {
            console.log(e);
            // notify error;
        }


    }

    private getCallBackByQueueName(queueName: QueueName) {
        switch (queueName) {
            case QUEUE_NAMES.GITHUB_SYNC:
                return this.cloneProject.bind(this);
            default:
                return async (message: any) => {};
        }
    }

}

const githubConsumer = new GithubConsumer();

export default githubConsumer




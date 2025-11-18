import { CloneProjectRequest, MessageQueueConsumer } from "../types/types";
import githubClient from "@/core";
import { rabbitMQService } from "../rabbitmq.service";
import { ANOTHER_QUEUE_NAMES, QUEUE_NAMES, QueueName } from "../types/queueNames";
import { createProjectDirectory } from "@/utils/dir.util";
import githubProducer from "../producers/github.producer";
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const readFile = promisify(fs.readFile);
const access = promisify(fs.access);

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
            const projectId = message.projectId;
            const directoryPath = await createProjectDirectory(userId, projectId);
            await this._githubClient.cloneProject(githubUrl, directoryPath);

            // After sync, get the content of README.md file
            let readmeContent: string | null = null;
            const readmePath = path.join(directoryPath, 'README.md');

            try {
                // Check if README.md exists
                await access(readmePath, fs.constants.F_OK);
                // Read the README.md content
                readmeContent = await readFile(readmePath, 'utf-8');
                console.log(`README.md found and read successfully for project ${projectId}`);
            } catch (readmeError) {
                console.log(`README.md not found in project ${projectId}, skipping...`);
            }

            // Generate timestamp in Vietnam timezone (UTC+7)
            const vietnamTimestamp = new Date().toLocaleString('en-US', {
                timeZone: 'Asia/Ho_Chi_Minh',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            const messagePayload = {
                githubUrl,
                authorId: userId,
                directoryPath,
                status: 'synced',
                projectId,
                discription: readmeContent,
                syncedAt: vietnamTimestamp,
                syncedAtISO: new Date().toISOString()
            }

            console.log(`Synced at (Vietnam Time): ${vietnamTimestamp}`);

            this._githubProducer.sendToQueue(ANOTHER_QUEUE_NAMES.PROJECT_SYNC, messagePayload);
            console.log("SEND TO QUEUE PROjECT_SYNC");
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




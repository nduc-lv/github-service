export interface MessageQueueConsumer {
    consume(queueName: string, callback: (message: any) => Promise<any>): Promise<void>
    //TODO: ADD SUBSCRIBER
}
export interface MessageQueueProducer {
    sendToQueue(queueName: string, message: any, options?: any): Promise<boolean>
    //TODO: ADD PUBLISHER
}

export type CloneProjectRequest = {
    authorId: string,
    githubUrl: string,
    projectName: string,
    projectId: string,
    [key: string]: string
}
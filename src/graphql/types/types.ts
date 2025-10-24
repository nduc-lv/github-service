export interface MessageQueueConsumer {
    consume(queueName: string, callback: (message: any) => Promise<any>): Promise<boolean>
    //TODO: ADD SUBSCRIBER
}
export interface MessageQueueProducer {
    sendToQueue(queueName: string, message: any, options: any): Promise<void>
    //TODO: ADD PUBLISHER
}
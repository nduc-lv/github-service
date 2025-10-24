import * as dotenv from 'dotenv';
dotenv.config();


const configs = {
    graphql: {
        url: process.env.RABBITMQ_URL || 'amqp://username:password@localhost:5672'
    }
}

export default configs
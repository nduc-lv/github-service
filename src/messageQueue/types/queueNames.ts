export const EXCHANGES = {
    EVENTS: 'events-exchange'
} as const

export const QUEUE_NAMES = {
    GITHUB_SYNC: 'github-sync',
} as const;

export const ANOTHER_QUEUE_NAMES = {
    PROJECT_SYNC: 'projects-sync'
}

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
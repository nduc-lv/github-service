export const EXCHANGES = {
    EVENTS: 'events-exchange'
} as const

export const QUEUE_NAMES = {
    GITHUB_SYNC: 'github-sync',
    PROJECT_SYNC: 'project-sync'
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];
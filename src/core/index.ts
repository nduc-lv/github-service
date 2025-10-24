import simpleGit, { SimpleGit, TaskOptions, SimpleGitTaskCallback } from "simple-git";

class GithubClient {
    private git: SimpleGit;

    constructor() {
        this.git = simpleGit();
    }

    async cloneProject(githubUrl: string, directory: string, options?: TaskOptions, callback?: SimpleGitTaskCallback) {
        const response = await this.git.clone(githubUrl, directory, options, callback);
        return response;
    }
}
const githubClient = new GithubClient();

export default githubClient;
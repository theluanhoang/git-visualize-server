import { Injectable } from '@nestjs/common';
import { generateCommitId } from './git-engine.utils';
import { ETypeGitObject, GitCommandResponse, IBranch, ICommit, IRepositoryState } from './git-engine.interface';

@Injectable()
export class GitEngineService {
    private repositoryState: IRepositoryState | null = null;
    private knownCommands = ['clear', 'init', 'commit', 'branch', 'checkout', 'switch', 'status', 'log', 'tag'];

    constructor() { }

    executeCommand(command: string): GitCommandResponse | null {
        const tokens = command.trim().split(/\s+/);

        if (tokens[0] !== 'git') {
            return this.response(`${tokens[0]}: command not found`, false)
        }

        tokens.shift();
        const [cmd, ...args] = tokens;

        if (!cmd) {
            return this.response("git: no command provided. See 'git --help'.", false);
        }

        if (!this.knownCommands.includes(cmd)) {
            const suggestion = this.findSimilarCommand(cmd);
            let message = `git: '${cmd}' is not a git command. See 'git --help'.`;
            if (suggestion) {
                message += `\n\nThe most similar command is\n\t${suggestion}`;
            }
            return this.response(message, false);
        }

        switch (cmd as string) {
            case 'init':
                return this.init();
            case 'status':
                return this.status();
            case 'commit':
                return this.commit(args);
            case 'branch':
                return this.branch(args);
            case 'checkout':
                return this.checkout(args);
            case 'switch':
                return this.switch(args);
            case 'clear':
                return this.clear();
            default:
                return this.response(`git: '${cmd}' not implemented yet`);
        }
    }

    private setRepositoryState(state: IRepositoryState) {
        this.repositoryState = state;
    }

    getRepositoryState(): IRepositoryState | null {
        return this.repositoryState;
    }

    private init(): GitCommandResponse {
        let message = "Reinitialized existing Git repository";
        let state = this.repositoryState;
        if (!this.repositoryState) {
            state = {
                commits: [],
                branches: [{ name: 'main', commitId: '' }],
                tags: [],
                head: { type: 'branch', ref: 'main', commitId: '' },
            };

            this.setRepositoryState(state);

            message = "Initialized empty Git repository"
        }

        return {
            success: true,
            output: message,
            repositoryState: this.repositoryState,
        };
    }

    private status(): GitCommandResponse {
        if (!this.repositoryState) {
            return {
                success: false,
                output: "fatal: not a git repository (or any of the parent directories): .git",
                repositoryState: this.repositoryState,
            };
        }

        const head = this.repositoryState.head;
        const branchName =
            head && head.type === "branch" ? head.ref : "(detached HEAD)";

        if (this.repositoryState.commits.length === 0) {
            return {
                success: true,
                output:
                    `On branch ${branchName}\n\n` +
                    `No commits yet\n\n` +
                    `nothing to commit (create/copy files and use "git add" to track)`,
                repositoryState: this.repositoryState,
            };
        }

        return {
            success: true,
            output:
                `On branch ${branchName}\n` +
                `nothing to commit, working tree clean`,
            repositoryState: this.repositoryState,
        };
    }

    private clear(): GitCommandResponse | null {
        if (!this.repositoryState) {
            return this.response(
                "fatal: not a git repository (or any of the parent directories): .git",
                false
            );
        }

        this.repositoryState = null;

        return {
            success: true,
            output: '',
            repositoryState: null
        }
    }

    private commit(args: string[]): GitCommandResponse {
        if (!this.repositoryState) {
            return this.response(
                "fatal: not a git repository (or any of the parent directories): .git",
                false
            );
        }

        const head = this.repositoryState.head;
        if (!head || head.type !== "branch") {
            return this.response("fatal: HEAD is not pointing to a branch", false);
        }

        const branchName = head.ref;
        const branch = this.repositoryState.branches.find(b => b.name === branchName);

        if (!branch) {
            return this.response(`fatal: current branch '${branchName}' not found`, false);
        }

        const messageIndex = args.indexOf("-m");
        if (messageIndex === -1 || !args[messageIndex + 1]) {
            return this.response("error: commit message not provided (use -m \"msg\")", false);
        }
        const message = args.slice(messageIndex + 1).join(" ");

        const commitId = generateCommitId();
        const newCommit: ICommit = {
            id: commitId,
            message,
            author: {
                name: "You",
                email: "<you@example.com>",
                date: new Date()
            },
            committer: {
                name: "You",
                email: "<you@example.com>",
                date: new Date()
            },
            parents: branch.commitId ? [branch.commitId] : [],
            type: ETypeGitObject.COMMIT,
            branch: branch.name
        };

        this.repositoryState.commits.push(newCommit);
        branch.commitId = commitId;
        this.repositoryState.head = { type: "branch", ref: branchName, commitId: branch.commitId };

        return {
            success: true,
            output: `[${branchName} ${commitId.substring(0, 7)}] ${message}`,
            repositoryState: this.repositoryState,
        };
    }

    private branch(args: string[]): GitCommandResponse {
        if (!this.repositoryState) {
            return this.response(
                "fatal: not a git repository (or any of the parent directories): .git", false
            );
        }

        const head = this.repositoryState.head;
        if (!head || head.type !== "branch") {
            return this.response("fatal: HEAD is not pointing to a branch", false);
        }

        if (args.length === 0) {
            const branchList = this.repositoryState.branches
                .map(b => {
                    const prefix = b.name === head.ref ? "*" : " ";
                    return `${prefix} ${b.name}`;
                })
                .join("\n");

            return {
                success: true,
                output: branchList,
                repositoryState: this.repositoryState,
            };
        }

        const newBranchName = args[0];

        const exists = this.repositoryState.branches.some(b => b.name === newBranchName);
        if (exists) {
            return this.response(`fatal: A branch named '${newBranchName}' already exists.`, false);
        }

        const currentBranch = this.repositoryState.branches.find(b => b.name === head.ref);
        if (!currentBranch || !currentBranch.commitId) {
            return this.response("fatal: not a valid commit to branch from", false);
        }

        this.repositoryState.branches.push({
            name: newBranchName,
            commitId: currentBranch.commitId,
        });

        return {
            success: true,
            output: "",
            repositoryState: this.repositoryState,
        };
    }

    private checkout(args: string[]): GitCommandResponse {
        if (!this.repositoryState) {
            return this.response(
                "fatal: not a git repository (or any of the parent directories): .git",
                false
            );
        }
        const head = this.repositoryState.head;

        if (!head || head.type !== "branch") {
            return this.response("fatal: HEAD is not pointing to a branch", false);
        }

        if (args.length === 0) {
            return this.response(`Your branch is up to date with '${head.ref}'.`);
        }

        const branchName = args[0];
        const branch = this.repositoryState.branches.find(b => b.name === branchName);
        if (!branch) {
            return this.response(
                `error: pathspec '${branchName}' did not match any file(s) known to git`,
                false
            );
        }
        this.repositoryState.head = { type: "branch", ref: branchName, commitId: branch.commitId };

        return {
            success: true,
            output: `Switched to branch '${branchName}'`,
            repositoryState: this.repositoryState,
        };
    }

    private switch(args: string[]): GitCommandResponse {
        if (!this.repositoryState) {
            return this.response(
                "fatal: not a git repository (or any of the parent directories): .git",
                false
            );
        }

        if (args.length === 0) {
            return this.response("fatal: missing branch or commit argument", false);
        }

        let isNewBranch = false;
        let target = "";

        if (args[0] === "-c" && args[1]) {
            isNewBranch = true;
            target = args[1];
        } else {
            target = args[0];
        }

        if (!target) {
            return this.response("fatal: missing branch or commit argument", false);
        }

        const existingBranch = this.repositoryState.branches.find(b => b.name === target);

        if (existingBranch && !isNewBranch) {
            this.repositoryState.head = {
                type: "branch",
                ref: existingBranch.name,
                commitId: existingBranch.commitId
            };
            return {
                success: true,
                output: `Switched to branch '${target}'`,
                repositoryState: this.repositoryState,
            };
        }

        if (isNewBranch) {
            const currentHead = this.repositoryState.head;
            let commitId = "";

            if (currentHead) {
                if (currentHead.type === "branch") {
                    const currentBranch = this.repositoryState.branches.find(b => b.name === currentHead.ref);
                    commitId = currentBranch?.commitId || "";
                } else if (currentHead.type === "commit") {
                    commitId = currentHead.ref;
                }
            }

            if (existingBranch) {
                return this.response(`fatal: A branch named '${target}' already exists.`, false);
            }

            this.repositoryState.branches.push({ name: target, commitId });
            this.repositoryState.head = {
                type: "branch",
                ref: target,
                commitId
            };

            return {
                success: true,
                output: `Switched to a new branch '${target}'`,
                repositoryState: this.repositoryState,
            };
        }

        const commit = this.repositoryState.commits.find(c => c.id === target);
        if (commit) {
            this.repositoryState.head = {
                type: "commit",
                ref: commit.id
            };
            return {
                success: true,
                output: `Note: switching to detached HEAD '${commit.id}'`,
                repositoryState: this.repositoryState,
            };
        }

        return this.response(`fatal: invalid reference: ${target}`, false);
    }


    private response(message: string, success?: boolean): GitCommandResponse {
        return {
            success: success ?? true,
            output: message,
            repositoryState: this.repositoryState,
        };
    }


    private findSimilarCommand(cmd: string): string | null {
        let closest: string | null = null;
        let minDistance = Infinity;

        for (const known of this.knownCommands) {
            const dist = this.levenshteinDistance(cmd, known);
            if (dist < minDistance) {
                minDistance = dist;
                closest = known;
            }
        }

        return minDistance <= 3 ? closest : null;
    }

    private levenshteinDistance(a: string, b: string): number {
        const dp: number[][] = Array.from({ length: a.length + 1 }, () =>
            Array(b.length + 1).fill(0),
        );

        for (let i = 0; i <= a.length; i++) dp[i][0] = i;
        for (let j = 0; j <= b.length; j++) dp[0][j] = j;

        for (let i = 1; i <= a.length; i++) {
            for (let j = 1; j <= b.length; j++) {
                if (a[i - 1] === b[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1];
                } else {
                    dp[i][j] =
                        1 +
                        Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
                }
            }
        }

        return dp[a.length][b.length];
    }
}

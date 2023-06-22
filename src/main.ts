import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

import * as input from './input';
import { CheckRunner } from './check';
import { Err, Ok, Result } from './result';

async function getVersion(cmd: string, toolchain: string): Promise<string> {
    return (await exec.getExecOutput('rustup', ['run', toolchain, cmd, '-V'], { silent: true }))
        .stdout;
}

function addPrefix(prefix: string, options: string[]): string[] {
    return options.flatMap(opt => [
        prefix,
        opt === 'warnings' ? opt : opt.startsWith('clippy::') ? opt : `clippy::${opt}`,
    ]);
}

export async function run(actionInput: input.Input): Promise<Result<void, string>> {
    const startedAt = new Date().toISOString();
    const rustcVersion = await getVersion('rustc', actionInput.toolchain);
    const cargoVersion = await getVersion('cargo', actionInput.toolchain);
    const clippyVersion = await getVersion('cargo', actionInput.toolchain);
    const target = actionInput.target === undefined ? [] : ['-t', actionInput.target];

    const warn = addPrefix('--warn', actionInput.warn);
    const allow = addPrefix('--allow', actionInput.allow);
    const deny = addPrefix('--deny', actionInput.deny);
    const forbid = addPrefix('--forbid', actionInput.forbid);
    const manifestPath: string = actionInput.workingDirectory.endsWith('/')
        ? `${actionInput.workingDirectory}Cargo.toml`
        : `${actionInput.workingDirectory}/Cargo.toml`;

    const runner = new CheckRunner();
    let stdErr = '';
    let clippyExitCode = 0;

    try {
        core.startGroup('Executing cargo clippy (JSON output)');
        const execOutput = await exec.getExecOutput(
            'cargo',
            [
                'clippy',
                '--message-format=json',
                `--manifest-path=${manifestPath}`,
                ...actionInput.options.filter(opt => !opt.startsWith('--message-format')),
                ...target,
                '--',
                ...warn,
                ...allow,
                ...deny,
                ...forbid,
            ],
            {
                ignoreReturnCode: true,
                failOnStdErr: false,
                listeners: {
                    stdline: (line: string) => {
                        runner.tryPush(line);
                    },
                },
            },
        );
        stdErr = execOutput.stderr;
        clippyExitCode = execOutput.exitCode;
    } finally {
        core.endGroup();
    }

    let sha = github.context.sha;
    const pr = github.context.payload.pull_request;
    if (pr !== undefined && 'head' in pr) {
        sha = pr.head.sha;
    }
    await runner.executeCheck({
        token: actionInput.token,
        name: actionInput.name,
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        head_sha: sha,
        started_at: startedAt,
        context: {
            rustc: rustcVersion,
            cargo: cargoVersion,
            clippy: clippyVersion,
        },
    });

    if (clippyExitCode !== 0) {
        return new Err(`Clippy had exited with the ${clippyExitCode} exit code:\n${stdErr}`);
    }
    return new Ok(undefined);
}

async function main(): Promise<void> {
    const actionInput = input.get();
    const res = await run(actionInput);
    if (res.type === 'failure') core.setFailed(`${res.unwrap_err()}`);
}

main();

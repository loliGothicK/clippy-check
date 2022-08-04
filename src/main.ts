import * as core from '@actions/core';
import * as exec from '@actions/exec';
import * as github from '@actions/github';

import * as input from './input';
import { CheckRunner } from './check';
import { Err, Ok, Result } from './result';

async function version(cmd: string, args?: string[]): Promise<string> {
    args = args === undefined ? ['-V'] : [...args, '-V'];
    return (await exec.getExecOutput(cmd, args, { silent: true })).stdout;
}

function prefix(prefix: string, options: string[]): string[] {
    return options.flatMap(opt => [
        prefix,
        opt === 'warnings' ? opt : opt.startsWith('clippy::') ? opt : 'clippy::' + opt,
    ]);
}

export async function run(actionInput: input.Input): Promise<Result<void, string>> {
    const startedAt = new Date().toISOString();

    let rustcVersion = await version('rustc');
    let cargoVersion = await version('cargo');
    let clippyVersion = await version('cargo', ['clippy']);

    const warn = prefix('--warn', actionInput.warn);
    const allow = prefix('--allow', actionInput.allow);
    const deny = prefix('--deny', actionInput.deny);
    const forbid = prefix('--forbid', actionInput.forbid);

    let runner = new CheckRunner();
    let stdErr = '';
    let clippyExitCode = 0;
    try {
        core.startGroup('Executing cargo fmt (JSON output)');
        const execOutput = await exec.getExecOutput(
            'cargo',
            [
                'clippy',
                '--message-format=json',
                ...actionInput.options.filter(opt => !opt.startsWith('--message-format')),
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
        if (
            stdErr
                .split('\n')
                .map(line => line.startsWith('error: internal compiler error'))
                .reduce((acc, ice) => acc || ice, false)
        ) {
            core.setOutput('Suppress ICEs', stdErr);
            return new Ok(undefined);
        }
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

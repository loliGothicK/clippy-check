import stringArgv from 'string-argv';
import * as core from '@actions/core';

// Parsed action input
export interface Input {
    token: string;
    options: string[];
    warn: string[];
    allow: string[];
    deny: string[];
    forbid: string[];
    name: string;
}

export function get(): Input {
    const token = core.getInput('token', { required: true });
    const options = stringArgv(core.getInput('options', { required: false }));
    const warn = core.getMultilineInput('warn', { required: false });
    const allow = core.getMultilineInput('allow', { required: false });
    const deny = core.getMultilineInput('deny', { required: false });
    const forbid = core.getMultilineInput('forbid', { required: false });
    const name = core.getInput('name', { required: false });

    core.setOutput('warn', `${warn}`);
    core.setOutput('allow', `${allow}`);
    core.setOutput('deny', `${deny}`);
    core.setOutput('forbid', `${forbid}`);

    return {
        token,
        options,
        warn,
        allow,
        deny,
        forbid,
        name,
    };
}

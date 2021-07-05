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
    const warn = stringArgv(core.getInput('warn', { required: false }));
    const allow = stringArgv(core.getInput('allow', { required: false }));
    const deny = stringArgv(core.getInput('deny', { required: false }));
    const forbid = stringArgv(core.getInput('forbid', { required: false }));
    const name = core.getInput('name', { required: false });

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

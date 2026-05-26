# Security Policy

`prompt-provenance-stamp` is a pure-transform library and CLI: it reads a prompt file (or stdin) and emits a JSON document. No network listener, no remote fetch, no execution of user-supplied code.

Note: the sha256 of the prompt content is the integrity signal; if you change the file after stamping, the stamped document's hash will no longer match.

## Supported versions

Only the latest tagged release is supported.

## Reporting a vulnerability

Please use GitHub Security Advisories for private disclosure:

- [Open a security advisory](https://github.com/mizcausevic-dev/prompt-provenance-stamp/security/advisories/new)

Do not file public issues for security reports.

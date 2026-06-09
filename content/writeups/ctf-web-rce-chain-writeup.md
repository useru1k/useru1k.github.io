# CTF Web Challenge: Template Injection to RCE

This writeup documents a web exploitation chain that started with weak input filtering and ended with command execution on the challenge host.

## Recon

The app exposed a feedback form rendered through a template engine. Basic reflected payloads suggested server-side rendering behavior.

## Initial Foothold

A payload using template expression syntax confirmed server-side template injection:

```text
{{7*7}}
```

The output returned `49`, confirming evaluation.

## Escalation to Command Execution

After probing available objects and built-ins, the payload was adapted to invoke process execution via server-side runtime primitives.

## Post-Exploitation

- Enumerated local files for flag paths.
- Collected environment metadata.
- Retrieved final flag from protected location.

## Lessons

- Template engines should never evaluate untrusted input.
- Sandboxing alone is not a complete control.
- Input validation must be paired with strict server-side encoding and logic separation.

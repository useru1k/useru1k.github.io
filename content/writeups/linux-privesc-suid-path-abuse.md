# Linux PrivEsc: SUID Path Abuse Walkthrough

SUID binaries can become privilege escalation vectors when they trust user-controllable environment state.

## Enumeration

Start with:

```bash
find / -perm -4000 -type f 2>/dev/null
```

Look for custom binaries or wrappers that execute system tools without absolute paths.

## Exploit Concept

If a privileged binary runs `service` or `tar` without full path, an attacker can place a malicious binary earlier in `PATH`.

## Mitigation

- Use absolute paths in privileged code.
- Drop privileges before external command execution.
- Restrict SUID usage to audited binaries only.

Privilege escalation often starts as a tiny trust assumption. Remove those assumptions first.

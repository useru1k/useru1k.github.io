# AD CS Enrollment Abuse: Attack Surface Primer

Active Directory Certificate Services (AD CS) is often deployed for convenience first and security later. That gap creates attack paths where low-privileged users can request certificates that act like domain authentication material.

## Why It Matters

When certificate templates allow broad enrollment and dangerous subject settings, an attacker can request a certificate for a privileged identity and authenticate as that user.

## Typical Misconfiguration Pattern

1. Enrollment rights granted to broad groups.
2. Template allows arbitrary subject alternative names.
3. Client authentication EKU present.
4. Manager approval disabled.

## Defensive Checks

- Audit all templates with enrollment rights that include Authenticated Users.
- Restrict subject name supply where not strictly needed.
- Remove client authentication EKU from templates not used for authentication.
- Monitor certificate requests for privileged UPN values.

## Quick Detection Idea

Track certificate issuance events and flag issuance where requester and certificate subject do not align with expected account ownership.

```powershell
Get-WinEvent -LogName "Security" |
  Where-Object { $_.Id -in 4886, 4887 } |
  Select-Object TimeCreated, Id, Message
```

## Closing Thought

AD CS abuse is not exotic. It is usually configuration debt. Treat template governance as an identity security control, not PKI housekeeping.

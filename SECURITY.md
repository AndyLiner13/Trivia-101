# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The Horizon Worlds Trivia Game team takes security seriously. We appreciate your efforts to responsibly disclose your findings.

### How to Report

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please send an email to: [Your security email or create a security contact]

Include the following information:
- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit the issue

### What to Expect

- We will acknowledge receipt of your report within 3 business days
- We will provide a detailed response within 7 days indicating next steps
- We will keep you informed of the progress throughout the process
- We may ask for additional information or guidance

### Security Considerations for Horizon Worlds

This project runs within Meta's Horizon Worlds environment, which provides several built-in security features:

#### Platform Security
- **Sandboxed Execution**: Scripts run in Horizon Worlds' controlled environment
- **Network Isolation**: Network communication is managed by the platform
- **Asset Validation**: All assets are validated by the platform before use
- **Player Authentication**: Player identity is managed by Meta's systems

#### Application-Specific Security

**Network Events**
- All network events are validated for proper structure
- Player IDs are verified through Horizon Worlds' player system
- Host authority prevents unauthorized game control
- Input sanitization for all player-submitted data

**Asset Security**
- Asset IDs are validated before use
- No external asset loading outside Horizon Worlds' system
- Image and audio assets are processed by the platform

**Player Data**
- No sensitive player information is stored locally
- Score data is handled through Horizon Worlds' persistence system
- Player headshots and names come from platform APIs

#### Potential Risks and Mitigations

**Client-Side Validation**
- Risk: Malicious clients could send invalid data
- Mitigation: Host validates all incoming player actions and data

**Host Authority Abuse**
- Risk: Malicious host could manipulate game state
- Mitigation: Game state is visible to all players; obvious manipulation is easily detected

**Asset ID Spoofing**
- Risk: Invalid asset IDs could cause crashes or unexpected behavior
- Mitigation: Asset loading is wrapped in try-catch blocks with fallback handling

**Network Event Flooding**
- Risk: Rapid network events could cause performance issues
- Mitigation: Event handling includes throttling and validation

### Best Practices for Contributors

When contributing to this project:

1. **Input Validation**: Always validate input data, especially from network events
2. **Error Handling**: Use proper error handling for all external API calls
3. **Asset References**: Verify asset IDs exist before using them
4. **Player Verification**: Use Horizon Worlds' player verification methods
5. **State Validation**: Validate game state before acting on it
6. **Timeout Handling**: Implement proper timeouts for async operations

### Scope

This security policy covers:
- The trivia game application code
- Network event handling
- Asset management systems
- Player data handling
- UI component security

This policy does not cover:
- Meta Horizon Worlds platform security (handled by Meta)
- Third-party libraries or dependencies
- User's Horizon Worlds account security
- Hardware or device security

### Safe Harbor

We support safe harbor for security researchers who:
- Make a good faith effort to avoid privacy violations and disruptions
- Only interact with accounts they own or with explicit permission
- Do not access or modify other users' data
- Do not perform actions that could negatively impact Horizon Worlds services
- Do not publicly disclose issues until they have been resolved

Thank you for helping keep the Horizon Worlds Trivia Game and our users safe!

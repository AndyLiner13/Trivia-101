# Contributing to Horizon Worlds Trivia Game

We love your input! We want to make contributing to this project as easy and transparent as possible, whether it's:

- Reporting a bug
- Discussing the current state of the code
- Submitting a fix
- Proposing new features
- Becoming a maintainer

## Development Process

We use GitHub to host code, to track issues and feature requests, as well as accept pull requests.

## Pull Requests

Pull requests are the best way to propose changes to the codebase. We actively welcome your pull requests:

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure your code follows the existing style guidelines.
5. Make sure your code lints without errors.
6. Issue that pull request!

## Code Style Guidelines

### TypeScript Guidelines
- Use TypeScript strict mode
- Follow existing naming conventions
- Add type annotations where helpful for clarity
- Use meaningful variable and function names

### Horizon Worlds Specific Guidelines
- Each `.ts` file in the root directory represents a separate script
- Follow the component architecture pattern established in the codebase
- Use the provided Horizon Worlds API types from the `types/` folder
- Adhere to CustomUI best practices outlined in the documentation

### Code Organization
- Keep related functionality grouped together
- Use clear, descriptive comments for complex logic
- Separate UI components from business logic where possible
- Follow the existing project structure

## Bug Reports

We use GitHub issues to track public bugs. Report a bug by [opening a new issue](https://github.com/AndyLiner13/MePhone/issues/new).

**Great Bug Reports** tend to have:

- A quick summary and/or background
- Steps to reproduce
  - Be specific!
  - Give sample code if you can
- What you expected would happen
- What actually happens
- Notes (possibly including why you think this might be happening, or stuff you tried that didn't work)

## Feature Requests

We welcome feature requests! Please:

1. Check if the feature has already been requested
2. Provide a clear description of the feature
3. Explain why this feature would be useful
4. Consider providing implementation suggestions

## Development Setup

### Prerequisites
- Meta Horizon Worlds Creator Access
- TypeScript 4.7.4+
- Basic understanding of Horizon Worlds scripting

### Local Development
1. Clone the repository
2. Install dependencies with `npm install`
3. Make your changes
4. Test thoroughly in Horizon Worlds environment

### Testing Guidelines
- Test with multiple players when possible
- Verify network synchronization works correctly
- Check UI responsiveness across different devices
- Test edge cases (player leaving/joining mid-game, etc.)

## Debugging

Use the provided debug UIs:
- `DebugUIs/TriviaGameDebugUI.ts` - For game state debugging
- `DebugUIs/TriviaPhoneDebugUI.ts` - For phone interface debugging

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Feel free to contact the maintainers if you have questions about contributing.

## Recognition

Contributors will be recognized in the project documentation and releases. Thank you for helping make this project better!

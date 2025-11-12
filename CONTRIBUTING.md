# Contributing Guide

Thanks for considering contributing! Here's how to do it.

## Quick Start

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/RanaRomdhane/book-recommendation-api.git
   cd book-recommendation-api
   ```
3. **Create a branch** for your work
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Making Changes

### 1. Write Your Code

Make your changes in the appropriate files. Keep changes focused - one feature or fix per PR.

### 2. Test Your Changes

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage

# Run locally
npm start
```

### 3. Commit Your Changes

Use clear commit messages:
```bash
git add .
git commit -m "Add feature: book filtering by author"
```

**Good commit messages:**
- ✅ "Fix health check endpoint returning 500"
- ✅ "Add pagination to books endpoint"
- ✅ "Update README with Docker instructions"

**Avoid:**
- ❌ "Fixed stuff"
- ❌ "Update"
- ❌ "asdfasdf"

## Creating a Pull Request

### 1. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 2. Open a Pull Request

1. Go to the repository on GitHub
2. Click "Pull requests" → "New pull request"
3. Select your branch
4. Fill in the PR template (it appears automatically)
5. Click "Create pull request"

### 3. PR Description Guidelines

Your PR should explain:
- **What** changed
- **Why** you made the change
- **How** you tested it

Example:
```markdown
## What does this PR do?
Adds pagination to the /books endpoint so users can request 
books in chunks instead of all at once.

## Why are we doing this?
When we have 1000+ books, returning all of them is slow.
Closes #42

## How did you test this?
- Added unit tests for pagination logic
- Tested manually with curl:
  - /books?page=1&limit=10
  - /books?page=2&limit=10
- All existing tests pass
```

## Code Review Process

### What Happens Next?

1. **Automated checks run**: Tests, security scans, linting
2. **A maintainer reviews your code**: Usually within 2-3 days
3. **You may get feedback**: Address comments and push updates
4. **PR gets merged**: Once approved and checks pass

### Addressing Review Feedback

```bash
# Make the requested changes
# Then commit and push

git add .
git commit -m "Address review feedback: improve error handling"
git push origin feature/your-feature-name
```

The PR updates automatically when you push to your branch.

## Code Standards

### Style Guidelines

- Use 2 spaces for indentation
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

### Testing Requirements

- Add tests for new features
- Maintain existing test coverage
- Tests should be clear and descriptive

Example test:
```javascript
it('should filter books by genre', async () => {
  const res = await request(app)
    .post('/recommendations')
    .send({ preferredGenres: ['sci-fi'] });
  
  expect(res.statusCode).toEqual(200);
  expect(res.body.data.every(book => book.genre === 'sci-fi')).toBe(true);
});
```

## Common Scenarios

### Adding a New Endpoint

1. Update `src/app.js` with the new route
2. Add tests in `tests/app.test.js`
3. Update `README.md` with usage examples
4. Run tests: `npm test`

### Fixing a Bug

1. Write a test that reproduces the bug
2. Fix the bug
3. Verify the test now passes
4. Add explanation in PR description

### Updating Documentation

1. Make changes to relevant `.md` files
2. Check for broken links
3. Ensure examples still work

## Getting Help

- **Questions?** Open an issue with the "question" label
- **Found a bug?** Open an issue with the "bug" label
- **Want to discuss a feature?** Open an issue with the "enhancement" label

## Peer Review Checklist

When reviewing someone else's PR, check:

- [ ] Does the code work as described?
- [ ] Are there tests for the changes?
- [ ] Is the code readable and well-commented?
- [ ] Does it follow the project style?
- [ ] Is the documentation updated?
- [ ] Do all CI checks pass?

Leave constructive feedback:
- ✅ "Consider extracting this into a separate function for readability"
- ✅ "Good solution! Have you thought about the case where...?"
- ❌ "This is wrong" (explain why!)

## Recognition

Contributors will be added to the README.md contributors section. Thanks for helping improve this project! 🎉
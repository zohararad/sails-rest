MOCHA_OPTS= --check-leaks --timeout 30000
REPORTER = dot

test: test-integration

test-integration:
	@NODE_ENV=test node test/integration/runner.js

setup_emacs_dev :
	@npm init -y
	@npm install --save-dev typescript-deno-plugin typescript

DENO_TEST=deno test --allow-run

test : test_quiet

# runs tests and filters out any lines that just report a test that passed
test_quiet :
	@NO_COLOR=1 set -o pipefail; $(DENO_TEST) | grep -v "^test .*\.\.\. ok ([0-9]\+ms)$$"

test_verbose :
	@NO_COLOR=1 $(DENO_TEST)

COVERAGE_FILE=cov_profile
COVERAGE_OUT=coverage_report

coverage :
	@rm -rf $(COVERAGE_OUT)\
	&& NO_COLOR=1 $(DENO_TEST) --coverage=$(COVERAGE_FILE) --unstable\
	&& deno coverage --unstable --lcov $(COVERAGE_FILE) > $(COVERAGE_FILE).lcov\
	&& mkdir -p $(COVERAGE_OUT)\
	&& genhtml $(COVERAGE_FILE).lcov --output-directory $(COVERAGE_OUT);\
	rm -rf $(COVERAGE_FILE){,.lcov};\
	echo -e "\n\nCoverage data stored in $(COVERAGE_OUT)"

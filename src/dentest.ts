import { AssertionError } from './assertions.ts';

type Rose<N, T> = N | [T, Rose<N, T>[]];

type TestResultTree = Rose<TestResult, GroupResultInfo>;

type TestInfo = {
    name: string;
}

type InnerTest = (topDesc: string) => void;

type TestResult = {
    testInfo: TestInfo
} & ({
    result: 'pass'
} | {
    result: 'fail'
    reason: AssertionError
} | {
    result: 'skip'
});

type GroupResultInfo = {
    name: string;
};

export interface Testable {
    /** Run the test as a subtest of another test. */
    runAsInner: InnerTest;

    /** Run the test as a top-level test. */
    runAsMain: () => void;

    /** Run a test in-place for a test result. */
    runTest(): Rose<TestResult, GroupResultInfo>;
}

function testFailed(info: TestInfo, reason: AssertionError): TestResult {
    return {
        result: 'fail',
        testInfo: info,
        reason: reason,
    };
}

function testOk(info: TestInfo): TestResult {
    return {
        result: 'pass',
        testInfo: info
    };
}

function skipTest(info: TestInfo): TestResult {
    return {
        result: 'skip',
        testInfo: info
    };
}

function groupResult(groupInfo: GroupResultInfo, results: TestResultTree[]): [GroupResultInfo, TestResultTree[]] {
    return [groupInfo, results];
}

type TestOptions = {
    name: string;
    skip: boolean | (() => boolean);
}

export class Test implements Testable {
    description: string;
    runner: () => void;
    skip: boolean | (() => boolean);

    constructor(opts: string | TestOptions, runner: () => void) {
        if (typeof opts === 'string') {
            this.description = opts;
            this.skip = false;
        } else {
            this.description = opts.name;
            this.skip = opts.skip;
        }
        this.runner = runner;
    }

    runAsInner(topDesc: string) {
        Deno.test({ name: `${topDesc}, ${this.description}`, ignore: this.shouldSkip(), fn: this.runner });
    }

    runAsMain() {
        Deno.test({ name: `${this.description}`, ignore: this.shouldSkip(), fn: this.runner });
    }

    private shouldSkip(): boolean {
        return typeof this.skip === 'boolean' ? this.skip : this.skip();
    }

    runTest() {
        const testInfo = {
            name: this.description
        };
        if (this.shouldSkip()) {
            return skipTest(testInfo);
        }
        try {
            this.runner();
            return testOk(testInfo);
        } catch (e) {
            if (e instanceof AssertionError) {
                return testFailed(testInfo, e);
            } else {
                throw e;
            }
        }
    }
}

interface TestGroupOptions {
    /* Function run after before each in the group. */
    beforeEach?: () => void;

    /* Function run after each test in the group. */
    afterEach?: () => void;

    /* Name of the group. */
    name: string;
}

export class TestGroup implements Testable {
    private options: TestGroupOptions;
    private tests: Testable[];

    constructor(options: TestGroupOptions, ...tests: Testable[]) {
        this.options = options;
        this.tests = tests;
    }

    runAsInner(topDesc: string) {
        this.tests.map(t => t.runAsInner(`${topDesc}, ${this.options.name}`));
    }

    runAsMain() {
        this.tests.map(t => t.runAsInner(`${this.options.name}`));
    }

    runTest(): [GroupResultInfo, TestResultTree[]] {
        const testInfo: GroupResultInfo = {
            name: this.options.name
        };
        return groupResult(testInfo, this.tests.map(t => {
            if (this.options.beforeEach) {
                this.options.beforeEach();
            }
            const res = t.runTest();
            if (this.options.afterEach) {
                this.options.afterEach();
            }
            return res;
        }));
    }
}

export function testGroup(options: TestGroupOptions, ...tests: Testable[]): TestGroup
export function testGroup(topDesc: string, ...tests: Testable[]): TestGroup
export function testGroup(arg1: TestGroupOptions | string, ...tests: Testable[]) {
    if (typeof arg1 === 'string') {
        return new TestGroup({ name: arg1 }, ...tests);
    }
    return new TestGroup(arg1, ...tests);
}

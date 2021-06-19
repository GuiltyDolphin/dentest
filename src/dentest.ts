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

function groupResult(groupInfo: GroupResultInfo, results: TestResultTree[]): [GroupResultInfo, TestResultTree[]] {
    return [groupInfo, results];
}

export class Test implements Testable {
    description: string;
    runner: () => void;

    constructor(description: string, runner: () => void) {
        this.description = description;
        this.runner = runner;
    }

    runAsInner(topDesc: string) {
        Deno.test(`${topDesc}, ${this.description}`, this.runner);
    }

    runAsMain() {
        Deno.test(`${this.description}`, this.runner);
    }

    runTest() {
        const testInfo = {
            name: this.description
        };
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

export class TestGroup implements Testable {
    private namePart: string;

    private tests: Testable[];

    constructor(namePart: string, ...tests: Testable[]) {
        this.namePart = namePart;
        this.tests = tests;
    }

    runAsInner(topDesc: string) {
        this.tests.map(t => t.runAsInner(`${topDesc}, ${this.namePart}`));
    }

    runAsMain() {
        this.tests.map(t => t.runAsInner(`${this.namePart}`));
    }

    runTest(): [GroupResultInfo, TestResultTree[]] {
        const testInfo: GroupResultInfo = {
            name: this.namePart
        };
        return groupResult(testInfo, this.tests.map(t => t.runTest()));
    }
}

export function testGroup(topDesc: string, ...tests: Testable[]): TestGroup {
    return new TestGroup(topDesc, ...tests);
}

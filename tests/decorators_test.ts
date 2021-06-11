import {
    assertEquals,
    assertThrows,
    Test,
    testGroup,
} from '../mod.ts';

import {
    AssertionError
} from '../src/assertions.ts';

import {
    after,
    before,
    skip,
    subtest,
    runTests,
    test,
} from '../src/decorators.ts';

const testsRun: string[] = [];

class OrderTesting {
    @before setup() { testsRun.push('setup') }

    @before setup2() { testsRun.push('setup2') }

    @after tearDown1() { testsRun.push('tearDown1') }

    @after tearDown2() { testsRun.push('tearDown2') }

    @test test1() { testsRun.push('test1') }

    nonTest() { testsRun.push('nonTest') }

    @test test2() { testsRun.push('test2') }

    @skip @test test3() { testsRun.push('test3') }

    @subtest
    innerTests() {
        testsRun.push('innerTests');
        class Inner {
            @before setupInner() { testsRun.push('setupInner') }

            @after tearDownInner() { testsRun.push('tearDownInner') }
            @test innerTest1() { testsRun.push('innerTest1') }

            @test innerTest2() { testsRun.push('innerTest2') }

            @skip @test innerTest3() { testsRun.push('innerTest3') }
        }
        return Inner;
    }

    @skip
    @subtest
    innerTests2() {
        testsRun.push('innerTests2');
        class Inner {
            @before setupInner() { testsRun.push('2setupInner') }
            @after tearDownInner() { testsRun.push('2tearDownInner') }
            @test innerTest1() { testsRun.push('2innerTest1') }
        }
        return Inner;
    }
}


new Test('correct order of tests', () => {
    runTests(OrderTesting);

    assertEquals(testsRun, [
        'setup', 'setup2', 'test1', 'tearDown1', 'tearDown2',
        'setup', 'setup2', 'test2', 'tearDown1', 'tearDown2',
        'setup', 'setup2', 'innerTests',
        'setupInner', 'innerTest1', 'tearDownInner',
        'setupInner', 'innerTest2', 'tearDownInner',
        'tearDown1', 'tearDown2',
    ]);
}).runAsMain();

const testFirstFailureRun: string[] = [];

class TestFirstFailure {
    @test
    fail1() {
        testFirstFailureRun.push('fail1');
        assertEquals(true, false);
    }

    @test
    fail2() {
        testFirstFailureRun.push('fail2');
        assertEquals(0, 1);
    }
}

testGroup('test on failure',
    new Test('failure throws error', () => {
        assertThrows(() => runTests(TestFirstFailure), AssertionError);
    }),
    new Test('tests stop after first failure', () => {
        assertEquals(testFirstFailureRun, ['fail1']);
    }),
).runAsMain();

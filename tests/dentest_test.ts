import { da } from './deps.ts';

import * as dt from '../mod.ts';
import { AssertionError } from '../src/assertions.ts';

import {
    testGroup,
    Test,
} from '../src/dentest.ts';

Deno.test('correct success, non group',
    () => {
        const res = new Test('1 == 1', () => dt.assertEquals(1, 1)).runTest();
        da.assertEquals(res, { result: 'pass', testInfo: { name: '1 == 1' } })
    }
);

Deno.test('correct success, group (simple)',
    () => {
        const res = testGroup('basic group',
            new Test('1 == 1', () => dt.assertEquals(1, 1)),
        ).runTest();
        da.assertEquals(res, [{ name: 'basic group' }, [{ result: 'pass', testInfo: { name: '1 == 1' } }]])
    }
);

Deno.test('correct success, group (complex)',
    () => {
        const res = testGroup('basic group',
            new Test('1 == 1', () => dt.assertEquals(1, 1)),
            testGroup('inner group',
                new Test('2 == 2', () => dt.assertEquals(2, 2)),
            ),
        ).runTest();
        da.assertEquals(res, [{ name: 'basic group' }, [{ result: 'pass', testInfo: { name: '1 == 1' } }, [{ name: 'inner group' }, [{ result: 'pass', testInfo: { name: '2 == 2' } }]]]])
    }
);

Deno.test('correct failure, non group',
    () => {
        const res = new Test('1 != 2', () => dt.assertEquals(1, 2)).runTest();
        da.assertEquals(res, { result: 'fail', testInfo: { name: '1 != 2' }, reason: new AssertionError('') })
    }
);

Deno.test('correct failure, group',
    () => {
        const res = testGroup('basic group',
            new Test('1 != 2', () => dt.assertEquals(1, 2)),
        ).runTest();
        da.assertEquals(res, [{ name: 'basic group' }, [{ result: 'fail', testInfo: { name: '1 != 2' }, reason: new AssertionError('') }]])
    }
);

Deno.test('correct failure, group (complex, partial failure)',
    () => {
        const res = testGroup('basic group',
            new Test('1 == 3', () => dt.assertEquals(1, 3)),
            testGroup('inner group',
                new Test('1 == 2', () => dt.assertEquals(1, 2)),
                new Test('2 == 2', () => dt.assertEquals(2, 2)),
            ),
        ).runTest();
        da.assertEquals(res, [{ name: 'basic group' },
        [{ result: 'fail', testInfo: { name: '1 == 3' }, reason: new AssertionError('') },
        [{ name: 'inner group' },
        [{ result: 'fail', testInfo: { name: '1 == 2' }, reason: new AssertionError('') },
        { result: 'pass', testInfo: { name: '2 == 2' } }]]]])
    }
);

for (const [tn, skip, resType] of
    [['boolean = false', false, 'pass'],
    ['boolean = true', true, 'skip'],
    ['booleanFn -> false', () => false, 'pass'],
    ['booleanFn -> true', () => true, 'skip']] as [string, boolean | (() => boolean), 'pass' | 'skip'][]) {
    Deno.test(`Test, skip, ${tn}`,
        () => {
            const res = new Test({
                name: 'test',
                skip: skip
            }, () => dt.assertEquals(1, 1)).runTest();
            da.assertEquals(res, { result: resType, testInfo: { name: 'test' } });
        }
    );

}

Deno.test('testGroup, afterEach',
    () => {
        let counter = 0;
        const res = testGroup({
            name: 'test group',
            afterEach: () => {
                counter++;
            }
        }, new Test('test1', () => {
            dt.assertEquals(counter, 0);
        }), new Test('test2', () => {
            dt.assertEquals(1, 2);
        }), new Test('test3', () => {
            dt.assertEquals(counter, 2);
        }),
        ).runTest();
        da.assertEquals(res, [{ name: 'test group' },
        [{ result: 'pass', testInfo: { name: 'test1' } },
        { result: 'fail', testInfo: { name: 'test2' }, reason: new AssertionError('') },
        { result: 'pass', testInfo: { name: 'test3' } }]]);
    }
);

Deno.test('testGroup, beforeEach',
    () => {
        let counter = 0;
        const res = testGroup({
            name: 'test group',
            beforeEach: () => {
                counter++;
            }
        }, new Test('test1', () => {
            dt.assertEquals(counter, 1);
        }), new Test('test2', () => {
            dt.assertEquals(1, 2);
        }), new Test('test3', () => {
            dt.assertEquals(counter, 3);
        }),
        ).runTest();
        da.assertEquals(res, [{ name: 'test group' },
        [{ result: 'pass', testInfo: { name: 'test1' } },
        { result: 'fail', testInfo: { name: 'test2' }, reason: new AssertionError('') },
        { result: 'pass', testInfo: { name: 'test3' } }]]);
    }
);

type CaseInfo = {
    passed: number;
    filtered?: number;
    failed?: number;
    ignored?: number;
};

async function testCaseHelper(caseName: string, resInfo: CaseInfo, opts?: { extraArgs: string }) {
    const testProc = await Deno.run({
        cmd: ['deno', 'test', `tests/cases/${caseName}.ts`].concat(opts?.extraArgs ?? []),
        stderr: 'null',
        stdout: 'piped',
    });
    const numPassed = resInfo.passed;
    const numFailed = resInfo.failed ?? 0;
    const numFiltered = 'filtered' in resInfo ? resInfo.filtered : 0;
    const numIgnored = resInfo.ignored ?? 0;
    const totalTests = numPassed + numFailed + numIgnored;
    try {
        const output = new TextDecoder().decode(await testProc.output());
        da.assertMatch(output, new RegExp(`^running ${totalTests} test${totalTests === 1 ? '' : 's'} from file:.*tests\\/cases\\/${caseName}\\.ts`));
        da.assertMatch(output, new RegExp(`test result: ${numFailed === 0 ? 'ok' : 'FAILED'}\\. ${numPassed} passed; ${numFailed} failed; ${numIgnored} ignored; 0 measured; ${numFiltered} filtered out \\([0-9]+ms\\)$`, 'm'));
    } catch (e) {
        throw e;
    } finally {
        testProc.close();
    }
}

Deno.test('correct recorded number of tests, Test.runAsMain runs with `deno test`', async () => {
    await testCaseHelper('001-Test-runAsMain', { passed: 1 });
});

Deno.test('correct recorded number of tests, TestGroup.runAsMain runs with `deno test`', async () => {
    await testCaseHelper('002-TestGroup-runAsMain', { passed: 3 });
});

Deno.test('correct recorded number of tests, mixed failing and succeeding tests', async () => {
    await testCaseHelper('003-mixed', { passed: 4, failed: 4 });
});

Deno.test('correct recorded number of tests, mixed failing and succeeding tests, filtered', async () => {
    await testCaseHelper('003-mixed', { passed: 2, failed: 2, filtered: 4 }, { extraArgs: '--filter=group' });
});

Deno.test('correct recorded number of tests, tests with skip', async () => {
    await testCaseHelper('004-Test-skip', { passed: 3, ignored: 3 });
});

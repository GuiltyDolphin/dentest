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

import {
    shrinkBool,
    shrinkInt,
    shrinkList,
} from '../../src/generate/shrink.ts';

import {
    assertEquals,
    Test,
    testGroup,
} from '../deps.ts';

function testShrinker<T>(shrinker: (x: T) => T[], x: T, expected: T[]): Test {
    return new Test(JSON.stringify(x), () => assertEquals(shrinker(x), expected));
}

function testShrinkBool(n: boolean, expected: boolean[]): Test {
    return testShrinker(shrinkBool, n, expected);
}

testGroup('shrinkBool',
    testShrinkBool(true, [false]),
    testShrinkBool(false, []),
).runAsMain();

function testShrinkInt(n: number, expected: number[]): Test {
    return testShrinker(shrinkInt, n, expected);
}

testGroup('shrinkInt',
    testShrinkInt(0, []),
    testShrinkInt(1, [0]),
    testShrinkInt(-1, [1, 0]),
    testShrinkInt(2, [0, 1]),
    testShrinkInt(-2, [2, 0, -1]),
    testShrinkInt(1999, [0, 1000, 1500, 1750, 1875, 1937, 1968, 1984, 1992, 1996, 1998]),
    testShrinkInt(-1999, [1999, 0, -1000, -1500, -1750, -1875, -1937, -1968, -1984, -1992, -1996, -1998]),
    testShrinkInt(2000, [0, 1000, 1500, 1750, 1875, 1938, 1969, 1985, 1993, 1997, 1999]),
    testShrinkInt(-2000, [2000, 0, -1000, -1500, -1750, -1875, -1938, -1969, -1985, -1993, -1997, -1999]),
).runAsMain();

function testShrinkList<T>(xs: T[], expected: T[][]): Test {
    return testShrinker((x) => shrinkList(_ => [], x), xs, expected);
}

function testShrinkList2<T>(xs: T[], expected: T[][]): Test {
    return testShrinker((x) => shrinkList(x => [x], x), xs, expected);
}

function testShrinkListInt(xs: number[], expected: number[][]): Test {
    return testShrinker((x) => shrinkList(shrinkInt, x), xs, expected);
}

testGroup('shrinkList',
    testGroup('x => []',
        testShrinkList([], []),
        testShrinkList([1], [[]]),
        testShrinkList([1, 2, 3], [[], [2, 3], [1, 3], [1, 2]]),
        testShrinkList([1, 2, 3, 4, 5], [[], [3, 4, 5], [1, 2, 5], [2, 3, 4, 5], [1, 3, 4, 5], [1, 2, 4, 5], [1, 2, 3, 5], [1, 2, 3, 4]]),
    ),
    testGroup('x => [x]',
        testShrinkList2([], []),
        testShrinkList2([1], [[], [1]]),
        testShrinkList2([1, 2], [[], [2], [1], [1, 2]]),
    ),
    testGroup('x => shrinkInt(x)',
        testShrinkListInt([], []),
        testShrinkListInt([1], [[], [0]]),
        testShrinkListInt([1, 2], [[], [2], [1], [0, 2], [1, 0], [1, 1]]),
    ),
).runAsMain();

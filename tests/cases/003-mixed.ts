import {
    assertEquals,
    testGroup,
    Test,
} from '../../mod.ts';

new Test('test1', () => assertEquals(1, 1)).runAsMain();

new Test('test2', () => assertEquals(1, 2)).runAsMain();

testGroup('group1',
    new Test('test 1.1', () => assertEquals(1, 1)),
    new Test('test 1.2', () => assertEquals(1, 3)),
).runAsMain();

testGroup('group2',
    new Test('test 2.1', () => assertEquals(2, 3)),
    new Test('test 2.2', () => assertEquals(2, 2)),
).runAsMain();

new Test('test3', () => assertEquals(1, 4)).runAsMain();

new Test('test4', () => assertEquals(1, 1)).runAsMain();

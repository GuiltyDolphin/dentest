import {
    assertEquals,
    testGroup,
    Test,
} from '../../mod.ts';

testGroup('runAsMain test',
    new Test('test1', () => {
        assertEquals(1, 1);
    }),
    new Test('test2', () => {
        assertEquals(2, 2);
    }),
    testGroup('inner group',
        new Test('test3', () => {
            assertEquals(3, 3);
        }),
    ),
).runAsMain();

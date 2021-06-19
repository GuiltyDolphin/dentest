import {
    assertEquals,
    Test,
    testGroup,
} from '../../mod.ts';

new Test({
    name: 'test1',
    skip: false
}, () => {
    assertEquals(1, 1);
}).runAsMain();

new Test({
    name: 'test2',
    skip: true
}, () => {
    assertEquals(1, 2);
}).runAsMain();

new Test({
    name: 'test3',
    skip: () => {
        return false;
    },
}, () => {
    assertEquals(2, 2);
}).runAsMain();

new Test({
    name: 'test4',
    skip: () => {
        return true;
    },
}, () => {
    assertEquals(2, 3);
}).runAsMain();

testGroup('group',
    new Test({
        name: 'test5',
        skip: false
    }, () => assertEquals(5, 5)),
    new Test({
        name: 'test6',
        skip: true
    }, () => assertEquals(6, 6)),
).runAsMain();

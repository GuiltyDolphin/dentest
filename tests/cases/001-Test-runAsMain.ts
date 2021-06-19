import {
    assertEquals,
    Test,
} from '../../mod.ts';

new Test('runAsMain test', () => {
    assertEquals(1, 1);
}).runAsMain();

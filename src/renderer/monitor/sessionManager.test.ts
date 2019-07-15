import { addSession, removeSession, getAllSession } from './sessionManager';
import { sessionDBPath } from '../../config';
import { existsSync, unlinkSync } from 'fs';

describe('sessionManager', () => {
    beforeAll(() => {
        if (existsSync(sessionDBPath)) {
            unlinkSync(sessionDBPath);
        }
    });

    it('addSession', async () => {});
});

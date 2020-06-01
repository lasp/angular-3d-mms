import { TestBed } from '@angular/core/testing';

import { LatisService } from './latis.service';

describe('LatisService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: LatisService = TestBed.get(LatisService);
        expect(service).toBeTruthy();
    });
});

import { TestBed } from '@angular/core/testing';

import { OrbitDataService } from './orbit-data.service';

describe('OrbitDataService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: OrbitDataService = TestBed.get(OrbitDataService);
        expect(service).toBeTruthy();
    });
});

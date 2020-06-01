import { TestBed } from '@angular/core/testing';

import { DatasetInitializerService } from './dataset-initializer.service';

describe('DatasetInitializerService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: DatasetInitializerService = TestBed.get(DatasetInitializerService);
        expect(service).toBeTruthy();
    });
});

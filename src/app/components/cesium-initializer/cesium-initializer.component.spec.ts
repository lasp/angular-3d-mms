import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CesiumInitializerComponent } from './cesium-initializer.component';

describe('CesiumInitializerComponent', () => {
    let component: CesiumInitializerComponent;
    let fixture: ComponentFixture<CesiumInitializerComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ CesiumInitializerComponent ]
        })
    .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(CesiumInitializerComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

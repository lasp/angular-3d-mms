import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ScichartsComponent } from './scicharts.component';

describe('ScichartsComponent', () => {
    let component: ScichartsComponent;
    let fixture: ComponentFixture<ScichartsComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ ScichartsComponent ]
        })
    .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(ScichartsComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

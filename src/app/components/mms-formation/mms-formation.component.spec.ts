import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MmsFormationComponent } from './mms-formation.component';

describe('MmsFormationComponent', () => {
    let component: MmsFormationComponent;
    let fixture: ComponentFixture<MmsFormationComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ MmsFormationComponent ]
        })
    .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(MmsFormationComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

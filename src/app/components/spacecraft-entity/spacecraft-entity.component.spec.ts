import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpacecraftEntityComponent } from './spacecraft-entity.component';

describe('SpacecraftEntityComponent', () => {
    let component: SpacecraftEntityComponent;
    let fixture: ComponentFixture<SpacecraftEntityComponent>;

    beforeEach(async(() => {
        TestBed.configureTestingModule({
            declarations: [ SpacecraftEntityComponent ]
        })
    .compileComponents();
    }));

    beforeEach(() => {
        fixture = TestBed.createComponent(SpacecraftEntityComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});

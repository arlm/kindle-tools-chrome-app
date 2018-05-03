import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClippingsComponent } from './clippings.component';

describe('ClippingsComponent', () => {
  let component: ClippingsComponent;
  let fixture: ComponentFixture<ClippingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClippingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClippingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

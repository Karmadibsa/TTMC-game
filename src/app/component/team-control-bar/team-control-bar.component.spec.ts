import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeamControlBarComponent } from './team-control-bar.component';

describe('TeamControlBarComponent', () => {
  let component: TeamControlBarComponent;
  let fixture: ComponentFixture<TeamControlBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TeamControlBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TeamControlBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

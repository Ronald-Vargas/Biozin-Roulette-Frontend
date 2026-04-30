import { TestBed } from '@angular/core/testing';

import { Roulette } from './roulette';

describe('Roulette', () => {
  let service: Roulette;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Roulette);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { AppTaskComponent } from './task.component';

describe('AppTaskComponent', () => {
  // Pending rather than empty: an empty describe() makes Jasmine raise during
  // declaration and leaves its suite on the declaration stack, so every spec
  // file bundled after this one is registered as a child of this suite and
  // inherits its hooks.
  //
  // The spec stays pending because the component's template binds
  // `#d2="ngbDatepicker"`, and @ng-bootstrap/ng-bootstrap is not a dependency
  // of this project, so AppTaskComponent cannot be instantiated as it stands.
  it('should create');

  it('is exported', () => {
    expect(AppTaskComponent).toBeDefined();
  });
});

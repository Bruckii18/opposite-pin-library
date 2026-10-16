import { describeError } from '../shared/errors';
import type { LibraryRepository } from './libraryRepository';
import type { PinLibrary } from './librarySchema';

export const LibraryStatus = {
  Loading: 'loading',
  Ready: 'ready',
  Failed: 'failed',
} as const;

export type LibraryState =
  | { readonly status: typeof LibraryStatus.Loading }
  | { readonly status: typeof LibraryStatus.Ready; readonly library: PinLibrary }
  | { readonly status: typeof LibraryStatus.Failed; readonly message: string };

export interface LibraryChange<Outcome> {
  readonly library: PinLibrary;
  readonly outcome: Outcome;
}

export class LibraryNotReadyError extends Error {
  constructor() {
    super('The pin library is not loaded, so it cannot be changed right now.');
    this.name = 'LibraryNotReadyError';
  }
}

export class LibraryStore {
  private state: LibraryState = { status: LibraryStatus.Loading };
  private readonly listeners = new Set<() => void>();
  private pendingChange: Promise<unknown> = Promise.resolve();

  constructor(private readonly repository: LibraryRepository) {}

  start(): () => void {
    void this.repository.load().then(
      (library) => this.setState({ status: LibraryStatus.Ready, library }),
      (error: unknown) => this.fail(error),
    );
    return this.repository.subscribe(
      (library) => this.setState({ status: LibraryStatus.Ready, library }),
      (error) => this.fail(error),
    );
  }

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly getSnapshot = (): LibraryState => this.state;

  update(transform: (library: PinLibrary) => PinLibrary): Promise<void> {
    return this.change((library) => ({ library: transform(library), outcome: undefined }));
  }

  change<Outcome>(apply: (library: PinLibrary) => LibraryChange<Outcome>): Promise<Outcome> {
    const nextChange = this.pendingChange.then(() => this.persistChange(apply));
    // Keeps the queue usable after a failed change; the caller still receives the rejection.
    this.pendingChange = nextChange.catch(() => undefined);
    return nextChange;
  }

  private async persistChange<Outcome>(
    apply: (library: PinLibrary) => LibraryChange<Outcome>,
  ): Promise<Outcome> {
    if (this.state.status !== LibraryStatus.Ready) {
      throw new LibraryNotReadyError();
    }
    const { library, outcome } = apply(this.state.library);
    await this.repository.save(library);
    this.setState({ status: LibraryStatus.Ready, library });
    return outcome;
  }

  private fail(error: unknown): void {
    this.setState({ status: LibraryStatus.Failed, message: describeError(error) });
  }

  private setState(state: LibraryState): void {
    this.state = state;
    this.listeners.forEach((listener) => listener());
  }
}

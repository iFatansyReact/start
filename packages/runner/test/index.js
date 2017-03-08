import Runner from '../src/index';

const noopReporter = () => () => {};
const runner = Runner(noopReporter);

describe('runner', () => {
  describe('single task', () => {
    it('resolve', () => {
      const testSpy = jest.fn();

      return runner(
        function testTask() {
          return new Promise((resolve) => {
            testSpy();
            resolve();
          });
        }
      )().then(() => {
        expect(testSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('reject', () => {
      const testSpy = jest.fn();

      return runner(
        function testTask() {
          return new Promise((resolve, reject) => {
            testSpy();
            reject();
          });
        }
      )().catch(() => {
        expect(testSpy).toHaveBeenCalledTimes(1);
      });
    });

    it('hard error', () => {
      const testSpy = jest.fn();

      return runner(
        function testTask1() {
          return new Promise(() => {
            testSpy();
            throw new Error('oops');
          });
        },
      )().catch(() => {
        expect(testSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('sequence of tasks', () => {
    it('resolve', () => {
      const testSpy1 = jest.fn();
      const testSpy2 = jest.fn();

      return runner(
        function testTask1() {
          return new Promise((resolve) => {
            setTimeout(() => {
              testSpy1();
              resolve();
            }, 0);
          });
        },
        function testTask2() {
          return new Promise((resolve) => {
            setTimeout(() => {
              testSpy2();
              resolve();
            }, 0);
          });
        }
      )().then(() => {
        expect(testSpy1).toHaveBeenCalledTimes(1);
        expect(testSpy2).toHaveBeenCalledTimes(1);
      });
    });

    it('reject', () => {
      const testSpy1 = jest.fn();
      const testSpy2 = jest.fn();

      return runner(
        function testTask1() {
          return new Promise((resolve, reject) => {
            testSpy1();
            reject();
          });
        },
        function testTask2() {
          return new Promise((resolve) => {
            testSpy2();
            resolve();
          });
        }
      )().catch(() => {
        expect(testSpy1).toHaveBeenCalledTimes(1);
        expect(testSpy2).toHaveBeenCalledTimes(0);
      });
    });

    it('nested', () => {
      const testSpy1 = jest.fn();
      const testSpy2 = jest.fn();

      const sub = () => runner(
        function testTask1() {
          return new Promise((resolve) => {
            testSpy2();
            resolve();
          });
        }
      );

      return runner(
        function testTask2() {
          return new Promise((resolve) => {
            testSpy1();
            resolve();
          });
        },
        sub()
      )().then(() => {
        expect(testSpy1).toHaveBeenCalledTimes(1);
        expect(testSpy2).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('input', () => {
    it('initial', () => {
      const testSpy = jest.fn();

      return runner(
        function testTask(input) {
          return new Promise((resolve) => {
            setTimeout(() => {
              testSpy(input);
              resolve();
            }, 0);
          });
        }
      )('initial').then(() => {
        expect(testSpy).toHaveBeenCalledWith('initial');
      });
    });

    it('from task to task', () => {
      const testSpy = jest.fn();

      return runner(
        function testTask1() {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve('output');
            }, 0);
          });
        },
        function testTask2(input) {
          return new Promise((resolve) => {
            setTimeout(() => {
              testSpy(input);
              resolve();
            }, 0);
          });
        }
      )().then(() => {
        expect(testSpy).toHaveBeenCalledWith('output');
      });
    });

    it('from task to nested runner', () => {
      const testSpy = jest.fn();

      const sub = () => runner(
        function testTask1(input) {
          return new Promise((resolve) => {
            testSpy(input);
            resolve();
          });
        }
      );

      return runner(
        function testTask2() {
          return new Promise((resolve) => {
            resolve('output');
          });
        },
        sub()
      )().then(() => {
        expect(testSpy).toHaveBeenCalledWith('output');
      });
    });
  });

  describe('reporter', () => {
    it('resolve', () => {
      const spyReporterInner = jest.fn();
      const spyReporter = jest.fn(() => spyReporterInner);

      return Runner(spyReporter)(
        function testTask() {
          return new Promise((resolve) => {
            resolve();
          });
        }
      )().then(() => {
        expect(spyReporter).toHaveBeenCalledTimes(1);
        expect(spyReporter).toHaveBeenCalledWith('testTask');
        expect(spyReporterInner).toHaveBeenCalledTimes(2);
        expect(spyReporterInner.mock.calls[0]).toEqual([ 'start' ]);
        expect(spyReporterInner.mock.calls[1]).toEqual([ 'resolve' ]);
      });
    });

    it('reject', () => {
      const spyReporterInner = jest.fn();
      const spyReporter = jest.fn(() => spyReporterInner);

      return Runner(spyReporter)(
        function testTask() {
          return new Promise((resolve, reject) => {
            reject('error');
          });
        }
      )().catch(() => {
        expect(spyReporter).toHaveBeenCalledTimes(1);
        expect(spyReporter).toHaveBeenCalledWith('testTask');
        expect(spyReporterInner).toHaveBeenCalledTimes(2);
        expect(spyReporterInner.mock.calls[0]).toEqual([ 'start' ]);
        expect(spyReporterInner.mock.calls[1]).toEqual([ 'reject', 'error' ]);
      });
    });

    it('hard error', () => {
      const spyReporterInner = jest.fn();
      const spyReporter = jest.fn(() => spyReporterInner);

      return Runner(spyReporter)(
        function testTask() {
          throw new Error('error');
        }
      )().catch(() => {
        expect(spyReporter).toHaveBeenCalledTimes(1);
        expect(spyReporter).toHaveBeenCalledWith('testTask');
        expect(spyReporterInner).toHaveBeenCalledTimes(2);
        expect(spyReporterInner.mock.calls[0]).toEqual([ 'start' ]);
        expect(spyReporterInner.mock.calls[1]).toEqual([ 'reject', new Error('error') ]);
      });
    });

    it('log', () => {
      const spyReporterInner = jest.fn();
      const spyReporter = jest.fn(() => spyReporterInner);

      return Runner(spyReporter)(
        function testTask(input, log) {
          return new Promise((resolve) => {
            log('test');
            resolve();
          });
        }
      )().then(() => {
        expect(spyReporter).toHaveBeenCalledTimes(1);
        expect(spyReporter).toHaveBeenCalledWith('testTask');
        expect(spyReporterInner).toHaveBeenCalledTimes(3);
        expect(spyReporterInner.mock.calls[0]).toEqual([ 'start' ]);
        expect(spyReporterInner.mock.calls[1]).toEqual([ 'info', 'test' ]);
        expect(spyReporterInner.mock.calls[2]).toEqual([ 'resolve' ]);
      });
    });

    it('original reporter', () => {
      const spyReporterInner = jest.fn();
      const spyReporter = jest.fn(() => spyReporterInner);

      return Runner(spyReporter)(
        function testTask(input, log, reporter) {
          expect(reporter).toEqual(spyReporter);

          return Promise.resolve();
        }
      )();
    });
  });
});

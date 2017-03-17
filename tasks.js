import Start from 'start';
import reporter from 'start-pretty-reporter';
import env from 'start-env';
import files from 'start-files';
import watch from 'start-watch';
import inputConnector from 'start-input-connector';
import clean from 'start-clean';
import read from 'start-read';
import babel from 'start-babel';
import write from 'start-write';
import eslint from 'start-eslint';
import jest from 'start-jest';
import codecov from 'start-codecov';

export const start = Start(reporter());

export const build = (packageName) => start(
  env('NODE_ENV', 'production'),
  files(`packages/${packageName}/lib/`),
  clean(),
  files(`packages/${packageName}/src/*.js`),
  read(),
  babel(),
  write(`packages/${packageName}/lib/`)
);

export const dev = (packageName) => start(
  env('NODE_ENV', 'development'),
  files(`packages/${packageName}/lib/`),
  clean(),
  watch(`packages/${packageName}/src/*.js`)((changedFiles) => start(
    inputConnector(changedFiles),
    read(),
    babel(),
    write(`packages/${packageName}/lib/`)
  ))
);

export const lint = () => start(
  files([ 'packages/*/@(src|test)/*.js' ]),
  eslint()
);

export const test = () => start(
  env('NODE_ENV', 'test'),
  jest({ config: '.jestrc' })
);

export const tdd = () => start(
  env('NODE_ENV', 'test'),
  jest({
    config: '.jestrc',
    watchAll: true
  })
);

export const ci = () => start(
  lint,
  test,
  files('coverage/lcov.info'),
  read(),
  codecov()
);

export const prepush = () => start(
  lint,
  test
);

# Migration to start@6

## Start

### Repositories

`Start` became a monorepo.

Pros:

* much easier to maintain
* no `start-start-preset`
* no `babel-preset-start`

Cons:

* ???


### Runner

```js
import Runner from 'start';
import Reporter from 'start-pretty-reporter';

const runner = Runner(Reporter());

export const build = () => runner(
  // ...
);
```

With this naming our core concept became much more clear: there are `tasks` and tasks `runners`. You have to wrap `tasks` with `runner`.

### "External" input

`runner` itself is another function in which you can pass an "initial" input:

```js
runner(...tasks)('input!')
  .then(console.log)
  .catch(console.error);
```

So no more `start-input-connector`:

```js
export const tasksRunner1 = () => runner(
  function task2(input) {
    console.log('input from previous runner': input);

    return Promise.resolve();
  },
);

export const tasksRunner2 = () => runner(
  function task1() {
    return Promise.resolve('output');
  },
  tasksRunner1()
);
```

And `start-watch` became really beautiful:

```js
export const dev = runner(
  clean('lib/'),
  watch('src/**/*.js')(
    runner(
      read(),
      babel(),
      write('lib/')
    )
  )
);
```

## Tasks

### Refactoring

Tasks were slightly simplified:

```js
export default (options) => function myTask(input, log, reporter) {
  console.log('input:', input);
  log('hey from My Task!');
  console.log('original reporter:', reporter);

  return Promise.resolve('My Task output');
}
```

So in the simplest case `task` is just a single named function which should return a Promise.

## Reporters

### Default reporter

`console.log` is no more a default reporter for Runner.

### Refactoring

Reporters were splitted into composed functions:

```js
export default (name) => (type, message) => console.log(name, type, message);
```

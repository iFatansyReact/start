export default (reporter) => (...tasks) => (input) => tasks.reduce((current, next) => {
  if (!next.name) {
    return current.then(next);
  }

  const taskReporter = reporter(next.name);

  return current
    .then((output) => {
      taskReporter('start');

      return next(output, taskReporter.bind(taskReporter, 'info'), reporter);
    })
    .then((result) => {
      taskReporter('resolve');

      return result;
    })
    .catch((error) => {
      taskReporter('reject', error);

      throw error;
    });
}, Promise.resolve(input));

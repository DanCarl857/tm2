module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    browsers: ['ChromeHeadless'],
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: require('path').join(
        __dirname,
        '../../coverage/apps/dashboard-karma',
      ),
      subdir: '.',
      reporters: [{ type: 'html' }, { type: 'text-summary' }],
    },
    client: { clearContext: false },
    singleRun: true,
  });
};

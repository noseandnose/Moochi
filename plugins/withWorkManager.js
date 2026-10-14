// Aligns androidx.work on one version for the Android app module.
//
// react-native-android-widget depends on work-runtime 2.8.1 while another
// module pulls work-runtime-ktx 2.7.1 transitively; the two ship the same
// Kotlin extension classes and the build fails with "Duplicate class
// androidx.work.OneTimeWorkRequestKt". Forcing both artifacts to the same
// version resolves it (the ktx artifact is an empty shim from 2.9 onwards).
const { withAppBuildGradle } = require('@expo/config-plugins');

const VERSION = '2.9.1';
const MARKER = '// youchi: align androidx.work';
const BLOCK = `
${MARKER}
configurations.all {
  resolutionStrategy {
    force 'androidx.work:work-runtime:${VERSION}'
    force 'androidx.work:work-runtime-ktx:${VERSION}'
  }
}
`;

module.exports = function withWorkManager(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += BLOCK;
    }
    return mod;
  });
};

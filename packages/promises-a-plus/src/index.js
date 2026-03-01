import adapter from "./test-adapter.js";
import promisesAPlusTests from "promises-aplus-tests";

promisesAPlusTests(adapter, function (err) {
  if (err) {
    // If err is present, it means setup failed, not necessarily tests failed.
    // The runner usually prints test results to stdout.
    console.error("Test runner failed!");
    console.error(err);
    process.exit(1);
  } else {
    // The callback is called when tests complete?
    // Looking at promises-tests documentation (or source code), the callback is (err).
    // If err is null, it just means execution finished.
    // Mocha output will show pass/fail.
    console.log("Test runner finished.");
    // We don't know if tests passed from here unless we parse output or check exit code?
    // Usually mocha exits with failure code if tests fail.
  }
});

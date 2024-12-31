const { parentPort } = require("worker_threads");

parentPort.on("message", (number) => {
  try {
    const result = performCalculation(number);

    // Send result back to main thread
    parentPort.postMessage({
      success: true,
      result: result,
    });
  } catch (error) {
    parentPort.postMessage({
      success: false,
      error: error.message,
    });
  }
});

function performCalculation(number) {
  let result = 0;
  for (let i = 0; i < number; i++) {
    result += Math.sqrt(i);
  }
  return result;
}

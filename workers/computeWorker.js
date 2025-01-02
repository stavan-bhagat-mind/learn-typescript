const { parentPort } = require("worker_threads");

parentPort.on("message", async (data) => {
  try {
    const result = await performCalculation(data.number);
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
  return new Promise((resolve, reject) => {
    let result = 0;
    setTimeout(() => {
      try {
        for (let i = 0; i < number; i++) {
          result += Math.sqrt(i);
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
}



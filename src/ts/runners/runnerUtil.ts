import {exec} from "child_process";

export async function run(command, silent= false) {
  return new Promise<void>((resolve, reject) => {
    const callback = function (error, stdout, stderr) {
      if (error) {
        console.log(error.stack);
        console.log('Error code: '+error.code);
        console.log('Signal received: '+error.signal);
      }
      console.log('Child Process STDERR: ' + stderr);
      console.log('Child Process STDOUT: ' + stdout);
      resolve();
    };

    // percentage from trainingset as trainingset, rest as testset
    exec(command, callback);
  })
}

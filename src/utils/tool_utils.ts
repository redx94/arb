export const execute_command = async ({ command, requires_approval }: { command: string, requires_approval: boolean }) => {
  try {
    const process = await new Promise<{ stdout: string, stderr: string, exitCode: number }>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      const childProcess = require('child_process').exec(command, { cwd: '/Users/redx/Documents/arb' });

      childProcess.stdout.on('data', (data: string) => {
        stdout += data;
      });

      childProcess.stderr.on('data', (data: string) => {
        stderr += data;
      });

      childProcess.on('close', (exitCode: number) => {
        resolve({ stdout, stderr, exitCode });
      });

      childProcess.on('error', (err: Error) => {
        reject(err);
      });
    });
    return process;
  } catch (error: any) {
    console.error('Command execution error:', error);
    return null;
  }
};


import mongoose from "mongoose";
import {DB_NAME} from '../constants.js';


const connectDB = async () =>{
    
    try{
     const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)

     console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host} DB NAME: ${connectionInstance.connection.name}`)
    }catch(error){
        console.log("CONNECTION FAILED ERROR:",error)
        process.exit(1) // read about this..
    }
}

export default connectDB


/*
When to Use process.exit()
Use process.exit(0) for a graceful shutdown.
Use process.exit(1) or another non-zero value to indicate an error or abnormal termination.

Key Features of the process Object:
Process Information



process.pid: Returns the process ID of the current Node.js process.
process.version: Returns the Node.js version.
process.versions: Returns an object containing version information of Node.js and its dependencies (e.g., V8, libuv, etc.).
process.platform: Specifies the platform the Node.js process is running on (e.g., linux, darwin, win32).
process.arch: Specifies the processor architecture (e.g., x64, arm).
Environment Variables

process.env: An object containing the environment variables. You can use it to access or set variables (e.g., process.env.NODE_ENV).
Standard I/O Streams

process.stdin: A readable stream for standard input.
process.stdout: A writable stream for standard output.
process.stderr: A writable stream for standard error.
Command-Line Arguments

process.argv: An array containing the command-line arguments passed when the Node.js process was launched. The first element is the Node.js executable, and the second is the script being executed.
Control the Process

process.exit(code): Terminates the process. An optional exit code can be provided (0 for success, 1 or other non-zero values for errors).
process.abort(): Aborts the process and generates a core dump.
process.kill(pid, [signal]): Sends a signal to a process identified by its PID.
process.uptime(): Returns the number of seconds the process has been running.
Event Handling

process.on(event, listener): Listens for events on the process object. Common events include:
'exit': Emitted when the process is about to exit.
'uncaughtException': Emitted when an uncaught exception occurs.
'warning': Emitted when a warning is generated.
Performance and Debugging

process.memoryUsage(): Returns an object describing memory usage (e.g., heapUsed, heapTotal).
process.hrtime([time]): Provides high-resolution real-time in [seconds, nanoseconds].
process.nextTick(callback): Schedules a callback function to be invoked in the next iteration of the event loop.



*/
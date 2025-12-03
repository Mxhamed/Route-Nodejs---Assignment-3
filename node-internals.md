### What is the Node.js Event Loop?

The Event Loop is Basically the Heart of Node.js. It's What Allows Node to Handle Multiple Operations at Once WITHOUT Blocking, Even though JavaScript Runs on a Single Thread.

Think of It like a Restaurant Manager who Takes Orders (_Async Operations_), Sends them to the Kitchen (_System Kernel/Thread Pool_), and Delivers the Finished Dishes (_Callbacks_) When They're Ready.

The Manager NEVER Stops Moving, CONSTANTLY Checking What's Done and What Needs Attention Next.

---

### What is Libuv and What Role Does It Play in Node.js?

Libuv is a C library that Handles ALL the Low-Level, Operating System Stuff for Node.js.

It's What Makes Node's Asynchronous I/O ACTUALLY Work Across Different Platforms (_Windows, Mac, Linux_).

WITHOUT Libuv, Node.js Would Need Different Code for EACH Operating System.

Libuv Abstracts ALL that Away and Provides a Consistent Interface, Handling Things like File System Operations, Networking, and Threading Behind the Scenes.

---

### How Does Node.js Handle Asynchronous Operations Under the Hood?

Node Uses Its Event Loop (_Powered by Libuv_) to Manage Async Operations WITHOUT Blocking the Main Thread.

- You Call an Async Function (_like fs.readFile()_)

- Node Delegates this to Libuv, Which Uses the OS or Thread Pool

- Your Code Continues Running (_Non-Blocking!_)

- When the Operation Finishes, Libuv Puts the Callback in the Event Queue

- The Event Loop Picks It Up and Executes It When the Call Stack is Clear

  > This is Why Node Can Handle THOUSANDS of Concurrent Connections EFFICIENTLY → It's ALWAYS Doing Something Useful Instead of Waiting.

---

### What is the Difference Between the Call Stack, Event Queue, and Event Loop?

<div style="overflow-x: auto;">
  <table>
    <thead>
      <tr>
        <th style="min-width: 120px;">Concept</th>
        <th style="min-width: 380px;">Definition</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><b>Call Stack</b></td>
        <td>Where JavaScript Executes Your Code → LIFO (<i>Last In, First Out</i>) Structure Tracking Current Function.</td>
      </tr>
      <tr>
        <td><b>Event Queue</b></td>
        <td>Waiting Room for Callbacks from Completed Async Operations → FIFO (<i>First In, First Out</i>).</td>
      </tr>
      <tr>
        <td><b>Event Loop</b></td>
        <td>Coordinator that <b>CONSTANTLY</b> Checks if Call Stack is Empty, Then Pushes Next Callback from Queue.</td>
      </tr>
    </tbody>
  </table>
</div>

---

### What is the Node.js Thread Pool and How to Set the Thread Pool Size?

The Thread Pool is a Set of Worker Threads (_Default: `4`_) that Handle CPU-Intensive or Blocking Operations (_e.g., File System Work, DNS Lookups, and Crypto Operations_).

This Prevents these Heavy Tasks from Blocking the Main Event Loop.

You Can Adjust the Pool Size with the `UV_THREADPOOL_SIZE` Environment Variable:

```bash
# Windows PowerShell
$env:UV_THREADPOOL_SIZE=12; node main.js

# Unix/Mac/Linux
UV_THREADPOOL_SIZE=12 node main.js
```

> Generally, You'd Increase this If You're Doing LOTS of File I/O or Crypto Work SIMULTANEOUSLY.

---

### How Does Node.js Handle Blocking and Non-Blocking Code Execution?

Node Handles this Through Its Event Loop and Thread Pool Architecture.

Non-blocking Code (_like Async I/O_) Gets Offloaded to the System Kernel or Thread Pool, so Your Main Thread Keeps Running.

Blocking Code (_Synchronous Operations_) Freezes the Event Loop UNTIL It Completes → this is Why You'll Hear People Say “NEVER Use `fs.readFileSync()` in Production”.

> If an Operation Might Take Time, Use the Async Version so Node CAN Work on Other Things WHILE Waiting for It to Complete.

---

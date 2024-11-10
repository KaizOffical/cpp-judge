const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const pathJoin = path.join;

function formatPath(filePath) {
  const segments = path.resolve(filePath).split(path.sep);
  segments.shift();
  let currentPath = path.sep;

  for (const segment of segments) {
    const files = fs.readdirSync(currentPath);
    const match = files.find((f) => f.toLowerCase() === segment.toLowerCase());
    if (!match) return filePath;
    currentPath = pathJoin(currentPath, match);
  }

  return currentPath;
}

path.join = (...args) => {
  const joinedPath = pathJoin(...args);
  return formatPath(joinedPath);
};

const RESULT_PATH = path.join(__dirname, "results.json");

function saveResults(USERNAME, TEST_NAME, AC, WA, TLE, RTE, MLE, TEST_NUM) {
  const results = JSON.parse(fs.readFileSync(RESULT_PATH));
  if (!results[USERNAME]) results[USERNAME] = {};
  if (!results[USERNAME][TEST_NAME]) results[USERNAME][TEST_NAME] = {};
  results[USERNAME][TEST_NAME] = { AC, WA, TLE, RTE, MLE, total: TEST_NUM };
  fs.writeFileSync(RESULT_PATH, JSON.stringify(results, null, 2), "utf-8");
}

class Judge {
  constructor(username, testname, testnum, pad) {
    this.TIMEOUT = 1000;
    this.MAX_MEMORY = 256 * 1024 * 1024;
    this.CHECKER = path.join(__dirname, "check");

    this.WORKSPACE = path.join(__dirname, "users", username);
    this.USERNAME = username;
    this.TEST_NAME = testname;
    this.TEST_NUM = testnum;
    this.PAD = pad;

    this.AC = 0;
    this.WA = 0;
    this.TLE = 0;
    this.RTE = 0;
    this.CE = 0;
    this.MLE = 0;
    this.OLE = 0;

    this.testPath = path.join(__dirname, "testcases", testname);
  }

  zeropad(x) {
    return x.toString().padStart(this.PAD, "0");
  }

  compileCode(codeFile) {
    return new Promise((resolve, reject) => {
      exec(
        `cd "${this.WORKSPACE}" && g++ "${codeFile}.cpp" -std=c++11 -o "${codeFile}" -O3`,
        (error, stdout, stderr) => {
          resolve({ stderr, CE: error ? true : false });
        }
      );
    });
  }

  executeCode(codeFile) {
    return new Promise((resolve, reject) => {
      exec(
        `cd "${this.WORKSPACE}" && /usr/bin/time -v ./${codeFile}`,
        { timeout: this.TIMEOUT },
        (error, stdout, stderr) => {
          if (error) {
            resolve({
              error:
                error.signal == "SIGTERM"
                  ? "Time Limit Exceeded"
                  : "Runtime Error\n" + error,
            });
          } else {
            const memoryMatch = stderr.match(
              /Maximum resident set size \(kbytes\): (\d+)/
            );
            const timeMatch = stderr.match(/User time \(seconds\): (\d+\.\d+)/);

            const memory = memoryMatch ? parseInt(memoryMatch[1], 10) : null;
            const time = timeMatch ? parseFloat(timeMatch[1]) : null;

            resolve({ memory, time });
          }
        }
      );
    });
  }

  check(i, o, a) {
    return new Promise((resolve, reject) => {
      exec(`${this.CHECKER} ${i} ${o} ${a}`, (error, stderr, stdout) => {
        const res = stdout.trim().split(" ");
        if (res.includes("ok"))
          resolve({
            status: "Answer Correct",
            feedback: res.splice(1).join(" "),
          }),
            this.AC++;
        else
          resolve({
            status: "Wrong Answer",
            feedback: res.splice(2).join(" "),
          }),
            this.WA++;
      });
    });
  }

  async start() {
    const compile = await this.compileCode(this.TEST_NAME);
    if (compile.stderr) console.log(compile.stderr);
    if (compile.CE) {
      console.log("Compilation Error");
      return;
    }
    for (let i = 1; i <= this.TEST_NUM; i++) {
      const inputPath = path.join(
        this.testPath,
        `test${this.zeropad(i)}`,
        `${this.TEST_NAME}.inp`
      );
      const outputPath = path.join(
        this.testPath,
        `test${this.zeropad(i)}`,
        `${this.TEST_NAME}.out`
      );
      const input = fs.readFileSync(inputPath);
      fs.writeFileSync(
        path.join(this.WORKSPACE, `${this.TEST_NAME}.inp`),
        input
      );
      console.log(`Test ${i}: `);
      const startTime = Date.now();
      const exe = await this.executeCode(this.TEST_NAME);
      const endTime = Date.now();
      if (exe.error) {
        console.log(exe.error);
        if (exe.error == "Time Limit Exceeded") this.TLE++;
        else this.RTE++;
        continue;
      }
      const { memory, time } = exe;
      const runtime = endTime - startTime;
      console.log(`${time}s (${runtime}ms), ${memory}KB`);
      const feedback = await this.check(
        inputPath,
        path.join(this.WORKSPACE, `${this.TEST_NAME}.out`),
        outputPath
      );
      console.log(feedback);
    }
    const files = fs.readdirSync(this.WORKSPACE);
    for (const file of files)
      if (!file.toLowerCase().endsWith(".cpp"))
        fs.unlinkSync(path.join(this.WORKSPACE, file));
    saveResults(
      this.USERNAME,
      this.TEST_NAME,
      this.AC,
      this.WA,
      this.TLE,
      this.RTE,
      this.MLE,
      this.TEST_NUM
    );
    console.log(
      `${this.USERNAME}/${this.TEST_NAME} AC: ${this.AC}, WA: ${this.WA}, TLE: ${this.TLE}, RTE: ${this.RTE}, MLE: ${this.MLE}`
    );
  }
}

const args = process.argv.slice(2);

let username = [];
let problems = [];
let currentFlag = null;

for (const arg of args) {
  if (["--username", "--user", "-u"].includes(arg)) currentFlag = "users";
  else if (["--problems", "--prob", "--probs", "-p"].includes(arg))
    currentFlag = "problems";
  else {
    if (currentFlag === "users") username.push(arg);
    else if (currentFlag === "problems") problems.push(arg);
  }
}

async function judge(username) {
  const workspace = path.join(__dirname, "users", username);
  const testspace = path.join(__dirname, "testcases");
  const files = fs.readdirSync(workspace);

  for (const file of files) {
    if (
      problems.length > 0 &&
      !problems.includes(file.toLowerCase().split(".")[0])
    )
      continue;
    if (!file.toLowerCase().endsWith(".cpp")) continue;
    const testname = file.split(".")[0];
    const tests = fs.readdirSync(path.join(testspace, testname));
    let testnum = 0,
      pad = 1;
    for (const test of tests) {
      if (test.toLowerCase().startsWith("testcases")) testnum++;
      const splited = test.toLowerCase().split("testcases")[1];
      pad = Math.max(splited.length, pad);
    }
    const judge = new Judge(username, testname, testnum, pad);
    console.log(`Problem ${username}/${testname} is judging...`);
    await judge.start();
  }
}

async function run() {
  if (username.length == 0) {
    const users = fs.readdirSync(path.join(__dirname, "users"));
    users.forEach(async (user) => {
      try {
        judge(user);
      } catch (e) {}
    });
  } else {
    username.forEach(async (user) => judge(user));
  }
  // if (username.length == 0) {
  //   const users = fs.readdirSync(path.join(__dirname, "users"));
  //   for (const user of users) {
  //     try {
  //       await judge(user);
  //     } catch (e) {}
  //   }
  // } else {
  //   for (const user of username) {
  //     try {
  //       await judge(user);
  //     } catch (e) {}
  //   }
  // }
}

run();

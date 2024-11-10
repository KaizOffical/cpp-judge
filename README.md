# C++ Auto Judge

<p align="center">
   <img alt="Open Pull Requests" src="https://img.shields.io/github/issues-raw/KaizOffical/cpp-judge?color=5c46eb&label=issues&style=for-the-badge">
   <img alt="Open Issues" src="https://img.shields.io/github/issues-pr-raw/KaizOffical/cpp-judge?color=5c46eb&label=pull%20requests&style=for-the-badge">
   <br>
</p>

Free C++ Auto Judge made by Javascript and Codeforces utilities

# Tutorial

1. Clone the project

```bash
git clone https://github.com/KaizOffical/cpp-judge.git
```

2. Read tutorials about setting up [testcases](/testcases/) and [users](/users/)
3. Run the judge

```bash
node index.js
```

4. Get judge results

The results will be put in `results.json` file with the following format:

```json
{
  "<username1>": {
    "<problem1>": {
      "AC": 10, // Answer Corrected
      "WA": 0, // Wrong Answer
      "TLE": 0, // Time Limit Exceeded
      "RTE": 0, // Runtime Error
      "MLE": 0, // Memory Limit Exceeded
      "total": 10 // Total tests
    },
    "<problem2>": {
      "AC": 10, // Answer Corrected
      "WA": 0, // Wrong Answer
      "TLE": 0, // Time Limit Exceeded
      "RTE": 0, // Runtime Error
      "MLE": 0, // Memory Limit Exceeded
      "total": 10 // Total tests
    }
  },
  "<username2>": {
    // same as above
  }
}
```

5. Configure the judge with custom problems and users

- Problem flags: `problems`, `probs`, `prob`, `p`
- User flags: `username`, `user`, `u`
- Using flags when running commands

```bash
node index.js --username kaizisntme --problems example
```

The above command will judge the `example` problem and only for `kaizisntme` users.

# Checker setup

- There is a checker `check` which is provided in this project. However, sometimes it may not work properly. Therefore, you should compile the checker manually and put it in the root folder of your project (where the current checker is located). Read [checker documentation](/checker) for more information.

# Issues

If you have any problems, feel free to [open an issue](https://github.com/KaizOffical/cpp-judge/issues/new/choose).

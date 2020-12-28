---
name: Problem encountered
about: Report information that could help fixing a bug in the OScript support
title: ''
labels: ''
assignees: ''
---

**What is the version of `oscript-parser` that you use?**

You can print the version number by executing `osparse -V` or `oslint -V` if you use the command-line tools, or by executing `jq .version node_modules/oscript-parser/package.json` if you use the API.

**What does not work or work unexpectedly?**

Explain what does not work as you would expect.

**How do you expect it to work?**

Describe what would be your expectation.

**If you use the command-line tools, what is their output?**

If you add the `-v` command-line parameter, the additional information may help to resolve the problem.

**If you use the API, what was the error thrown or the result returned?**

You can attach it as a file if it is too big.

**What is the input OScript source that you used?**

A minimum source code reproducing the problem will be a great help. You can attach it as a file if it is too big.

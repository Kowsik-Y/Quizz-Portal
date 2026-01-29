const { VM } = require('vm2');

// Execute code safely
exports.executeCode = async (req, res) => {
  try {
    const { code, language, input } = req.body;

    if (!code || !language) {
      return res.status(400).json({ error: 'Code and language are required' });
    }

    let output = '';
    let error = null;

    try {
      if (language === 'javascript') {
        const vm = new VM({
          timeout: 5000, // 5 second timeout
          sandbox: {
            console: {
              log: (...args) => {
                output += args.join(' ') + '\n';
              }
            },
            input: input || ''
          }
        });

        const result = vm.run(code);
        if (result !== undefined) {
          output += String(result);
        }
      } else {
        // For other languages, we'd need to implement Docker containers
        // or use external services like Judge0
        error = `${language} execution not implemented yet. Use Docker or Judge0 API.`;
      }
    } catch (err) {
      error = err.message;
    }

    res.json({
      output: output.trim(),
      error,
      success: !error
    });
  } catch (error) {
    console.error('Execute code error:', error);
    res.status(500).json({ error: 'Code execution failed' });
  }
};

// Test code with test cases
exports.testCode = async (req, res) => {
  try {
    const { code, language, test_cases } = req.body;

    if (!code || !language || !test_cases) {
      return res.status(400).json({ error: 'Code, language, and test_cases are required' });
    }

    const results = [];

    for (const testCase of test_cases) {
      const { input, expected_output } = testCase;

      let output = '';
      let error = null;
      let passed = false;

      try {
        if (language === 'javascript') {
          const vm = new VM({
            timeout: 5000,
            sandbox: {
              console: {
                log: (...args) => {
                  output += args.join(' ') + '\n';
                }
              },
              input: input || ''
            }
          });

          const result = vm.run(code);
          if (result !== undefined) {
            output = String(result);
          }

          // Normalize line endings and trim both outputs
          const normalize = (str) => (str || '').replace(/\r\n|\r/g, '\n').trimEnd();
          const actual = normalize(output);
          const expected = normalize(expected_output);
          passed = actual === expected;
        }
      } catch (err) {
        error = err.message;
      }

      results.push({
        input,
        expected_output,
        actual_output: (output || '').replace(/\r\n|\r/g, '\n').trimEnd(),
        passed,
        error
      });
    }

    const allPassed = results.every(r => r.passed);
    const passedCount = results.filter(r => r.passed).length;

    res.json({
      results,
      all_passed: allPassed,
      passed_count: passedCount,
      total_count: test_cases.length,
      success: true
    });
  } catch (error) {
    console.error('Test code error:', error);
    res.status(500).json({ error: 'Code testing failed' });
  }
};

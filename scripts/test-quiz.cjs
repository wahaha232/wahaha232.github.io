// Quiz 引擎自動測試（node scripts/test-quiz.cjs）
const Quiz = require("../js/quiz.js");
let pass = 0;

function assert(cond, label) {
  if (!cond) {
    console.error("FAIL: " + label);
    process.exit(1);
  }
  pass++;
  console.log("PASS: " + label);
}

// 1) 題庫結構
{
  assert(Quiz.DEFAULT.length > 0, "default question bank is not empty");
  Quiz.DEFAULT.forEach(function (q, i) {
    assert(q.options.length === 4, "Q" + i + " has 4 options");
    assert(q.answer >= 0 && q.answer < 4, "Q" + i + " has a valid answer index");
  });
}

// 2) 作答與計分
{
  const g = new Quiz();
  assert(g.total() === Quiz.DEFAULT.length, "total matches the bank");
  assert(g.current() !== null, "has a current question");
  const q = g.current();
  const res = g.answer(q.answer);
  assert(res && res.correct === true, "correct answer scores");
  assert(g.score === 1, "score increments to 1");
  assert(g.answer(0) === null, "cannot answer twice in a row");
}

// 3) 答錯不計分但記錄正確答案
{
  const g = new Quiz();
  const q = g.current();
  const wrong = (q.answer + 1) % q.options.length;
  const res = g.answer(wrong);
  assert(res.correct === false, "wrong answer marked incorrect");
  assert(res.correctIndex === q.answer, "reports the correct index");
  assert(g.score === 0, "score stays 0");
}

// 4) 完成整份測驗
{
  const g = new Quiz();
  while (!g.finished) {
    const cur = g.current();
    g.answer(cur.answer);
    g.next();
  }
  assert(g.finished === true, "quiz finishes after the last question");
  assert(g.current() === null, "no current question when finished");
  assert(g.score === g.total(), "all-correct run scores full marks");
}

// 5) 自訂題庫
{
  const g = new Quiz([{ q: "2+2?", options: ["3", "4"], answer: 1 }]);
  assert(g.total() === 1, "custom bank length respected");
  const res = g.answer(1);
  assert(res.correct === true, "custom question answerable");
}

console.log("\nALL QUIZ TESTS PASSED (" + pass + ")");

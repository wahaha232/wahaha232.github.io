// ═══════════════════════════════════════════════════════════════
// Quiz — 遊戲引擎（題庫 + 作答流程，與 DOM 完全分離）
// 題目與選項皆為本站自訂內容（原創，非引用他人）。
// ═══════════════════════════════════════════════════════════════

(function (global) {
  "use strict";

  function Quiz(questions) {
    this.questions = questions && questions.length ? questions : Quiz.DEFAULT;
    this.reset();
  }

  Quiz.prototype.reset = function () {
    this.index = 0;
    this.score = 0;
    this.answered = false;
    this.finished = false;
    this.lastCorrect = null;
    this.selected = -1;
  };

  Quiz.prototype.total = function () {
    return this.questions.length;
  };

  Quiz.prototype.current = function () {
    if (this.finished) return null;
    return this.questions[this.index] || null;
  };

  Quiz.prototype.answer = function (i) {
    if (this.answered || this.finished) return null;
    var q = this.current();
    if (!q || i < 0 || i >= q.options.length) return null;
    this.answered = true;
    this.selected = i;
    this.lastCorrect = i === q.answer;
    if (this.lastCorrect) this.score++;
    return { correct: this.lastCorrect, correctIndex: q.answer };
  };

  Quiz.prototype.next = function () {
    if (!this.answered) return false;
    this.index++;
    this.answered = false;
    this.selected = -1;
    if (this.index >= this.questions.length) this.finished = true;
    return !this.finished;
  };

  // 原創一般常識題目
  Quiz.DEFAULT = [
    { q: "Which planet is known as the Red Planet?", options: ["Mars", "Venus", "Jupiter", "Mercury"], answer: 0 },
    { q: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], answer: 2 },
    { q: "What is the chemical formula for water?", options: ["WO2", "H2O", "HO2", "OH2"], answer: 1 },
    { q: "What colour do you get by mixing blue and yellow paint?", options: ["Purple", "Orange", "Green", "Brown"], answer: 2 },
    { q: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: 3 },
    { q: "How many sides does a hexagon have?", options: ["5", "6", "7", "8"], answer: 1 },
    { q: "Which is the capital city of Japan?", options: ["Osaka", "Kyoto", "Tokyo", "Nagoya"], answer: 2 },
    { q: "Which gas do plants take in for photosynthesis?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], answer: 1 },
    { q: "How many players from one team are on a football (soccer) pitch?", options: ["9", "10", "11", "12"], answer: 2 },
    { q: "Which animal is famous for changing colour to blend in?", options: ["Penguin", "Chameleon", "Dolphin", "Kangaroo"], answer: 1 }
  ];

  // 支援 Node（測試用）與瀏覽器
  if (typeof module !== "undefined" && module.exports) {
    module.exports = Quiz;
  }
  global.Quiz = Quiz;
})(typeof window !== "undefined" ? window : globalThis);

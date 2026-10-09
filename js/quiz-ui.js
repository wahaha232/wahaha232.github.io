// ═══════════════════════════════════════════════════════════════
// Quiz UI — 只呼叫 js/quiz.js 公開方法
// ═══════════════════════════════════════════════════════════════

(function () {
  "use strict";

  var game = new Quiz(window.QUIZ_BANK || undefined);
  var progressEl = document.getElementById("quiz-progress");
  var scoreEl = document.getElementById("quiz-score");
  var questionEl = document.getElementById("quiz-question");
  var optionsEl = document.getElementById("quiz-options");
  var feedbackEl = document.getElementById("quiz-feedback");
  var nextBtn = document.getElementById("quiz-next");
  var restartBtn = document.getElementById("quiz-restart");

  function renderQuestion() {
    var q = game.current();
    if (!q) {
      renderEnd();
      return;
    }
    progressEl.textContent = "Question " + (game.index + 1) + " / " + game.total();
    scoreEl.textContent = String(game.score);
    questionEl.textContent = q.q;
    feedbackEl.textContent = "";
    feedbackEl.className = "qz-feedback";
    optionsEl.innerHTML = "";
    nextBtn.hidden = true;
    restartBtn.hidden = true;

    q.options.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "qz-opt";
      b.textContent = opt;
      b.addEventListener("click", function () {
        choose(i);
      });
      optionsEl.appendChild(b);
    });
  }

  function choose(i) {
    var res = game.answer(i);
    if (!res) return;
    var q = game.current();
    var btns = optionsEl.querySelectorAll(".qz-opt");
    for (var k = 0; k < btns.length; k++) {
      btns[k].disabled = true;
      if (k === res.correctIndex) btns[k].classList.add("is-correct");
      else if (k === i) btns[k].classList.add("is-wrong");
    }
    scoreEl.textContent = String(game.score);
    feedbackEl.textContent = res.correct
      ? "Correct! ✅"
      : "Not quite — the answer is: " + q.options[res.correctIndex];
    feedbackEl.className = "qz-feedback " + (res.correct ? "is-correct" : "is-wrong");
    nextBtn.hidden = false;
    nextBtn.textContent = game.index + 1 >= game.total() ? "See Result" : "Next";
  }

  function onNext() {
    if (game.next()) renderQuestion();
    else renderEnd();
  }

  function renderEnd() {
    progressEl.textContent = "Quiz complete";
    questionEl.textContent = "";
    optionsEl.innerHTML = "";
    feedbackEl.textContent = "";
    var pct = Math.round((game.score / game.total()) * 100);
    questionEl.innerHTML =
      "You scored <strong>" + game.score + " / " + game.total() + "</strong> (" + pct + "%)." +
      (pct >= 80 ? " Excellent! 🎉" : pct >= 50 ? " Nice work!" : " Give it another go!");
    scoreEl.textContent = String(game.score);
    nextBtn.hidden = true;
    restartBtn.hidden = false;
  }

  if (nextBtn) nextBtn.addEventListener("click", onNext);
  if (restartBtn) {
    restartBtn.addEventListener("click", function () {
      game.reset();
      renderQuestion();
    });
  }

  renderQuestion();
})();

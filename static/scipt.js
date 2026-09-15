document.addEventListener("DOMContentLoaded", function () {

    // ================= QUIZ SECTION =================

    const questionBoxes = Array.from(
        document.querySelectorAll(".question-box")
    );

    // If there are no quiz questions, skip quiz code
    if (questionBoxes.length > 0) {

        let currentQuestionIndex = 0;
        let score = 0;
        let correctCount = 0;
        let wrongCount = 0;
        let selectedAnswer = null;
        let timeLeft = 30;
        let timerInterval = null;
        let quizFinished = false;

        const answers = [];

        const scoreElement = document.getElementById("score");
        const timerElement = document.getElementById("timer");

        const nextButton = document.getElementById("next-button");
        const submitButton = document.getElementById("submit-button");

        const quizScreen = document.getElementById("quiz-screen");
        const resultScreen = document.getElementById("result-screen");

        const finalScoreElement = document.getElementById("final-score");
        const correctCountElement = document.getElementById("correct-count");
        const wrongCountElement = document.getElementById("wrong-count");
        const accuracyElement = document.getElementById("accuracy");

        const performanceBox = document.getElementById("performance-box");
        const reviewList = document.getElementById("review-list");
        const streakMessage = document.getElementById("streak-message");
        const restartButton = document.getElementById("restart-button");


        // ---------------- SHOW QUESTION ----------------

        function showQuestion(index) {

            questionBoxes.forEach(function (box, boxIndex) {
                if (boxIndex === index) {
                    box.classList.add("active");
                    box.style.display = "block";
                } else {
                    box.classList.remove("active");
                    box.style.display = "none";
                }
            });

            selectedAnswer = null;
            timeLeft = 30;

            const currentBox = questionBoxes[index];

            currentBox.querySelectorAll(".option-button").forEach(function (button) {
                button.classList.remove("selected");
                button.classList.remove("correct");
                button.classList.remove("wrong");
                button.disabled = false;
            });

            updateTimerDisplay();
            startTimer();

            if (index === questionBoxes.length - 1) {
                if (nextButton) {
                    nextButton.style.display = "none";
                }

                if (submitButton) {
                    submitButton.style.display = "block";
                }
            } else {
                if (nextButton) {
                    nextButton.style.display = "block";
                }

                if (submitButton) {
                    submitButton.style.display = "none";
                }
            }

            if (streakMessage) {
                streakMessage.textContent = "";
            }
        }


        // ---------------- TIMER ----------------

        function updateTimerDisplay() {

            if (timerElement) {
                timerElement.textContent = timeLeft;

                if (timeLeft <= 5) {
                    timerElement.style.background = "#ef4444";
                    timerElement.style.color = "white";
                } else {
                    timerElement.style.background = "#f59e0b";
                    timerElement.style.color = "#451a03";
                }
            }
        }


        function startTimer() {

            clearInterval(timerInterval);

            timerInterval = setInterval(function () {

                if (quizFinished) {
                    clearInterval(timerInterval);
                    return;
                }

                timeLeft--;
                updateTimerDisplay();

                if (timeLeft <= 0) {

                    clearInterval(timerInterval);

                    if (selectedAnswer === null) {
                        handleAnswer(null, true);
                    }

                    if (currentQuestionIndex < questionBoxes.length - 1) {
                        currentQuestionIndex++;
                        showQuestion(currentQuestionIndex);
                    } else {
                        finishQuiz();
                    }
                }

            }, 1000);
        }


        // ---------------- HANDLE ANSWER ----------------

        function handleAnswer(button, timedOut = false) {

            if (selectedAnswer !== null) {
                return;
            }

            const currentBox = questionBoxes[currentQuestionIndex];

            const correctAnswer = currentBox.dataset.correctAnswer || "";
            const questionText = currentBox.dataset.question || "";

            if (button) {
                selectedAnswer =
                    button.dataset.option ||
                    button.dataset.answer ||
                    button.textContent.trim();
            } else {
                selectedAnswer = "Not answered";
            }

            const isCorrect = selectedAnswer === correctAnswer;

            currentBox.querySelectorAll(".option-button").forEach(function (optionButton) {

                optionButton.disabled = true;

                const optionValue =
                    optionButton.dataset.option ||
                    optionButton.dataset.answer ||
                    optionButton.textContent.trim();

                if (optionValue === correctAnswer) {
                    optionButton.classList.add("correct");
                }

                if (optionValue === selectedAnswer && !isCorrect) {
                    optionButton.classList.add("wrong");
                }
            });

            if (isCorrect) {
                correctCount++;
                score += 10;

                if (streakMessage) {
                    streakMessage.textContent = "🎯 Correct answer! +10 points";
                }

            } else {
                wrongCount++;

                if (streakMessage) {
                    if (timedOut) {
                        streakMessage.textContent = "⏰ Time's up!";
                    } else {
                        streakMessage.textContent = "❌ Wrong answer!";
                    }
                }
            }

            if (scoreElement) {
                scoreElement.textContent = score;
            }

            answers.push({
                question: questionText,
                user_answer: selectedAnswer,
                correct_answer: correctAnswer,
                is_correct: isCorrect
            });
        }


        // ---------------- NEXT QUESTION ----------------

        function moveToNextQuestion() {

            clearInterval(timerInterval);

            if (currentQuestionIndex < questionBoxes.length - 1) {
                currentQuestionIndex++;
                showQuestion(currentQuestionIndex);
            } else {
                finishQuiz();
            }
        }


        // ---------------- NEXT BUTTON ----------------

        if (nextButton) {

            nextButton.addEventListener("click", function (event) {

                event.preventDefault();

                if (selectedAnswer === null) {
                    alert("Please select an answer first.");
                    return;
                }

                moveToNextQuestion();
            });
        }


        // ---------------- SUBMIT BUTTON ----------------

        if (submitButton) {

            submitButton.addEventListener("click", function (event) {

                event.preventDefault();

                if (selectedAnswer === null) {
                    alert("Please select an answer first.");
                    return;
                }

                finishQuiz();
            });
        }


        // ---------------- OPTION BUTTONS ----------------

        questionBoxes.forEach(function (questionBox) {

            const optionButtons =
                questionBox.querySelectorAll(".option-button");

            optionButtons.forEach(function (button) {

                button.addEventListener("click", function (event) {

                    event.preventDefault();

                    if (selectedAnswer !== null) {
                        return;
                    }

                    optionButtons.forEach(function (otherButton) {
                        otherButton.classList.remove("selected");
                    });

                    button.classList.add("selected");

                    handleAnswer(button, false);
                });
            });
        });


        // ---------------- FINISH QUIZ ----------------

        function finishQuiz() {

            if (quizFinished) {
                return;
            }

            quizFinished = true;
            clearInterval(timerInterval);

            if (selectedAnswer === null) {
                handleAnswer(null, true);
            }

            const totalQuestions = questionBoxes.length;

            const accuracy = totalQuestions > 0
                ? ((correctCount / totalQuestions) * 100).toFixed(2)
                : "0.00";

            if (finalScoreElement) {
                finalScoreElement.textContent = score;
            }

            if (correctCountElement) {
                correctCountElement.textContent = correctCount;
            }

            if (wrongCountElement) {
                wrongCountElement.textContent = wrongCount;
            }

            if (accuracyElement) {
                accuracyElement.textContent = accuracy + "%";
            }

            let performanceMessage = "";

            if (accuracy >= 90) {
                performanceMessage =
                    "🏆 Excellent performance! You have outstanding knowledge.";
            } else if (accuracy >= 70) {
                performanceMessage =
                    "🌟 Great job! Your performance is very good.";
            } else if (accuracy >= 50) {
                performanceMessage =
                    "👍 Good effort! Keep practicing to improve.";
            } else {
                performanceMessage =
                    "📚 Keep learning and try again. You can improve!";
            }

            if (performanceBox) {
                performanceBox.textContent = performanceMessage;
            }

            // Review answers
            if (reviewList) {

                reviewList.innerHTML = "";

                answers.forEach(function (item, index) {

                    const reviewItem = document.createElement("div");

                    reviewItem.className =
                        "review-item " +
                        (item.is_correct
                            ? "correct-review"
                            : "wrong-review");

                    const questionHeading =
                        document.createElement("div");

                    questionHeading.className = "review-question";
                    questionHeading.textContent =
                        (index + 1) + ". " + item.question;

                    const selectedText =
                        document.createElement("div");

                    selectedText.className = "review-answer";
                    selectedText.textContent =
                        "Your answer: " + item.user_answer;

                    const correctText =
                        document.createElement("div");

                    correctText.className = "review-answer";
                    correctText.textContent =
                        "Correct answer: " + item.correct_answer;

                    const resultText =
                        document.createElement("div");

                    resultText.className = "review-answer";
                    resultText.textContent =
                        item.is_correct
                            ? "✓ Correct"
                            : "✗ Wrong";

                    reviewItem.appendChild(questionHeading);
                    reviewItem.appendChild(selectedText);
                    reviewItem.appendChild(correctText);
                    reviewItem.appendChild(resultText);

                    reviewList.appendChild(reviewItem);
                });
            }

            if (quizScreen) {
                quizScreen.style.display = "none";
            }

            if (resultScreen) {
                resultScreen.style.display = "block";
            }

            saveQuizHistory(accuracy);
        }


        // ---------------- SAVE HISTORY ----------------

        function saveQuizHistory(accuracy) {

            const quizData = window.quizData || {};

            fetch("/save_history", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    player_name: quizData.playerName || "Anonymous",
                    subject: quizData.subject || "General Knowledge",
                    difficulty: quizData.difficulty || "Medium",
                    score: score,
                    correct: correctCount,
                    wrong: wrongCount,
                    accuracy: parseFloat(accuracy),
                    answers: answers
                })
            })
            .then(function (response) {
                return response.json();
            })
            .then(function (data) {
                if (!data.success) {
                    console.error("History save failed:", data.message);
                }
            })
            .catch(function (error) {
                console.error("Error saving quiz history:", error);
            });
        }


        // ---------------- RESTART QUIZ ----------------

        function restartQuiz() {

            const quizData = window.quizData || {};

            const url =
                "/quiz?player_name=" +
                encodeURIComponent(quizData.playerName || "") +
                "&subject=" +
                encodeURIComponent(quizData.subject || "") +
                "&difficulty=" +
                encodeURIComponent(quizData.difficulty || "Medium");

            window.location.href = url;
        }

        if (restartButton) {
            restartButton.addEventListener("click", restartQuiz);
        }


        // Start quiz with first question
        showQuestion(currentQuestionIndex);
    }


    // ================= SPIN WHEEL SECTION =================

    const wheelCanvas = document.getElementById("spinWheel");
    const spinBtn = document.getElementById("spinButton");
    const wheelResult = document.getElementById("wheelResult");

    if (wheelCanvas && spinBtn) {

        const wheelContext = wheelCanvas.getContext("2d");

        const wheelSubjects = [
            "Mathematics",
            "Science",
            "English",
            "Hindi",
            "History",
            "Geography",
            "Computer",
            "General Knowledge",
            "Physics",
            "Chemistry",
            "Biology",
            "Environmental Studies",
            "Space and Astronomy",
            "Physical Education",
            "Art and Music"
        ];

        const wheelColors = [
            "#ff595e",
            "#ffca3a",
            "#8ac926",
            "#1982c4",
            "#6a4c93",
            "#f15bb5",
            "#00bbf9",
            "#00f5d4",
            "#ff924c",
            "#c77dff",
            "#52b788",
            "#e63946",
            "#457b9d",
            "#f4a261",
            "#2a9d8f"
        ];

        let wheelRotation = 0;
        let wheelIsSpinning = false;

        function drawSpinWheel() {

            const center = wheelCanvas.width / 2;
            const radius = 200;
            const slice =
                (2 * Math.PI) / wheelSubjects.length;

            wheelContext.clearRect(
                0,
                0,
                wheelCanvas.width,
                wheelCanvas.height
            );

            wheelSubjects.forEach(function (subject, index) {

                const startAngle = index * slice;
                const endAngle = startAngle + slice;

                wheelContext.beginPath();
                wheelContext.moveTo(center, center);

                wheelContext.arc(
                    center,
                    center,
                    radius,
                    startAngle,
                    endAngle
                );

                wheelContext.closePath();

                wheelContext.fillStyle = wheelColors[index];
                wheelContext.fill();

                wheelContext.strokeStyle = "#ffffff";
                wheelContext.lineWidth = 2;
                wheelContext.stroke();

                wheelContext.save();

                wheelContext.translate(center, center);
                wheelContext.rotate(startAngle + slice / 2);

                wheelContext.textAlign = "right";
                wheelContext.fillStyle = "#ffffff";
                wheelContext.font = "bold 11px Arial";

                let shortSubject = subject;

                if (shortSubject.length > 17) {
                    shortSubject =
                        shortSubject.substring(0, 15) + "...";
                }

                wheelContext.fillText(
                    shortSubject,
                    radius - 10,
                    4
                );

                wheelContext.restore();
            });

            // Center circle
            wheelContext.beginPath();

            wheelContext.arc(
                center,
                center,
                38,
                0,
                2 * Math.PI
            );

            wheelContext.fillStyle = "#ffffff";
            wheelContext.fill();

            wheelContext.strokeStyle = "#673ab7";
            wheelContext.lineWidth = 4;
            wheelContext.stroke();
        }


        spinBtn.addEventListener("click", function () {

            if (wheelIsSpinning) {
                return;
            }

            wheelIsSpinning = true;
            spinBtn.disabled = true;

            if (wheelResult) {
                wheelResult.textContent = "Spinning...";
            }

            const randomRotation =
                Math.floor(Math.random() * 360);

            const totalRotation =
                1800 + randomRotation;

            wheelRotation += totalRotation;

            wheelCanvas.style.transition =
                "transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)";

            wheelCanvas.style.transform =
                `rotate(${wheelRotation}deg)`;

            setTimeout(function () {

                const finalAngle = wheelRotation % 360;

                const sliceDegrees =
                    360 / wheelSubjects.length;

                const selectedIndex = Math.floor(
                    (
                        (360 - finalAngle + sliceDegrees / 2) % 360
                    ) / sliceDegrees
                );

                if (wheelResult) {
                    wheelResult.textContent =
                        "Selected Subject: " +
                        wheelSubjects[selectedIndex];
                }

                wheelIsSpinning = false;
                spinBtn.disabled = false;

            }, 5000);
        });

        drawSpinWheel();
    }

});

console.log("MindArena script loaded");
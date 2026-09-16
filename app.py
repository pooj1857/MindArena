from flask import Flask, render_template, request, redirect, url_for
import sqlite3
import random
import json
from datetime import datetime

from questions import questions
DB_PATH = "quiz_history.db"

app = Flask(__name__)

DATABASE = "quiz_history.db"


# --------------------------------------------------
# DATABASE CONNECTION
# --------------------------------------------------

def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


# --------------------------------------------------
# INITIALIZE DATABASE
# --------------------------------------------------

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS quiz_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_name TEXT NOT NULL,
            subject TEXT NOT NULL,
            difficulty TEXT NOT NULL,
            score INTEGER NOT NULL,
            total_questions INTEGER NOT NULL,
            accuracy REAL DEFAULT 0,
            date_time TEXT DEFAULT '',
            answers TEXT DEFAULT '[]'
        )
    """)

    conn.commit()
    conn.close()

# --------------------------------------------------
# HOME PAGE AND START QUIZ
# --------------------------------------------------

@app.route("/", methods=["GET", "POST"])
def home():

    subjects = list(questions.keys())

    print("AVAILABLE SUBJECTS:", subjects)
    print("TOTAL SUBJECTS:", len(subjects))

    if request.method == "POST":
        player_name = request.form.get("player_name", "").strip()
        subject = request.form.get("subject", "").strip()
        difficulty = request.form.get("difficulty", "").strip()

        if not player_name or not subject or not difficulty:
            return render_template(
                "home.html",
                subjects=subjects,
                error="Please fill all fields."
            )

        question_bank = questions.get(subject, {}).get(difficulty, [])

        if not question_bank:
            return render_template(
                "home.html",
                subjects=subjects,
                error="No questions available for this subject and difficulty."
            )

        # Select maximum 10 random questions
        selected_questions = random.sample(
            question_bank,
            min(10, len(question_bank))
        )

        # Shuffle options without changing the original question bank
        for selected_question in selected_questions:
            selected_question["options"] = selected_question["options"].copy()
            random.shuffle(selected_question["options"])

        return render_template(
            "quiz.html",
            questions=selected_questions,
            subject=subject,
            difficulty=difficulty,
            player_name=player_name,
            total_questions=len(selected_questions)

        )

    return render_template(
        "home.html",
        subjects=subjects
    )


# --------------------------------------------------
# SUBMIT QUIZ AND SHOW RESULT
# --------------------------------------------------

# --------------------------------------------------
# SUBMIT QUIZ AND SHOW RESULT
# --------------------------------------------------

@app.route("/submit", methods=["POST"])
def submit():

    question_texts = request.form.getlist("question_text")
    correct_answers = request.form.getlist("correct_answer")

    player_name = request.form.get("player_name", "Unknown")
    subject = request.form.get("subject", "Unknown")
    difficulty = request.form.get("difficulty", "Unknown")

    total_questions = len(correct_answers)
    score = 0
    wrong_answers = []
    answer_details = []

    for index in range(total_questions):

        question_text = question_texts[index]
        correct_answer = correct_answers[index]

        user_answer = request.form.get(f"answer_{index}")

        if user_answer is None or user_answer.strip() == "":
            user_answer = "Not Answered"

        # Clean answers before comparing
        user_answer_clean = user_answer.strip().lower()
        correct_answer_clean = correct_answer.strip().lower()

        is_correct = (
            user_answer_clean != "not answered"
            and user_answer_clean == correct_answer_clean
        )

        if is_correct:
            score += 1

        answer_details.append({
            "question": question_text,
            "user_answer": user_answer,
            "correct_answer": correct_answer,
            "is_correct": is_correct
        })

        if not is_correct:
            wrong_answers.append({
                "question": question_text,
                "user_answer": user_answer,
                "correct_answer": correct_answer
            })

    accuracy = (
        round((score / total_questions) * 100, 2)
        if total_questions
        else 0
    )

    # Convert answer details into text for SQLite
    import json
    answers_json = json.dumps(answer_details)

    # Save quiz history
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()

    date_time = datetime.now().strftime("%d-%m-%Y %I: %M %p")

    cursor.execute("""
        INSERT INTO quiz_history
        (player_name, subject, difficulty, score, total_questions,
         accuracy, date_time, answers)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        player_name,
        subject,
        difficulty,
        score,
        total_questions,
        accuracy,
        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        answers_json
    ))

    conn.commit()
    conn.close()

    return render_template(
        "result.html",
        score=score,
        total_questions=total_questions,
        accuracy=accuracy,
        wrong_answers=wrong_answers,
        answer_details=answer_details
    )


# --------------------------------------------------
# QUIZ HISTORY PAGE
# --------------------------------------------------

@app.route("/history")
def history():

    conn = get_db_connection()

    records = conn.execute("""
        SELECT *
        FROM quiz_history
        ORDER BY id DESC
    """).fetchall()

    conn.close()

    return render_template(
        "history.html",
        quiz_history=records
    )


# --------------------------------------------------
# CLEAR QUIZ HISTORY
# --------------------------------------------------

@app.route("/clear-history", methods=["POST"])
def clear_history():

    conn = get_db_connection()

    conn.execute("DELETE FROM quiz_history")

    conn.commit()
    conn.close()

    return redirect(url_for("history"))


# --------------------------------------------------
# HISTORY DETAILS PAGE
# --------------------------------------------------

@app.route("/history/<int:quiz_id>")
def history_detail(quiz_id):
    import json

    conn = sqlite3.connect("quiz_history.db")
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute(
        "SELECT * FROM quiz_history WHERE id = ?",
        (quiz_id,)
    )

    quiz = cursor.fetchone()
    conn.close()

    if quiz is None:
        return "Quiz record not found", 404

    answer_details = []

    if quiz["answers"]:
        try:
            answer_details = json.loads(quiz["answers"])
        except json.JSONDecodeError:
            answer_details = []

    return render_template(
        "history_detail.html",
        quiz=quiz,
        answer_details=answer_details
    )


# --------------------------------------------------
# RESTART QUIZ
# --------------------------------------------------

@app.route("/restart")
def restart():
    return redirect(url_for("home"))


# --------------------------------------------------
# RUN APPLICATION
# --------------------------------------------------

if __name__ == "__main__":
    init_db()
    app.run(debug=True)
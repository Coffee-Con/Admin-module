function addAnswer() {
    const container = document.getElementById("answersContainer");
    const newAnswerDiv = document.createElement("div");
    newAnswerDiv.classList.add("answer-input");

    newAnswerDiv.innerHTML = `
      <button class="btn btn-danger button-Animation" style="margin-right:10px; "type="button" class="delete-button" onclick="deleteAnswer(this)">Delete</button>
      <input type="text" class="answer" placeholder="Enter question answer">
      <input type="checkbox" class="correct-answer answer1" onclick="toggleSingleCheck(this)"> Correct
  `;
    container.insertBefore(newAnswerDiv, container.lastElementChild);
        const questionTypeSelect = document.getElementById('questionType');
        const correctCheckboxes = document.querySelectorAll('.answer1');
    
        questionTypeSelect.addEventListener('change', function() {
            if (questionTypeSelect.value === '2') {
                correctCheckboxes.forEach(checkbox => {
                    checkbox.style.display = 'none';
                });
            } else {
                correctCheckboxes.forEach(checkbox => {
                    checkbox.style.display = 'inline-block';
                });
            }
        });
        
        if (questionTypeSelect.value === '2') { // Fill in the Blank
            correctCheckboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
            });
        } else {
            correctCheckboxes.forEach(checkbox => {
                checkbox.style.display = 'inline-block';
            });
        }


}

function toggleSingleCheck(checkbox) {
    const questionId = checkbox.getAttribute('data-question-id');  // Get the question ID
    
    // For the correct-answer4 group, ensure that only one checkbox can be selected for the same question ID
    if (checkbox.classList.contains('correct-answer4')) {
        if (checkbox.checked) {
            document.querySelectorAll(`.correct-answer4[data-question-id="${questionId}"]`).forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false;  // Uncheck all other checkboxes
                }
            });
        }
    }
    // For the correct-answer group, ensure that only one checkbox can be selected for the same question ID
    else if (checkbox.classList.contains('correct-answer')) {
        if (checkbox.checked) {
            document.querySelectorAll(`.correct-answer`).forEach(cb => {
                if (cb !== checkbox) {
                    cb.checked = false;  // Uncheck all other checkboxes
                }
            });
        }
    }
}



function createQuestion() {
    const questionType = document.getElementById("questionType").value;
    const questionTopic = document.getElementById("questionTopic").value;
    const answers = Array.from(document.querySelectorAll(".answer")).map(input => {
        const isCorrect = input.parentElement.querySelector(".correct-answer").checked;
        return {
            text: input.value,
            correct: questionType === "2" ? true : isCorrect
        };
    });

    const questionData = {
        type: questionType,
        topic: questionTopic,
        answers: answers,
    };

    // Validation: Check if at least one correct answer is selected
    if (answers.length === 0) {
        alert("Please enter at least one answer.");
        return;
    }

    const hasCorrectAnswer = answers.some(answer => answer.correct);
    if (!hasCorrectAnswer) {
        alert("Please select at least one correct answer.");
        return; 
    }

    if(!questionType) {
        alert('Please Seletect A Question Type');
        return;
    }

    // Send questionData to the server
    fetch('/api/createQuestion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert(`Question created with ID: ${data.id}`);
        } else {
            alert(`Error: ${data.error}`);
        }
    })
    .catch(error => console.error('Error:', error));

    fetchQuestions(); // Refresh list
    loadAddQuestionToQuiz();
}

function deleteAnswer(button) {
    const answerDiv = button.parentElement;
    answerDiv.remove();
}

// Fetch and display the questions
function fetchQuestions() {
    fetch('/api/getAllQuestions')
        .then(response => response.json())
        .then(data => {
            const questionList = document.getElementById('questionList');
            questionList.innerHTML = '';

            data.forEach(question => {
                const questionDiv = document.createElement('div');
                questionDiv.classList.add('question-item');

                // New answers parsing, including text and correct
                const answers = Array.isArray(question.Answer) ?
                    question.Answer.map(answer => `${answer.text} (${answer.correct ? 'Correct' : 'Incorrect'})`).join(', ') :
                    'No answers available';

                questionDiv.innerHTML = `
                    <div class="question-header">
                        <span style="font-weight:bold; margin-bottom:20px;">Q${question.QuestionID}: ${question.Question}</span>
                        <button class="btn btn-danger button-Animation" style="margin-left:5px; padding:5px 10px; font-size:12px;" onclick="deleteQuestion(${question.QuestionID})" title="Delete">
                        <i class="fas fa-trash" style="font-size:12px;"></i></button>
                        <button class="btn btn-success button-Animation" style="margin-left:5px; padding:5px 10px; font-size:12px;" onclick="toggleDetails(this)" title="Click to show details of questions and to edit.">
                        <i class="fas fa-edit" style="font-size:12px;"></i></button>
                        <hr>
                    </div>
                    <div class="question-details" style="display: none;">
                        <div class="form-group" style="display:none;">
                            <label>Type:</label>
                            <select id="editType-${question.QuestionID}">
                                <option value="1" ${question.QuestionType === 1 ? 'selected' : ''}>MCQ</option>
                                <option value="2" ${question.QuestionType === 2 ? 'selected' : ''}>Fill in the Blank</option>
                            </select>
                        </div>
                        <div class="form-group" style="display:flex;">
                            <label>Type:</label>
                            <p style="margin-left:5px;">${question.QuestionType === 1 ? 'MCQ' : (question.QuestionType === 2 ? 'Fill in the Blank' : 'Other Type')}</p>
                        </div>
                        <div class="form-group">
                            <label>Question Text:</label>
                            <input type="text" id="editQuestion-${question.QuestionID}" value="${question.Question}">
                        </div>
                        <div class="form-group">
                            <label>Answers:</label>
                            <div id="editAnswersContainer-${question.QuestionID}">
                                ${Array.isArray(question.Answer) ?
                                question.Answer.map((answer, index) => `
                                    <div class="answer-input">
                                        <input type="text" id="editAnswerText-${question.QuestionID}-${index}" value="${answer.text}" placeholder="Edit answer ${index + 1}">
                                        <label style="margin-left:10px;" >
                                            <input type="checkbox" class="correct-answer4" onclick="toggleSingleCheck(this)" id="correct-${question.QuestionID}-${index}"  data-question-id="${question.QuestionID}" ${answer.correct ? 'checked' : ''}>
                                            Correct
                                        </label>
                                        <button class="deleteButton btn btn-danger button-Animation" style="margin-left: 10px;" type="button" onclick="deleteEditAnswer(${question.QuestionID}, ${index})">Delete</button>
                                    </div>
                                `).join('')
                                : ''
                                }
                            </div>
                            <div style="display:flex; margin-top:15px;">
                                <button class="btn btn-primary button-Animation" type="button" onclick="addEditAnswer(${question.QuestionID})">Add New Answer</button>
                                <button style="margin-left:630px; position:absolute"  class="btn btn-primary button-Animation" onclick="saveQuestion(${question.QuestionID})">Save Changes</button>
                                <hr>
                            </div>
                            <hr>
                        </div>
                    </div>
                `;
                questionList.appendChild(questionDiv);
                // Add event listeners here
                const questionTypeSelect2 = document.getElementById(`editType-${question.QuestionID}`);
                const questionTypeSelect3 = questionTypeSelect2.options[questionTypeSelect2.selectedIndex].text;
                const addAnswerButton2 = questionDiv.querySelector('.btn.btn-primary.button-Animation');
                const correctCheckboxes2 = questionDiv.querySelectorAll(`#editAnswersContainer-${question.QuestionID} input[type="checkbox`);

                if(questionTypeSelect3 ==='Fill in the Blank'){
                    correctCheckboxes2.forEach(checkbox => {
                        checkbox.style.display = 'none';
                    }); 
                }else{
                    correctCheckboxes2.forEach(checkbox => {
                        checkbox.style.display = 'inline-block';
                    });
                }

                questionTypeSelect2.addEventListener('change', function() {
                    if (questionTypeSelect2.value === '2') {
                        correctCheckboxes2.forEach(checkbox => {
                            checkbox.style.display = 'none';
                        });
                    } else {
                        correctCheckboxes2.forEach(checkbox => {
                            checkbox.style.display = 'inline-block';
                        });
                    }
                });
            });

            if (checkbox.checked) {
                // Uncheck all other checkboxes for the current question
                document.querySelectorAll(`.correct-answer[data-question-id="${questionId}"]`).forEach(cb => {
                    if (cb !== checkbox) {
                        cb.checked = false;
                    }
                });
            }
        })
        .catch(error => console.error('Error fetching questions:', error));
}

// Toggle details view for editing
function toggleDetails(button) {
    const detailsDiv = button.parentElement.nextElementSibling;
    detailsDiv.style.display = detailsDiv.style.display === 'none' ? 'block' : 'none';
}

// Delete question
function deleteQuestion(questionID) {
    fetch(`/api/delete-question/${questionID}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert(`Deleted question with ID: ${questionID}`);
                fetchQuestions(); // Refresh list
            } else {
                alert('Error deleting question');
            }
        })
        .catch(error => console.error('Error deleting question:', error));
}

// Add new answer input field for editing
function addEditAnswer(questionID) {
    const container = document.getElementById(`editAnswersContainer-${questionID}`);
    const newAnswerDiv = document.createElement('div');
    newAnswerDiv.classList.add('answer-input');

    newAnswerDiv.innerHTML = `
        <input type="text" placeholder="Enter question answer">
        <label style="margin-left:10px;">
            <input class="checkBox correct-answer4" type="checkbox" onclick="toggleSingleCheck(this)" name="correct-answer4-${questionID}"  data-question-id="${questionID}">
            Correct
        </label>
        <button class="btn btn-danger button-Animation" style="margin-left: 10px;" type="button" onclick="deleteEditAnswer(${questionID}, ${container.children.length})">Delete</button>
    `;
    container.appendChild(newAnswerDiv);
    // Check the problem type and hide/show the "Correct" checkbox
    const questionTypeSelect = document.getElementById(`editType-${questionID}`);
    const correctCheckboxes = container.querySelectorAll('.checkBox');

    if (questionTypeSelect.value === '2') { // Fill in the Blank
        correctCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'none';
        });
    } else {
        correctCheckboxes.forEach(checkbox => {
            checkbox.style.display = 'inline-block';
        });
    }

}

// Delete answer input field for editing
function deleteEditAnswer(questionID, answerIndex) {
    const container = document.getElementById(`editAnswersContainer-${questionID}`);
    container.children[answerIndex].remove();
}

// Save question changes
function saveQuestion(questionID) {
    const questionType = document.getElementById(`editType-${questionID}`).value;
    const questionText = document.getElementById(`editQuestion-${questionID}`).value;
    const answers = Array.from(document.querySelectorAll(`#editAnswersContainer-${questionID} .answer-input`)).map(answerDiv => {
        const answerInput = answerDiv.querySelector('input[type="text"]');
        const correctCheckbox = answerDiv.querySelector('input[type="checkbox"]');
        return {
            text: answerInput.value,
            correct: questionType === "2" ? true : correctCheckbox.checked
        };
    });

    const questionData = {
        QuestionID: questionID,
        type: questionType,
        topic: questionText,
        answers: answers
    };

    fetch(`/api/updateQuestion/${questionID}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Question updated successfully');
                fetchQuestions(); // Refresh list
            } else {
                alert('Error updating question');
            }
        })
        .catch(error => console.error('Error updating question:', error));
}

// By modifying the css of class="correct-answer", you can hide/show <input type="checkbox" class="correct-answer"> according to the selected question type
function questionTypecss() {
    var questionType = document.getElementById("questionType").value;
    var correctAnswer = document.getElementsByClassName("correct-answer2");
    if (questionType == 2) {
        for (var i = 0; i < correctAnswer.length; i++) {
            correctAnswer[i].style.display = "none";
        }
    } else {
        for (var i = 0; i < correctAnswer.length; i++) {
            correctAnswer[i].style.display = "block";
        }
    }
}

function addQuestionToQuiz() {
    const quizSelect = document.getElementById('addQuestionToQuizQuizID');
    const questionSelect = document.getElementById('addQuestionToQuizQuestionID');
    const quizID = quizSelect.value;
    const questionID = questionSelect.value;

    fetch(`/api/addQuestionToQuiz/${quizID}/${questionID}`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Question added to quiz');
                location.reload(); 
            } else {
                alert('Error adding question to quiz');
            }
        })
        .catch(error => console.error('Error adding question to quiz:', error));
}

function removeQuestionFromQuiz() {
    const quizSelect = document.getElementById('removeQuestionFromQuizQuizID');
    const questionSelect = document.getElementById('removeQuestionFromQuizQuestionID');
    const quizID = quizSelect.value;
    const questionID = questionSelect.value;

    fetch(`/api/removeQuestionFromQuiz/${quizID}/${questionID}`, {
        method: 'DELETE'
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Question removed from quiz');
                location.reload(); 
            } else {
                alert('Error removing question from quiz');
            }
        })
        .catch(error => console.error('Error removing question from quiz:', error));

}

// load quizzes
function loadQuizzes() {
    fetch('/getQuizzes')
        .then(response => response.json())
        .then(data => {
            const quizSelects = document.querySelectorAll('select[id^="addQuestionToQuizQuizID"], select[id^="removeQuestionFromQuizQuizID"]');
            quizSelects.forEach(select => {
                select.innerHTML = '<option value="" selected>Select a quiz</option>';
                data.forEach(quiz => {
                    const option = document.createElement('option');
                    option.value = quiz.QuizID;
                    option.textContent = quiz.QuizName;
                    select.appendChild(option);
                });
            });
        });
}

function loadAddQuestionToQuiz(quizID) {
    fetch(`/api/getQuestionsNotInQuiz/${quizID}`)
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const select = document.getElementById('addQuestionToQuizQuestionID');
            select.innerHTML = '<option value="" selected>Select a question</option>';
            data.forEach(question => {
                const option = document.createElement('option');
                option.value = question.QuestionID;
                option.innerText = question.Question;
                select.appendChild(option);
            });
        });
}

function loadRemoveQuestionFromQuiz(quizID) {
    fetch(`/api/getQuestions/${quizID}`)
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('removeQuestionFromQuizQuestionID');
            select.innerHTML = '<option value="" selected>Select a question</option>';
            data.forEach(question => {
                const option = document.createElement('option');
                option.value = question.QuestionID;
                option.innerText = question.Question;
                select.appendChild(option);
            });
        });
    }

document.addEventListener('DOMContentLoaded', () => {
    fetchQuestions();
    loadQuizzes();
});







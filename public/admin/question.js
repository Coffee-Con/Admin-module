function addAnswer() {
    const container = document.getElementById("answersContainer");
    const newAnswerDiv = document.createElement("div");
    newAnswerDiv.classList.add("answer-input");

    newAnswerDiv.innerHTML = `
      <button class="btn btn-danger button-Animation" style="margin-right:10px; "type="button" class="delete-button" onclick="deleteAnswer(this)">Delete</button>
      <input type="text" class="answer" placeholder="Enter question answer">
      <input type="checkbox" class="correct-answer"> Correct
  `;
    container.insertBefore(newAnswerDiv, container.lastElementChild);
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

    console.log(questionData);
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

                // 新的 answers 解析，包含 text 和 correct
                const answers = Array.isArray(question.Answer) ?
                    question.Answer.map(answer => `${answer.text} (${answer.correct ? 'Correct' : 'Incorrect'})`).join(', ') :
                    'No answers available';

                questionDiv.innerHTML = `
                    <div class="question-header">
                        <span style="font-weight:bold;">Q: ${question.Question}</span>
                        <button class="btn btn-danger button-Animation" style="margin-left:5px;" onclick="deleteQuestion(${question.QuestionID})">Delete</button>
                        <button class="btn btn-success button-Animation" style="margin-left:5px;" onclick="toggleDetails(this)">Edit</button>
                        <hr>
                    </div>
                    <div class="question-details" style="display: none;">
                        <div class="form-group">
                            <label>Type:</label>
                            <select id="editType-${question.QuestionID}">
                                <option value="1" ${question.QuestionType === 1 ? 'selected' : ''}>MCQ</option>
                                <option value="2" ${question.QuestionType === 2 ? 'selected' : ''}>Fill in the Blank</option>
                            </select>
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
                                            <input type="checkbox" id="correct-${question.QuestionID}-${index}" ${answer.correct ? 'checked' : ''}>
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
                // 在这里添加事件监听器
                const questionTypeSelect2 = document.getElementById(`editType-${question.QuestionID}`);
                const questionTypeSelect3 = questionTypeSelect2.options[questionTypeSelect2.selectedIndex].text;
                const addAnswerButton2 = questionDiv.querySelector('.btn.btn-primary.button-Animation');
                const correctCheckboxes2 = questionDiv.querySelectorAll(`#editAnswersContainer-${question.QuestionID} input[type="checkbox`);

                if(questionTypeSelect3 ==='Fill in the Blank'){
                    addAnswerButton2.style.display = 'none';
                    correctCheckboxes2.forEach(checkbox => {
                        checkbox.style.display = 'none';
                    }); 
                }else{
                    addAnswerButton2.style.display = 'inline-block';
                    correctCheckboxes2.forEach(checkbox => {
                        checkbox.style.display = 'inline-block';
                    });
                }

                questionTypeSelect2.addEventListener('change', function() {
                    if (questionTypeSelect2.value === '2') {
                        addAnswerButton2.style.display = 'none';
                        correctCheckboxes2.forEach(checkbox => {
                            checkbox.style.display = 'none';
                        });
                    } else {
                        addAnswerButton2.style.display = 'inline-block';
                        correctCheckboxes2.forEach(checkbox => {
                            checkbox.style.display = 'inline-block';
                        });
                    }
                });
            });
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
        <label>
            <input style="margin-left:10px;" type="checkbox">
            Correct
        </label>
        <button class="btn btn-danger button-Animation" style="margin-left: 10px;" type="button" onclick="deleteEditAnswer(${questionID}, ${container.children.length})">Delete</button>
    `;
    container.appendChild(newAnswerDiv);
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
            correct: correctCheckbox.checked
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

// 通过修改class="correct-answer"的css，实现根据选择的问题类型隐藏/显示<input type="checkbox" class="correct-answer">
function questionTypecss() {
    var questionType = document.getElementById("questionType").value;
    var correctAnswer = document.getElementsByClassName("correct-answer");
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

// Initialize question list on page load
window.onload = fetchQuestions;

document.addEventListener('DOMContentLoaded', function() {
    const questionTypeSelect = document.getElementById('questionType');
    const answersContainer = document.getElementById('answersContainer');
    const addAnswerButton = document.querySelector('.btn.btn-primary.button-Animation');
    const correctCheckboxes = document.querySelectorAll('.correct-answer');

    questionTypeSelect.addEventListener('change', function() {
        if (questionTypeSelect.value === '2') { // Fill in the Blank
            // 隐藏添加答案按钮和所有复选框
            addAnswerButton.style.display = 'none';
            correctCheckboxes.forEach(checkbox => {
                checkbox.style.display = 'none';
            });
        } else {
            // 显示添加答案按钮和所有复选框
            addAnswerButton.style.display = 'inline-block';
            correctCheckboxes.forEach(checkbox => {
                checkbox.style.display = 'inline-block';
            });
        }
    });
});




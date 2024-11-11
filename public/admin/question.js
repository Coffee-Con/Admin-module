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
  const answers = Array.from(document.querySelectorAll(".answer")).map(input => input.value);
  const correctAnswers = Array.from(document.querySelectorAll(".answer")).filter((input, index) => {
      const checkbox = input.parentElement.querySelector(".correct-answer");
      return checkbox.checked;
  }).map(input => input.value);
  
  // Validation: Check if at least one correct answer is selected
  if (correctAnswers.length === 0) {
      alert("Please select at least one correct answer.");
      return; // Stop execution if no correct answers are selected
  }

  const questionData = {
      type: questionType,
      topic: questionTopic,
      answers: answers,
      correctAnswers: correctAnswers
  };

  // Store questionData in JSON format (e.g., save to a server or log for testing)
  console.log(JSON.stringify(questionData));

  // Send questionData to the server
  fetch('/create-question', {
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

          console.log(data);

          data.forEach(question => {
              const questionDiv = document.createElement('div');
              questionDiv.classList.add('question-item');

              const answers = Array.isArray(question.Answer) ? question.Answer.join(', ') : 'No answers available';
              const correctAnswers = Array.isArray(question.CorrectAnswer) ? question.CorrectAnswer.join(', ') : 'No correct answers available';

              questionDiv.innerHTML = `
              <div class="question-header">
                  <span>${question.Question}</span>
                  <button class="btn btn-danger button-Animation" style="margin-left:5px;" onclick="deleteQuestion(${question.QuestionID})">Delete</button>
                  <button class="btn btn-primary button-Animation" style="margin-left:5px;" onclick="toggleDetails(this)">Edit</button>
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
                                  <input type="text" id="editAnswer-${question.QuestionID}-${index}" value="${answer}" placeholder="Edit answer ${index + 1}">
                                    <label>
                                        <input style="margin-left:10px;" type="checkbox" id="isCorrect-${question.QuestionID}-${index}" ${question.CorrectAnswer.includes(answer) ? 'checked' : ''}>
                                        Correct
                                    </label>
                                  <button class="btn btn-danger button-Animation" style="margin-left: 10px;" type="button" onclick="deleteEditAnswer(${question.QuestionID}, ${index})">Delete</button>
                              </div>
                          `).join('') 
                          : ''
                      }
                  </div>
                  <button class="btn btn-primary button-Animation" type="button" onclick="addEditAnswer(${question.QuestionID})">Add New Answer</button>
              </div>
                  <button class="btn btn-primary button-Animation" onclick="saveQuestion(${question.QuestionID})">Save Changes</button>
            </div>
          `;
          questionList.appendChild(questionDiv);
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

// Save question changes
function saveQuestion(questionID) {
  // You can add additional functionality to allow editing answers here
  alert('Save changes to the question functionality can be implemented here.');
}

// Initialize question list on page load
window.onload = fetchQuestions;
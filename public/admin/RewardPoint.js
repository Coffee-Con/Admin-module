function getUsersPoint() {
    fetch('/api/getUsersPoint')
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('UsersPoint');
        data.forEach((user, index) => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.Name}</td>
                <td>${user.RewardPoint}</td>
            `;
        });
    });
}

function getUsersRewards() {
    fetch('/api/getUsersRewards')
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('UsersRewards');
        data.forEach(reward => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${reward.UserID}</td>
                <td>${reward.RewardTime}</td>
                <td>${reward.RewardID}</td>
                <td>${reward.Status === 2 ? 'Completed' : 'In Progress'}</td>
                <td>
                    <button class="btn btn-success button-Animation" onclick="markCompleted(${reward.RewardID})" ${reward.Status === 2 ? 'disabled' : ''}>Completed</button>
                </td>
            `;
        });
    });
}

function markCompleted(rewardID) {
    fetch(`/api/markUserRewardCompleated/${rewardID}`, {
        method: 'POST'
    })
    .then(() => {
        getUsersRewards();
        getUsersPoint();
    });
}

function getCourseQuiz() {
    fetch('/api/getAllCourseQuizzes')
    .then(response => response.json())
    .then(data => {
        const select = document.getElementById('selectCourseQuiz');
        data.forEach(quiz => {
            const option = document.createElement('option');
            option.value = quiz.QuizID;
            option.innerText = `${quiz.CourseName} - ${quiz.QuizName} - Status: ${quiz.Status === 1 ? 'Active' : 'Ended'}`;
            select.appendChild(option);
        });
    });
}

function getUserQuizRank(QuizID) {
    fetch(`/api/getCourseQuizRank?QuizID=${QuizID}`, {
        method: 'GET'
    })
    .then(response => response.json())
    .then(data => {
        const table = document.getElementById('UserQuizScore');
        data.forEach((user, index) => {
            const row = table.insertRow();
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${user.UserID}</td>
                <td>${user.Name}</td>
                <td>${user.Score}</td>
                <td>${user.Time}</td>
                <td><input type="number" id="points${user.UserID}" value="${index + 1 == 1 ? 300 : index + 1 == 2 ? 250 : index + 1 == 3 ? 200 : index + 1 == 4 ? 150 : index + 1 == 5 ? 100 : 50}"></td>
            `;
        });
    });
}

function addUsersPoints() {
    const points = document.querySelectorAll('input[type="number"]');
    const userID = document.getElementById('UserQuizScore').rows[1].cells[1].innerText;

    points.forEach(point => {
        fetch(`/api/updateUserRewardPoint`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                UserID: point.parentElement.parentElement.cells[1].innerText,
                RewardPoint: point.value,
                Action: 'increase',
                ActionDetail: 'QuizRewardPoint'
            })
        });
    });
    getUsersPoint();
    alert('Points added successfully');
}

document.addEventListener('DOMContentLoaded', () => {
    getUsersPoint();
    getUsersRewards();
    getCourseQuiz();
});
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

document.addEventListener('DOMContentLoaded', () => {
    getUsersPoint();
});
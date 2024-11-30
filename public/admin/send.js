const form = document.getElementById("contact-form");

const formEvent = form.addEventListener("submit", (event) => {
  event.preventDefault();
  let mail = new FormData(form);
  sendMail(mail);
});

const sendMail = (mail) => {
  // Get all Name and Email input fields
  const names = document.getElementsByName('name[]');
  const emails = document.getElementsByName('email[]');
  
  // Add each recipient to the form data
  for (let i = 0; i < names.length; i++) {
    mail.append(`name[${i}]`, names[i].value);
    mail.append(`email[${i}]`, emails[i].value);
  }

  fetch("/send", {
    method: "post",
    body: mail,
  }).then((response) => {
    return response.text();
  }).then((data) => {
    alert(data);
  }).catch((error) => {
    alert("An error occurred: " + error);
  });
};

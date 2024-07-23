const form = document.getElementById("contact-form");

const formEvent = form.addEventListener("submit", (event) => {
  event.preventDefault();
  let mail = new FormData(form);
  sendMail(mail);
});

const sendMail = (mail) => {
  fetch("/send", {
    method: "post",
    body: mail,
  }).then((response) => {
    return response.text(); // 更改为返回文本
  }).then((data) => {
    document.getElementById("result-message").innerHTML = data;
  }).catch((error) => {
    document.getElementById("result-message").innerHTML = "An error occurred: " + error;
  });
};

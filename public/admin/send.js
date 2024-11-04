const form = document.getElementById("contact-form");

const formEvent = form.addEventListener("submit", (event) => {
  event.preventDefault();
  let mail = new FormData(form);
  sendMail(mail);
});

/*
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
*/
const sendMail = (mail) => {
  // 获取所有的 Name 和 Email 输入字段
  const names = document.getElementsByName('name[]');
  const emails = document.getElementsByName('email[]');
  
  // 将每个收件人添加到表单数据中
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
    document.getElementById("result-message").innerHTML = data;
  }).catch((error) => {
    document.getElementById("result-message").innerHTML = "An error occurred: " + error;
  });
};

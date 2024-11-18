document.addEventListener("DOMContentLoaded", () => {
    loadCourseOptions();
    loadMaterialList();
});

// 切换材料输入框
function toggleMaterialInput() {
    const materialType = document.getElementById("materialType").value;
    const videoLinkContainer = document.getElementById("videoLinkContainer");
    const pdfFileContainer = document.getElementById("pdfFileContainer");

    if (materialType === "1") {
        videoLinkContainer.style.display = "block";
        pdfFileContainer.style.display = "none";
    } else if (materialType === "2") {
        videoLinkContainer.style.display = "none";
        pdfFileContainer.style.display = "block";
    } else {
        videoLinkContainer.style.display = "none";
        pdfFileContainer.style.display = "none";
    }
}

// 加载课程选项
function loadCourseOptions() {
    fetch("/getCourses")
        .then((response) => response.json())
        .then((data) => {
            const courseSelect = document.getElementById("courseID");
            data.forEach((course) => {
                const option = document.createElement("option");
                option.value = course.CourseID;
                option.textContent = course.CourseName;
                courseSelect.appendChild(option);
            });
        })
        .catch((error) => console.error("Error loading courses:", error));
}

// 添加材料
function addMaterial() {
    const courseID = document.getElementById("courseID").value;
    const materialName = document.getElementById("materialName").value;
    const materialDescription = document.getElementById("materialDescription").value;
    const materialType = document.getElementById("materialType").value;
    const materialLink = document.getElementById("materialLink").value;
    const materialFile = document.getElementById("materialFile").files[0];

    // 验证输入
    if (!courseID || !materialName || !materialType) {
        alert("Please fill in all required fields.");
        return;
    }

    // 使用对象存储输入数据
    const materialData = {
        CourseID: courseID,
        MaterialName: materialName,
        MaterialDescription: materialDescription,
        MaterialType: materialType,
        MaterialLink: materialType === "1" ? materialLink : null,
    };

    // 使用 FormData 发送数据，特别是包含文件时
    const formData = new FormData();
    formData.append("materialData", JSON.stringify(materialData));

    // 如果是上传 PDF 文件
    if (materialType === "2" && materialFile) {
        formData.append("file", materialFile);
    }

    fetch("/api/createMaterial", {
        method: "POST",
        body: formData,
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            alert("Material added successfully.");
            loadMaterialList();
        } else {
            alert(data.error || "Error adding material.");
        }
    })
    .catch((error) => console.error("Error:", error));
}

// 加载材料列表
function loadMaterialList() {
    fetch("/api/getMaterials")
        .then((response) => response.json())
        .then((data) => {
            const materialList = document.getElementById("materialList");
            materialList.innerHTML = "";

            data.forEach((material) => {
                const div = document.createElement("div");
                div.className = "material-item";
                div.innerHTML = `
                  <h4>${material.MaterialName}</h4>
                  <p>${material.MaterialDescription}</p>
                  <a href="${material.MaterialLink}" target="_blank">Open Material</a>
              `;
                materialList.appendChild(div);
            });
        })
        .catch((error) => console.error("Error loading materials:", error));
}
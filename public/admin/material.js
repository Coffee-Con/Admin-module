document.addEventListener("DOMContentLoaded", () => {
    loadCourseOptions();
    loadMaterialList();
});

// Toggle material input box
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

// Loading Course Options
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

        const courseSelect2 = document.getElementById("courseID2");
        data.forEach((course) => {
            const option = document.createElement("option");
            option.value = course.CourseID;
            option.textContent = course.CourseName;
            courseSelect2.appendChild(option);
        });
    })
    .catch((error) => console.error("Error loading courses:", error));
}

// Add Material
function addMaterial() {
    const materialName = document.getElementById("materialName").value;
    const materialDescription = document.getElementById("materialDescription").value;
    const materialType = document.getElementById("materialType").value;
    const materialLink = document.getElementById("materialLink").value;
    const materialFile = document.getElementById("materialFile").files[0];

    // Validating Input
    if (!materialName || !materialType) {
        alert("Please fill in all required fields.");
        return;
    }

    // Save the material data
    const materialData = {
        MaterialName: materialName,
        MaterialDescription: materialDescription,
        MaterialType: (materialType === "1") ? 1 : (materialType === "2" ? 2 : materialType), // 1: video, 2: pdf
        MaterialLink: materialType === "1" ? materialLink : null,
    };

    // Use FormData to send data, especially when including files
    const formData = new FormData();
    formData.append("materialData", JSON.stringify(materialData));

    // If you upload a PDF file
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

// Delete Material
function deleteMaterial(MaterialID) {
    fetch(`/api/deleteMaterial/${MaterialID}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            alert('Material deleted successfully');
            loadMaterialList(); // Refresh the material list
        } else {
            alert(data.error || 'Error deleting material');
        }
    })
    .catch(err => console.error('Error deleting material:', err));
}

// Load Course Material
function loadMaterialList() {
    fetch("/api/getMaterials")
    .then((response) => response.json())
    .then((data) => {
        const materialList = document.getElementById("materialListBody");
        materialList.innerHTML = "";

        data.forEach((material) => {
            const tr = document.createElement("tr");
            tr.className = "material-item";
            tr.innerHTML = `
                <td>${material.MaterialName}</td>
                <td>${material.MaterialDescription}</td>
                <td><a href="${material.MaterialLink}" target="_blank">Open Material</a></td>
                <td><button class="btn btn-danger button-Animation" onclick="deleteMaterial(${material.MaterialID})">Delete</button></td>
            `;
            materialList.appendChild(tr);
        });
    })
    .catch((error) => console.error("Error loading materials:", error));
}

function addMaterialToCourse() {
    const CourseID = document.getElementById("courseID").value;
    const MaterialID = document.getElementById("materialID").value;

    fetch("/api/addMaterialToCourse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ CourseID, MaterialID }),
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.success) {
            alert("Material added to course successfully.");
            loadCourseMaterial(CourseID);
        } else {
            alert(data.error || "Error adding material to course.");
        }
    })
    .catch((error) => console.error("Error:", error));
}

function loadCourseMaterial(CourseID) {
    if (!CourseID) {
        const materialList = document.getElementById("RemoveMaterialListBody");
        materialList.innerHTML = "";
        return;
    }

    fetch(`/api/getCourseMaterials/${CourseID}`)
    .then((response) => response.json())
    .then((data) => {
        const materialList = document.getElementById("RemoveMaterialListBody");
        materialList.innerHTML = ""; // Clear existing rows

        data.forEach((material) => {
            // Create a new row (tr)
            const tr = document.createElement("tr"); 
            
            // Add the material information into the row
            tr.innerHTML = `
                <td>${material.MaterialID}</td>
                <td>${material.MaterialName}</td>
                <td>${material.MaterialDescription}</td>
                <td><a href="${material.MaterialLink}" target="_blank">Link</a></td>
                <td><button class="btn btn-danger button-Animation" onclick="deleteCourseMaterial(${material.CourseMaterialID})">Delete</button></td>
            `;
            
            // Append the new row to the table body
            materialList.appendChild(tr);
        });
    })
    .catch((error) => console.error("Error loading materials:", error));
}

function getMaterialsNotInCourse(CourseID) {
    if (!CourseID) {
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a material";
        materialSelect.appendChild(defaultOption);
        return;
    }

    fetch(`/api/getMaterialsNotInCourse/${CourseID}`)
    .then((response) => response.json())
    .then((data) => {
        const materialSelect = document.getElementById("materialID");
        materialSelect.innerHTML = "";

        // Add default "Select a material" option
        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select a material";
        materialSelect.appendChild(defaultOption);

        if (data.length === 0) {
            materialSelect.innerHTML = "";
            const defaultOption = document.createElement("option");
            defaultOption.value = "";
            defaultOption.textContent = "Select a material";
            materialSelect.appendChild(defaultOption);
            return;
        }

        // Add materials to the select dropdown
        data.forEach((material) => {
            const option = document.createElement("option");
            option.value = material.MaterialID;
            option.textContent = material.MaterialName;
            materialSelect.appendChild(option);
        });
    })
    .catch((error) => console.error("Error loading materials:", error));
}

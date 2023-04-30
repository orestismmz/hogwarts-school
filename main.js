"use strict";

let students = [];

// events cannot listen to async functions so I call start in an anonymous function
window.addEventListener("DOMContentLoaded", () => start());

async function start() {
  onFilterSelection();
  let [studentsData, bloodData] = await fetchData();
  students = generateStudents(studentsData, bloodData);
  displayList(students);
  console.log(students);
}

async function fetchData() {
  return await Promise.all([
    fetch("https://petlatkea.dk/2021/hogwarts/students.json").then((response) => response.json()),
    fetch("https://petlatkea.dk/2021/hogwarts/families.json").then((response) => response.json()),
  ]);
}

function generateStudents(studentsData, bloodData) {
  return studentsData
    .map((jsonObject) => {
      const nameParts = jsonObject.fullname
        .trim()
        .split(" ")
        .filter((str) => str);

      if (!nameParts || nameParts.length === 0) {
        return null;
      }

      // New properties and values
      jsonObject.firstName = capitalizeFirstLetter(nameParts[0]);
      jsonObject.house = capitalizeFirstLetter(jsonObject.house.trim());
      jsonObject.gender = capitalizeFirstLetter(jsonObject.gender.trim());
      if (nameParts.length === 2) {
        jsonObject.lastName = capitalizeFirstLetter(nameParts[1]);
      } else if (nameParts.length === 3) {
        if (nameParts[1].startsWith('"') && nameParts[1].endsWith('"')) {
          jsonObject.nickName = capitalizeFirstLetter(nameParts[1].slice(1, -1)); // remove the quotes
        } else {
          jsonObject.middleName = capitalizeFirstLetter(nameParts[1]);
        }
        jsonObject.lastName = capitalizeFirstLetter(nameParts[nameParts.length - 1]);
      }
      jsonObject.fullName = `${jsonObject.firstName} ${
        jsonObject.middleName ? jsonObject.middleName : ""
      } ${jsonObject.nickName ? jsonObject.nickName : ""} ${
        jsonObject.lastName ? jsonObject.lastName : ""
      }`;

      if (jsonObject.lastName === "Patil") {
        jsonObject.image = `img/${jsonObject.lastName}_${jsonObject.firstName}.png`;
      } else if (jsonObject.firstName === "Leanne") {
        jsonObject.image = `img/noimage.png`;
      } else {
        jsonObject.image = `img/${
          jsonObject.lastName
            ? jsonObject.lastName.slice(jsonObject.lastName.indexOf("-") + 1).toLowerCase()
            : ""
        }_${jsonObject.firstName ? jsonObject.firstName[0].toLowerCase() : ""}.png`;
      }

      const halfBloods = bloodData.half;
      const pureBloods = bloodData.pure;

      if (halfBloods.includes(jsonObject.lastName)) {
        jsonObject.bloodStatus = "Half";
      } else if (pureBloods.includes(jsonObject.lastName)) {
        jsonObject.bloodStatus = "Pure";
      } else {
        jsonObject.bloodStatus = "Muggle";
      }
      jsonObject.prefect = false;
      jsonObject.squadMember = false;
      jsonObject.status = "enrolled";

      return jsonObject;
    })
    .filter((jsonObject) => jsonObject);
}

function onFilterSelection() {
  document.querySelector("#filters").addEventListener("change", filterStudents);
  document.querySelector("#search-button").addEventListener("click", filterStudents);
}

function filterStudents() {
  const houseFilter = document.getElementById("house-filter").value;
  const prefectsFilter = document.getElementById("prefects-filter").value;
  const squadFilter = document.getElementById("squad-filter").value;
  const statusFilter = document.getElementById("student-status-filter").value;
  const searchInput = document.getElementById("search").value;

  const filteredStudents = students.filter((student) => {
    if (houseFilter !== "all-houses" && student.house.toLowerCase() !== houseFilter.toLowerCase()) {
      return false;
    }
    if (prefectsFilter !== "-") {
      if (prefectsFilter === "yes" && !student.prefect) {
        return false;
      }
      if (prefectsFilter === "no" && student.prefect) {
        return false;
      }
    }
    if (squadFilter !== "-") {
      if (squadFilter === "yes" && !student.squadMember) {
        return false;
      }
      if (squadFilter === "no" && student.squadMember) {
        return false;
      }
    }
    if (statusFilter !== "-" && statusFilter !== student.status) {
      return false;
    }
    if (searchInput) {
      if (!student.fullName.toLowerCase().includes(searchInput.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
  displayList(filteredStudents);
}

function displayList(students) {
  // clear the list
  let studentList = document.querySelector("#student-list");
  studentList.innerHTML = "";

  // create a student fields with properties
  students.forEach((student) => {
    let studentField = document.createElement("article");

    let studentImage = document.createElement("img");
    let studentName = document.createElement("h2");

    studentImage.src = student.image;
    studentImage.alt = "";
    studentName.textContent = `${student.firstName} ${student.lastName ? student.lastName : ""}`;

    studentField.appendChild(studentImage);
    studentField.appendChild(studentName);

    studentField.classList.add("students");

    // add a data set to the student field
    studentField.dataset.name = `${student.firstName} ${
      student.middleName ? student.middleName : ""
    } ${student.lastName ? student.lastName : ""}`;

    // display modal
    studentField.addEventListener("click", () => {
      const modal = document.querySelector("#modal");
      modal.classList.remove("hidden");

      // fill in student properties
      let modalImage = document.querySelector("#modal-image");
      modalImage.src = student.image;
      let studentFirstName = document.querySelector("#first-name-field");
      let studentMiddleName = document.querySelector("#middle-name-field");
      let studentNickName = document.querySelector("#nick-name-field");
      let studentLastName = document.querySelector("#last-name-field");
      let studentHouse = document.querySelector("#house-field");
      let studentGender = document.querySelector("#gender-field");
      let squadMemberLi = document.querySelector("#squad-member-li");
      let prefectLi = document.querySelector("#prefect-li");

      const expellCheckbox = document.querySelector("#expell");
      const prefectCheckbox = document.querySelector("#set-prefect");
      const squadCheckbox = document.querySelector(
        '#set-squad-member:not([style*="display:none;"])'
      );

      studentFirstName.textContent = student.firstName;

      studentMiddleName.textContent = student.middleName ? student.middleName : "";
      studentNickName.textContent = student.nickName ? student.nickName : "";
      studentLastName.textContent = student.lastName ? student.lastName : "";
      studentHouse.textContent = student.house;
      studentGender.textContent = student.gender;

      if (student.prefect) {
        prefectLi.classList.remove("hidden");
      } else {
        prefectLi.classList.add("hidden");
      }

      if (student.squadMember) {
        squadMemberLi.classList.remove("hidden");
      } else {
        squadMemberLi.classList.add("hidden");
      }

      if (student.house !== "Slytherin") {
        document.querySelector("[data-name='set-squad-member']").classList.add("hidden");
      } else {
        document.querySelector("[data-name='set-squad-member']").classList.remove("hidden");
      }

      if (student.status === "expelled") {
        document.querySelector("[data-name='assign-buttons']").classList.add("hidden");
      } else {
        document.querySelector("[data-name='assign-buttons']").classList.remove("hidden");
        expellCheckbox.checked = false;
      }
      prefectCheckbox.checked = student.prefect;
      squadCheckbox.checked = student.squadMember;

      // on save & exit
      document.querySelector("#modal-save-button").addEventListener("click", (_) => {
        if (prefectCheckbox.checked) {
          let houseOtherPrefectsLength = students.filter(
            (st) => st.house === student.house && st.prefect && student.fullname !== st.fullname
          ).length;

          if (houseOtherPrefectsLength > 1) {
            window.alert(`${student.house} cannot have any more prefects`);
            return;
          }

          student.prefect = prefectCheckbox.checked;
        } else {
          student.prefect = prefectCheckbox.checked;
        }

        if (expellCheckbox.checked) {
          student.status = "expelled";
        }

        if (squadCheckbox) {
          student.squadMember = squadCheckbox.checked;
        }

        document.querySelector("#modal").classList.add("hidden");
        displayList(students);
      });
    });

    if (student.status === "expelled") {
      studentField.classList.add("low-opacity");
    } else {
      studentField.classList.remove("low-opacity");
    }

    // fill the list
    studentList.appendChild(studentField);

    // results number
    document.querySelector("#results").textContent = students.length;
  });
}

function capitalizeFirstLetter(str) {
  if (!str) {
    return null;
  }
  return str[0].toUpperCase() + str.substring(1).toLowerCase();
}

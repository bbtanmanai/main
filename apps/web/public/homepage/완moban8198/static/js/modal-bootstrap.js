
const contactInfoSection = document.getElementById("contactInfoSection");
const cvUploadSection = document.getElementById("cvUploadSection");
const confirmationSection = document.getElementById("confirmationSection");
const thankYouSection = document.getElementById("thankYouSection");
const nextStepButton = document.getElementById("nextStepButton");
const submitButton = document.getElementById("submitButton");
const backButton = document.getElementById("backButton");
const confirmButton = document.getElementById("confirmButton");
const progressBar = document.getElementById("progressBar");
const modalHeader = document.querySelector(".modal-header");
const modalFooter = document.querySelector(".modal-footer");

let progress = 50;
confirmButton.style.display = "none";
 
nextStepButton.addEventListener("click", function () {
  const fields = [
    {
      element: document.getElementById("fname"),
      error: document.getElementById("nameError"),
    },
    {
      element: document.getElementById("e-mail"),
      error: document.getElementById("emailError"),
    },
    {
      element: document.getElementById("ctext"),
      error: document.getElementById("countryError"),
    },
    {
      element: document.getElementById("number"),
      error: document.getElementById("phoneError"),
    },
  ];

  let isValid = true;
 
  fields.forEach(({ element, error }) => {
    if (!element.value.trim()) {
      error.style.display = "block";
      isValid = false;
    } else {
      error.style.display = "none";
    }
  });

  if (!isValid) return;  
 
  contactInfoSection.style.display = "none";
  cvUploadSection.style.display = "block";
  nextStepButton.style.display = "none";
  submitButton.style.display = "block";
  backButton.style.display = "block";
  progress = 100;
  updateProgressBar();
});
 
submitButton.addEventListener("click", function () {
  document.getElementById("summaryName").innerText =
    document.getElementById("fname").value;
  document.getElementById("summaryEmail").innerText =
    document.getElementById("e-mail").value;
  document.getElementById("summaryCountry").innerText =
    document.getElementById("ctext").value;
  document.getElementById("summaryNumber").innerText =
    document.getElementById("number").value;
  document.getElementById("summaryFileName").innerText =
    document.getElementById("fileName").textContent;

  cvUploadSection.style.display = "none";
  confirmationSection.style.display = "block";
  submitButton.style.display = "none";
  confirmButton.style.display = "block";
});
 
confirmButton.addEventListener("click", function () {
  confirmationSection.style.display = "none";
  thankYouSection.style.display = "block";
  backButton.style.display = "none";
  confirmButton.style.display = "none";

  if (modalHeader) modalHeader.style.display = "none";
  if (modalFooter) modalFooter.style.display = "none";
});
 
backButton.addEventListener("click", function () {
  if (confirmationSection.style.display === "block") {
    confirmationSection.style.display = "none";
    cvUploadSection.style.display = "block";
    submitButton.style.display = "block";
    confirmButton.style.display = "none";
  } else if (cvUploadSection.style.display === "block") {
    cvUploadSection.style.display = "none";
    contactInfoSection.style.display = "block";
    nextStepButton.style.display = "block";
    backButton.style.display = "none";
    progress = 50;
    updateProgressBar();
  }
});
 
function updateProgressBar() {
  progressBar.style.width = progress + "%";
  progressBar.setAttribute("aria-valuenow", progress);
}
 
document.getElementById("cvUpload").addEventListener("change", function () {
  const file = this.files[0];
  document.getElementById("fileName").textContent = file ? file.name : "";
});

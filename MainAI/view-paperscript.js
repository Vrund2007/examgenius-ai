let loadUserPapers;

firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "../Login/login.html";
  } else {
    console.log("User is signed in:", user.email);
    if (loadUserPapers) {
      loadUserPapers(user.uid);
    }
  }
});

function signOut() {
  firebase
    .auth()
    .signOut()
    .then(() => {
      console.log("User signed out.");
      alert("Signed out successfully!");
      window.location.href = "../Login/login.html";
    })
    .catch((error) => {
      console.error("Sign out error:", error);
      alert("Error signing out. Please try again.");
    });
}

document.addEventListener("DOMContentLoaded", function () {
  const papersContainer = document.getElementById("papers-container");
  const sortSelect = document.getElementById("sort-select");

  
  loadUserPapers = async function(userId) {
    try {
      const response = await fetch(
        `http://localhost/get_user_papers.php?user_id=${userId}`
      );
      const result = await response.json();

      if (result.success && result.papers.length > 0) {
        renderPdfs(result.papers);
        setupSorting(result.papers);
      } else {
        papersContainer.innerHTML =
          '<p class="no-papers">No papers found. Generate some first!</p>';
        sortSelect.style.display = "none";
      }
    } catch (error) {
      console.error("Error loading papers:", error);
      papersContainer.innerHTML =
        '<p class="error-message">Failed to load papers. Please try again later.</p>';
    }
  };

  
  function renderPdfs(pdfs) {
    papersContainer.innerHTML = "";

    pdfs.forEach((pdf) => {
      const paperCard = document.createElement("a");
      paperCard.href = pdf.download_url;
      paperCard.target = "_blank";
      paperCard.className = "paper-card";

      paperCard.innerHTML = `
                <div class="paper-icon">
                    <i class="fas fa-file-pdf"></i>
                </div>
                <h3 class="paper-name">${pdf.file_name}</h3>
                <p class="paper-date">Created: ${formatDate(
                  pdf.date_created
                )}</p>
                <p class="paper-type">${pdf.exam_type}</p>
            `;

      papersContainer.appendChild(paperCard);
    });
  }
  

  function formatDate(dateString) {
    const options = {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  }

  
  function setupSorting(pdfs) {
    sortSelect.style.display = "block";

    sortSelect.addEventListener("change", function () {
      const sortedPdfs = [...pdfs];

      sortedPdfs.sort((a, b) => {
        const dateA = new Date(a.date_created);
        const dateB = new Date(b.date_created);

        return this.value === "newest" ? dateB - dateA : dateA - dateB;
      });

      renderPdfs(sortedPdfs);
    });
  }
});
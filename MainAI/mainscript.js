firebase.auth().onAuthStateChanged((user) => {
  if (!user) {
    // Userr not sign in
    window.location.href = "../Login/login.html";
  } else {
    console.log("User is signed in:", user.email);
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

document.getElementById("your-papers-btn").addEventListener("click", () => {
  window.open("view-paper.html", "_blank");
});

document.addEventListener("DOMContentLoaded", function () {
  const jeeBtn = document.querySelector("#jee-option .generate-btn");
  const neetBtn = document.querySelector("#neet-option .generate-btn");
  jeeBtn.addEventListener("click", () => generatePDF("JEE"));
  neetBtn.addEventListener("click", () => generatePDF("NEET"));

  async function generatePDF(examType) {
    const btn = examType === "JEE" ? jeeBtn : neetBtn;
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    btn.disabled = true;

    try {
      // pdf loading
      if (!window.jsPDF) {
        throw new Error("jsPDF library not loaded - check the script tag");
      }
      const apiEndpoint =
        examType === "JEE"
          ? "http://localhost:3000/generate-questions"
          : "http://localhost:3000/generate-questionneet";

      // api call
      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          examType: examType,
          subject: examType === "NEET" ? "Biology" : "Mathematics",
          difficulty: "Medium",
          numQuestions: examType === "NEET" ? 15 : 15,
        }),
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const result = await response.json();
      console.log("API Response:", result);

      // que extract
      const questions = result.questions?.questions || [];
      if (!questions.length) {
        throw new Error("Received empty questions array from API");
      }

      // new pdf
      const pdf = new window.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const styles = {
        title: { size: 16, spacing: 10, color: [0, 0, 128] },
        question: { size: 11, spacing: 6, color: [0, 0, 0] },
        option: { size: 10, spacing: 5, indent: 10, color: [30, 30, 30] }, 
        footer: { size: 9, color: [100, 100, 100] }, 
      };

      const margins = {
        top: 25,
        left: 15,
        right: 15,
        bottom: 20,
      };

      const addHeader = (isContinued = false) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(styles.title.size);
        pdf.setTextColor(...styles.title.color);

        const title = `${examType} QUESTION PAPER${
          isContinued ? " (Continued)" : ""
        }`;
        pdf.text(title, 105, margins.top - 10, { align: "center" });

        pdf.setDrawColor(150, 150, 150);
        pdf.setLineWidth(0.3);
        pdf.line(margins.left, margins.top, 210 - margins.right, margins.top);
      };

      const addQuestion = (question, index, yPosition) => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(styles.question.size);
        pdf.setTextColor(...styles.question.color);

      
        const questionText = `${index + 1}. ${question.q}`;
        const questionLines = pdf.splitTextToSize(
          questionText,
          180 - margins.left - margins.right
        );

        
        pdf.text(questionLines, margins.left, yPosition);
        let currentY =
          yPosition + questionLines.length * styles.question.spacing;

          
        pdf.setFontSize(styles.option.size);
        pdf.setTextColor(...styles.option.color);

        question.options.forEach((option, optIndex) => {
          const cleanOption = option.replace(/^[A-Za-z]\)\s*/, "");
          const optionText = `${String.fromCharCode(
            97 + optIndex
          )}. ${cleanOption}`;
          pdf.text(optionText, margins.left + styles.option.indent, currentY);
          currentY += styles.option.spacing;
        });

        return currentY + 8; 
      };
      
      //genrate pdf
      let currentPage = 1;
      let yPos = margins.top + 15; 
      addHeader();

      // add que
      for (let i = 0; i < questions.length; i++) {
        if (yPos > 297 - margins.bottom - 50) {
          pdf.addPage();
          currentPage++;
          yPos = margins.top + 10;
          addHeader(true);
        }

        yPos = addQuestion(questions[i], i, yPos);
      }

      const answerKey = [];
      for (let i = 0; i < questions.length; i++) {
        answerKey.push({ number: i + 1, answer: questions[i].ans });
      }

      // add ans key
      pdf.addPage();
      currentPage++;
      yPos = margins.top + 10;

      
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(styles.title.size);
      pdf.text("ANSWER KEY", 105, yPos, { align: "center" });
      yPos += 15;

      
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);

      
      const colWidth = 60;
      const answersPerCol = Math.ceil(answerKey.length / 3);

      for (let col = 0; col < 3; col++) {
        const startIdx = col * answersPerCol;
        const endIdx = Math.min(startIdx + answersPerCol, answerKey.length);
        let colY = yPos;

        for (let i = startIdx; i < endIdx; i++) {
          const { number, answer } = answerKey[i];
          pdf.text(`${number}. ${answer}`, 15 + col * colWidth, colY);
          colY += 7;
        }
      }

      
      pdf.setFontSize(styles.footer.size);
      pdf.setTextColor(...styles.footer.color);
      pdf.text(
        `Page ${currentPage} • Generated on ${new Date().toLocaleDateString()}`,
        105,
        297 - margins.bottom + 10,
        { align: "center" }
      );

      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const seconds = String(now.getSeconds()).padStart(2, "0");

      const formattedDateTime = `${year}-${month}-${day}_${hours}:${minutes}:${seconds}`;
      const fileName = `${examType}_Question_Paper_${formattedDateTime}.pdf`;

      
      const pdfBlob = pdf.output("blob");

      try {
        const downloadUrl = await uploadToCloudinary(pdfBlob, fileName);

        const user = firebase.auth().currentUser;
        const now = new Date().toISOString();

        const dbResponse = await fetch(
          "http://localhost/insert_pdf_metadata.php",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              file_name: fileName,
              date: now,
              user_id: user.uid,
              download_url: downloadUrl,
              exam_type: examType,
            }),
          }
        );

        const dbResult = await dbResponse.json();
        if (!dbResult.success) {
          console.error("Database insertion failed:", dbResult.error);
        }

        alert(`File available at: ${downloadUrl}`);
        window.open(downloadUrl, "_blank");
      } catch (error) {
        alert("Failed to upload PDF. Please try again.");
      }

      pdf.save(fileName);
    } catch (error) {
      console.error("PDF Generation Error:", error);
      alert(`Failed to generate PDF: ${error.message}`);
    } finally {
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  }

  async function uploadToCloudinary(fileBlob, fileName) {
    try {
      const formData = new FormData();
      formData.append("file", fileBlob);
      formData.append("upload_preset", "unsigned_pdf_upload");
      formData.append("public_id", fileName.slice(0, -4));

      // Add metadata
      const now = new Date().toISOString();
      const examType = fileName.includes("JEE") ? "JEE" : "NEET";
      const user = firebase.auth().currentUser;
      if (!user) {
        alert("User not authenticated. Cannot upload metadata.");
        return downloadUrl; 
      }
      const userId = user.uid;

      
      const context = `alt=${fileName}|caption=${examType}|created_at=${now}|user_id=${userId}`;
      formData.append("context", context);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dol7leoig/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Cloudinary upload failed: ${await response.text()}`);
      }

      const data = await response.json();
      const downloadUrl = data.secure_url;

      return downloadUrl;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload PDF: " + error.message);
    }
  }
});


function animateButton(button) {
  button.disabled = true;
  button.innerHTML =
    '<i class="fas fa-spinner fa-spin"></i><span>Generating...</span>';
  button.style.pointerEvents = "none";
}


function resetButton(button) {
  button.disabled = false;
  button.innerHTML =
    '<span>Generate Paper</span><i class="fas fa-arrow-right"></i>';
  button.style.pointerEvents = "auto";
}


const optionCards = document.querySelectorAll(".option-card");
optionCards.forEach((card) => {
  card.addEventListener("mouseenter", function () {
    const icon = this.querySelector(".card-icon i");
    icon.style.transform = "scale(1.1)";
    icon.style.color = "#ffffff";
  });

  card.addEventListener("mouseleave", function () {
    const icon = this.querySelector(".card-icon i");
    icon.style.transform = "scale(1)";
    icon.style.color = "#64ffda";
  });
});


const features = document.querySelectorAll(".feature");
const observerOptions = {
  threshold: 0.1,
};

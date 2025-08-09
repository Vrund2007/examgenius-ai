document.addEventListener("DOMContentLoaded", function () {
  
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      document.querySelector(this.getAttribute("href")).scrollIntoView({
        behavior: "smooth",
      });
    });
  });

  
  const jeeButton = document.querySelector("#jee-option .generate-btn");
  const neetButton = document.querySelector("#neet-option .generate-btn");

  if (jeeButton)
    jeeButton.addEventListener("click", () => handleGenerate("JEE"));
  if (neetButton)
    neetButton.addEventListener("click", () => handleGenerate("NEET"));

  
  function handleGenerate(examType) {
    alert(`Generating ${examType} paper...`);

    
    const doc = new jsPDF();
    doc.text(`Your ${examType} Paper`, 10, 10);
    doc.save(`${examType}_Paper.pdf`);
  }

  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate");
        }
      });
    },
    {
      threshold: 0.1,
    }
  );

  document.querySelectorAll(".feature-card, .step").forEach((el) => {
    observer.observe(el);
  });
});

document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const progressBar = document.getElementById('progressBar');
    const currIdxTxt = document.getElementById('currIdx');
    const totalIdxTxt = document.getElementById('totalIdx');

    if (totalIdxTxt) totalIdxTxt.textContent = slides.length;

    function updateStatus() {
        if (!progressBar || !currIdxTxt) return;
        
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = scrollPercent + '%';

        let current = 1;
        slides.forEach((slide, idx) => {
            const slideTop = slide.offsetTop;
            if (scrollTop >= slideTop - 100) current = idx + 1;
        });
        currIdxTxt.textContent = current;
    }

    window.nextSlide = function() { window.scrollBy(0, window.innerHeight); };
    window.prevSlide = function() { window.scrollBy(0, -window.innerHeight); };

    window.addEventListener('scroll', updateStatus);
    window.addEventListener('resize', updateStatus);
    updateStatus();
});

// PDF Generation
window.generatePDF = function() {
    if (typeof html2pdf === 'undefined') {
        alert('PDF 라이브러리가 로드되지 않았습니다.');
        return;
    }
    const element = document.body;
    const cleanTitle = document.title.replace(/[\[\]]/g, '');
    const opt = {
        margin: [10, 10, 10, 10],
        filename: 'linkdrop_' + cleanTitle + '.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
};

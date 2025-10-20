// Animación de aparición al hacer scroll
const items = document.querySelectorAll('.menu-item');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
});
items.forEach(item => observer.observe(item));

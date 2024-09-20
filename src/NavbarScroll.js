// © 2024 Learning for Well-Being Institute. All rights reserved.
// Policy Decision Tree
// policydecisions.org

let lastScrollTop = 0;
let navbar;
let navbarHeight;

// Function to initialize navbar variables
function initNavbar() {
  navbar = document.querySelector('.navbar');
  if (navbar) {
    navbarHeight = navbar.getBoundingClientRect().height;
  }
}

// Function to handle scroll
function handleScroll() {
  if (!navbar) return; // Exit if navbar is not found

  let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  
  if (scrollTop > lastScrollTop && scrollTop > navbarHeight * 2) {
    // Scrolling down & past twice the navbar height
    navbar.classList.add('navbar--hidden');
  } else if (scrollTop < lastScrollTop || scrollTop <= navbarHeight) {
    // Scrolling up or near the top
    navbar.classList.remove('navbar--hidden');
  }
  
  lastScrollTop = scrollTop;
}

// Initialize navbar when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initNavbar);

// Add scroll event listener
window.addEventListener('scroll', handleScroll);

// Re-initialize navbar on window resize (in case of responsive design changes)
window.addEventListener('resize', initNavbar);
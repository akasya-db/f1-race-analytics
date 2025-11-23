document.addEventListener('DOMContentLoaded', function() {
  const flashMessages = document.querySelectorAll('.flash-message');
  flashMessages.forEach(function(message) {
    setTimeout(function() {
      message.remove();
    }, 4000);
  });
});

// Kullanıcı dropdown'ını aç/kapat
function toggleDropdown() {
  const dropdown = document.querySelector('.user-dropdown');
  if (dropdown) {
    dropdown.classList.toggle('open');
  }
}

// Dışına tıklayınca dropdown'ı kapat
document.addEventListener('click', function(event) {
  const dropdown = document.querySelector('.user-dropdown');
  if (dropdown && !dropdown.contains(event.target)) {
    dropdown.classList.remove('open');
  }
});

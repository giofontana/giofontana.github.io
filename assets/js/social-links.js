// Ensure all anchor elements with class `social-link` open in a new tab
document.addEventListener('DOMContentLoaded', function () {
  try {
    var links = document.querySelectorAll('a.social-link');
    links.forEach(function (a) {
      if (!a.hasAttribute('target')) a.setAttribute('target', '_blank');
      var rel = a.getAttribute('rel') || '';
      var parts = rel.split(/\s+/).filter(Boolean);
      if (parts.indexOf('noopener') === -1) parts.push('noopener');
      if (parts.indexOf('noreferrer') === -1) parts.push('noreferrer');
      a.setAttribute('rel', parts.join(' '));
    });
  } catch (e) {
    console && console.error && console.error('social-links initialization error', e);
  }
});

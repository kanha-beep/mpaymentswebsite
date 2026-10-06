(() => {
  const currentHeader = document.querySelector('#site-header');
  if (!currentHeader) return;

  const request = new XMLHttpRequest();
  request.open('GET', '/', false);
  request.send();

  if (request.status < 200 || request.status >= 300) return;

  const homepage = new DOMParser().parseFromString(request.responseText, 'text/html');
  const homepageHeader = homepage.querySelector('#site-header');
  if (homepageHeader) currentHeader.replaceWith(homepageHeader);
})();

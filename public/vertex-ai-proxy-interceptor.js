(function() {
  const originalFetch = window.fetch;
  window.fetch = function() {
    let [resource, config] = arguments;
    if (typeof resource === 'string' && (resource.includes('generativelanguage.googleapis.com') || resource.includes('googleapis.com'))) {
      try {
        const url = new URL(resource);
        const newResource = '/api-proxy' + url.pathname + url.search;
        console.log('Intercepted fetch:', resource, '->', newResource);
        return originalFetch.call(this, newResource, config);
      } catch (e) {
        return originalFetch.apply(this, arguments);
      }
    }
    return originalFetch.apply(this, arguments);
  };

  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && (url.includes('generativelanguage.googleapis.com') || url.includes('googleapis.com'))) {
      try {
        const parsedUrl = new URL(url, window.location.href);
        const newUrl = '/api-proxy' + parsedUrl.pathname + parsedUrl.search;
        console.log('Intercepted XHR:', url, '->', newUrl);
        return originalOpen.call(this, method, newUrl, ...Array.prototype.slice.call(arguments, 2));
      } catch (e) {
        return originalOpen.apply(this, arguments);
      }
    }
    return originalOpen.apply(this, arguments);
  };
})();

const allowedRichTextTags = new Set([
  'A',
  'B',
  'BLOCKQUOTE',
  'BR',
  'DIV',
  'EM',
  'H3',
  'H4',
  'I',
  'LI',
  'OL',
  'P',
  'S',
  'SPAN',
  'STRONG',
  'U',
  'UL',
]);

const allowedRichTextLinkProtocols = new Set(['http:', 'https:', 'mailto:']);

export function sanitizeRichTextHtml(html: string) {
  if (!html.trim()) {
    return '';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');

  const sanitizeNode = (node: Node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) {
        child.remove();
        return;
      }

      const element = child as HTMLElement;

      if (!allowedRichTextTags.has(element.tagName)) {
        sanitizeNode(element);
        element.replaceWith(...element.childNodes);
        return;
      }

      [...element.attributes].forEach((attribute) => {
        const name = attribute.name.toLowerCase();

        if (element.tagName === 'A' && name === 'href') {
          const href = attribute.value.trim();
          let protocol: string;

          try {
            protocol = new URL(href, window.location.origin).protocol;
          } catch {
            element.removeAttribute(attribute.name);
            return;
          }

          if (!allowedRichTextLinkProtocols.has(protocol)) {
            element.removeAttribute(attribute.name);
            return;
          }

          element.setAttribute('target', '_blank');
          element.setAttribute('rel', 'noopener noreferrer');
          return;
        }

        element.removeAttribute(attribute.name);
      });

      sanitizeNode(element);
    });
  };

  sanitizeNode(doc.body);

  return doc.body.firstElementChild?.innerHTML.trim() ?? '';
}
